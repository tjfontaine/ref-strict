var assert = require('assert')
var ref = require('ref');
var Struct = require('ref-struct')
var StrictType = require('../')
var ffi = require('ffi')
var bindings = require('./build/Release/strict_tests')

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
    // now that we use ref.set undefined is no longer treated the same as null
    //instance.a = undefined
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
    }, /AssertionError: error setting argument 1 - Value is of wrong type/)
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

  var voidPtr = ref.refType(ref.types.void);

  it('should properly set the type', function () {
    var test_init = ffi.ForeignFunction(bindings.test_init, voidPtr, [ref.types.int32, ref.types.int32]);
    var test_cmp = ffi.ForeignFunction(bindings.test_cmp, ref.types.int32, [voidPtr, ref.types.int32, ref.types.int32]);
    var stype = StrictType(voidPtr);

    var strict_cmp = ffi.ForeignFunction(bindings.test_cmp, ref.types.int32, [stype, ref.types.int32, ref.types.int32]);
    var strict_init = ffi.ForeignFunction(bindings.test_init, stype, [ref.types.int32, ref.types.int32]);

    var obj = test_init(44, 77);
    var ret = test_cmp(obj, 44, 77);

    assert(ret);

    ret = strict_cmp(stype.cast(obj), 44, 77);

    assert(ret);

    obj = strict_init(99, 31);
    ret = strict_cmp(obj, 99, 31);

    assert(ret);
  })
})
