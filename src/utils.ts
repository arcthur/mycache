const toString = Object.prototype.toString;

function isDate(obj: any) {
  return toString.call(obj) === '[object Date]';
}

function isNumber(obj: any) {
  return toString.call(obj) === '[object Number]';
}

const isArray = Array.isArray;

function isObject(val: any) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
};

function isObjectObject(o: any) {
  return isObject(o) === true
    && Object.prototype.toString.call(o) === '[object Object]';
}

function isPlainObject(o: any) {
  var ctor,prot;

  if (isObjectObject(o) === false) return false;

  // If has modified constructor
  ctor = o.constructor;
  if (typeof ctor !== 'function') return false;

  // If has modified prototype
  prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
}

function extend(target: any, source: any) {
  if (source === null || typeof source !== 'object') return target;

  var keys = Object.keys(source);
  var i = keys.length;
  while (i--) {
    target[keys[i]] = source[keys[i]];
  }

  return target;
}

function omit(obj: any, props: any) {
  if (!isObject(obj)) return {};

  if (typeof props === 'string') { props = [props]; }

  let keys = Object.keys(obj);
  let res: any = {};

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (!props || (props.indexOf(key) === -1)) {
      res[key] = obj[key];
    }
  }
  return res;
};

export { isDate, isNumber, isArray, isPlainObject, extend, omit };