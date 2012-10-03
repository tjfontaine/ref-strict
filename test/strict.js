var assert = require('assert')
var ref = require('ref');
var Struct = require('ref-struct')
var StrictType = require('../')
var ffi = require('ffi')

var ASSERTION = /AssertionError: Value is of wrong type/

describe('StrictType', function () {
  var myType = StrictType(ref.refType(ref.types.void))

  it('should assert on alloc', function () {
    var obj = ref.alloc(ref.refType(ref.types.void))
    assert.throws(function () {
      var inst = ref.alloc(myType, obj)    
    }, ASSERTION)
  })

  it('should accept a cast', function () {
    var obj = ref.alloc(ref.refType(ref.types.void))
    var inst = ref.alloc(myType, myType.cast(obj))
  })

  it('should return different types for multiple void*', function () {
    var a = StrictType(ref.refType(ref.types.void))
    var b = StrictType(ref.refType(ref.types.void))
    assert(a !== b)
  })

  it('should return the same type for complex types', function () {
    var s = Struct()
    var a = StrictType(s)
    var b = StrictType(s)
    assert(a === b)
  })

  it('should allow null parameters', function () {
    var s = Struct({ a: myType })
    var instance = new s()
    instance.a = null
    instance.a = ref.NULL
    instance.a = undefined
  })

  it('structs should throw on wrong type', function () {
    var s = Struct({ a: myType })
    var instance = new s()
    var obj = ref.alloc(ref.refType(ref.types.void))
    assert.throws(function () {
      instance.a = obj
    }, ASSERTION)
    instance.a = myType.cast(obj)
  })

  it('ffi arguments should throw', function () {
    var obj = ref.alloc(ref.refType(ref.types.void))
    var l = ffi.Library(null, {
      printf: [ref.types.void, [ref.types.CString, myType]],
    })
    assert.throws(function () {
      l.printf("%p\n", obj)
    }, ASSERTION)
    l.printf("%p\n", myType.cast(obj))
  })

  it('should not break alignment', function () {
    var s = Struct({
      a: ref.types.uint32,
    })
    var ss = StrictType(s);
    var t = Struct({
      b: ss,
    });
    var st = StrictType(t, 't');
  })
})

/*
var l = ffi.Library(null, {
  printf: [ref.types.void, [ref.types.CString, ssType]],
})

var s = new ssType()

assert.throws(function () {
  l.printf("%p\n", obj)
}, /AssertionError: Value is of wrong type/)

l.printf("ssType %p\n", s)
*/
