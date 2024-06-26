import Factory from './Factory.js'
import Sequence from './generators/Sequence.js'
import Assoc from './generators/Assoc.js'
import AssocAttrs from './generators/AssocAttrs.js'
import AssocMany from './generators/AssocMany.js'
import AssocAttrsMany from './generators/AssocAttrsMany.js'
import ChanceGenerator from './generators/ChanceGenerator.js'
import OneOf from './generators/OneOf.js'
import DefaultAdapter from './adapters/DefaultAdapter.js'

function wrapGenerator(generator) {
  return (...args) => () => generator.generate(...args)
}

export function generatorThunk(factoryGirl, SomeGenerator) {
  const generator = new SomeGenerator(factoryGirl)
  return wrapGenerator(generator)
}

export default class FactoryGirl {
  constructor(options = {}) {
    this.factories = {}
    this.options = {}
    this.adapters = {}
    this.created = new Set()

    this.assoc = generatorThunk(this, Assoc)
    this.assocMany = generatorThunk(this, AssocMany)
    this.assocAttrs = generatorThunk(this, AssocAttrs)
    this.assocAttrsMany = generatorThunk(this, AssocAttrsMany)
    this.seq = this.sequence = (...args) =>
      generatorThunk(this, Sequence)(...args)
    this.resetSeq = this.resetSequence = id => {
      Sequence.reset(id)
    }

    const chance = new ChanceGenerator(this)
    this.chance = wrapGenerator(chance)
    this.chance.seed = value => {
      chance.seed(value)
    }

    this.oneOf = generatorThunk(this, OneOf)

    this.defaultAdapter = new DefaultAdapter()
    this.options = options
  }

  define(name, Model, initializer, options = {}) {
    if (this.getFactory(name, false)) {
      throw new Error(`Factory ${name} already defined`)
    }
    const factory = (this.factories[name] = new Factory(
      Model,
      initializer,
      options,
    ))
    return factory
  }

  remove(name) {
    delete this.factories[name]
  }

  extend(parent, name, childInitializer, options = {}) {
    if (this.getFactory(name, false)) {
      throw new Error(`Factory ${name} already defined`)
    }
    const parentFactory = this.getFactory(parent, true)
    const Model = options.model || parentFactory.Model
    const jointOptions = { ...parentFactory.options, ...options }
    let jointInitializer

    function resolveInitializer(initializer, buildOptions) {
      return typeof initializer === 'function'
        ? initializer(buildOptions)
        : initializer
    }

    if (
      typeof parentFactory.initializer === 'function' ||
      typeof childInitializer === 'function'
    ) {
      jointInitializer = function initializer(buildOptions = {}) {
        return Object.assign(
          {},
          resolveInitializer(parentFactory.initializer, buildOptions),
          resolveInitializer(childInitializer, buildOptions),
        )
      }
    } else {
      jointInitializer = Object.assign(
        {},
        parentFactory.initializer,
        childInitializer,
      )
    }

    const factory = (this.factories[name] = new Factory(
      Model,
      jointInitializer,
      jointOptions,
    ))
    return factory
  }

  attrs(name, attrs, buildOptions = {}) {
    return this.getFactory(name).attrs(attrs, buildOptions)
  }

  attrsSync(name, attrs, buildOptions = {}) {
    return this.getFactory(name).attrsSync(attrs, buildOptions)
  }

  async build(name, attrs = {}, buildOptions = {}) {
    const adapter = this.getAdapter(name)
    const model = await this.getFactory(name).build(adapter, attrs, buildOptions);

    if (this.options.afterBuild) {
      return await this.options.afterBuild(model, attrs, buildOptions);
    }

    return model;
  }

  async create(name, attrs, buildOptions = {}) {
    const adapter = this.getAdapter(name)
    const createdModel = await this.getFactory(name).create(adapter, attrs, buildOptions);
    const model = await this.addToCreatedList(adapter, createdModel);

    if (this.options.afterCreate) {
      return await this.options.afterCreate(model, attrs, buildOptions);
    }

    return model;
  }

  attrsMany(name, num, attrs, buildOptions = {}) {
    return this.getFactory(name).attrsMany(num, attrs, buildOptions)
  }

  attrsManySync(name, num, attrs, buildOptions = {}) {
    return this.getFactory(name).attrsManySync(num, attrs, buildOptions)
  }

  async buildMany(name, num, attrs, buildOptions = {}) {
    const adapter = this.getAdapter(name)
    const models = await this.getFactory(name).buildMany(adapter, num, attrs, buildOptions);

    if (this.options.afterBuild) {
      return await Promise.all(
        models.map((model, i) =>
          this.options.afterBuild(model, attrs, buildOptions[i]),
        ),
      );
    }

    return models;
  }

  async createMany(name, num, attrs, buildOptions = {}) {
    const adapter = this.getAdapter(name)
    let models = await this.getFactory(name).createMany(adapter, num, attrs, buildOptions);
    models = this.addToCreatedList(adapter, models);

    if (this.options.afterCreate) {
      return await Promise.all(
        models.map((model, i) =>
          this.options.afterCreate(model, attrs, buildOptions?.[i]),
        ),
      );
    }

    return models;
  }

  getFactory(name, throwError = true) {
    if (!this.factories[name] && throwError) {
      throw new Error(`Invalid factory '${name}' requested`)
    }
    return this.factories[name]
  }

  withOptions(options, merge = false) {
    this.options = merge ? { ...this.options, ...options } : options
  }

  getAdapter(factory) {
    return factory
      ? this.adapters[factory] || this.defaultAdapter
      : this.defaultAdapter
  }

  addToCreatedList(adapter, models) {
    if (!Array.isArray(models)) {
      this.created.add([adapter, models])
    } else {
      // eslint-disable-next-line no-restricted-syntax
      for (const model of models) {
        this.created.add([adapter, model])
      }
    }
    return models
  }

  cleanUp() {
    const createdArray = []
    // eslint-disable-next-line no-restricted-syntax
    for (const c of this.created) {
      createdArray.unshift(c)
    }
    const promise = createdArray.reduce(async (prev, [adapter, model]) => {
      await prev
      if (model === null) {
        return
      }
      await adapter.destroy(model, model.constructor)
    }, Promise.resolve())
    this.created.clear()
    this.resetSeq()
    return promise
  }

  setAdapter(adapter, factoryNames = null) {
    if (!factoryNames) {
      this.defaultAdapter = adapter
    } else {
      factoryNames = Array.isArray(factoryNames) ? factoryNames : [factoryNames]
      factoryNames.forEach(name => {
        this.adapters[name] = adapter
      })
    }
    return adapter
  }
}
