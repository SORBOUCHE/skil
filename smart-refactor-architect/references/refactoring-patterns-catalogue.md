# Refactoring Patterns Catalogue

A curated reference catalog of canonical refactoring patterns, smells addressed, mechanics, and code examples based on Martin Fowler's disciplines and modern clean architecture standards.

---

## 1. Composing Methods & Functions

### 1.1 Extract Function / Method
- **Code Smell**: Long Method, Duplicated Code, Low Readability.
- **Goal**: Turn a code fragment into a dedicated function whose name explains its intent.
- **Mechanics**:
  1. Create a new function named after the intention of the code.
  2. Copy the extracted code into the new target function.
  3. Scan the extracted code for variables that are local to the source function. Pass them as arguments.
  4. Replace the original code fragment with a call to the new function.
  5. Compile and run tests.

### 1.2 Replace Temp with Query
- **Code Smell**: Temporary variables cluttering a function and making extraction harder.
- **Goal**: Extract the expression into a pure function/getter and replace references to the temp variable with that query.
- **Before**:
  ```typescript
  const basePrice = quantity * itemPrice;
  if (basePrice > 1000) return basePrice * 0.95;
  ```
- **After**:
  ```typescript
  function getBasePrice(quantity: number, itemPrice: number): number {
    return quantity * itemPrice;
  }
  if (getBasePrice(quantity, itemPrice) > 1000) return getBasePrice(quantity, itemPrice) * 0.95;
  ```

### 1.3 Replace Nested Conditional with Guard Clauses (Early Return)
- **Code Smell**: Arrow anti-pattern, deeply indented nested `if/else` statements.
- **Goal**: Use guard clauses for exceptional/edge conditions to keep the "happy path" flat and prominent.
- **Before**:
  ```typescript
  function getPayAmount(employee: Employee): number {
    let result: number;
    if (employee.isDead) {
      result = deadAmount();
    } else {
      if (employee.isSeparated) {
        result = separatedAmount();
      } else {
        if (employee.isRetired) {
          result = retiredAmount();
        } else {
          result = normalPayAmount();
        }
      }
    }
    return result;
  }
  ```
- **After**:
  ```typescript
  function getPayAmount(employee: Employee): number {
    if (employee.isDead) return deadAmount();
    if (employee.isSeparated) return separatedAmount();
    if (employee.isRetired) return retiredAmount();
    return normalPayAmount();
  }
  ```

---

## 2. Organizing Data & Responsibilities

### 2.1 Introduce Parameter Object
- **Code Smell**: Long Parameter List, Data Clumps.
- **Goal**: Group repeated clusters of parameters into an explicit domain object or value object.
- **Before**:
  ```typescript
  function searchTransactions(startDate: Date, endDate: Date, customerId: string, minAmount: number, maxAmount: number) { ... }
  ```
- **After**:
  ```typescript
  interface DateRange {
    start: Date;
    end: Date;
  }
  interface TransactionFilter {
    dateRange: DateRange;
    customerId: string;
    amountRange?: { min: number; max: number };
  }
  function searchTransactions(filter: TransactionFilter) { ... }
  ```

### 2.2 Replace Primitive Obsession with Value Object
- **Code Smell**: Primitive Obsession (passing raw strings or numbers for emails, currency, phone numbers, coordinates).
- **Goal**: Encapsulate the primitive with validation and domain logic into an immutable Value Object.
- **Example**:
  ```typescript
  export class EmailAddress {
    private readonly value: string;

    constructor(candidate: string) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
        throw new Error(`Invalid email address format: ${candidate}`);
      }
      this.value = candidate.toLowerCase().trim();
    }

    public toString(): string {
      return this.value;
    }

    public equals(other: EmailAddress): boolean {
      return this.value === other.value;
    }
  }
  ```

### 2.3 Extract Class / Extract Service
- **Code Smell**: Large Class / God Class, Divergent Change (class modified for multiple unrelated reasons).
- **Goal**: Split out cohesive sets of fields and methods into a dedicated independent class.

---

## 3. Simplifying Conditional Logic & Polymorphism

### 3.1 Replace Conditional with Polymorphism (Strategy Pattern)
- **Code Smell**: Switch statements checking type codes or enums in multiple places.
- **Goal**: Create a common interface and subclasses/strategies for each case.
- **Before**:
  ```typescript
  function calculateShipping(type: 'AIR' | 'GROUND' | 'SEA', weight: number): number {
    switch (type) {
      case 'AIR': return weight * 5.0 + 20;
      case 'GROUND': return weight * 1.5 + 5;
      case 'SEA': return weight * 0.8 + 15;
    }
  }
  ```
- **After**:
  ```typescript
  interface ShippingStrategy {
    calculate(weight: number): number;
  }

  class AirShipping implements ShippingStrategy {
    calculate(weight: number): number { return weight * 5.0 + 20; }
  }

  class GroundShipping implements ShippingStrategy {
    calculate(weight: number): number { return weight * 1.5 + 5; }
  }

  class SeaShipping implements ShippingStrategy {
    calculate(weight: number): number { return weight * 0.8 + 15; }
  }
  ```

---

## 4. Large-Scale System Modernization Patterns

### 4.1 Strangler Fig Pattern
- **Definition**: Gradually replace specific features of a legacy monolith by routing new traffic to a modernized service while keeping the old system running until complete deprecation.
- **Steps**:
  1. Place an API gateway / reverse proxy in front of legacy application.
  2. Build the new bounded context or micro-module.
  3. Route a slice of incoming traffic to the new module.
  4. Once proven stable, redirect 100% of traffic and strangle the legacy path.

### 4.2 Branch by Abstraction
- **Definition**: Refactor a component in place within a single codebase where multiple developers are working concurrently.
- **Steps**:
  1. Introduce an abstraction layer (interface) over the legacy component.
  2. Refactor existing consumers to call the abstraction.
  3. Write the new implementation adhering to the abstraction.
  4. Toggle the implementation using feature flags or dependency injection.
  5. Once verified, delete the old implementation and optionally inline the abstraction.
