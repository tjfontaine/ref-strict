#include "v8.h"
#include "node.h"
#include "node_buffer.h"

using namespace v8;
using namespace node;

namespace strict_tests {

typedef struct _test {
  int a;
  int b;
} test;

typedef struct _test_arr {
  int a;
  int b;
  void *data[3];
} test_arr;

test *test_init(int a, int b) {
  test *t = new test;
  t->a = a;
  t->b = b;
  return t;
}

int test_cmp(test *t, int a, int b) {
  if (t->a == a && t->b == b) {
    return 1;
  } else {
    return 0;
  }
}

test test_struct(int a, int b) {
  test t;
  t.a = a;
  t.b = b;
  return t;
}

test_arr test_struct_arr(int a, int b) {
  test_arr t;
  t.a = a;
  t.b = b;
  t.data[0] = (void *)0x100;
  t.data[1] = (void *)0x200;
  t.data[2] = (void *)0x400;
  return t;
}

int test_struct_arr_cmp(test_arr t, int a, int b) {
  if (t.a == a && t.b == b)
    return 1;
  else
    return 0;
};

void wrap_pointer_cb(char *data, void *hint) {
  //fprintf(stderr, "wrap_pointer_cb\n");
}

Handle<Object> WrapPointer(char *ptr) {
  void *user_data = NULL;
  size_t length = 0;
  Buffer *buf = Buffer::New(ptr, length, wrap_pointer_cb, user_data);
  return buf->handle_;
}

void Initialize(Handle<Object> target) {
  HandleScope scope;
  target->Set(String::NewSymbol("test_init"), WrapPointer((char *)test_init));
  target->Set(String::NewSymbol("test_cmp"), WrapPointer((char *)test_cmp));
  target->Set(String::NewSymbol("test_struct"), WrapPointer((char *)test_struct));
  target->Set(String::NewSymbol("test_struct_arr"), WrapPointer((char *)test_struct_arr));
  target->Set(String::NewSymbol("test_struct_arr_cmp"), WrapPointer((char *)test_struct_arr_cmp));
}

}
NODE_MODULE(strict_tests, strict_tests::Initialize);
