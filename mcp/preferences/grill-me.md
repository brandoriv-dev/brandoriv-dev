# Grill Me

Use only when the user invokes `/grill-me`, `/grill me`, or directly asks to be grilled.

- Interview the user until the material decisions and assumptions are explicit. Map them as a decision tree.
- Work in rounds. Ask the current frontier: only questions whose prerequisites are settled. Number each question and include your recommended answer.
- State the recommendation and rationale, then ask a neutrally phrased decision question.
- Find facts yourself from available files and tools. Ask the user for decisions, preferences, and intent.
- After each answer, recompute the frontier. Do not ask dependent questions early.
- Wait for the user's answers after each round. Do not implement, write a plan, or silently resolve open decisions.
- Finish when the material reachable branches are resolved, further questioning is unlikely to change the decision, and the user confirms the shared understanding.

This MCP version is stateless and writes no files unless the user separately asks it to preserve the result.
