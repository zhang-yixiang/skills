---
"mattpocock-skills": minor
---

Add an explicit subtractive-audit mode to **`improve-codebase-architecture`**. It now traces current owners, production and non-production consumers, repository contracts, behavior trade-offs, and net reduction before recommending that existing machinery be removed or collapsed. The mode returns a read-only text report, may conclude that no simplification is justified, and stops without entering the HTML deepening or grilling flow. Unqualified invocations keep the existing deepening survey, while branch and diff reviews remain owned by **`code-review`**.
