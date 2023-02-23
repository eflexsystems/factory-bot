import DefaultAdapter from './DefaultAdapter.js'

export default class BookshelfAdapter extends DefaultAdapter {
  save(doc, Model) {
    return doc.save(null, { method: 'insert' })
  }
}
