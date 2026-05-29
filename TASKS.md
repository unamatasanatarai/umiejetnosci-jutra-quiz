# Developer Task Breakdown: Interactive Local Quiz Application

## 1. Context Summary

The objective is to implement a lightweight, fully client-side single-page quiz application (SPA) using Vanilla JavaScript, HTML5 templates, and CSS3. The application operates entirely offline, ingestion-validates a local JSON question array, shuffles both questions and options, tracks session execution via a hardware-clock delta timer that freezes during question feedback, and provides a focused review mode for incorrect answers.

### Key Assumptions & Dependencies

* **No Environment Dependencies:** The application requires zero compilation steps, external packages, CDNs, frameworks, or runtime servers; it executes as a static bundle directly in modern browser engines (Chromium, Firefox, Safari).
* **Ephemeral In-Memory State:** No persistence layer (`localStorage`, database) is required for MVP v1. State is completely wiped on browser reload or session restart.
* **Source Constraint:** The code must be integrated cleanly within a single structured file setup (`index.html`, `styles.css`, `app.js`) while maintaining strict architectural boundaries.

---

## 2. Sequencing & Implementation Roadmap

```
[Phase 1: Core Foundation]  ──►  [Phase 2: Data Ingestion]  ──►  [Phase 3: Quiz Execution]  ──►  [Phase 4: Review & Cycle]
  - Event Bus & State Struct       - File API & JSON Validation      - Question Presentation      - Summary Screen View
  - Shell HTML & Layout CSS       - Deep Copy & Normalization       - Delta Timer Engine         - Review Mode Loop

```

* **Parallel Workstreams:** Once the foundational Pub/Sub Event Bus and State definitions are merged, *Task 3 (UI Layout & Theme)*, *Task 4 (JSON Parser & Validator)*, and *Task 5 (Question Selection Engine)* can be worked on concurrently by different developers using mocking interfaces.

---

## 3. Detailed Task Breakdown

### Phase 1: Core Foundation & Infrastructure

#### Task 1: Initialize Architecture, Core State Engine, and Synchronous Event Bus

* **Description:** Build the underlying state orchestration foundation. Define the global configuration (`CONFIG`), the canonical in-memory state representation (`STATE`), and a decoupled Pub/Sub communication structure (`eventBus`) to manage data transitions without tight coupling.
* **Acceptance Criteria:**
* Define configuration constants containing constraints: `MAX_QUESTIONS: 50`, `SEC_PER_QUESTION: 72`, and `ALLOWED_CHOICES: ['a', 'b', 'c', 'd']`.
* Instantiate the structural global `STATE` tracking variables: `phase`, `allQuestions`, `selectedQuestions`, `currentQuestionIndex`, `pausedRemainingMs`, `endTimestamp`, `timerInterval`, `startedAt`, `finishedAt`.
* Implement the standalone synchronous Event Bus interface with exactly three tracking methods: `on(eventName, handler)`, `off(eventName, handler)`, and `emit(eventName, payload)`.
* Ensure the event bus handles multiple listeners for system events (`TIMEOUT`, `ANSWER_SELECTED`, `NEXT_QUESTION`, `QUIZ_COMPLETED`, `RESTART_SESSION`, `FILE_REJECTED`) without state leakages.


* **Dependencies:** None
* **Priority:** High

#### Task 2: Build Pure Immutable Render Engine Shell

* **Description:** Create the presentation driver (`renderEngine`) responsible for template-based single-page view swapping. It must enforce functional purity, prevent DOM state drift, and clear listener memory footprints between views.
* **Acceptance Criteria:**
* Define the `render(frozenState)` functional interface signature.
* Explicitly freeze incoming state configurations inside callers using `Object.freeze({ ...STATE })` before passing data downward into the rendering execution path.
* Ensure the execution path clears the root container element completely (`root.textContent = ""`) before mounting a new view.
* Utilize native browser deep-cloning logic (`document.importNode(template.content, true)`) to construct views from template instances.
* Enforce text-only data injection bindings across dynamic data slots exclusively using `.textContent`. The use of `innerHTML`, `outerHTML`, or `insertAdjacentHTML` must be blocked to prevent XSS vulnerability pathways.


* **Dependencies:** Task 1
* **Priority:** High

#### Task 3: Implement Shell HTML Templates & Responsive Layout Styles

* **Description:** Draft the markup shell structures inside the primary entrypoint layout, along with the color token definitions required by mobile viewports.
* **Acceptance Criteria:**
* Populate `index.html` with native structural `<template>` elements matching the required lifecycle application screens: `#tpl-idle`, `#tpl-ready`, `#tpl-quiz`, `#tpl-summary`, `#tpl-review`.
* Set up CSS custom properties matching system UI specifications: `--color-success: #2e7d32;`, `--color-error: #c62828;`, `--color-faded: #9e9e9e;`, and `--color-alert: #d32f2f;`.
* Enforce layout containment constraints using mobile-first media selections, establishing safe word wrapping rules (`word-break: break-word;`) to prevent dynamic content or large strings from causing horizontal overflow.


* **Dependencies:** Task 2
* **Priority:** Medium

---

### Phase 2: Data Ingestion Pipeline

#### Task 4: Develop Local File Input Handler and Strict JSON Schema Validator

* **Description:** Implement local data intake parsing layers to intercept user uploads and process structural schema evaluations safely within a sandbox boundary.
* **Acceptance Criteria:**
* Set up unified interaction targets supporting both manual drag-and-drop actions and native file-picker file inputs.
* Read targeted components client-side using `FileReader` bound to a strict UTF-8 text interpretation format.
* Enforce strict array structural checking matching the exact layout profile rules: required string parameter markers (`question`, `a`, `b`, `c`, `d`) and valid mapping enum constraints (`correct` matching exactly `["a", "b", "c", "d"]`).
* Enforce rejection constraints for files containing empty data slices (`[]`) or missing configuration property strings.
* Trap format anomalies using isolated `try/catch` processing blocks, routing fallback channels onto a clean error event emission (`emit("FILE_REJECTED")`).


* **Dependencies:** Task 1, Task 3
* **Priority:** High

#### Task 5: Build Array Shuffling and Question Normalization Processor

* **Description:** Implement array transformations to split reference tracking pathways from source objects, isolate the active pool, and construct internal models.
* **Acceptance Criteria:**
* Sever structural pointer links referencing base array sources via deep-cloning serialization mechanisms: `JSON.parse(JSON.stringify(masterArray))`.
* Limit question storage size safely using maximum allocation boundaries: $\min(N, 50)$.
* Randomize question layout positions using an unbiased array sorting method before applying length cuts.
* Normalize alphabet mapping parameters into structured objects:
```javascript
{
  questionText: raw.question,
  choices: [raw.a, raw.b, raw.c, raw.d], // Randomly shuffled order
  correctAnswerValue: raw[raw.correct],
  selectedAnswerValue: null,
  isCorrect: false,
  originalShuffledOrder: [] // Preserved choice sequence
}

```


* Populate `originalShuffledOrder` arrays dynamically with the randomized choices positions to guarantee layout rendering consistency during downstream review steps.


* **Dependencies:** Task 4
* **Priority:** High

---

### Phase 3: Active Quiz Execution Engine

#### Task 6: Implement Hardware-Clock Delta Timer Engine

* **Description:** Build a stable countdown tracking tracker driven by system wall-clock differences, circumventing tab background sleep constraints and processing delays.
* **Acceptance Criteria:**
* Compute maximum session durations dynamically upon moving out of setup steps using the total question pool count: $Duration = \min(N, 50) \times 72\text{ seconds}$.
* Derive active countdown limits by measuring differences between absolute expiration marks and real time ticks: `Math.max(0, STATE.endTimestamp - Date.now())`.
* Trigger automated expiration routines (`emit("TIMEOUT")`) if evaluation parameters encounter values at or below zero.
* When a question times out, mark the question as incorrect (`isCorrect = false`), stop the active timer loop, and force a transition to the completion view.


* **Dependencies:** Task 1, Task 5
* **Priority:** High

#### Task 7: Build Intermittent Timing Pause and Navigation Anchor Controls

* **Description:** Orchestrate transition logic to freeze timer tracking targets while evaluating feedback, shifting deadlines forward when users progress.
* **Acceptance Criteria:**
* Halt countdown intervals instantly using clear commands (`clearInterval`) when option clicks hit selection layers.
* Freeze and record remaining microsecond balances safely within specific state parameters: `STATE.pausedRemainingMs = STATE.endTimestamp - Date.now();`.
* Move the system state into feedback phases (`STATE.phase = "feedback"`) and reveal navigation step items (`#btn-next-question`).
* Shift target expiration deadlines forward when users trigger progression actions, re-anchoring execution limits onto active clock times: `STATE.endTimestamp = Date.now() + STATE.pausedRemainingMs;`.
* Clear and nullify active timer references (`STATE.timerInterval = null`) across all completion events (`TIMEOUT`, `QUIZ_COMPLETED`, `RESTART_SESSION`).


* **Dependencies:** Task 6
* **Priority:** High

#### Task 8: Build Interactive Question Evaluation Screen Layouts

* **Description:** Formulate active user selection handling structures to style choices based on correctness states without configuration step confirms.
* **Acceptance Criteria:**
* Trap pointer clicks hitting option layouts, binding choices onto internal trackers instantly.
* Lock sibling options immediately against subsequent input modifications once a selection is registered.
* Update CSS variable layout selections immediately to render correctness mappings:
* Clicked Correct Option $\rightarrow$ Apply `--color-success`
* Clicked Incorrect Option $\rightarrow$ Apply `--color-error` & reveal Correct Target using `--color-success`
* Unselected / Remaining Options $\rightarrow$ Apply muted formatting treatments via `--color-faded`




* **Dependencies:** Task 2, Task 7
* **Priority:** High

---

### Phase 4: Performance Summary & Review Loop

#### Task 9: Implement Summary Dashboard Controller

* **Description:** Construct the aggregate performance compilation engine to format and display final session scores and session time metrics.
* **Acceptance Criteria:**
* Calculate aggregate completion metrics, presenting scores as integer percentage computations.
* Render total count summaries presenting successes relative to evaluated items.
* Output absolute elapsed session durations formatted in a standard minute and second notation ($\text{Total Duration} - \text{Remaining Time Balance}$).
* Hook up state-purging interactive triggers ("Restart Session") to reset state data, destroy intervals, clear container DOM targets, and return to ingestion steps.


* **Dependencies:** Task 2, Task 8
* **Priority:** Medium

#### Task 10: Implement Session Review Mode Feature Set

* **Description:** Build linear review loops allowing isolated inspection of missed items while keeping original option layouts and selections unchanged.
* **Acceptance Criteria:**
* Filter session tracking targets to extract only items marked incorrect (`isCorrect = false`) for display during review operations.
* Reconstruct option layouts using preserved sequence parameters (`originalShuffledOrder`), rendering choice positions exactly as seen during the live test session.
* Re-apply correctness status treatments, locking interaction handling entirely so users can only view selections.
* Support linear navigation steps ("Previous" / "Next") to traverse missed items, along with exit mechanisms to return to the summary screen.


* **Dependencies:** Task 5, Task 9
* **Priority:** Medium

---

## 4. Technical Considerations & Edge Cases

* **Background Tab Suspension:** If a user flags out or leaves the browser window backgrounded during live question views, standard `setInterval` loops often pause or slow down. The implementation *must* compute step degradation using `Date.now()` differences during interval wake-up to prevent cheating or timing drift.
* **Double-Click Form Mutations:** To prevent rapid double-clicks from incrementing question tracking indices out of bounds, input event handling must freeze input targets instantly before triggering state modifications.
* **Clean Event Bus Subscriptions:** During view swapping routines, old DOM elements are removed, but dangling event handlers can cause memory leaks. Event bindings should be attached directly to the freshly cloned template document fragments before they are appended to the main root view.

---

## 5. Architectural Gaps & Clarification Questions

> [!NOTE]
> *Development can proceed immediately based on the current requirements, but the following edge cases should be clarified with stakeholders for v1.*

1. **Review Mode with Zero Errors:** If a user achieves a perfect score ($100\%$), what should the system display when the "Review Mode" button is clicked? *Recommendation:* Disable the review button or display a state configuration notice indicating there are no errors to review.
2. **File Processing Size Ceilings:** While the requirements specify that a 1,000-question JSON file must load seamlessly, what is the maximum file size limit in megabytes before the application throws a memory or performance warning?
3. **OS Clock Tampering:** Since the timer compares hardware clock ticks (`Date.now()`), a user can artificially add or subtract test time by modifying their operating system clock mid-session. Given the single-user, offline-first scope, we assume this risk is acceptable for MVP v1.