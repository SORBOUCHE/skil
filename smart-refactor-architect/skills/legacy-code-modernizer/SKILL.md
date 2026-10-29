---
name: legacy-code-modernizer
description: Transforms legacy code to modern standards: CommonJS to ESM, callbacks to async/await, Python 2/3 idioms, and strict typing.
---

# Legacy Code Modernizer Skill

## Overview
The `legacy-code-modernizer` skill equips the agent with systematic procedures, static transformation heuristics, and code patterns to transform aging, deprecated, and non-idiomatic code into modern, maintainable, and type-safe systems across JavaScript/TypeScript and Python ecosystems without breaking runtime contracts.

---

## 1. JavaScript & TypeScript Modernization

### 1.1 Migrating CommonJS to ECMAScript Modules (ESM)

#### Transformation Matrix
| CommonJS Pattern | Modern ESM Equivalent | Notes |
| :--- | :--- | :--- |
| `const mod = require('./mod');` | `import mod from './mod.js';` | Default import |
| `const { a, b } = require('./mod');` | `import { a, b } from './mod.js';` | Named import |
| `module.exports = myFunction;` | `export default myFunction;` | Default export |
| `module.exports = { a, b };` | `export { a, b };` or inline `export const a = ...;` | Named exports |
| `exports.fn = fn;` | `export const fn = ...;` | Inline export |
| `const data = require('./data.json');` | `import data from './data.json' with { type: 'json' };` | Import attributes |
| Dynamic `require(pkg)` | `const mod = await import(pkg);` | Dynamic ESM import |

#### Resolving `__dirname` and `__filename` in Node.js ESM
```javascript
// Legacy CommonJS
const path = require('path');
const configPath = path.join(__dirname, 'config.json');

// Modern Node.js ESM (ES2022+)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, 'config.json');
```

---

### 1.2 Transforming Callback Hell and Nested Promises to Async/Await

#### The Callback Hell Pattern
```javascript
// LEGACY: Node callback pyramid
function fetchUserAuditData(userId, callback) {
  getUser(userId, (err, user) => {
    if (err) return callback(err);
    getRolePermissions(user.roleId, (err, perms) => {
      if (err) return callback(err);
      getAuditLogs(user.id, (err, logs) => {
        if (err) return callback(err);
        callback(null, { user, perms, logs });
      });
    });
  });
}
```

#### Modern Async/Await Refactored
```typescript
import { promisify } from 'node:util';

// 1. Promisify node-style callbacks if underlying library cannot be changed
const getUserAsync = promisify(getUser);
const getRolePermissionsAsync = promisify(getRolePermissions);
const getAuditLogsAsync = promisify(getAuditLogs);

interface UserAuditData {
  user: User;
  perms: Permission[];
  logs: AuditLog[];
}

// 2. Modern async/await with clean structured error handling and parallel concurrency
export async function fetchUserAuditData(userId: string): Promise<UserAuditData> {
  const user = await getUserAsync(userId);
  
  // Parallelize non-dependent asynchronous operations
  const [perms, logs] = await Promise.all([
    getRolePermissionsAsync(user.roleId),
    getAuditLogsAsync(user.id),
  ]);

  return { user, perms, logs };
}
```

#### Flattening `.then().catch()` Promise Chains
```javascript
// LEGACY: Verbose promise chains with shared outer scope leakage
function processTransaction(payload) {
  let transactionId;
  return validatePayload(payload)
    .then(valid => {
      if (!valid) throw new Error('Invalid payload');
      return createTransactionRecord(payload);
    })
    .then(record => {
      transactionId = record.id;
      return executePayment(record.amount);
    })
    .then(paymentResult => {
      return markTransactionCompleted(transactionId, paymentResult.receipt);
    })
    .catch(err => {
      logger.error('Failed transaction', err);
      throw err;
    });
}

// MODERN: Sequential, readable, isolated scope
export async function processTransaction(payload: TransactionPayload): Promise<TransactionReceipt> {
  const isValid = await validatePayload(payload);
  if (!isValid) {
    throw new ValidationError('Invalid payload parameters');
  }

  const record = await createTransactionRecord(payload);
  try {
    const paymentResult = await executePayment(record.amount);
    return await markTransactionCompleted(record.id, paymentResult.receipt);
  } catch (error) {
    logger.error('Payment processing failed', { transactionId: record.id, error });
    await markTransactionFailed(record.id, error);
    throw error;
  }
}
```

---

### 1.3 Migrating React Class Components to Functional Components & Hooks

#### Legacy Class Component
```tsx
// LEGACY: Verbose class lifecycle component
class UserProfileWidget extends React.Component<UserProfileProps, UserProfileState> {
  private timerId?: number;

  state: UserProfileState = {
    profile: null,
    loading: true,
    error: null,
    tick: 0,
  };

  componentDidMount() {
    this.fetchProfile(this.props.userId);
    this.timerId = window.setInterval(() => {
      this.setState(prev => ({ tick: prev.tick + 1 }));
    }, 1000);
  }

  componentDidUpdate(prevProps: UserProfileProps) {
    if (prevProps.userId !== this.props.userId) {
      this.fetchProfile(this.props.userId);
    }
  }

  componentWillUnmount() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
    }
  }

  fetchProfile = async (id: string) => {
    try {
      this.setState({ loading: true, error: null });
      const profile = await api.getUser(id);
      this.setState({ profile, loading: false });
    } catch (err) {
      this.setState({ error: (err as Error).message, loading: false });
    }
  };

  render() {
    const { profile, loading, error, tick } = this.state;
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    return <div>{profile?.name} (Session: {tick}s)</div>;
  }
}
```

#### Modern Functional Component with Hooks
```tsx
import React, { useState, useEffect, useCallback } from 'react';

interface UserProfileProps {
  userId: string;
}

export const UserProfileWidget: React.FC<UserProfileProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState<number>(0);

  // Interval timer with lifecycle isolation
  useEffect(() => {
    const timerId = window.setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  // Fetch data on userId change with cancellation / race condition prevention
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getUser(userId);
        if (!isCancelled) {
          setProfile(result);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [userId]);

  if (loading) return <div role="status">Loading...</div>;
  if (error) return <div role="alert">Error: {error}</div>;
  return <div>{profile?.name} (Session: {tick}s)</div>;
};
```

---

### 1.4 Deprecated Library Replacements

| Legacy Library | Modern Replacement | Migration Action |
| :--- | :--- | :--- |
| `moment` | `date-fns` or native `Intl.DateTimeFormat` | Eliminate large bundle size, convert to immutable pure date helpers. |
| `request` | `fetch` (native global) or `ky` / `got` | Replace deprecated request package with native standard fetch API. |
| `lodash/cloneDeep` | `structuredClone()` (Web/Node 17+) | Native deep clone without external library overhead. |
| `lodash/isNil`, `has` | `??`, `?.`, `Object.hasOwn()` | Native syntax operations. |
| `bluebird` | Native `Promise` & `Promise.allSettled` | Native runtime promises are now performant and standard. |

---

## 2. Python Codebase Modernization

### 2.1 Eradicating Python 2 / Legacy Idioms

#### Systematic Cleanup Rules
1. **Dictionaries**:
   - `dict.iteritems()` -> `dict.items()`
   - `dict.iterkeys()` -> `dict.keys()`
   - `dict.has_key(k)` -> `k in dict`
2. **Ranges & Sequences**:
   - `xrange(n)` -> `range(n)`
3. **Strings & Unicode**:
   - `unicode(text)` -> `str(text)`
   - `basestring` -> `str`
   - Old formatting `"%s: %d" % (name, count)` or `"{}".format()` -> f-strings `f"{name}: {count}"`
4. **File I/O**:
   - Legacy `os.path.join(a, b)` -> `pathlib.Path(a) / b`
   - Raw `open()` without context manager -> `with Path("file.txt").open(mode="r", encoding="utf-8") as f:`

---

### 2.2 Adding Comprehensive PEP 484 / PEP 604 Type Annotations

#### Before: Un-typed, Ambiguous Python
```python
def process_orders(orders, config=None, fallback=None):
    results = []
    for item in orders:
        if item.get("status") == "active":
            val = item.get("total", 0) * (config.get("multiplier") if config else 1.0)
            results.append({"id": item.get("id"), "val": val})
    return results
```

#### After: Fully Typed Modern Python 3.10+
```python
from __future__ import annotations
from typing import TypedDict

class OrderInput(TypedDict):
    id: str
    status: str
    total: float

class OrderResult(TypedDict):
    id: str
    val: float

class ProcessingConfig(TypedDict, total=False):
    multiplier: float

def process_orders(
    orders: list[OrderInput],
    config: ProcessingConfig | None = None,
    fallback: float | None = None,
) -> list[OrderResult]:
    multiplier = config.get("multiplier", 1.0) if config else 1.0
    return [
        {"id": item["id"], "val": item.get("total", 0.0) * multiplier}
        for item in orders
        if item.get("status") == "active"
    ]
```

---

### 2.3 Converting Verbose Classes to Dataclasses & Pydantic Models

#### Legacy Class Boilerplate
```python
class CustomerInvoice:
    def __init__(self, invoice_id, customer_name, total_amount, items=None, is_paid=False):
        self.invoice_id = invoice_id
        self.customer_name = customer_name
        self.total_amount = total_amount
        self.items = items if items is not None else []
        self.is_paid = is_paid

    def __repr__(self):
        return f"CustomerInvoice(id={self.invoice_id}, customer={self.customer_name})"

    def __eq__(self, other):
        if not isinstance(other, CustomerInvoice):
            return False
        return self.invoice_id == other.invoice_id
```

#### Modern Python Dataclass
```python
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4

@dataclass(slots=True, frozen=True)
class InvoiceItem:
    description: str
    unit_price: float
    quantity: int = 1

    @property
    def total(self) -> float:
        return self.unit_price * self.quantity

@dataclass(slots=True)
class CustomerInvoice:
    invoice_id: UUID = field(default_factory=uuid4)
    customer_name: str = ""
    items: list[InvoiceItem] = field(default_factory=list)
    is_paid: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def total_amount(self) -> float:
        return sum(item.total for item in self.items)
```

---

### 2.4 Modern Python Structural Pattern Matching (PEP 634)

Replace sprawling `if-elif-else isinstance(...)` or dictionary dispatchers with clear `match/case`:
```python
from dataclasses import dataclass

@dataclass
class OrderCreated:
    order_id: str
    total: float

@dataclass
class OrderShipped:
    order_id: str
    tracking_number: str

@dataclass
class OrderCancelled:
    order_id: str
    reason: str

type OrderEvent = OrderCreated | OrderShipped | OrderCancelled

def handle_order_event(event: OrderEvent) -> None:
    match event:
        case OrderCreated(order_id=oid, total=total) if total > 1000:
            logger.info("High value order created: %s, amount: %f", oid, total)
            send_vip_alert(oid)
        case OrderCreated(order_id=oid):
            logger.info("Standard order created: %s", oid)
        case OrderShipped(order_id=oid, tracking_number=tracking):
            notify_customer_shipped(oid, tracking)
        case OrderCancelled(order_id=oid, reason=reason):
            audit_cancellation(oid, reason)
        case _:
            raise ValueError(f"Unhandled event type: {event}")
```

---

## 3. Migration Verification Protocol
1. **Lint & Syntax Check**: Run ESLint/Biome or Ruff/Flake8.
2. **Type Check**: Run `tsc --noEmit` or `mypy --strict`.
3. **Behavioral Invariance Tests**: Run test suite (Jest, Vitest, Pytest).
4. **Bundle & Performance Profiling**: Verify reduction in memory footprint and package bundle size.
