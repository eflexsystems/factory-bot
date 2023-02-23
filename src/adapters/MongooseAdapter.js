import DefaultAdapter from './DefaultAdapter.js'

export default class MongooseAdapter extends DefaultAdapter {
  async destroy(model, Model) {
    return model.remove()
  }
}
