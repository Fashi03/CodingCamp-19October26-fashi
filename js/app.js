'use strict';

window.App = {};

// ---------------------------------------------------------------------------
// Storage keys — shared across all modules
// ---------------------------------------------------------------------------
const KEYS = Object.freeze({
  USER_NAME: 'tld_user_name',
  TASKS:     'tld_tasks',
  LINKS:     'tld_links',
  THEME:     'tld_theme',
});

// ---------------------------------------------------------------------------
// App.Storage — thin localStorage wrapper with result objects
// ---------------------------------------------------------------------------
App.Storage = (function () {

  /**
   * Read and JSON-parse a value from localStorage.
   * @param {string} key
   * @returns {{ ok: true, value: * } | { ok: false, error: Error }}
   */
  function get(key) {
    try {
      const raw = localStorage.getItem(key);
      const value = raw === null ? null : JSON.parse(raw);
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * JSON-stringify and write a value to localStorage.
   * @param {string} key
   * @param {*} value
   * @returns {{ ok: true } | { ok: false, error: Error }}
   */
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  /**
   * Remove a key from localStorage.
   * @param {string} key
   */
  function remove(key) {
    localStorage.removeItem(key);
  }

  return Object.freeze({ get, set, remove });
}());

// ---------------------------------------------------------------------------
// App.Utils — pure utility functions (Req 1.1–1.6, 4.4)
// ---------------------------------------------------------------------------
App.Utils = (function () {

  /** Day and month name lookup tables */
  const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

  /**
   * Format a Date as "Weekday, DD Month YYYY".
   * e.g. "Monday, 26 October 2026"
   * Req 1.1
   * @param {Date} date
   * @returns {string}
   */
  function formatDate(date) {
    const day   = DAY_NAMES[date.getDay()];
    const dd    = String(date.getDate()).padStart(2, '0');
    const month = MONTH_NAMES[date.getMonth()];
    const yyyy  = date.getFullYear();
    return day + ', ' + dd + ' ' + month + ' ' + yyyy;
  }

  /**
   * Format a Date as zero-padded "HH:MM:SS".
   * Req 1.2
   * @param {Date} date
   * @returns {string}
   */
  function formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return hh + ':' + mm + ':' + ss;
  }

  /**
   * Return a greeting string based on the hour of the day (0–23).
   *   5–11  → "Good Morning"
   *  12–17  → "Good Afternoon"
   *  18–21  → "Good Evening"
   *  22–23, 0–4 → "Good Night"
   * Req 1.3
   * @param {number} hour  Integer 0–23
   * @returns {string}
   */
  function getGreeting(hour) {
    if (hour >= 5  && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 21) return 'Good Evening';
    return 'Good Night'; // covers 22, 23, 0, 1, 2, 3, 4
  }

  /**
   * Return true only if `str` (after trimming) starts with "http://" or "https://".
   * Req 1.4
   * @param {string} str
   * @returns {boolean}
   */
  function isValidUrl(str) {
    const trimmed = str.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://');
  }

  /**
   * Trim whitespace and convert to lower-case.
   * Req 1.5
   * @param {string} str
   * @returns {string}
   */
  function trimAndLower(str) {
    return str.trim().toLowerCase();
  }

  /**
   * Replace HTML special characters with their entity equivalents.
   *   & → &amp;   < → &lt;   > → &gt;   " → &quot;   ' → &#39;
   * Req 1.6
   * @param {string} str
   * @returns {string}
   */
  function sanitizeText(str) {
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  return Object.freeze({ formatDate, formatTime, getGreeting, isValidUrl, trimAndLower, sanitizeText });
}());

// ---------------------------------------------------------------------------
// App.Theme — dark/light theme toggle (Req 5.1–5.5)
// ---------------------------------------------------------------------------
App.Theme = (function () {

  function _updateIcon() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = document.documentElement.classList.contains('theme-dark');
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  /**
   * Initialise theme on page load.
   * Reads the persisted theme from Storage and applies it immediately
   * to prevent a flash of the wrong theme.
   * Req 5.1, 5.2
   */
  function init() {
    // Apply persisted theme as early as possible (Req 5.1)
    const result = App.Storage.get(KEYS.THEME);
    if (result.ok && result.value === 'dark') {
      document.documentElement.classList.add('theme-dark');
    }
    // No class needed for light — it is the default (Req 5.2)
    _updateIcon();

    // Wire the toggle button (Req 5.3, 5.4, 5.5)
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        const isDark = document.documentElement.classList.contains('theme-dark');

        if (isDark) {
          // Currently dark → switch to light
          document.documentElement.classList.remove('theme-dark');
          App.Storage.set(KEYS.THEME, 'light');
          // Req 5.4: on Storage failure the class was already removed — session state is correct
        } else {
          // Currently light → switch to dark
          document.documentElement.classList.add('theme-dark');
          App.Storage.set(KEYS.THEME, 'dark');
          // Req 5.4: on Storage failure the class was already added — session state is correct
        }
        // Req 5.5: no error shown to the user regardless of Storage result

        // Trigger spin animation; update icon at midpoint (when opacity hits 0)
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
          toggleBtn.classList.add('is-spinning');
          toggleBtn.addEventListener('animationend', function handler() {
            toggleBtn.classList.remove('is-spinning');
            toggleBtn.removeEventListener('animationend', handler);
          });
        }
        _updateIcon();
      });
    }
  }

  return Object.freeze({ init });
}());

// ---------------------------------------------------------------------------
// App.Greeting — personalized greeting, live clock, name persistence (Req 1.1–1.12)
// ---------------------------------------------------------------------------
App.Greeting = (function () {

  // ── Closure state ──────────────────────────────────────────────────────
  var currentName   = 'Friend';   // Req 1.11: default placeholder name
  var clockInterval = null;       // handle returned by setInterval

  // ── Private helpers ────────────────────────────────────────────────────

  /**
   * Update all three greeting-display elements with the current date, time,
   * and personalised greeting text.
   * Req 1.1, 1.2, 1.3–1.6, 1.7
   */
  function _updateDisplay() {
    var now = new Date();

    var dateEl     = document.getElementById('greeting-date');
    var timeEl     = document.getElementById('greeting-time');
    var greetingEl = document.getElementById('greeting-text');

    if (dateEl)     dateEl.textContent     = App.Utils.formatDate(now);                                         // Req 1.1
    if (timeEl)     timeEl.textContent     = App.Utils.formatTime(now);                                         // Req 1.2
    if (greetingEl) greetingEl.textContent = App.Utils.getGreeting(now.getHours()) + ', ' +                     // Req 1.3–1.6
                                             App.Utils.sanitizeText(currentName);                               // Req 1.7
  }

  /**
   * Called by setInterval every 1 000 ms.
   * Req 1.2
   */
  function _tick() {
    _updateDisplay();
  }

  /**
   * Remove any existing `.error-msg` element inside the given form.
   * @param {HTMLElement} form
   */
  function _clearError(form) {
    var existing = form.querySelector('.error-msg');
    if (existing) existing.remove();
  }

  /**
   * Inject a `<p class="error-msg" role="alert">` after the `.input-row`
   * div inside the given form.
   * @param {HTMLElement} form
   * @param {string}      message
   */
  function _showError(form, message) {
    _clearError(form);
    var p = document.createElement('p');
    p.className   = 'error-msg';
    p.setAttribute('role', 'alert');
    p.textContent = message;

    // Insert after .input-row (or at the end of the form if not found)
    var inputRow = form.querySelector('.input-row');
    if (inputRow && inputRow.nextSibling) {
      form.insertBefore(p, inputRow.nextSibling);
    } else if (inputRow) {
      form.appendChild(p);
    } else {
      form.appendChild(p);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Initialise the Greeting widget:
   *   1. Restore saved name from Storage (Req 1.10)
   *   2. Render the display immediately (Req 1.1, 1.2)
   *   3. Start the 1-second clock interval (Req 1.2)
   *   4. Wire the name-form submit listener (Req 1.7–1.9, 1.12)
   *   5. Wire the name-input `input` listener to clear stale errors
   */
  function init() {
    // 1. Restore persisted name (Req 1.10, 1.11)
    var stored = App.Storage.get(KEYS.USER_NAME);
    if (stored.ok && stored.value !== null) {
      var trimmed = String(stored.value).trim();
      if (trimmed.length >= 1 && trimmed.length <= 50) {
        currentName = trimmed;                                                   // Req 1.10
      }
    }

    // 2. Render immediately so date/time appear before the first tick
    _updateDisplay();

    // 3. Start the live clock (Req 1.2: updates every ≤ 1 500 ms)
    clockInterval = setInterval(_tick, 1000);

    // 4. Wire the name form
    var form  = document.getElementById('name-form');
    var input = document.getElementById('name-input');

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();                                                  // Req 1.8

        // Clear any stale error from a previous submission attempt (Req 1.9, 1.12)
        _clearError(form);

        var value   = input ? input.value : '';
        var trimmed = value.trim();

        // Req 1.9: reject empty or > 50 chars
        if (trimmed.length < 1 || trimmed.length > 50) {
          _showError(form, 'Name must be between 1 and 50 characters.');
          return;
        }

        // Attempt to persist (Req 1.8, 1.12)
        var result = App.Storage.set(KEYS.USER_NAME, trimmed);

        // Update in-memory name and display regardless of storage outcome
        // (Req 1.8: on success; Req 1.12: on failure still update session display)
        currentName = trimmed;
        _updateDisplay();

        if (!result.ok) {
          // Req 1.12: show error but keep the updated display
          _showError(form, 'Name updated for this session, but could not be saved.');
        }
      });
    }

    // 5. Clear error on input change (UX: immediate feedback as user types)
    if (input && form) {
      input.addEventListener('input', function () {
        _clearError(form);
      });
    }
  }

  return Object.freeze({ init });
}());

// ---------------------------------------------------------------------------
// App.Timer — Focus Timer (Req 2.1–2.9)
// ---------------------------------------------------------------------------
App.Timer = (function () {

  // Closure state
  var remaining    = 1500;   // seconds (25 × 60)
  var tickInterval = null;
  var isRunning    = false;

  /**
   * Update the countdown display element.
   * Req 2.3
   */
  function _updateDisplay() {
    var display = document.getElementById('timer-display');
    if (!display) return;
    var mm = String(Math.floor(remaining / 60)).padStart(2, '0');
    var ss = String(remaining % 60).padStart(2, '0');
    display.textContent = mm + ':' + ss;
  }

  /**
   * Apply button enabled/disabled states for a given timer state.
   * Req 2.6, 2.7, 2.8
   * @param {'idle'|'running'|'complete'} state
   */
  function _applyButtonStates(state) {
    var btnStart = document.getElementById('timer-start');
    var btnStop  = document.getElementById('timer-stop');
    var btnReset = document.getElementById('timer-reset');
    if (!btnStart || !btnStop || !btnReset) return;

    if (state === 'running') {
      // Req 2.7: disable Start, enable Stop, enable Reset
      btnStart.disabled = true;
      btnStop.disabled  = false;
      btnReset.disabled = false;
    } else {
      // 'idle' or 'complete'
      // Req 2.6 (idle) / 2.8 (complete): enable Start, disable Stop, enable Reset
      btnStart.disabled = false;
      btnStop.disabled  = true;
      btnReset.disabled = false;
    }
  }

  /**
   * Called every second while the timer is running.
   * Req 2.4, 2.5, 2.9
   */
  function _tick() {
    if (remaining <= 0) {
      // Timer complete
      clearInterval(tickInterval);
      tickInterval = null;
      isRunning    = false;

      var msg = document.getElementById('timer-complete');
      if (msg) {
        msg.textContent = '🎉 Focus session complete! Great work.';
        msg.hidden = false;  // Req 2.9: reveal the completion message
      }

      _applyButtonStates('complete');  // Req 2.8
    } else {
      remaining -= 1;        // Req 2.4: decrement
      _updateDisplay();      // Req 2.3: refresh display
    }
  }

  /**
   * Initialise the timer widget.
   * Req 2.1, 2.2
   */
  function init() {
    // Req 2.1: set initial display to "25:00"
    var display = document.getElementById('timer-display');
    if (display) {
      display.textContent = '25:00';
    }

    // Req 2.6: idle state on load
    _applyButtonStates('idle');

    // Wire Start button — Req 2.5
    var btnStart = document.getElementById('timer-start');
    if (btnStart) {
      btnStart.addEventListener('click', function () {
        if (isRunning) return;   // guard: ignore if already running
        isRunning    = true;
        tickInterval = setInterval(_tick, 1000);
        _applyButtonStates('running');
      });
    }

    // Wire Stop button — Req 2.6
    var btnStop = document.getElementById('timer-stop');
    if (btnStop) {
      btnStop.addEventListener('click', function () {
        clearInterval(tickInterval);
        tickInterval = null;
        isRunning    = false;
        _applyButtonStates('idle');
      });
    }

    // Wire Reset button — Req 2.7
    var btnReset = document.getElementById('timer-reset');
    if (btnReset) {
      btnReset.addEventListener('click', function () {
        clearInterval(tickInterval);
        tickInterval = null;
        isRunning    = false;
        remaining    = 1500;
        _updateDisplay();
        _applyButtonStates('idle');

        // Hide the completion message
        var msg = document.getElementById('timer-complete');
        if (msg) {
          msg.hidden = true;
          msg.textContent = '';
        }
      });
    }
  }

  return Object.freeze({ init });
}());

// ---------------------------------------------------------------------------
// App.Todo — To-Do List: data layer and rendering (Req 3.4, 3.5, 3.11, 3.12, 3.13)
// ---------------------------------------------------------------------------
App.Todo = (function () {

  // ── Closure state ──────────────────────────────────────────────────────
  var tasks = [];   // single source of truth; Task[]

  // ── Private helpers ────────────────────────────────────────────────────

  /**
   * Remove any existing `.error-msg` element inside the given form.
   * @param {HTMLElement} form
   */
  function _clearError(form) {
    var existing = form.querySelector('.error-msg');
    if (existing) existing.remove();
  }

  /**
   * Inject a `<p class="error-msg" role="alert">` after the `.input-row`
   * div inside the given form.
   * @param {HTMLElement} form
   * @param {string}      message
   */
  function _showError(form, message) {
    _clearError(form);
    var p = document.createElement('p');
    p.className = 'error-msg';
    p.setAttribute('role', 'alert');
    p.textContent = message;

    // Insert after .input-row (or at the end of the form if not found)
    var inputRow = form.querySelector('.input-row');
    if (inputRow && inputRow.nextSibling) {
      form.insertBefore(p, inputRow.nextSibling);
    } else if (inputRow) {
      form.appendChild(p);
    } else {
      form.appendChild(p);
    }
  }

  /**
   * Persist the current tasks array to localStorage.
   * On failure, inject an inline error into the Todo widget's error container.
   * Req 3.11, 3.13
   */
  function _save() {
    var result = App.Storage.set(KEYS.TASKS, tasks);
    if (!result.ok) {
      // Req 3.13: show inline error; in-memory state is still valid
      var container = document.getElementById('todo-error-container');
      if (container) {
        var p = document.createElement('p');
        p.className = 'error-msg';
        p.setAttribute('role', 'alert');
        p.textContent = 'Data could not be saved. Changes will be lost on reload.';
        container.innerHTML = '';   // clear any previous storage error before showing new one
        container.appendChild(p);
      }
    }
  }

  /**
   * Re-render the task list from the current `tasks` array.
   * Clears the `<ul id="task-list">` and rebuilds it.
   * Req 3.4, 3.5, 3.12
   */
  function _render() {
    var list = document.getElementById('task-list');
    if (!list) return;

    // Clear existing content
    list.innerHTML = '';

    // Empty state (Req 3.4)
    if (tasks.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No tasks yet. Add one above!';
      list.appendChild(empty);
      return;
    }

    // Render each task as a <li>
    tasks.forEach(function (task) {
      var li = document.createElement('li');
      li.className = 'task-item';
      li.setAttribute('data-id', task.id);                          // for event delegation
      li.setAttribute('data-completed', String(task.completed));    // Req 3.5

      // ── Toggle button ──────────────────────────────────────────────
      var btnToggle = document.createElement('button');
      btnToggle.type = 'button';
      btnToggle.className = 'btn-toggle';
      btnToggle.setAttribute('aria-pressed', String(task.completed));  // Req 3.5
      btnToggle.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
      btnToggle.textContent = task.completed ? '✅' : '⬜';
      btnToggle.addEventListener('click', function () {
        var taskId = li.getAttribute('data-id');
        var task = tasks.find(function (t) { return t.id === taskId; });
        if (task) {
          task.completed = !task.completed;
          _save();
          _render();
        }
      });

      // ── Task text span ─────────────────────────────────────────────
      var span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = App.Utils.sanitizeText(task.text);          // Req 3.4, XSS-safe

      // ── Edit button ────────────────────────────────────────────────
      var btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn-icon';
      btnEdit.setAttribute('aria-label', 'Edit task');
      btnEdit.setAttribute('data-action', 'edit');
      btnEdit.textContent = '✏️';
      btnEdit.addEventListener('click', function () {
        var editingId = li.getAttribute('data-id');
        var taskToEdit = tasks.find(function (t) { return t.id === editingId; });
        if (!taskToEdit) return;

        // Req 3.6: replace span with an inline text input
        var editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'form-input';
        editInput.value = taskToEdit.text;
        span.replaceWith(editInput);
        editInput.focus();

        // Replace edit button with a Save button
        var saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = 'Save';
        btnEdit.replaceWith(saveBtn);

        // Helper: inject/replace error message adjacent to the edit input
        function showEditError(message) {
          var existing = li.querySelector('.error-msg');
          if (existing) existing.remove();
          var p = document.createElement('p');
          p.className = 'error-msg';
          p.setAttribute('role', 'alert');
          p.textContent = message;
          editInput.insertAdjacentElement('afterend', p);
        }

        // Helper: validate and commit the edit
        function commitEdit() {
          var trimmedValue = editInput.value.trim();

          // Req 3.9: reject empty or > 200 chars
          if (trimmedValue.length < 1 || trimmedValue.length > 200) {
            showEditError('Task must be between 1 and 200 characters.');
            return;
          }

          // Req 3.8: reject duplicate against OTHER tasks
          if (tasks.some(function (t) {
            return t.id !== editingId &&
              App.Utils.trimAndLower(t.text) === App.Utils.trimAndLower(trimmedValue);
          })) {
            showEditError('Another task with this name already exists.');
            return;
          }

          // Req 3.7: valid — update text, persist, re-render
          taskToEdit.text = trimmedValue;
          _save();
          _render();
        }

        // Req 3.6: Save on button click or Enter key
        saveBtn.addEventListener('click', commitEdit);
        editInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
        });
      });

      // ── Delete button ──────────────────────────────────────────────
      var btnDelete = document.createElement('button');
      btnDelete.type = 'button';
      btnDelete.className = 'btn-icon';
      btnDelete.setAttribute('aria-label', 'Delete task');
      btnDelete.setAttribute('data-action', 'delete');
      btnDelete.textContent = '🗑';
      btnDelete.addEventListener('click', function () {
        var taskId = li.getAttribute('data-id');
        tasks = tasks.filter(function (t) { return t.id !== taskId; });
        _save();
        _render();
      });

      // Assemble the <li>
      li.appendChild(btnToggle);
      li.appendChild(span);
      li.appendChild(btnEdit);
      li.appendChild(btnDelete);

      list.appendChild(li);
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Initialise the Todo widget:
   *   1. Load saved tasks from Storage (Req 3.12)
   *   2. Render the task list (Req 3.4)
   * Req 3.12, 3.13
   */
  function init() {
    // Req 3.12: restore persisted tasks
    var result = App.Storage.get(KEYS.TASKS);
    if (result.ok && Array.isArray(result.value)) {
      tasks = result.value;
    }
    // If read fails or value is not an array, tasks stays as []
    // (graceful degradation — no error shown on read failure per design)

    _render();

    // ── Wire #task-form submit (Req 3.1, 3.2, 3.3) ─────────────────────
    var form  = document.getElementById('task-form');
    var input = document.getElementById('task-input');

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Clear any stale error from a previous submission attempt (Req 3.2, 3.3, 3.13)
        _clearError(form);

        var value   = input ? input.value : '';
        var trimmed = value.trim();

        // Req 3.2: reject empty or > 200 chars
        if (trimmed.length < 1 || trimmed.length > 200) {
          _showError(form, 'Task must be between 1 and 200 characters.');
          return;
        }

        // Req 3.3: reject duplicate (case-insensitive)
        if (tasks.some(function (t) {
          return App.Utils.trimAndLower(t.text) === App.Utils.trimAndLower(trimmed);
        })) {
          _showError(form, 'This task already exists.');
          return;
        }

        // Req 3.1: add task on success
        tasks.push({
          id:        crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          text:      trimmed,
          completed: false
        });
        _save();
        _render();

        // Clear input
        if (input) input.value = '';
        // Clear any previous error
        _clearError(form);
      });
    }

    // ── Wire #task-input input event to clear errors ─────────────────────
    if (input && form) {
      input.addEventListener('input', function () {
        _clearError(form);
      });
    }
  }

  return Object.freeze({ init });
}());

// ---------------------------------------------------------------------------
// App.Links — Quick Links manager: data layer and rendering (Req 4.6, 4.7, 4.9, 4.10)
// ---------------------------------------------------------------------------
App.Links = (function () {

  // ── Closure state ──────────────────────────────────────────────────────
  var links = [];   // Link[] — single source of truth

  // ── Private helpers ────────────────────────────────────────────────────

  /**
   * Persist the current `links` array to localStorage.
   * If the write fails, inject an error message into the Links error container.
   * Req 4.8
   */
  function _save() {
    var result = App.Storage.set(KEYS.LINKS, links);
    if (!result.ok) {
      var container = document.getElementById('links-error-container');
      if (container) {
        var p = document.createElement('p');
        p.className = 'error-msg';
        p.setAttribute('role', 'alert');
        p.textContent = 'Link could not be saved. Storage may be unavailable.';
        container.innerHTML = '';   // clear any previous storage error before showing new one
        container.appendChild(p);
      }
    }
  }

  /**
   * Re-render the entire links list from the `links` closure array.
   * Req 4.6, 4.7, 4.9
   *
   * Each link renders as:
   *   <div class="link-item">
   *     <button class="link-btn" data-url="...">Label</button>
   *     <button class="btn-icon" data-id="...">🗑</button>
   *   </div>
   *
   * If `links` is empty, renders an empty-state paragraph instead.
   */
  function _render() {
    var container = document.getElementById('links-list');
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    if (links.length === 0) {
      // Empty-state message (Req 4.9 — widget renders in empty state)
      var empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No links saved yet. Add one above!';
      container.appendChild(empty);
      return;
    }

    // Render each link
    links.forEach(function (link) {
      var item = document.createElement('div');
      item.className = 'link-item';

      // Link open button — Req 4.6: opens URL in new tab with noopener,noreferrer
      var linkBtn = document.createElement('button');
      linkBtn.className = 'link-btn';
      linkBtn.textContent = App.Utils.sanitizeText(link.label);
      linkBtn.setAttribute('data-url', link.url);
      linkBtn.addEventListener('click', function () {
        window.open(link.url, '_blank', 'noopener,noreferrer');  // Req 4.6
      });

      // Delete button — Req 4.7: removes the link permanently
      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-icon';
      deleteBtn.setAttribute('data-id', link.id);
      deleteBtn.setAttribute('aria-label', 'Delete link ' + App.Utils.sanitizeText(link.label));
      deleteBtn.textContent = '🗑';
      deleteBtn.addEventListener('click', function () {
        var targetId = this.getAttribute('data-id');
        links = links.filter(function (l) { return l.id !== targetId; });
        _save();
        _render();
      });

      item.appendChild(linkBtn);
      item.appendChild(deleteBtn);
      container.appendChild(item);
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Initialise the Quick Links widget:
   *   1. Load persisted links from Storage (Req 4.9)
   *   2. If data is corrupted or missing, silently fall back to empty array (Req 4.10)
   *   3. Render the loaded links (or empty state)
   *   4. Wire the add-link form submit handler (Req 4.1–4.5, 4.8)
   *   5. Wire input events to clear inline errors (UX)
   */
  function init() {
    var result = App.Storage.get(KEYS.LINKS);

    if (result.ok && Array.isArray(result.value)) {
      // Req 4.9: restore and render saved links
      links = result.value;
    } else {
      // Req 4.10: corrupted / missing data — discard silently, render empty state
      links = [];
    }

    _render();

    // ── Wire the add-link form ────────────────────────────────────────────
    var form       = document.getElementById('link-form');
    var labelInput = document.getElementById('link-label-input');
    var urlInput   = document.getElementById('link-url-input');

    if (!form || !labelInput || !urlInput) return;

    // Helper: inject an error <p> after a given input element (inside its .form-group)
    function _injectInputError(inputEl, message) {
      var p = document.createElement('p');
      p.className = 'error-msg';
      p.setAttribute('role', 'alert');
      p.textContent = message;
      inputEl.parentNode.appendChild(p);
    }

    // Helper: inject a form-level error (cap / duplicate) at the end of the form
    function _injectFormError(message) {
      var p = document.createElement('p');
      p.className = 'error-msg';
      p.setAttribute('role', 'alert');
      p.textContent = message;
      form.appendChild(p);
    }

    // Req 4.1–4.5: submit handler
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      // Clear all existing error messages from the form before re-validating
      var existingErrors = form.querySelectorAll('.error-msg');
      existingErrors.forEach(function (el) { el.remove(); });

      var trimmedLabel = labelInput.value.trim();
      var trimmedUrl   = urlInput.value.trim();

      // Req 4.2: validate label length (1–100 chars)
      if (trimmedLabel.length < 1 || trimmedLabel.length > 100) {
        _injectInputError(labelInput, 'Label is required and must be 1–100 characters.');
        return;
      }

      // Req 4.4: validate URL format
      if (!App.Utils.isValidUrl(trimmedUrl)) {
        _injectInputError(urlInput, 'Please enter a valid URL starting with http:// or https://.');
        return;
      }

      // Req 4.3: duplicate URL check (case-insensitive, trim-aware)
      if (links.some(function (l) {
        return App.Utils.trimAndLower(l.url) === App.Utils.trimAndLower(trimmedUrl);
      })) {
        _injectFormError('This link already exists.');
        return;
      }

      // Req 4.5: enforce 20-link cap
      if (links.length >= 20) {
        _injectFormError('Maximum number of links (20) has been reached.');
        return;
      }

      // Req 4.1: all validations passed — add the new link
      var newLink = {
        id:    (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
        label: trimmedLabel,
        url:   trimmedUrl,
      };
      links.push(newLink);
      _save();     // Req 4.1, 4.8: persist (shows inline error on failure)
      _render();   // Req 4.1: re-render button list

      // Clear input fields after successful add
      labelInput.value = '';
      urlInput.value   = '';
    });

    // Wire input events to clear inline errors immediately as the user types
    labelInput.addEventListener('input', function () {
      var err = labelInput.parentNode.querySelector('.error-msg');
      if (err) err.remove();
    });
    urlInput.addEventListener('input', function () {
      var err = urlInput.parentNode.querySelector('.error-msg');
      if (err) err.remove();
    });
  }

  return Object.freeze({ init });
}());

// ---------------------------------------------------------------------------
// App.init — Bootstrap all modules (Req 5.4, 6.1, 6.2, 6.3)
// ---------------------------------------------------------------------------
// App.Theme.init() is called first to apply the saved theme class to <html>
// before any other module touches the DOM, preventing a flash of the wrong
// theme color (Req 5.4).
// ---------------------------------------------------------------------------
App.init = function () {
  App.Theme.init();    // must be first — applies theme class before paint
  App.Greeting.init();
  App.Timer.init();
  App.Todo.init();
  App.Links.init();
};

document.addEventListener('DOMContentLoaded', App.init);
