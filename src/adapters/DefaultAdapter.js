export default class DefaultAdapter {
  build(Model, props) {
    return new Model(props)
  }

  async save(model) {
    await model.save();
    return model;
  }

  async destroy(model) {
    await model.destroy();
    return model;
  }

  get(model, attr) {
    return model.get(attr)
  }

  set(props, model) {
    return model.set(props)
  }
}
