import DefaultAdapter from './DefaultAdapter.js'

export default class MongooseAdapter extends DefaultAdapter {
  async destroy(model) {
    return model.remove()
  }
}
