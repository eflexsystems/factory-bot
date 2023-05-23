const objectProto = Object.getPrototypeOf({})
function isPlainObject(o) {
  return Object.getPrototypeOf(o) === objectProto
}

export default function syncPopulate(target, source) {
  if (typeof target !== 'object') {
    throw new Error('Invalid target passed');
  }
  if (typeof source !== 'object') {
    throw new Error('Invalid source passed');
  }

  Object.keys(source).map(attr => {
    if (Array.isArray(source[attr])) {
      target[attr] = []
      syncPopulate(target[attr], source[attr])
    } else if (source[attr] === null || source[attr] === undefined) {
      target[attr] = source[attr]
    } else if (isPlainObject(source[attr])) {
      target[attr] = target[attr] || {}
      syncPopulate(target[attr], source[attr])
    } else if (typeof source[attr] === 'function') {
      target[attr] = source[attr](target, source);
    } else {
      target[attr] = source[attr];
    }
  })
}
