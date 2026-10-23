# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement a fully client-side, zero-dependency single-page application delivered as `index.html`, `css/style.css`, and `js/app.js`. All state lives in `localStorage`; all rendering is plain DOM manipulation in Vanilla JavaScript. Modules are IIFE-based, attached to a single `App` namespace. Tasks are ordered so each step integrates with the previous one — no orphaned code.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - [x] 1.1 Create folder structure and `index.html`
    - Create `css/` and `js/` directories inside the workspace root
    - Write `index.html` with `<!DOCTYPE html>`, `<meta charset>`, `<meta name="viewport">`, title, `<link>` to `css/style.css`, `<script defer>` to `js/app.js`
    - Add semantic markup: `<header>` with theme toggle button and app title, `<main class="dashboard-grid">` containing four `<section>` elements: `#greeting`, `#timer`, `#todo`, `#links`
    - Each section needs its widget-specific inner markup: form fields, button placeholders, and empty list containers as described in the design's UI Layout section
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 1.2 Create `css/style.css` and `js/app.js` stubs
    - Create `css/style.css` with a single comment placeholder
    - Create `js/app.js` with `'use strict';` and an empty `window.App = {};` declaration
    - Ensure `<link href="css/style.css">` and `<script defer src="js/app.js">` paths in `index.html` resolve to the created files (relative paths match the directory structure)
    - _Requirements: 6.1, 6.2_

- [x] 2. Implement CSS architecture
  - [x] 2.1 Define CSS custom properties and reset
    - Add `:root` block with all 13 custom properties: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-danger`, `--color-success`, `--color-border`, `--shadow`, `--radius`, `--font-body`, `--font-size-base`, `--font-size-sm` (exact values from design)
    - Add `html.theme-dark` override block with the 7 dark-theme property overrides
    - Add a minimal CSS reset: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`
    - Set `body` font to `var(--font-body)`, background to `var(--color-bg)`, color to `var(--color-text)`, `min-height: 100vh`
    - _Requirements: 5.2, 8.1, 8.2, 8.3_

  - [x] 2.2 Implement responsive grid layout
    - Style `<header>`: flex row, space-between, padding, `background: var(--color-surface)`, `box-shadow: var(--shadow)`
    - Style `.dashboard-grid`: CSS Grid, mobile-first single column, `gap`, `padding`, `max-width` centered
    - Add `@media (min-width: 600px)` breakpoint: 2-column grid; Greeting spans 2 cols; Timer and Links side by side; Todo full width
    - Add `@media (min-width: 1024px)` breakpoint: refined column distribution per design table
    - All widget `<section>` elements: `background: var(--color-surface)`, `border-radius: var(--radius)`, `box-shadow: var(--shadow)`, `padding`
    - _Requirements: 8.4, 6.3_

  - [x] 2.3 Add component and utility styles
    - Style form inputs, buttons, and error messages using only custom properties (no hard-coded colors)
    - Add `.error-msg` class: `color: var(--color-danger)`, `font-size: var(--font-size-sm)`
    - Add `[data-completed="true"] .task-text` strikethrough style (`text-decoration: line-through; color: var(--color-text-muted)`) for completed tasks
    - Add `.btn-icon` style for edit/delete icon buttons (transparent background, border-radius, hover state using `var(--color-accent)`)
    - Add theme toggle button style visible in both light and dark themes
    - Set `body` `font-size` to at least `var(--font-size-sm)` (0.875rem = 14px) to enforce minimum body text size
    - _Requirements: 8.1, 8.2, 8.3, 3.5_

- [x] 3. Implement `App.Storage` module
  - [x] 3.1 Write the Storage IIFE module
    - In `js/app.js`, define `App.Storage` as an IIFE returning a frozen object with `get(key)`, `set(key, value)`, and `remove(key)`
    - `get`: wrap `localStorage.getItem` + `JSON.parse` in `try/catch`; return `{ ok: true, value }` or `{ ok: false, error }`
    - `set`: wrap `JSON.stringify` + `localStorage.setItem` in `try/catch`; return `{ ok: true }` or `{ ok: false, error }`
    - `remove`: call `localStorage.removeItem(key)` (no return needed)
    - Define `const KEYS = Object.freeze({ USER_NAME: 'tld_user_name', TASKS: 'tld_tasks', LINKS: 'tld_links', THEME: 'tld_theme' })` above the modules
    - _Requirements: 1.12, 3.13, 4.8, 5.3_

- [x] 4. Implement `App.Utils` module
  - [x] 4.1 Write the Utils IIFE module
    - Define `App.Utils` as an IIFE returning a frozen object with six pure functions: `formatDate(date)`, `formatTime(date)`, `getGreeting(hour)`, `isValidUrl(str)`, `trimAndLower(str)`, `sanitizeText(str)`
    - `formatDate`: use `Intl.DateTimeFormat` or manual lookup to produce `"Weekday, DD Month YYYY"` format
    - `formatTime`: zero-pad hours, minutes, seconds into `"HH:MM:SS"` string
    - `getGreeting(hour)`: map 5–11 → "Good Morning", 12–17 → "Good Afternoon", 18–21 → "Good Evening", 22–23 and 0–4 → "Good Night" (exhaustive, all 24 hours covered)
    - `isValidUrl`: return `true` only if string starts with `http://` or `https://` after trimming
    - `trimAndLower`: return `str.trim().toLowerCase()`
    - `sanitizeText`: replace `&`, `<`, `>`, `"`, `'` with their HTML entities
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.4_

  - [ ]* 4.2 Write property tests for `App.Utils` in `test.html`
    - Create `test.html` at workspace root; load fast-check via CDN `<script>` tag
    - **Property 1: Greeting time-of-day mapping is exhaustive and deterministic** — for each integer 0–23, assert `getGreeting(h)` ∈ `{"Good Morning","Good Afternoon","Good Evening","Good Night"}`
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
    - **Property 8: Quick Links URL validation rejects scheme-less URLs** — generate arbitrary strings not starting with `http://`/`https://`; assert `isValidUrl` returns `false`
    - **Validates: Requirements 4.4**
    - Tag each test: `// Feature: todo-life-dashboard, Property N: <text>`
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 4.4_

- [x] 5. Implement `App.Theme` module
  - [x] 5.1 Write the Theme IIFE module
    - Define `App.Theme` as an IIFE with a public `init()` method
    - `init()`: call `Storage.get(KEYS.THEME)`; if result is `"dark"` apply `document.documentElement.classList.add('theme-dark')`; otherwise default to light (no class)
    - Wire the theme toggle button's `click` listener: read current state from presence of `'theme-dark'` class, toggle it, then call `Storage.set(KEYS.THEME, newTheme)`
    - On storage failure (`Storage.set` returns `{ ok: false }`), still apply the theme class for the session without showing an error
    - `App.Theme.init()` MUST be placed first in `App.init()` to prevent flash of wrong theme
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 5.2 Write property test for Theme toggle in `test.html`
    - **Property 11: Theme toggle is its own inverse (idempotent round-trip)** — start from either `"light"` or `"dark"`; call toggle twice; assert the same theme class is present/absent as before
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. Implement `App.Greeting` module
  - [x] 6.1 Write the Greeting IIFE module
    - Define `App.Greeting` with a public `init()` method and closure variables `currentName` (default `"Friend"`) and `clockInterval`
    - `init()`: read `Storage.get(KEYS.USER_NAME)`; if ok and trimmed length is 1–50, set `currentName`; call `_updateDisplay()` immediately; then start `setInterval(_tick, 1000)`
    - `_tick()`: call `_updateDisplay()` every second — update date element via `Utils.formatDate(new Date())`, time element via `Utils.formatTime(new Date())`, greeting element via `Utils.getGreeting(new Date().getHours()) + ", " + Utils.sanitizeText(currentName)`
    - Wire the name form's `submit` listener: prevent default, trim input value, reject if trimmed length < 1 or > 50 by injecting a `<p class="error-msg" role="alert">` element adjacent to the input; on valid input, call `Storage.set(KEYS.USER_NAME, trimmed)`, update `currentName`, call `_updateDisplay()`, remove any existing `.error-msg`; if `Storage.set` returns `{ ok: false }`, still update `currentName` and the display but inject an error message stating the name could not be saved
    - Wire the name input's `input` event to remove any existing `.error-msg` child element from the form
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12_

  - [ ]* 6.2 Write property test for name validation in `test.html`
    - **Property 2: Name validation accepts exactly the valid range** — generate strings of varying trimmed lengths; assert accepted iff trimmed length ∈ [1, 50]
    - **Validates: Requirements 1.7, 1.8, 1.9**
    - _Requirements: 1.7, 1.8, 1.9_

- [x] 7. Implement `App.Timer` module
  - [x] 7.1 Write the Timer IIFE module
    - Define `App.Timer` with a public `init()` method and closure variables `remaining` (1500), `tickInterval` (null), `isRunning` (false)
    - `init()`: set the timer display element's `textContent` to `"25:00"`, call `_applyButtonStates('idle')`
    - `_updateDisplay()`: compute `MM:SS` from `remaining` using zero-padding (`String(Math.floor(remaining / 60)).padStart(2, '0')` and `String(remaining % 60).padStart(2, '0')`); set the timer display element's `textContent`
    - `_applyButtonStates(state)`: for `'idle'` — enable Start, disable Stop, enable Reset; for `'running'` — disable Start, enable Stop, enable Reset; for `'complete'` — enable Start, disable Stop, enable Reset
    - Wire Start button: set `isRunning = true`, launch `setInterval(_tick, 1000)`, call `_applyButtonStates('running')`
    - Wire Stop button: call `clearInterval(tickInterval)`, set `isRunning = false`, call `_applyButtonStates('idle')`
    - Wire Reset button: call `clearInterval(tickInterval)`, set `isRunning = false`, set `remaining = 1500`, call `_updateDisplay()`, call `_applyButtonStates('idle')`, remove or hide the completion message element
    - `_tick()`: if `remaining <= 0`, call `clearInterval(tickInterval)`, set the completion message element's `textContent` to a non-empty completion string, make it visible, call `_applyButtonStates('complete')`; else decrement `remaining` by 1, call `_updateDisplay()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [x] 8. Implement `App.Todo` module
  - [x] 8.1 Write the Todo IIFE module — data layer and rendering
    - Define `App.Todo` with a public `init()` method and closure variable `tasks = []`
    - `init()`: call `Storage.get(KEYS.TASKS)`; if `ok` is `true` and the parsed value is an array, assign it to `tasks`; call `_render()`
    - `_save()`: call `Storage.set(KEYS.TASKS, tasks)`; if result is `{ ok: false }`, inject a `<p class="error-msg" role="alert">` into the Todo widget's error container with text indicating data could not be saved
    - `_render()`: clear the task list container's `innerHTML`; iterate `tasks` — for each task build a `<li>` element containing: a `<button>` toggle with `aria-pressed` set to `task.completed`, a `<span class="task-text">` with `textContent` set to `Utils.sanitizeText(task.text)`, the `data-completed` attribute set to `String(task.completed)` on the `<li>`, an edit `<button class="btn-icon">`, and a delete `<button class="btn-icon">`; append each `<li>` to the list container; if `tasks.length === 0`, render a non-empty empty-state message `<p>` instead
    - _Requirements: 3.4, 3.5, 3.11, 3.12, 3.13_

  - [x] 8.2 Implement add-task logic
    - Wire the task form's `submit` listener: prevent default, read and trim the task input value
    - If trimmed value length < 1 or > 200, inject a `<p class="error-msg" role="alert">` below the input and return
    - If `tasks.some(t => Utils.trimAndLower(t.text) === Utils.trimAndLower(trimmedValue))` is `true`, inject a `<p class="error-msg" role="alert">` indicating the task already exists and return
    - On success: push `{ id: crypto.randomUUID?.() ?? String(Date.now()), text: trimmedValue, completed: false }` to `tasks`, call `_save()`, call `_render()`, set task input `value` to `''`
    - Wire the task input's `input` event to remove any `.error-msg` sibling injected by this form
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 8.3 Write property tests for Task add in `test.html`
    - **Property 3: Task addition round-trip preserves data** — generate valid task texts; add, serialise, deserialise; assert stored entry has matching `text` and `completed === false`
    - **Validates: Requirements 3.1, 3.11**
    - **Property 4: Whitespace-only task text is always rejected** — generate whitespace-only strings; assert list length unchanged
    - **Validates: Requirements 3.2**
    - **Property 5: Duplicate task detection is case-insensitive and trim-aware** — add task T; try adding trim/case variants; assert list length unchanged
    - **Validates: Requirements 3.3**
    - _Requirements: 3.1, 3.2, 3.3, 3.11_

  - [x] 8.4 Implement toggle-complete and delete logic
    - Toggle: in the `click` handler attached during `_render()`, find the task in `tasks` whose `id` matches the `<li>`'s `data-id` attribute, set `task.completed = !task.completed`, call `_save()`, call `_render()`
    - Delete: in the delete button's `click` handler, set `tasks = tasks.filter(t => t.id !== targetId)`, call `_save()`, call `_render()`
    - Attach these listeners per item inside `_render()` using the `<li>`'s `data-id` attribute to identify the target task
    - _Requirements: 3.5, 3.10, 3.11_

  - [ ]* 8.5 Write property test for Toggle in `test.html`
    - **Property 6: Completion toggle is its own inverse (idempotent round-trip)** — generate a task in either state; toggle twice; assert original `completed` state is restored and localStorage reflects it
    - **Validates: Requirements 3.5**
    - _Requirements: 3.5_

  - [x] 8.6 Implement edit-task logic
    - When edit button is clicked: replace the task's `<span class="task-text">` with an `<input type="text">` whose `value` is the current `task.text`; call `.focus()` on the input; replace the edit button with a Save `<button>`
    - On Save button `click` or `keydown` Enter on the input: read and trim the input value
    - If trimmed length < 1 or > 200, inject a `<p class="error-msg" role="alert">` adjacent to the input and return without calling `_save()` or `_render()`
    - If `tasks.some(t => t.id !== editingId && Utils.trimAndLower(t.text) === Utils.trimAndLower(trimmedValue))` is `true`, inject a `<p class="error-msg" role="alert">` indicating the duplicate and return
    - On valid input: find the task by `editingId` in `tasks`, set `task.text = trimmedValue`, call `_save()`, call `_render()`
    - _Requirements: 3.6, 3.7, 3.8, 3.9, 3.11_

  - [ ]* 8.7 Write property test for Edit in `test.html`
    - **Property 7: Edit duplicate check excludes the task being edited** — generate task list; edit one task to its own text (same text, different case); assert success; edit to match a different task's text; assert rejection
    - **Validates: Requirements 3.7, 3.8**
    - _Requirements: 3.7, 3.8_

  - [ ]* 8.8 Write property test for Task serialisation in `test.html`
    - **Property 12: localStorage serialisation round-trip preserves task array** — generate arrays of valid Task objects; serialise to localStorage then deserialise; assert deep equality of all fields
    - **Validates: Requirements 3.11, 3.12**
    - _Requirements: 3.11, 3.12_

- [x] 9. Implement `App.Links` module
  - [x] 9.1 Write the Links IIFE module — data layer and rendering
    - Define `App.Links` with a public `init()` method and closure variable `links = []`
    - `init()`: call `Storage.get(KEYS.LINKS)`; if `ok` is `true` and the parsed value is an array, assign to `links`; if `ok` is `false` or the value is not an array, set `links = []` (silently discard per Requirement 4.10); call `_render()`
    - `_save()`: call `Storage.set(KEYS.LINKS, links)`; if result is `{ ok: false }`, inject a `<p class="error-msg" role="alert">` into the Links widget's error container with text indicating the link could not be saved
    - `_render()`: clear the links container's `innerHTML`; iterate `links` — for each link build a `<button class="link-btn">` with `textContent` set to `Utils.sanitizeText(link.label)` and a `data-url` attribute; attach a `click` listener that calls `window.open(link.url, '_blank', 'noopener,noreferrer')`; also append a delete `<button class="btn-icon">` with a `data-id` attribute; if `links.length === 0`, render a non-empty empty-state message `<p>` instead
    - _Requirements: 4.6, 4.7, 4.9, 4.10_

  - [x] 9.2 Implement add-link logic
    - Wire the link form's `submit` listener: prevent default, trim label and URL input values
    - If trimmed label length < 1 or > 100, inject a `<p class="error-msg" role="alert">` adjacent to the label input and return
    - If `Utils.isValidUrl(trimmedUrl)` returns `false`, inject a `<p class="error-msg" role="alert">` adjacent to the URL input and return
    - If `links.some(l => Utils.trimAndLower(l.url) === Utils.trimAndLower(trimmedUrl))` is `true`, inject a `<p class="error-msg" role="alert">` indicating the duplicate and return
    - If `links.length >= 20`, inject a `<p class="error-msg" role="alert">` indicating the maximum has been reached and return
    - On success: push `{ id: crypto.randomUUID?.() ?? String(Date.now()), label: trimmedLabel, url: trimmedUrl }` to `links`, call `_save()`, call `_render()`, clear both form input fields
    - Wire both form inputs' `input` events to remove any `.error-msg` injected by this form
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8_

  - [ ]* 9.3 Write property tests for Links in `test.html`
    - **Property 8: Quick Links URL validation rejects scheme-less URLs** — (already covered in 4.2 if `test.html` already exists; add here if not yet written)
    - **Property 9: Quick Links duplicate URL check is case-insensitive** — add link with URL U; try adding trim/case variants; assert list length unchanged
    - **Validates: Requirements 4.3**
    - **Property 10: Quick Links cap is strictly enforced** — fill list to 20; attempt to add one more; assert rejection and list length remains 20
    - **Validates: Requirements 4.5**
    - **Property 13: localStorage serialisation round-trip preserves link array** — generate arrays of valid Link objects; serialise then deserialise; assert deep equality
    - **Validates: Requirements 4.1, 4.9**
    - _Requirements: 4.3, 4.5, 4.9_

- [x] 10. Wire `App.init`, enforce error message lifecycle, and finalize integration
  - [x] 10.1 Implement `App.init()` and bootstrap all modules
    - In `js/app.js`, define `App.init = function() { App.Theme.init(); App.Greeting.init(); App.Timer.init(); App.Todo.init(); App.Links.init(); }`
    - Attach `App.init` to `DOMContentLoaded`: `document.addEventListener('DOMContentLoaded', App.init)`
    - `App.Theme.init()` must be the first call inside `App.init` so the correct theme class is applied to `<html>` before any other DOM changes
    - _Requirements: 5.4, 6.1, 6.2, 6.3_

  - [x] 10.2 Implement error message lifecycle enforcement across all widgets
    - For each widget form (Greeting, Todo, Links): ensure the error `<p>` element is created with `role="alert"` so screen readers announce it
    - Ensure the error `<p>` is removed (call `.remove()` or clear the container) at the top of each form's `submit` handler before re-validating, so stale errors are cleared on every resubmission attempt
    - Ensure each triggering input's `input` event handler calls `.remove()` on the current `.error-msg` child, giving the user immediate feedback as they begin typing a correction
    - Remove any `alert()` or `console.error` calls used for user-facing messages and replace them with the inline `<p class="error-msg" role="alert">` pattern
    - _Requirements: 1.9, 1.12, 3.2, 3.3, 3.8, 3.9, 3.13, 4.2, 4.3, 4.4, 4.5, 4.8_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for full traceability
- `App.Storage` and `App.Utils` must be defined before all other modules in `app.js` — order matters at parse time
- The timer has no localStorage persistence by design; it always resets on page reload
- Property tests in `test.html` use fast-check loaded via CDN `<script>` tag — no build step needed
- `crypto.randomUUID()` is available in all modern browsers; the `Date.now()` fallback covers older environments
- All DOM manipulation uses `textContent` or `Utils.sanitizeText()` before `innerHTML` to prevent XSS

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["2.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["5.2", "6.1"] },
    { "id": 6, "tasks": ["6.2", "7.1"] },
    { "id": 7, "tasks": ["8.1", "9.1"] },
    { "id": 8, "tasks": ["8.2", "9.2"] },
    { "id": 9, "tasks": ["8.3", "8.4", "9.3"] },
    { "id": 10, "tasks": ["8.5", "8.6"] },
    { "id": 11, "tasks": ["8.7", "8.8"] },
    { "id": 12, "tasks": ["10.1"] },
    { "id": 13, "tasks": ["10.2"] }
  ]
}
```
