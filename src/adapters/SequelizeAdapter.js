import DefaultAdapter from './DefaultAdapter.js'

export default class SequelizeAdapter extends DefaultAdapter {
  build(Model, props) {
    return Model.build(props)
  }
}
