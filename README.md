ref-strict
==========

adds strict typing layer on to ffi on a per type basis, especially helpful if
you are binding a library with opqaue pointers and want to ensure that what is
being passed to the native layer is indeed the proper type

```javascript
var voidPtr = ref.refType(ref.types.void)
var myType = StrictType(voidPtr)

var l = ffi.Library(mylib, {
  myType_init: [myType, []],
  otherType_init: [voidPtr, []],
  some_method: [ref.type.void, [myType]],
})

var m = l.myType_init()
var o = l.otherType_init()

// will throw
l.some_method(o)

// will succeed
l.some_method(m)

// will succeed but cause you all kinds of pain
l.some_method(myType.cast(o))
```
