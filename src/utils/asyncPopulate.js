const objectProto = Object.getPrototypeOf({})
function isPlainObject(o) {
  return Object.getPrototypeOf(o) === objectProto
}

export default async function asyncPopulate(target, source) {
  if (typeof target !== 'object') {
    return Promise.reject(new Error('Invalid target passed'))
  }
  if (typeof source !== 'object') {
    return Promise.reject(new Error('Invalid source passed'))
  }

  await Promise.all(Object.keys(source).map(async attr => {
    let promise
    if (Array.isArray(source[attr])) {
      target[attr] = []
      await asyncPopulate(target[attr], source[attr])
    } else if (source[attr] === null || source[attr] === undefined) {
      target[attr] = source[attr]
    } else if (isPlainObject(source[attr])) {
      target[attr] = target[attr] || {}
      await asyncPopulate(target[attr], source[attr])
    } else if (typeof source[attr] === 'function') {
      const v = await source[attr](target, source);
      target[attr] = v
    } else {
      const v = await source[attr];
      target[attr] = v
    }
    return promise
  }));
}
