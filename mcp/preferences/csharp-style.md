# Explicit, Readable C# Style

Prefer conventional, easily debugged C# over compressed, deeply nested, prematurely abstract, or speculatively optimized code. Repository conventions still come first unless they conflict with correctness or the requested change.

## Personal defaults

- Prefer explicit types over `var` when the type is known and readable.
- Prefer ordinary `value == null` checks; use pattern matching when the pattern adds meaning.
- Keep simple ternaries; use normal control flow when a branch becomes difficult to scan.
- Keep control flow flat with guard clauses and condition inversion. Do not replace nesting with collections of one-line helpers.
- Use complete purpose-driven names. Include units when a numeric value is otherwise ambiguous, and avoid dumping-ground names such as `Utils`, `Common`, or `Manager`.
- Keep temporary state local. Primary constructors are fine when initialization remains easy to scan; use a conventional constructor when it is clearer.

## Abstractions

Create an abstraction only for a present benefit: meaningful non-trivial reuse, complexity isolation, a real boundary, interchangeable implementations, or an established architectural requirement. A second occurrence alone is not enough.

- Prefer a small amount of obvious duplication over forcing unrelated behavior through the wrong abstraction.
- Prefer composition for code reuse. Use inheritance for a stable subtype relationship or when a framework requires it.
- Do not introduce an interface merely because a class has one implementation. Keep justified interfaces narrow and follow normal `IName` conventions.

## Comments and performance

- Make code explain what it does; use comments for why, external constraints, compatibility, workarounds, algorithms, or non-obvious optimization.
- Prefer straightforward algorithms until profiling, benchmarks, or explicit requirements justify complexity. Do not ignore obvious algorithmic, network, or database costs.
- Document why an optimization is necessary when it makes the implementation substantially less obvious.

Final test: can a developer understand and safely change the code without first unraveling avoidable cleverness, nesting, coupling, or abstraction?

