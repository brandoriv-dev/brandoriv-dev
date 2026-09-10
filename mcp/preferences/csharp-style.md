# Explicit, Readable C# Style

Automatically apply when working with C# or .NET code.

Prefer explicit, conventional, easily debugged C# over clever, compressed, deeply nested, prematurely abstract, or unnecessarily optimized code. Optimize for the developer who has a breakpoint in the method and needs to quickly understand what state exists, which conditions matter, what happens next, and why anything unusual was done.

Existing repository conventions still matter, but do not copy an existing pattern merely because it is more clever, abstract, or compressed than necessary.

## Types

- Prefer explicit types over `var`.
- Use `Customer customer = ...`, `string customerName = ...`, and `int orderCount = ...` when the type is known and readable.

## Null checks

- Prefer conventional equality null checks for ordinary null checks: `customer == null`.
- Do not avoid pattern matching when the pattern provides meaningful value. This is not a ban on `is`.

## Ternaries

- Simple ternaries are good: `customer.IsActive ? "Active" : "Inactive"`.
- Use `if` / `else` when the condition or branches become difficult to scan.
- A mentally expensive ternary should become ordinary control flow.

## Control flow

- Keep control flow flat.
- Prefer guard clauses and condition inversion when they keep the main path visually flat.
- Three nested control-flow levels should trigger a readability check. It is not a mechanical prohibition.
- When flattening code, prefer guard clauses first, invert exceptional or unhappy conditions, and extract a method only when a substantial block has a coherent named responsibility.
- Do not respond to nesting by creating a collection of one-line helper methods or micro-abstractions.

## Abstractions

- Do not create abstractions merely because an abstraction is possible or because code appears twice.
- Every abstraction introduces another relationship future changes must respect.
- Ask: what concrete value does this abstraction provide, and is that value worth the additional coupling?
- Avoid unnecessary interfaces, wrappers, helper classes, services, factories, extension methods, base classes, generic frameworks, one-use methods, and one-use abstractions.
- Create an abstraction when it solves a present, concrete problem: meaningful duplication of non-trivial behavior, genuine complexity, a required test boundary, multiple interchangeable implementations, separation of a decision from when it is used, or an established architectural requirement.
- A small amount of obvious duplication is often preferable to forcing unrelated code through the wrong shared abstraction.
- Do not justify an abstraction with only "separation of concerns", "testability", "future extensibility", "clean architecture", "SOLID", or "we may need another implementation later". Explain the concrete present benefit.

## Composition and inheritance

- Prefer composition over implementation inheritance when the goal is primarily code reuse.
- Prefer small concrete types, composition, and narrow interfaces when an abstraction is actually needed.
- Avoid deep base-class hierarchies, shared protected state, and overrides required only to satisfy the parent type.
- Inheritance is appropriate when there is a genuine, stable subtype relationship or an existing framework expects it.
- Do not introduce an interface simply because a class has one implementation.
- When an interface is justified, keep its contract narrow.
- Follow normal C#/.NET interface naming conventions such as `ICustomerRepository`; do not remove the `I` prefix for style reasons.

## Naming

- Names should communicate purpose without requiring the reader to decode shorthand.
- Prefer complete, descriptive names such as `currentCustomer`, `expirationDate`, and `retryCount`.
- Avoid single-letter variables except where the meaning is conventional and tightly scoped, such as a simple loop index or mathematical expression.
- Common domain and technical abbreviations such as `Id`, `URL`, `HTTP`, `DTO`, or project-standard terms are fine.
- Do not redundantly encode the declared type into the variable name. Prefer `customerName` and `customers` over `customerNameString` and `customerListCollection`.
- For raw numeric values where the unit is ambiguous, include the unit in the name, such as `timeoutSeconds` or `distanceMiles`.
- Avoid dumping-ground names such as `Utils`, `Helpers`, `Common`, and `Manager` when a more specific responsibility can be named. Do not create a class solely to avoid one of these names.

## Comments

- Prefer code that communicates intent without explanatory narration.
- Comments should explain why, not translate the next line into English.
- Useful comments explain unusual decisions, external system behavior, compatibility constraints, non-obvious performance decisions, workarounds, mathematical or domain-specific algorithms, or links to specifications and issues.
- When a comment is required only to explain a complicated expression, first try better names, intermediate variables, clearer control flow, or a better type.
- Keep public API and architectural documentation where it provides value.

## Variable scope

- Prefer local variables when the value belongs to a single method.
- Do not promote temporary state to a class field unnecessarily.
- For simple method state, declaring variables near the beginning of the method is fine when it makes the method easier to scan and debug.
- Do not force declarations into the narrowest possible textual location when doing so makes the method harder to follow.

## Constructors

- Primary constructors are fine when they remain easy to scan.
- When a class has multiple dependencies, format constructor parameters vertically rather than compressing everything onto one line.
- Reducing line count is not itself a readability improvement.
- Use a conventional constructor when initialization logic makes it clearer.

## Performance

- Do not sacrifice readability for speculative micro-optimizations.
- Prefer the straightforward implementation unless profiling identifies a bottleneck, benchmarks demonstrate a meaningful difference, performance requirements make the constraint explicit, or the better algorithm/data structure is obvious without harming readability.
- This does not mean ignoring obvious algorithmic problems, unnecessary network/database calls, or clearly inappropriate data structures.
- Avoid spending complexity on tiny efficiencies while missing large architectural costs.
- When an optimization makes code substantially less obvious, document why the optimization is necessary.

## Readability

Prefer:

- explicit over implicit
- readable over clever
- simple over compressed
- flat over deeply nested
- local over unnecessarily promoted
- concrete over prematurely abstract
- composition over forced inheritance
- clear names over abbreviations
- self-explanatory code over narrating comments
- measured optimization over speculative cleverness
- a little duplication over the wrong abstraction
- boring, obvious code over impressive-looking code

These are preferences, not excuses for dogmatism. Do not use them to duplicate large amounts of genuinely shared behavior, reject useful abstractions, ignore established project architecture, remove appropriate framework patterns, or make code less idiomatic for the surrounding C#/.NET codebase.

Final test: can a developer reading this code understand its behavior and safely change it without first unraveling unnecessary cleverness, nesting, coupling, or abstraction?

