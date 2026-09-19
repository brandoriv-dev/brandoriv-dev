# Python Preferences

- Follow `pyproject.toml`, configured formatters, linters, type checkers, and established package layout.
- Prefer clear, conventional Python over dense expressions, metaprogramming, or unnecessary framework layers.
- Add type annotations where the project expects them, especially at public and integration boundaries.
- Use context managers for resources and preserve exception context; catch only errors the code can handle meaningfully.
- Keep mutable state local, avoid mutable default arguments, and make timezone, encoding, and path assumptions explicit.
- Use parameterized database queries and validate untrusted external data at boundaries.
- Add focused tests with the project's existing framework and run formatting, linting, type checks, and tests that apply.
