import asyncPopulate from './utils/asyncPopulate.js'
import syncPopulate from './utils/syncPopulate.js'

export default class Factory {
  constructor(Model, initializer, options = {}) {
    this.name = null
    this.Model = null
    this.initializer = null
    this.options = {}

    if (!Model) {
      throw new Error('Invalid Model constructor passed to the factory')
    }
    if (
      (typeof initializer !== 'object' && typeof initializer !== 'function') ||
      !initializer
    ) {
      throw new Error('Invalid initializer passed to the factory')
    }

    this.Model = Model
    this.initializer = initializer
    this.options = { ...this.options, ...options }
  }

  getFactoryAttrs(buildOptions = {}) {
    let attrs
    if (typeof this.initializer === 'function') {
      attrs = this.initializer(buildOptions)
    } else {
      attrs = { ...this.initializer }
    }
    return attrs;
  }

  async attrs(extraAttrs = {}, buildOptions = {}) {
    const factoryAttrs = await Promise.resolve(this.getFactoryAttrs(buildOptions));
    const modelAttrs = {}

    const filteredAttrs = Object.keys(factoryAttrs).reduce((attrs, name) => {
      // eslint-disable-next-line no-prototype-builtins
      if (!extraAttrs.hasOwnProperty(name)) attrs[name] = factoryAttrs[name]
      return attrs
    }, {})

    await asyncPopulate(modelAttrs, filteredAttrs)
    await asyncPopulate(modelAttrs, extraAttrs)

    return modelAttrs
  }

  attrsSync(extraAttrs = {}, buildOptions = {}) {
    const factoryAttrs = this.getFactoryAttrs(buildOptions)
    const modelAttrs = {}

    const filteredAttrs = Object.keys(factoryAttrs).reduce((attrs, name) => {
      // eslint-disable-next-line no-prototype-builtins
      if (!extraAttrs.hasOwnProperty(name)) attrs[name] = factoryAttrs[name]
      return attrs
    }, {})

    syncPopulate(modelAttrs, filteredAttrs)
    syncPopulate(modelAttrs, extraAttrs)

    return modelAttrs
  }

  async build(adapter, extraAttrs = {}, buildOptions = {}) {
    const modelAttrs = await this.attrs(extraAttrs, buildOptions)
    const model = adapter.build(this.Model, modelAttrs)
    return this.options.afterBuild
      ? this.options.afterBuild(model, extraAttrs, buildOptions)
      : model
  }

  async create(adapter, attrs = {}, buildOptions = {}) {
    const model = await this.build(adapter, attrs, buildOptions)
    const savedModel = await adapter.save(model, this.Model);

    if (this.options.afterCreate) {
      return await this.options.afterCreate(savedModel, attrs, buildOptions);
    }

    return savedModel;
  }

  attrsMany(num, attrsArray = [], buildOptionsArray = []) {
    let attrObject = null
    let buildOptionsObject = null

    if (typeof attrsArray === 'object' && !Array.isArray(attrsArray)) {
      attrObject = attrsArray
      attrsArray = []
    }
    if (
      typeof buildOptionsArray === 'object' &&
      !Array.isArray(buildOptionsArray)
    ) {
      buildOptionsObject = buildOptionsArray
      buildOptionsArray = []
    }
    if (typeof num !== 'number' || num < 1) {
      return Promise.reject(new Error('Invalid number of objects requested'))
    }
    if (!Array.isArray(attrsArray)) {
      return Promise.reject(new Error('Invalid attrsArray passed'))
    }
    if (!Array.isArray(buildOptionsArray)) {
      return Promise.reject(new Error('Invalid buildOptionsArray passed'))
    }
    attrsArray.length = buildOptionsArray.length = num
    const models = []
    for (let i = 0; i < num; i++) {
      models[i] = this.attrs(
        attrObject || attrsArray[i] || {},
        buildOptionsObject || buildOptionsArray[i] || {},
      )
    }
    return Promise.all(models)
  }

  attrsManySync(num, attrsArray = [], buildOptionsArray = []) {
    let attrObject = null
    let buildOptionsObject = null

    if (typeof attrsArray === 'object' && !Array.isArray(attrsArray)) {
      attrObject = attrsArray
      attrsArray = []
    }
    if (
      typeof buildOptionsArray === 'object' &&
      !Array.isArray(buildOptionsArray)
    ) {
      buildOptionsObject = buildOptionsArray
      buildOptionsArray = []
    }
    if (typeof num !== 'number' || num < 1) {
      throw new Error('Invalid number of objects requested');
    }
    if (!Array.isArray(attrsArray)) {
      throw new Error('Invalid attrsArray passed');
    }
    if (!Array.isArray(buildOptionsArray)) {
      throw new Error('Invalid buildOptionsArray passed');
    }
    attrsArray.length = buildOptionsArray.length = num
    const models = []
    for (let i = 0; i < num; i++) {
      models[i] = this.attrsSync(
        attrObject || attrsArray[i] || {},
        buildOptionsObject || buildOptionsArray[i] || {},
      )
    }
    return models;
  }

  async buildMany(
    adapter,
    num,
    attrsArray = [],
    buildOptionsArray = [],
    buildCallbacks = true,
  ) {
    const attrs = await this.attrsMany(num, attrsArray, buildOptionsArray)
    const models = await Promise.all(attrs.map(attr => adapter.build(this.Model, attr)));

    if (this.options.afterBuild && buildCallbacks) {
      return await Promise.all(
        models.map(async (builtModel, i) =>
          this.options.afterBuild(
            builtModel,
            attrsArray,
            buildOptionsArray[i],
          ),
        ),
      );
    }

    return models;
  }

  async createMany(adapter, num, attrsArray = [], buildOptionsArray = []) {
    if (Array.isArray(num)) {
      buildOptionsArray = attrsArray
      attrsArray = num
      num = attrsArray.length
    }
    let models = await this.buildMany(
      adapter,
      num,
      attrsArray,
      buildOptionsArray,
    )

    if (adapter.bulkSave) {
      models = await adapter.bulkSave(models, this.Model);
    } else {
      models = await Promise.all(models.map(model => adapter.save(model, this.Model)));
    }

    if (this.options.afterCreate) {
      return await Promise.all(
        models.map((createdModel, i) =>
          this.options.afterCreate(
            createdModel,
            attrsArray,
            buildOptionsArray?.[i],
          ),
        ),
      )
    }

    return models;
  }
}
