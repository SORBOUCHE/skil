# Smart Refactor Architect - Agent Rules & Core Directives

## 1. Prime Directive: Behavioral Invariance
Refactoring is strictly defined as changing the internal structure of code without altering its external observable behavior.

1. **Two-Hat Discipline (Kent Beck / Martin Fowler)**:
   - When wearing the **Refactoring Hat**, do not add any new user-facing functionality or change existing behavior. Only restructure code to improve readability, maintainability, performance, or testability.
   - When wearing the **Feature Hat**, add tests and implement new capabilities.
   - **Never mix feature additions/bug fixes with structural refactoring in the same atomic commit or step.**

2. **Test-Protected Refactoring**:
   - Refactoring **MUST NOT** proceed on untested code without first establishing a safety net.
   - **Step 0: Verification**: Run existing test suites. If tests fail, stop and fix tests/environment first before refactoring.
   - **Step 1: Characterization Tests**: If tests are missing or insufficient around legacy components, write *characterization tests* (golden master tests) that capture the current runtime behavior before altering a single line of logic.
   - **Step 2: Micro-steps**: Make small, incremental transformations. Run tests after every single transformation.
   - **Step 3: Verification**: Confirm that all tests pass before completing the refactoring turn.

3. **Public Interface Preservation**:
   - Preserve all existing public APIs, function signatures, exported types, and ABI/REST contracts.
   - If an interface must be modernized, implement the **Adapter Pattern** or create a deprecated shim wrapping the new modern implementation.
   - Mark legacy APIs with standard deprecation notices (e.g. `@deprecated`, `warnings.warn(..., DeprecationWarning)`) with migration guidance pointing to the new interface.

4. **SOLID Principles & Clean Architecture**:
   - **Single Responsibility Principle (SRP)**: Each class/module must have only one reason to change. Extract cohesive responsibilities into dedicated services.
   - **Open/Closed Principle (OCP)**: Favor polymorphic dispatch, strategy patterns, or dependency injection over sprawling `switch`/`if-else` blocks on types.
   - **Liskov Substitution Principle (LSP)**: Derived classes or implementations must honor the contracts of their base types without throwing unexpected unsupported operation errors.
   - **Interface Segregation Principle (ISP)**: Clients should not be forced to depend upon interfaces they do not use. Prefer small, role-specific interfaces.
   - **Dependency Inversion Principle (DIP)**: High-level modules must not depend on low-level modules; both must depend on abstractions. Pure domain logic must never import concrete infrastructure (DB, HTTP, Disk, Framework specifics).

5. **Elimination of Technical Debt & Code Smells**:
   - Dismantle God Objects and Bloated Classes (> 300 LOC or > 10 methods).
   - Eradicate Long Parameter Lists (> 3-4 arguments) using Parameter Objects or Builder patterns.
   - Clean Primitive Obsession by encapsulating domain primitives into Value Objects.
   - Eliminate Dead Code and zombie features with certainty (verify no dynamic references).
   - Flatten Deep Nesting (maximum 2-3 levels of indentation) using Early Returns / Guard Clauses.

6. **Tooling & Language Modernization Standards**:
   - Modernize JavaScript/TypeScript: migrate legacy CommonJS `require` to ESM `import`/`export`, callback hell and raw `.then()` chains to clean `async`/`await` with proper `try`/`catch`, and legacy React class components to modern hooks with strict TypeScript typing.
   - Modernize Python: eliminate Python 2 idioms, add PEP 484 type annotations, leverage `dataclasses` or `pydantic` models, use `pathlib.Path` over `os.path`, and modern dictionary merges/pattern matching.
