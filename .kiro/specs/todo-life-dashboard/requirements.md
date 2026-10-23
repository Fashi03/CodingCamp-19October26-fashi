# Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page, client-side web application built with HTML, CSS, and Vanilla JavaScript. It serves as a personal productivity hub, combining a contextual greeting, a Focus Timer, a To-Do List, and a Quick Links manager — all persisted in the browser's Local Storage with no backend required. The app supports light/dark mode toggling and a user-configurable display name.

## Glossary

- **Dashboard**: The single HTML page that hosts all four feature widgets.
- **Greeting_Widget**: The section displaying the user's name, current date, current time, and a time-of-day greeting.
- **Focus_Timer**: The countdown timer widget that counts down from 25 minutes (1500 seconds).
- **Todo_List**: The widget that manages the user's task items.
- **Task**: A single to-do item with a text label and a completion state.
- **Quick_Links**: The widget that stores and displays user-defined shortcut buttons to external URLs.
- **Link**: A single quick-link entry containing a display label and a URL.
- **Local_Storage**: The browser's `localStorage` API used to persist all user data.
- **Theme**: The active color scheme of the Dashboard — either "light" or "dark".
- **Duplicate_Task**: A Task whose trimmed, case-insensitive text matches an existing Task in the Todo_List.
- **Duplicate_Link**: A Link whose trimmed URL matches an existing Link in the Quick_Links widget.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see a personalized greeting with the current time and date, so that I feel welcomed and oriented when I open the Dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Monday, 26 October 2026").
2. THE Greeting_Widget SHALL display the current time in HH:MM:SS format, updated at intervals of no more than 1500 milliseconds.
3. WHEN the current local hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the current local hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the current local hour is between 18:00 and 21:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the current local hour is between 22:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".
7. THE Greeting_Widget SHALL display a user-configurable name of 1 to 50 characters after the greeting text (e.g., "Good Morning, Alex").
8. WHEN the user submits a name via the name input field and the trimmed value is between 1 and 50 characters, THE Greeting_Widget SHALL save the trimmed name to Local_Storage and display it immediately.
9. IF the user submits a name via the name input field and the trimmed value is empty or exceeds 50 characters, THEN THE Greeting_Widget SHALL reject the input and display an error message indicating the name must be between 1 and 50 characters, without altering the currently displayed name.
10. WHEN the Dashboard loads and Local_Storage contains a saved name, THE Greeting_Widget SHALL restore and display that saved name.
11. IF Local_Storage contains no saved name, THEN THE Greeting_Widget SHALL display a default placeholder name (e.g., "Friend").
12. IF a Local_Storage write operation fails, THEN THE Greeting_Widget SHALL display the submitted name for the current session without persisting it, and display an error message indicating the name could not be saved.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can time focused work sessions without leaving the Dashboard.

#### Acceptance Criteria

1. WHEN the page loads, THE Focus_Timer SHALL initialize with a countdown display of 25:00 (1500 seconds) in MM:SS format.
2. WHEN the user activates the Start button, THE Focus_Timer SHALL begin counting down one second per second.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the Stop button, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the Reset button, THE Focus_Timer SHALL stop any active countdown and restore the display to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visible message on the Dashboard informing the user that the session is complete.
7. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the Start button and enable the Stop and Reset buttons.
8. WHILE the Focus_Timer is paused or at the initial state, THE Focus_Timer SHALL enable the Start and Reset buttons and disable the Stop button.
9. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL enable the Start and Reset buttons and disable the Stop button.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks, so that I can track and manage my daily activities from the Dashboard.

#### Acceptance Criteria

1. WHEN the user submits a task text of 1–200 characters via the task input field, THE Todo_List SHALL add a new Task with completion state set to false.
2. IF the submitted task text is empty after trimming whitespace, THEN THE Todo_List SHALL reject the submission and display an inline error message indicating the task text cannot be empty.
3. IF the submitted task text, after trimming whitespace and ignoring case, matches an existing Task in the Todo_List, THEN THE Todo_List SHALL reject the submission and display an inline error message indicating the task already exists.
4. THE Todo_List SHALL display all Tasks, each showing the task text, a completion toggle control, an edit control, and a delete control.
5. WHEN the user activates the completion toggle for a Task, THE Todo_List SHALL flip the Task's completion state and apply a strikethrough style to that Task's text when complete.
6. WHEN the user activates the edit control for a Task, THE Todo_List SHALL replace the Task's text display with an editable input pre-filled with the current task text and set focus to that input.
7. WHEN the user confirms an edit by pressing Enter or activating a save control, THE Todo_List SHALL update the Task's text to the new trimmed value and return to the display state.
8. IF the confirmed edit text, after trimming whitespace and ignoring case, matches a different existing Task, THEN THE Todo_List SHALL reject the edit and display an inline error message indicating the duplicate.
9. IF the confirmed edit text is empty after trimming, THEN THE Todo_List SHALL reject the edit and display an inline error message indicating the task text cannot be empty.
10. WHEN the user activates the delete control for a Task, THE Todo_List SHALL remove that Task from the list permanently.
11. THE Todo_List SHALL persist all Task data (text and completion state) to Local_Storage after every add, edit, complete-toggle, or delete operation.
12. WHEN the Dashboard loads and Local_Storage contains saved Tasks, THE Todo_List SHALL restore and render all saved Tasks.
13. IF a Local_Storage write operation fails, THEN THE Todo_List SHALL display an inline error message indicating the data could not be saved, and preserve the in-memory state for the current session.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and open shortcut buttons to my favorite websites, so that I can navigate to them quickly from the Dashboard.

#### Acceptance Criteria

1. WHEN the user submits a label of 1–100 characters and a valid URL via the link input fields, THE Quick_Links widget SHALL add a new Link, render it as a clickable button, and persist the updated Link list to Local_Storage.
2. IF the user submits the link form with an empty label field, THEN THE Quick_Links widget SHALL reject the submission and display an inline error message indicating the label is required.
3. IF the submitted URL, after trimming whitespace, matches the URL of an existing Link (case-insensitive), THEN THE Quick_Links widget SHALL reject the submission and display an inline error message indicating the link already exists.
4. IF the submitted URL is not a valid URL format (must include a scheme such as http:// or https://), THEN THE Quick_Links widget SHALL reject the submission and display an inline error message indicating the URL is invalid.
5. IF the Quick_Links widget already contains 20 Links and the user submits a new link, THEN THE Quick_Links widget SHALL reject the submission and display an inline error message indicating the maximum number of links has been reached.
6. WHEN the user activates a Link button, THE Quick_Links widget SHALL open the associated URL in a new browser tab.
7. WHEN the user activates the delete control for a Link, THE Quick_Links widget SHALL remove that Link permanently and persist the updated Link list to Local_Storage.
8. IF Local_Storage is unavailable or the write operation fails during a save, THEN THE Quick_Links widget SHALL display an inline error message indicating the link could not be saved.
9. WHEN the Dashboard loads and Local_Storage contains saved Links, THE Quick_Links widget SHALL restore and render all saved Links as buttons.
10. IF Local_Storage data for Links is present but cannot be parsed on Dashboard load, THEN THE Quick_Links widget SHALL discard the corrupted data and render the Quick_Links widget in an empty state.

---

### Requirement 5: Light and Dark Mode

**User Story:** As a user, I want to toggle between light and dark color themes, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a single toggle control that switches between the "light" Theme and the "dark" Theme.
2. WHEN the user activates the theme toggle, THE Dashboard SHALL apply the selected Theme's CSS variables or class to the root element immediately.
3. THE Dashboard SHALL persist the selected Theme identifier to Local_Storage after every toggle.
4. WHEN the Dashboard loads and Local_Storage contains a saved Theme, THE Dashboard SHALL restore and apply that saved Theme before the page renders visible content (no flash of wrong theme).
5. IF Local_Storage contains no saved Theme, THEN THE Dashboard SHALL apply the "light" Theme as the default.

---

### Requirement 6: Non-Functional — Simplicity

**User Story:** As a user, I want a clean, minimal interface with no complex setup, so that I can start using the Dashboard immediately without configuration.

#### Acceptance Criteria

1. THE Dashboard SHALL operate as a single HTML file with exactly one linked CSS file and one linked JavaScript file.
2. THE Dashboard SHALL require no installation, build step, server, or external network dependency to function.
3. THE Dashboard SHALL be fully operational by opening the HTML file directly in a modern browser (Chrome, Firefox, Edge, Safari).

---

### Requirement 7: Non-Functional — Performance

**User Story:** As a user, I want the Dashboard to load quickly and respond without lag, so that it does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL complete its initial render and display all widgets within 2 seconds on a modern desktop device without network throttling.
2. WHEN the user interacts with any widget (add, edit, delete, toggle, timer start/stop), THE Dashboard SHALL reflect the change in the UI within 100 milliseconds.
3. THE Dashboard SHALL write to Local_Storage synchronously so that data is persisted before the next user interaction can modify state.

---

### Requirement 8: Non-Functional — Visual Design

**User Story:** As a user, I want a visually appealing and readable interface, so that I can use the Dashboard for extended periods comfortably.

#### Acceptance Criteria

1. THE Dashboard SHALL use a consistent typographic scale with a minimum body font size of 14px.
2. THE Dashboard SHALL maintain a color contrast ratio of at least 4.5:1 between text and its background for both the light and dark Themes, in accordance with WCAG 2.1 AA.
3. THE Dashboard SHALL apply a clear visual hierarchy by distinguishing widget headings, interactive controls, and content areas through size, weight, or color differentiation.
4. THE Dashboard SHALL be responsive and remain usable on viewport widths from 320px to 1920px.
