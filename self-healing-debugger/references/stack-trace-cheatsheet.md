# Stack Trace Cheatsheet & Error Signatures

A comprehensive quick-reference guide covering stack trace formats, error patterns, parsing regular expressions, and resolution strategies across Node.js, Python, Go, Rust, and Dart.

---

## 1. Node.js / TypeScript / JavaScript (V8 Engine)

### Common Signatures
| Error Signature | Typical Cause | Resolution |
| :--- | :--- | :--- |
| `TypeError: Cannot read property 'x' of undefined` | Dereferencing an uninitialized or missing object property | Check upstream data provider, use optional chaining `?.`, add schema validation |
| `TypeError: x is not a function` | Invoking a variable that is null, undefined, or wrong type | Verify exports, import statements, circular dependencies, or method bindings |
| `ReferenceError: x is not defined` | Accessing an undeclared variable or out-of-scope identifier | Check variable declarations (`const`/`let`), scope brackets, or missing imports |
| `UnhandledPromiseRejection` | Promise rejected without `.catch()` or unawaited `async` call | Chain `.catch()`, wrap in `try/catch` with `await`, or configure global rejection handlers |
| `ERR_MODULE_NOT_FOUND` | Incorrect file extension or path in ESM imports | Add `.js` extensions in ESM mode or verify `tsconfig.json` module resolution |
| `RangeError: Maximum call stack size exceeded` | Infinite recursion or circular dependency traversal | Add base termination case, break recursion cycle, or convert to iterative loop |

### Example Trace
```text
TypeError: Cannot read properties of undefined (reading 'split')
    at parseAuthHeader (/app/src/auth/jwt.js:32:20)
    at authenticateRequest (/app/src/auth/middleware.js:15:18)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
```
- **Crash location:** `src/auth/jwt.js:32:20`
- **Root cause:** Authorization header was omitted from request payload.

---

## 2. Python (CPython)

### Common Signatures
| Error Signature | Typical Cause | Resolution |
| :--- | :--- | :--- |
| `AttributeError: 'NoneType' object has no attribute 'x'` | Method/function returned `None` instead of expected object | Check return value of search/lookup function before accessing attributes |
| `KeyError: 'id'` | Accessing dictionary key that does not exist | Use `.get('id', default)` or validate dictionary with Pydantic/dataclass |
| `TypeError: unsupported operand type(s) for +: 'int' and 'str'` | Unintended type mixing without explicit casting | Cast string using `int(s)` or use typed models with type annotations |
| `IndexError: list index out of range` | Accessing array index `>= len(list)` | Verify list bounds, check if list is empty before indexing |
| `ImportError: cannot import name 'X' from partially initialized module` | Circular import between two modules | Refactor shared dependencies into utility module or import inside function |
| `ZeroDivisionError: division by zero` | Denominator evaluated to zero | Add guard check `if denominator != 0:` before division |

### Example Trace
```text
Traceback (most recent call last):
  File "/app/services/report.py", line 42, in generate_report
    total_sales = calculate_total(order_list)
  File "/app/utils/math.py", line 18, in calculate_total
    return sum(item["price"] for item in items)
KeyError: 'price'
```
- **Crash location:** `utils/math.py:18`
- **Root cause:** An item in `order_list` was missing `'price'` key.

---

## 3. Go (Golang)

### Common Signatures
| Error Signature | Typical Cause | Resolution |
| :--- | :--- | :--- |
| `panic: runtime error: invalid memory address or nil pointer dereference` | Calling method on nil struct pointer or dereferencing nil pointer | Check pointer `if ptr == nil` before dereferencing; verify constructor initialization |
| `panic: runtime error: index out of range [x] with length y` | Slice or array access out of bounds | Check `len(slice)` before accessing element |
| `fatal error: concurrent map read and map write` | Unsynchronized concurrent access to standard Go map | Use `sync.RWMutex` around map or replace with `sync.Map` |
| `fatal error: all goroutines are asleep - deadlock!` | Channel blocked on send/receive with no active sender/receiver | Verify channel buffer size, ensure goroutine terminates or closes channel |
| `panic: send on closed channel` | Sending data into a channel that has already been closed | Close channels only from the sender side, use `sync.Once` for close operations |

### Example Trace
```text
panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: code=0x1 addr=0x0 pc=0x10b240]

goroutine 1 [running]:
main.GetUserProfile(0x0)
	/app/main.go:24 +0x28
main.main()
	/app/main.go:12 +0x40
```
- **Crash location:** `main.go:24` (invoked with nil pointer `0x0`).

---

## 4. Rust

### Common Signatures
| Error Signature | Typical Cause | Resolution |
| :--- | :--- | :--- |
| `panicked at 'called Option::unwrap() on a None value'` | Calling `.unwrap()` on empty `Option` | Use pattern matching `if let Some(x) = opt`, `unwrap_or_default()`, or `?` operator |
| `panicked at 'called Result::unwrap() on an Err value'` | Calling `.unwrap()` on an `Err` result | Use `?` operator to bubble errors or match with `match res { Ok(...) => ..., Err(e) => ... }` |
| `panicked at 'index out of bounds: the len is x but the index is y'` | Indexing slice out of bounds | Use `.get(index)` which returns `Option<&T>` instead of raw indexing |
| `panicked at 'already borrowed: BorrowMutError'` | Violating RefCell borrowing rules at runtime | Restructure data flow to eliminate overlapping mutable borrows |
| `borrow of moved value: x` | Trying to use a value after transferring ownership | Clone value if inexpensive, pass references `&x`, or restructure ownership |

### Example Trace
```text
thread 'main' panicked at 'called `Option::unwrap()` on a `None` value', src/database.rs:78:26
stack backtrace:
   0: rust_begin_unwind
   1: core::panicking::panic_fmt
   2: core::option::Option<T>::unwrap
   3: my_app::database::fetch_connection
             at ./src/database.rs:78:26
```
- **Crash location:** `src/database.rs:78:26`
- **Root cause:** Connection pool returned `None`.

---

## 5. Dart / Flutter

### Common Signatures
| Error Signature | Typical Cause | Resolution |
| :--- | :--- | :--- |
| `LateInitializationError: Field 'x' has not been initialized` | Accessing `late` variable before assignment | Initialize field in declaration, `initState()`, or make it nullable `Type?` |
| `Null check operator used on a null value` (`!`) | Forcing null assertion `!` on a null variable | Replace `!` with safe null check or fallback: `variable ?? defaultValue` |
| `A RenderFlex overflowed by x pixels` | Widget layout constraints exceeded available viewport space | Wrap widget in `SingleChildScrollView`, `Expanded`, or `Flexible` |
| `Bad state: No element` | Calling `.first` or `.single` on an empty `Iterable` | Check `.isNotEmpty` or use `firstWhereOrNull` from `collection` package |
| `setState() called after dispose()` | Calling `setState()` in an uncancelled async callback after widget disposed | Check `if (!mounted) return;` before calling `setState()` |

### Example Trace
```text
Unhandled exception:
Null check operator used on a null value
#0      UserProfileCard.build (package:myapp/widgets/profile.dart:45:32)
#1      StatelessElement.build (package:flutter/src/widgets/framework.dart:4992:28)
```
- **Crash location:** `widgets/profile.dart:45:32`
- **Root cause:** Unsafe usage of `user.avatarUrl!` when `avatarUrl` was null.
