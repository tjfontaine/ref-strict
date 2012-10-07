'use strict';

var assert = require('assert')
var ref = require('ref')
var debug = require('debug')('ref:strict')

var voidPtr = ref.refType(ref.types.void)

// Is _name really needed, should it take a nullable parameter?
var Strict = function (_type, _name) {
  var type, size, align, pod, name, k

  if (_type.indirection === 1) {
    // we either have a POD (plain old data type), a struct, array, StrictType
    // or another custom type
    type = _type
    size = _type.size
    align = _type.alignment
    // if the parent type is in ref.types we don't want to cache the StrictType
    // as the user may want to create multiple instances
    // TODO XXX FIXME maybe shouldn't even let PODs to be StrictType's
    for (k in ref.types) {
      pod = ref.types[k] === type
      if (pod)
        break
    }
  } else {
    // indirection is greater than 1, we can't assume the base type is safe to
    // enforce, or maybe we're trying to hide pointers and need to override
    // void* multiple times for distinct types
    type = ref.refType(ref.types.void)
    size = ref.sizeof.pointer
    align = ref.alignof.pointer
    pod = true
  }

  name = _name || type.name

  debug('making StrictType', name, pod)

  // if it's not a POD and we have already defined this StrictType return the
  // cached value
  if (!pod && type._stricttype) {
    debug('we have a cached stricttype', name)
    return type._stricttype
  }

  // Structs and Arrays need to be callable
  function StrictType (arg, data) {
    debug("we have a new instance of %s", name, arg, data)
    var ret = new type(arg, data)
    // this needs set for a struct instance because this is the field we
    // compare against in set
    ret.type = StrictType 
    return ret
  }

  // functions can only have their name set at definition
  // StrictType.name = _name || type.name

  // indirection == 1 means that we're sure our set will be called
  StrictType.indirection = 1
  StrictType.size = size
  StrictType.alignment = align
  // this makes sure ffi can find our type, either our parent type
  // or their parent's type for use with other StrictTypes or Array
  // TODO XXX FIXME check with ref-array and see what happens
  if (type.fields)
    StrictType.fields = type.fields
  else
    StrictType.type = type

  StrictType.get = function (buff, off) {
    var ret = ref.get(buff, off, type);
    ret.type = StrictType;
    debug("getting", buff, off, ret);
    return ret;
  }

  StrictType.set = function (buffer, offset, value) {
    debug('setting', buffer, value)
    // special case allowing null buffers, maybe configurable?
    // undefined treated the same as null in this case
    // should this be based on if type.indirection > 1 ? (that works for base
    // types but not for derived StrictTypes)
    if (value && !(value instanceof Buffer && ref.isNull(value))) {
      debug('checking strict type equality')
      assert.strictEqual(value.type, StrictType, 'Value is of wrong type')
    }
    ref.set(buffer, offset, value, type);
  }

  // convenience function to make things even feel more C like
  StrictType.cast = function (val) {
    debug('Casting to %s', name, val)
    val.type = StrictType 
    return val
  }

  // if it's not a plain old data type cache the StrictType on the original type
  if (!pod) {
    debug('not a plain data type, caching StrictType')
    type._stricttype = StrictType
  }

  return StrictType
}

module.exports = Strict
