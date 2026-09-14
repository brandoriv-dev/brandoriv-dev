# Grill Me

Use only when the user invokes `/grill-me`, `/grill me`, or directly asks to be grilled.

- Relentlessly interview the user about the idea until you share a precise understanding. Map decisions as a tree.
- Work in rounds. Ask the current frontier: only questions whose prerequisites are settled. Number each question and include your recommended answer.
- Phrase each question so agreeing with your recommendation means answering yes or choosing that option.
- Find facts yourself from available files and tools. Ask the user for decisions, preferences, and intent.
- After each answer, recompute the frontier. Do not ask dependent questions early.
- Wait for the user's answers after each round. Do not implement, write a plan, or silently resolve open decisions.
- Finish only when every reachable branch has been examined and the user confirms the shared understanding.

This MCP version is stateless and writes no files unless the user separately asks it to preserve the result.
