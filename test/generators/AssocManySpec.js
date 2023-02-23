import '../test-helper/testUtils.js'
import { expect } from 'chai'
import sinon from 'sinon'
import AssocMany from '../../src/generators/AssocMany.js'
import DummyFactoryGirl from '../test-helper/DummyFactoryGirl.js'
import asyncFunction from '../test-helper/asyncFunction.js'
// import _debug from 'debug';

// const debug = _debug('AssocManySpec');

describe('AssocMany', () => {
  const factoryGirl = new DummyFactoryGirl()

  describe('#generate', () => {
    it(
      'calls createMany on factoryGirl',
      asyncFunction(async () => {
        sinon.spy(factoryGirl, 'createMany')
        const assocMany = new AssocMany(factoryGirl)
        await assocMany.generate('model', 10)
        expect(factoryGirl.createMany).to.have.been.calledOnce
        factoryGirl.createMany.restore()
      }),
    )

    it(
      'passes arguments to createMany correctly',
      asyncFunction(async () => {
        sinon.spy(factoryGirl, 'createMany')
        const dummyAttrs = {}
        const dummyBuildOptions = {}
        const assocMany = new AssocMany(factoryGirl)
        await assocMany.generate('model', 10, dummyAttrs, dummyBuildOptions)
        expect(factoryGirl.createMany).to.have.been.calledWith(
          'model',
          10,
          dummyAttrs,
          dummyBuildOptions,
        )
        factoryGirl.createMany.restore()
      }),
    )

    it('returns a promise', () => {
      const assocMany = new AssocMany(factoryGirl)
      const modelsP = assocMany.generate('model', 10)
      expect(modelsP.then).to.be.a('function')
      return expect(modelsP).to.be.eventually.fulfilled
    })
    it(
      'resolves to array returned by createMany',
      asyncFunction(async () => {
        const assocMany = new AssocMany(factoryGirl)
        const models = await assocMany.generate('model', 10)
        expect(models).to.be.an('array')
        expect(models).to.have.lengthOf(2)
        expect(models[0].attrs.name).to.be.equal('Wayne')
        expect(models[1].attrs.age).to.be.equal(21)
      }),
    )

    it(
      'resolves to array of keys if key is set',
      asyncFunction(async () => {
        const assocMany = new AssocMany(factoryGirl)
        const models = await assocMany.generate('model', 10, 'name')
        expect(models).to.have.lengthOf(2)
        expect(models[0]).to.equal('Wayne')
        expect(models[1]).to.equal('Jane')
      }),
    )
  })
})
