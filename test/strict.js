var assert = require('assert')
var ref = require('ref');
var Struct = require('ref-struct')
var ArrayType = require('ref-array')
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

  it('should actually make structs in return values', function () {
    var struct = Struct({
      a: ref.types.int32,
      b: ref.types.int32,
    });
    var strict_struct = StrictType(struct);
    var test_struct = ffi.ForeignFunction(bindings.test_struct, struct, [ref.types.int32, ref.types.int32]);
    var strict_test_struct = ffi.ForeignFunction(bindings.test_struct, strict_struct, [ref.types.int32, ref.types.int32]);

    var obj = test_struct(31, 84);
    assert.strictEqual(obj.a, 31);
    assert.strictEqual(obj.b, 84);

    obj = strict_test_struct(35, 73);
    assert.strictEqual(obj.a, 35);
    assert.strictEqual(obj.b, 73);
  })

  it('should handle structs with constant arrays', function () {
    var struct = Struct({
      a: ref.types.int32,
      b: ref.types.int32,
      data: ArrayType(ref.refType(ref.types.void), 3),
    });
    var strict_array = StrictType(struct);

    assert.strictEqual(strict_array.size, struct.size);
    assert.strictEqual(strict_array.alignment, struct.alignment);

    var struct_arr = ffi.ForeignFunction(bindings.test_struct_arr, struct, [ref.types.int32, ref.types.int32]);
    var strict_struct_arr = ffi.ForeignFunction(bindings.test_struct_arr, strict_array, [ref.types.int32, ref.types.int32]);
    var strict_struct_arr_cmp = ffi.ForeignFunction(bindings.test_struct_arr_cmp, ref.types.int32, [strict_array, ref.types.int32, ref.types.int32]);

    var obj = struct_arr(21, 53);
    assert.strictEqual(obj.a, 21);
    assert.strictEqual(obj.b, 53);

    obj = strict_struct_arr(16, 74);
    assert.strictEqual(obj.a, 16);
    assert.strictEqual(obj.b, 74);

    var ret = strict_struct_arr_cmp(obj, 16, 74);
    assert(ret);
  })
})
