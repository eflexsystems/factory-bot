import ObjectAdapter from './ObjectAdapter.js'

const __Model__ = Symbol('Model')

const enhanceModel = Model => model => {
  if (!model) {
    return model
  }
  Object.defineProperty(model, __Model__, {
    enumerable: false,
    value: Model,
  })
  return model
}

export default class MongodbAdapter extends ObjectAdapter {
  constructor(db) {
    super()

    this.db = db
  }

  build(Model, props) {
    const model = {}
    this.set(props, model, Model)
    return model
  }

  async save(model, Model) {
    const c = this.db.collection(Model)

    if (model._id) {
      await c.findOneAndUpdate(model._id, { $set: model }, { upsert: true })
      const saved = await c.findOne(model._id);
      return enhanceModel(Model)(saved)
    }
    const { insertedId } = await c.insertOne(model)
    const saved = await c.findOne(insertedId);
    return enhanceModel(Model)(saved)
  }

  async destroy(model) {
    return this.db.collection(model[__Model__]).deleteOne(model)
  }
}
