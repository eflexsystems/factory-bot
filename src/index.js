import FactoryGirl from './FactoryGirl.js'

export { default as ObjectAdapter } from './adapters/ObjectAdapter.js'
export { default as DefaultAdapter } from './adapters/DefaultAdapter.js'
export { default as MongodbAdapter } from './adapters/MongodbAdapter.js'
export { default as MongooseAdapter } from './adapters/MongooseAdapter.js'

const factory = new FactoryGirl()
factory.FactoryGirl = FactoryGirl

export { factory }

export default factory
