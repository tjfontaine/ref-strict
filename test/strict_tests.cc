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
}

}
NODE_MODULE(strict_tests, strict_tests::Initialize);
