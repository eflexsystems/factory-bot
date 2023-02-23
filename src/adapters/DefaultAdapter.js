export default class DefaultAdapter {
  build(Model, props) {
    return new Model(props)
  }

  async save(model) {
    return Promise.resolve(model.save()).then(() => model)
  }

  async destroy(model) {
    return Promise.resolve(model.destroy()).then(() => model)
  }

  get(model, attr) {
    return model.get(attr)
  }

  set(props, model) {
    return model.set(props)
  }
}
