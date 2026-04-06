# CLAUDE.md — Codebase Standards & Philosophy

This file defines how this codebase is written and maintained. These rules are **not suggestions** — they are standing orders followed on every file, every function, every PR. When in doubt, re-read this file.

---

## Structure

Always adhere to the current structure of the codebase. If there is a pattern in how pages are structured, adhere to that structure when creating a new page. If the codebase lacks a cohesive structure, create one that is clean and intuitive.

---

## Core Philosophy

> **Code is written once, read hundreds of times. Optimize for the reader.**

A clean codebase is not about showing off. It is about making the next person (or future you) able to understand, modify, and extend the code with zero friction. Complexity is the enemy. Consistency is the weapon.

---

## 1. Naming

Names are the most important design decision in a file. Get them right.

- **Variables** — noun phrases that describe what the value *is*: `userProfile`, `invoiceTotal`, `isLoading`
- **Functions** — verb phrases that describe what they *do*: `fetchUserById`, `calculateDiscount`, `sendWelcomeEmail`
- **Booleans** — always prefixed with `is`, `has`, `can`, `should`: `isAuthenticated`, `hasPermission`
- **No abbreviations** — `req` → `request`, `res` → `response`, `e` → `error`, `cb` → `callback`
- **No single-letter variables** — except loop indices (`i`, `j`) in tight, obvious loops
- **No vague names** — `data`, `info`, `stuff`, `temp`, `thing`, `util` are banned
- **Name the why, not the what** — `filteredActiveUsers` beats `users2`

If you cannot name something cleanly, it is a signal the abstraction is wrong. Fix the structure.

---

## 2. Functions

- **One function, one job** — if you need "and" to describe what a function does, split it
- **Keep functions short** — aim for under 30 lines; if scrolling is required, refactor
- **No side effects in unexpected places** — a function named `getUser` must never write to a database
- **Pure when possible** — same inputs always produce same outputs; no hidden state
- **Early returns over nested conditionals** — validate and bail at the top, happy path at the bottom
- **Parameters** — prefer 1–2; at 3+, introduce a named options object
- **No boolean flag parameters** — `sendEmail(true)` is meaningless; use named variants or an options object

```
// ❌ Bad
function process(user, send, log, override) { ... }

// ✅ Good
function processUser(user, options = {}) {
  const { sendEmail = false, logActivity = true } = options;
  ...
}
```

---

## 3. Control Flow

- **Guard clauses first** — handle invalid states, edge cases, and early exits at the top of a function
- **Never nest more than 2 levels deep** — extract nested logic into named helper functions
- **No else after a return** — if a branch returns, the else is redundant noise

```
// ❌ Bad
function getDiscount(user) {
  if (user) {
    if (user.isPremium) {
      return 0.2;
    } else {
      return 0.05;
    }
  } else {
    return 0;
  }
}

// ✅ Good
function getDiscount(user) {
  if (!user) return 0;
  if (user.isPremium) return 0.2;
  return 0.05;
}
```

---

## 4. No Magic Values

Every literal value in the codebase must be named. No bare strings. No unexplained numbers.

```
// ❌ Bad
if (user.role === 3) { ... }
setTimeout(fn, 86400000);

// ✅ Good
const ROLE_ADMIN = 3;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

if (user.role === ROLE_ADMIN) { ... }
setTimeout(fn, ONE_DAY_MS);
```

Constants are defined at the top of a file or in a dedicated constants module. They are SCREAMING_SNAKE_CASE.

---

## 5. File & Module Structure

- **One concern per file** — a file owns one domain, one component, one service
- **File size limit: ~300 lines** — if a file exceeds this, it is doing too much; split it
- **Colocation** — keep related code together; don't scatter a feature across five folders
- **No barrel files that mask imports** — be explicit about what you're importing and from where
- **Folder names are lowercase-kebab** — `user-profile/`, not `UserProfile/` or `userProfile/`

Standard file layout (top to bottom):
1. Imports (external libraries, then internal modules)
2. Constants
3. Types / Interfaces (if applicable)
4. Main export (function, class, or component)
5. Helper functions (private, unexported)

---

## 6. Comments

Comments explain **why**, not **what**. If you're explaining what the code does, rewrite the code.

```
// ❌ Bad — describes the what (the code already says this)
// Multiply price by tax rate
const total = price * taxRate;

// ✅ Good — explains the why
// Tax rate is applied before discounts per regulatory requirement (see ticket #412)
const taxedPrice = price * taxRate;
```

**When to comment:**
- Business logic that isn't obvious from the domain
- Workarounds for known bugs, library quirks, or browser issues
- Links to external specs, tickets, or documentation
- Any code where "why is this here?" is a reasonable question

**When not to comment:**
- To label what a block of code does (extract it into a named function instead)
- To explain variable types (use types or better names)
- To leave TODO/FIXME notes that are older than one sprint

---

## 7. Error Handling

- **Never swallow errors silently** — an empty `catch` block is always a bug
- **Fail loudly in development, gracefully in production**
- **Errors are domain objects** — give them meaning; don't just re-throw a raw exception with no context
- **Handle errors at the right layer** — don't catch in a utility and also catch in the caller
- **Always log the original error** — when wrapping, preserve the original stack trace

```
// ❌ Bad
try {
  await saveUser(user);
} catch (e) {}

// ✅ Good
try {
  await saveUser(user);
} catch (error) {
  logger.error('Failed to save user', { userId: user.id, error });
  throw new AppError('USER_SAVE_FAILED', { cause: error });
}
```

---

## 8. Consistency Rules

These patterns are chosen and fixed. Do not introduce alternatives.

- **Formatting** — enforced by the project formatter (Prettier / Black / gofmt / etc.); never hand-format
- **Import order** — external → internal → relative; enforced by linter
- **Quotes** — single quotes for JS/TS strings; double quotes for Python strings (or whatever the formatter enforces — pick one)
- **Trailing commas** — always in multi-line lists and parameters
- **Semicolons** — always (JS/TS) or never — pick one and never deviate
- **`async`/`await` over raw Promises** — always; `.then().catch()` chains are banned except in exceptional cases
- **`const` over `let`** — default to `const`; only use `let` when reassignment is genuinely needed; `var` is banned

---

## 9. State & Data Flow

- **Data flows in one direction** — functions receive inputs, return outputs; avoid shared mutable state
- **No implicit globals** — everything a function needs is passed in or explicitly imported
- **Immutability by default** — do not mutate inputs; return new values
- **Minimize stateful surface area** — state lives in as few places as possible, as high as necessary, no higher

---

## 10. What "Done" Means

A piece of code is not done when it works. It is done when:

- [ ] It handles edge cases and errors explicitly
- [ ] Variable and function names communicate intent without comments
- [ ] No function is doing more than one job
- [ ] No magic values or unexplained literals remain
- [ ] Nesting is at most 2 levels deep
- [ ] It is consistent with the rest of the codebase
- [ ] A new developer could read it and understand it in under 60 seconds

---

## Non-Negotiables (Zero Tolerance)

These are never acceptable under any circumstances, regardless of deadline, urgency, or "I'll fix it later":

1. **Silent error swallowing** — `catch (e) {}` is always wrong
2. **Magic literals** — bare numbers and strings without names
3. **Functions with "and" in their name** — split them
4. **Nesting beyond 2 levels** — refactor with early returns or helper functions
5. **Commented-out code** committed to the repo — delete it; version control remembers
6. **Copy-paste duplication** — extract and reuse; duplication is a design failure
7. **Vague names** — `data`, `result`, `temp`, `foo`, `doStuff` are not names

---

*If a rule here conflicts with a quick fix, the rule wins. If a rule here seems wrong for a new situation, update this file in a deliberate conversation — don't silently break it.*
