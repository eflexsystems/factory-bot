import DefaultAdapter from './DefaultAdapter.js'

export default class ReduxORMAdapter extends DefaultAdapter {
  constructor(session) {
    super()

    this.session = session
  }

  build(modelName, props) {
    return this.session[modelName].create(props)
  }

  get(model, attr) {
    return model[attr]
  }

  async save(model) {
    return model
  }

  async destroy(model) {
    return Promise.resolve(model.delete()).then(() => true)
  }
}
