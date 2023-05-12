import DefaultAdapter from './DefaultAdapter.js'

export default class MongooseAdapter extends DefaultAdapter {
  async destroy(doc, Model) {
    await Model.deleteOne({ _id: doc._id })
    return doc;
  }
}
