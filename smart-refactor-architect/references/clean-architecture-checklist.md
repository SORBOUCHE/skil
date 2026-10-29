# Clean Architecture Refactoring Checklist

Use this checklist during code reviews, pre-commit evaluations, and architecture refactoring audits to verify that code conforms to Clean Architecture and SOLID principles.

---

## 1. Dependency Rule & Layer Boundary Verification

- [ ] **Dependency Inversion**: Do all dependencies point strictly inward toward the domain layer?
  - Domain (Entities, Value Objects) has **0 external framework/IO imports**.
  - Application (Use Cases) depends only on Domain and Port interfaces.
  - Infrastructure (Adapters, DB, Network) implements Application/Domain ports.
  - UI/Controllers call Application use cases through command/query models.
- [ ] **No Leaky Abstractions**: Are SQL queries, ORM entities, HTTP response objects, or external vendor SDK models strictly contained within their respective infrastructure adapters?
- [ ] **Composition Root**: Are dependencies instantiated and injected exclusively in a single composition root (e.g., `main.ts`, `container.ts`, or DI container module)?

---

## 2. SOLID Principles Verification

### Single Responsibility Principle (SRP)
- [ ] Does each module/class have only one reason to change (one actor or business domain)?
- [ ] Are persistence, validation, notifications, and core domain business logic isolated in separate classes?
- [ ] Are file sizes reasonable (typically under 200-300 lines of code)?

### Open/Closed Principle (OCP)
- [ ] Can new business behaviors or provider adapters be added without modifying existing use case orchestration code?
- [ ] Are type-based switch statements replaced by polymorphism, strategies, or plugin registries?

### Liskov Substitution Principle (LSP)
- [ ] Do all implementations of an interface honor the expected contract without throwing `NotImplementedException` or requiring type-checking (`instanceof`) by the caller?

### Interface Segregation Principle (ISP)
- [ ] Are interfaces lean and cohesive (client-specific) rather than general-purpose "fat" interfaces?
- [ ] Does any consumer class depend on methods it does not use? If so, split the interface into smaller role interfaces.

### Dependency Inversion Principle (DIP)
- [ ] Do high-level use cases depend on abstract Port interfaces rather than concrete repository or service implementations?

---

## 3. Testability & Maintainability Verification

- [ ] **100% Mockable In-Memory**: Can every use case be unit-tested without spinning up a database, filesystem, or network connection?
- [ ] **Deterministic Domain Logic**: Are domain entities and value objects pure functions or side-effect-free objects wherever possible?
- [ ] **Fast Test Execution**: Do the domain and application unit tests execute in milliseconds?
- [ ] **Test Coverage Safeguard**: Are all critical edge cases, boundary values, and error pathways covered by automated unit or characterization tests?

---

## 4. Code Health & Smell Elimination Checklist

- [ ] **Guard Clauses**: Are deep nested `if-else` blocks flattened into early returns?
- [ ] **Parameter Count**: Are function arguments limited to 3 or fewer, using Parameter Objects where needed?
- [ ] **Naming Intent**: Do class, method, and variable names clearly convey domain concepts rather than technical implementation details (e.g. `UserRepository` vs `PostgresQueryRunner`)?
- [ ] **No Dead Code**: Have all unused functions, unreferenced imports, commented-out code, and obsolete flags been removed?
