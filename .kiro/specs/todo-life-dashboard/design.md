# Design Document

## Overview

The To-Do List Life Dashboard is a fully client-side, zero-dependency single-page application delivered as three files: `index.html`, `css/style.css`, and `js/app.js`. There is no build step, no package manager, and no network calls. All state lives in the browser's `localStorage` and all rendering is done by direct DOM manipulation in Vanilla JavaScript.

The design follows five guiding principles:

1. **Single-file per concern** — one HTML file, one CSS file, one JS file.
2. **Module pattern** — each widget is an IIFE-based module attached to a single `App` namespace object to avoid polluting the global scope.
3. **CSS custom properties for theming** — the entire color palette is expressed as CSS variables on `:root`; switching themes is a single class swap on `<html>`.
4. **Defensive localStorage access** — every read/write is wrapped in a `try/catch`; the app degrades gracefully and shows inline error messages rather than crashing.
5. **No external dependencies** — the app works by opening `index.html` directly in any modern browser (Chrome, Firefox, Edge, Safari).

---

## Architecture

### High-Level Structure

```
CodingCamp-19October26-fashi/
├── index.html          # Single HTML page; all widget markup lives here
├── css/
│   └── style.css       # CSS custom properties, layout, component styles, responsive breakpoints
└── js/
    └── app.js          # All JavaScript: namespace, modules, event wiring
```

### JavaScript Architecture — Namespace + IIFE Modules

`app.js` creates a single global namespace object `App` and attaches each widget as a frozen sub-object. No other global variables are created.

```
window.App = {
  Storage,       // thin localStorage wrapper with try/catch
  Utils,         // shared helpers (date formatting, validation)
  Greeting,      // GreetingWidget module
  Timer,         // FocusTimer module
  Todo,          // TodoList module
  Links,         // QuickLinks module
  Theme,         // ThemeToggle module
  init()         // bootstraps all modules; called on DOMContentLoaded
}
```

Each module exposes only a public `init()` method (and optionally a few helpers for inter-module use). Internal state and DOM references are held in the module's closure.

### Execution Flow

```
DOMContentLoaded
  └── App.init()
        ├── App.Theme.init()      ← applies saved/default theme before paint
        ├── App.Greeting.init()   ← restores name, starts clock interval
        ├── App.Timer.init()      ← sets initial 25:00 display, wires buttons
        ├── App.Todo.init()       ← loads tasks from storage, renders list
        └── App.Links.init()      ← loads links from storage, renders buttons
```

`Theme.init()` runs first to prevent a flash of the wrong theme color.

### Event Propagation Pattern

Each module attaches its own event listeners during `init()`. User interactions stay within the module boundary — no cross-module events are fired for purely local operations (e.g., deleting a task). The only cross-cutting concern is the `Storage` module, which all other modules call.

---

## Components and Interfaces

### App.Storage

A thin wrapper around `localStorage` that surfaces errors as return values instead of thrown exceptions.

```js
App.Storage = {
  get(key)          → { ok: true, value } | { ok: false, error }
  set(key, value)   → { ok: true } | { ok: false, error }
  remove(key)       → void
}
```

All values are JSON-serialised on write and JSON-parsed on read. A `StorageError` is caught and returned as `{ ok: false, error }` so callers can show inline error messages.

---

### App.Utils

Shared pure helpers with no side effects.

```js
App.Utils = {
  formatDate(date)           → string  // "Monday, 26 October 2026"
  formatTime(date)           → string  // "HH:MM:SS"
  getGreeting(hour)          → string  // "Good Morning" | "Good Afternoon" | ...
  isValidUrl(str)            → boolean // must start with http:// or https://
  trimAndLower(str)          → string  // trim + toLowerCase for duplicate checks
  sanitizeText(str)          → string  // HTML-encode to prevent XSS
}
```

---

### App.Greeting

Manages the Greeting Widget: name persistence, clock display, and greeting logic.

**Public interface:**
```js
App.Greeting = {
  init()   → void  // restores name from storage, starts setInterval(1000ms)
}
```

**Internal state (closure):**
- `currentName` — the active display name (default: `"Friend"`)
- `clockInterval` — the `setInterval` handle

**Key behaviors:**
- On `init`, reads `Storage.get(KEYS.USER_NAME)`. If found and valid, sets `currentName`.
- The clock interval fires every 1000 ms, updates the time display, and re-evaluates the greeting string based on the current hour.
- Name form submit: trims input, validates length (1–50 chars), calls `Storage.set`, updates the DOM. On storage failure, updates the DOM but shows an error banner.

---

### App.Timer

Manages the Focus Timer widget: countdown, button states, and completion notification.

**Public interface:**
```js
App.Timer = {
  init()   → void
}
```

**Internal state (closure):**
- `remaining` — seconds left (initial: 1500)
- `tickInterval` — `setInterval` handle or `null`
- `isRunning` — boolean

**Button state matrix:**

| State      | Start | Stop | Reset |
|------------|-------|------|-------|
| Idle/Paused| ✅    | ❌   | ✅    |
| Running    | ❌    | ✅   | ✅    |
| Complete   | ✅    | ❌   | ✅    |

**Key behaviors:**
- Start: sets `isRunning = true`, launches `setInterval(1000)`, updates button states.
- Stop: clears interval, sets `isRunning = false`, updates button states.
- Reset: clears interval, sets `remaining = 1500`, updates display and button states.
- On each tick: decrements `remaining`, updates display. When `remaining === 0`, clears interval, shows completion message, updates button states.

*(The Focus Timer has no localStorage persistence — it resets on page reload per the requirements.)*

---

### App.Todo

Manages the To-Do List: add, edit, complete-toggle, delete, and localStorage persistence.

**Public interface:**
```js
App.Todo = {
  init()   → void
}
```

**Internal state (closure):**
- `tasks` — `Task[]` array (the single source of truth)

**Key behaviors:**
- `_save()` — serialises `tasks` to `Storage.set(KEYS.TASKS, tasks)`. On failure, shows inline error.
- `_render()` — clears the list container and re-renders all tasks from the `tasks` array.
- Add: trim input, validate non-empty (1–200 chars), check for case-insensitive duplicate, push to `tasks`, call `_save()`, call `_render()`.
- Toggle: find task by id, flip `completed`, call `_save()`, call `_render()`.
- Edit: replace text display with `<input>` pre-filled with current text, focus it. On confirm (Enter / save button), validate new text, check duplicate against other tasks, update, call `_save()`, call `_render()`.
- Delete: filter task from `tasks` by id, call `_save()`, call `_render()`.

---

### App.Links

Manages Quick Links: add, delete, open in new tab, and localStorage persistence.

**Public interface:**
```js
App.Links = {
  init()   → void
}
```

**Internal state (closure):**
- `links` — `Link[]` array

**Key behaviors:**
- Add: validate label (1–100 chars), validate URL format (must include scheme), check for duplicate URL (case-insensitive trim), enforce 20-link cap, push to `links`, call `_save()`, call `_render()`.
- Delete: filter by id, call `_save()`, call `_render()`.
- Open: `window.open(url, '_blank', 'noopener,noreferrer')`.
- On init, if `Storage.get(KEYS.LINKS)` parse fails (corrupted JSON), discards data and renders empty state.

---

### App.Theme

Manages light/dark theme toggle and persistence.

**Public interface:**
```js
App.Theme = {
  init()   → void
}
```

**Key behaviors:**
- On `init`: reads saved theme from `Storage.get(KEYS.THEME)`. If found, applies it; otherwise defaults to `"light"`.
- Apply: adds/removes `.theme-dark` class on `document.documentElement`.
- Toggle button listener: flips current theme, applies it, persists to storage.

---

## Data Models

### localStorage Keys

All keys are defined as constants in `app.js` to prevent typos:

```js
const KEYS = Object.freeze({
  USER_NAME : 'tld_user_name',   // string
  TASKS     : 'tld_tasks',       // JSON array of Task objects
  LINKS     : 'tld_links',       // JSON array of Link objects
  THEME     : 'tld_theme',       // "light" | "dark"
});
```

---

### Task Schema

```json
{
  "id"        : "string (crypto.randomUUID or Date.now fallback)",
  "text"      : "string (1–200 characters, trimmed)",
  "completed" : "boolean"
}
```

Example:
```json
{
  "id": "a1b2c3d4",
  "text": "Buy groceries",
  "completed": false
}
```

---

### Link Schema

```json
{
  "id"    : "string (crypto.randomUUID or Date.now fallback)",
  "label" : "string (1–100 characters, trimmed)",
  "url"   : "string (must include http:// or https://)"
}
```

Example:
```json
{
  "id"    : "x9y8z7w6",
  "label" : "GitHub",
  "url"   : "https://github.com"
}
```

---

### Theme Value

A plain string stored at `KEYS.THEME`. Valid values: `"light"`, `"dark"`.

---

### User Name Value

A plain string stored at `KEYS.USER_NAME`. Valid range: 1–50 characters (trimmed).

---

### UI Layout

The Dashboard uses a CSS Grid layout. The `<body>` contains:

```
<body>
  <header>          ← theme toggle, app title
  <main class="dashboard-grid">
    <section id="greeting">    ← spans full width on mobile, 1 column on desktop
    <section id="timer">       ← 1 column
    <section id="todo">        ← 1 column (grows taller)
    <section id="links">       ← 1 column
  </main>
</body>
```

**Responsive grid strategy:**

| Breakpoint  | Columns | Layout Notes                          |
|-------------|---------|---------------------------------------|
| < 600px     | 1       | All widgets stacked vertically        |
| 600–1023px  | 2       | Greeting spans 2 cols; Timer + Links side by side; Todo full width |
| ≥ 1024px    | 2 or 3  | Greeting top-full; Timer + Todo + Links in remaining space |

Flexible widths use `minmax(0, 1fr)`. No fixed pixel widths on widget containers.

---

### CSS Architecture

**Custom properties on `:root` (light theme defaults):**

```css
:root {
  --color-bg        : #f8f9fa;
  --color-surface   : #ffffff;
  --color-text      : #212529;
  --color-text-muted: #6c757d;
  --color-accent    : #4361ee;
  --color-danger    : #e63946;
  --color-success   : #2a9d8f;
  --color-border    : #dee2e6;
  --shadow          : 0 2px 8px rgba(0,0,0,.08);
  --radius          : 0.75rem;
  --font-body       : 'Segoe UI', system-ui, sans-serif;
  --font-size-base  : 1rem;       /* = 16px */
  --font-size-sm    : 0.875rem;   /* = 14px */
}
```

**Dark theme overrides (applied when `html.theme-dark`):**

```css
html.theme-dark {
  --color-bg        : #121212;
  --color-surface   : #1e1e1e;
  --color-text      : #e0e0e0;
  --color-text-muted: #9e9e9e;
  --color-accent    : #7b8cde;
  --color-border    : #333333;
  --shadow          : 0 2px 8px rgba(0,0,0,.4);
}
```

All component styles reference only the custom properties — never hard-coded colors — so switching themes requires no per-component CSS changes.

**Responsive breakpoints:**

```css
/* Mobile-first base styles, then: */
@media (min-width: 600px)  { /* 2-column grid */ }
@media (min-width: 1024px) { /* wider grid adjustments */ }
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting time-of-day mapping is exhaustive and deterministic

*For any* integer hour value in the range 0–23, `App.Utils.getGreeting(hour)` SHALL return exactly one of `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`, or `"Good Night"`, with no hour left unmapped.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Name validation accepts exactly the valid range

*For any* string, `App.Greeting` SHALL accept the input if and only if its trimmed length is in [1, 50]; all other inputs SHALL be rejected with an error message and the displayed name SHALL remain unchanged.

**Validates: Requirements 1.7, 1.8, 1.9**

---

### Property 3: Task addition round-trip preserves data

*For any* valid task text (1–200 characters, non-whitespace-only), after adding the task and reading back from `localStorage`, the stored JSON array SHALL contain an entry whose `text` equals the trimmed input and whose `completed` equals `false`.

**Validates: Requirements 3.1, 3.11**

---

### Property 4: Whitespace-only task text is always rejected

*For any* string composed entirely of whitespace characters, submitting it as a task description SHALL be rejected and the task list SHALL remain unchanged (same length and same items).

**Validates: Requirements 3.2**

---

### Property 5: Duplicate task detection is case-insensitive and trim-aware

*For any* existing task with text T, submitting a new task whose trimmed, lowercased text equals the trimmed, lowercased T SHALL be rejected with an error message and the task list length SHALL remain unchanged.

**Validates: Requirements 3.3**

---

### Property 6: Completion toggle is its own inverse (idempotent round-trip)

*For any* task in any completion state, toggling it twice SHALL return the task to its original completion state, and the `localStorage` representation SHALL reflect that original state.

**Validates: Requirements 3.5**

---

### Property 7: Edit duplicate check excludes the task being edited

*For any* task being edited, if the new trimmed text (case-insensitive) matches only the task itself (not any other task), the edit SHALL succeed. If it matches a different task, the edit SHALL be rejected.

**Validates: Requirements 3.7, 3.8**

---

### Property 8: Quick Links URL validation rejects scheme-less URLs

*For any* string that does not start with `http://` or `https://` (after trimming), adding it as a link URL SHALL be rejected with an error message and the link list SHALL remain unchanged.

**Validates: Requirements 4.4**

---

### Property 9: Quick Links duplicate URL check is case-insensitive

*For any* existing link with URL U, submitting a new link whose trimmed, lowercased URL equals the trimmed, lowercased U SHALL be rejected with an error message.

**Validates: Requirements 4.3**

---

### Property 10: Quick Links cap is strictly enforced

*For any* link list already at exactly 20 items, any attempt to add a new link SHALL be rejected with an error message and the list length SHALL remain 20.

**Validates: Requirements 4.5**

---

### Property 11: Theme toggle is its own inverse (idempotent round-trip)

*For any* current theme value T ∈ {`"light"`, `"dark"`}, toggling twice SHALL result in the same theme T being applied to `document.documentElement` and persisted in `localStorage`.

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 12: localStorage serialisation round-trip preserves task array

*For any* array of valid Task objects, serialising to `localStorage` and then deserialising SHALL produce an array of equal length with each task's `id`, `text`, and `completed` fields equal to the original.

**Validates: Requirements 3.11, 3.12**

---

### Property 13: localStorage serialisation round-trip preserves link array

*For any* array of valid Link objects, serialising to `localStorage` and then deserialising SHALL produce an array of equal length with each link's `id`, `label`, and `url` fields equal to the original.

**Validates: Requirements 4.1, 4.9**

---

## Error Handling

### Strategy

Every error is handled at the closest layer to the user and expressed as an **inline message** adjacent to the triggering control. The app never uses `alert()`, never crashes the page, and never silently ignores failures.

### Error Categories

| Category | Trigger | Handling |
|---|---|---|
| Validation error | Invalid user input (empty text, bad URL, duplicate) | Inline `<p class="error-msg">` injected below the input; cleared on next valid submit |
| localStorage write failure | `Storage.set()` returns `{ ok: false }` | Inline warning shown; in-memory state still updated so the session continues |
| localStorage read failure | `Storage.get()` returns `{ ok: false }` or JSON parse fails | Treat as empty/default; show no error (data just isn't restored) |
| Corrupted Links data | JSON parse of stored Links array fails | Discard silently, render empty Quick Links widget (per Requirement 4.10) |
| Timer over-run | `remaining` ticks below 0 | Guard clause: `if (remaining <= 0)` fires completion logic instead of decrementing further |

### Error Message Lifecycle

1. The error `<p>` is rendered with `role="alert"` for screen-reader accessibility.
2. It is removed automatically when the user submits the form again (whether or not the new attempt succeeds).
3. It is also removed when the input field receives the `input` event, giving the user immediate visual feedback as they start correcting the entry.

### localStorage Failure Graceful Degradation

```
User action → in-memory update → attempt Storage.set()
                                      ├── ok: true  → no error shown
                                      └── ok: false → show inline warning
                                                       in-memory state still valid
                                                       UI reflects the change
```

The user can continue working for the rest of the session; data is simply not persisted across page reloads if storage is unavailable.

---

## Testing Strategy

### Assessment of PBT Applicability

This feature is a Vanilla JavaScript web application with pure logic functions (validation, greeting mapping, duplicate detection, URL parsing, serialisation/deserialisation) that are well-suited to property-based testing. The properties identified above cover the core correctness invariants.

However, the requirements explicitly state no test framework is required (Requirement 6.1: single HTML + CSS + JS file, no build step). PBT libraries like fast-check require a module bundler or `<script>` tag include. **Accordingly, a lightweight inline approach is used: a minimal test harness embedded in a separate `test.html` file that can be opened directly in a browser.** This satisfies both the no-build-step constraint and the correctness testing goals.

### Unit Tests (Example-Based)

Target the pure utility functions and module logic with specific representative examples:

- `getGreeting(hour)` for all 24 boundary hours (0, 5, 12, 18, 22, etc.)
- `isValidUrl()` with valid URLs (http, https), and invalid ones (no scheme, empty string, ftp://)
- `sanitizeText()` with XSS payloads
- Task add/edit/delete/toggle cycle with a mock `localStorage`
- Link add/delete cycle with a mock `localStorage`
- Theme toggle cycle

### Property-Based Tests (Universal Properties)

Each property from the Correctness Properties section maps to a test using fast-check loaded via CDN `<script>` tag in `test.html`:

| Property | Test Pattern |
|---|---|
| P1 – Greeting exhaustive | Generate all 0–23 integers; assert return value ∈ valid set |
| P2 – Name validation range | Generate strings of varying lengths; assert accept/reject matches trimmed-length rule |
| P3 – Task round-trip | Generate random task texts; add, serialise, deserialise; compare |
| P4 – Whitespace-only rejection | Generate whitespace-only strings; assert rejection and unchanged list |
| P5 – Duplicate detection | Generate a task text T, add T, try to add variants of T (mixed case, extra spaces); assert rejection |
| P6 – Toggle idempotence | Generate a task in either state; toggle twice; assert original state restored |
| P7 – Edit self-match allowed | Generate task list; edit one task to its own text; assert success |
| P8 – URL scheme validation | Generate strings without http/https prefix; assert rejection |
| P9 – Link duplicate URL | Generate a URL U, add it, try to add variants; assert rejection |
| P10 – Links cap | Fill list to 20; generate a new link; assert rejection |
| P11 – Theme toggle round-trip | Start from either theme; toggle twice; assert same theme |
| P12 – Task serialisation round-trip | Generate Task arrays; serialise then deserialise; assert deep equality |
| P13 – Link serialisation round-trip | Generate Link arrays; serialise then deserialise; assert deep equality |

**Configuration:** Each property test runs a minimum of 100 iterations.

**Tag format for each test:**
```
// Feature: todo-life-dashboard, Property N: <property_text>
```

### Integration / Smoke Checks

Manual checklist to verify end-to-end behavior in the browser:

- [ ] Open `index.html` directly (no server) — all four widgets render
- [ ] Refresh page — all data persists
- [ ] Disable localStorage (browser DevTools) — app degrades gracefully with inline error
- [ ] Test in Chrome, Firefox, Edge, Safari
- [ ] Resize viewport from 320px to 1920px — layout remains usable
- [ ] Toggle theme — no flash; correct theme on reload
