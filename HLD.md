# High-Level Design (HLD)

## Interactive Local Quiz Application (Unified & Hardened Version)

---

# 1. Executive Summary

## Problem Statement

Build a lightweight, fully client-side interactive quiz application that:

* Loads questions from a local JSON file
* Randomly selects up to 50 questions
* Randomizes both question and answer order per session
* Provides immediate correctness feedback without step confirmation
* Operates entirely offline with no backend
* Runs from static files only
* Supports mobile-first responsive usage

The application is intended as a single-user MVP assessment tool with zero persistence, zero authentication, and no server dependencies.

---

## Solution Overview

The solution is a frontend-only browser application implemented using:

* Vanilla JavaScript
* HTML5 (including native `<template>` elements)
* CSS3

The application architecture is state-driven using:

* Centralized in-memory application state
* A lightweight internal Pub/Sub Event Bus
* Event-based UI updates driven by dynamic cloning of HTML templates
* Deterministic session lifecycle and stateless execution model

---

## Key Constraints

| Constraint | Impact |
| --- | --- |
| **No backend** | All logic client-side |
| **No persistence** | In-memory session state only |
| **No frameworks** | Manual state management and explicit rendering |
| **Single JS/CSS/HTML** | Strong modular organization required |
| **Mobile-first** | Responsive UI mandatory (portrait-first) |
| **Offline support** | No network dependencies |
| **Strict JSON schema** | Strong validation pipeline with syntax/schema separation |
| **No accessibility scope** | Simplified interaction handling |

---

## Core Architectural Decisions

| Area | Decision |
| --- | --- |
| **Architecture style** | State-driven SPA-like frontend backed by a Pub/Sub Event Bus |
| **Data source** | Local uploaded JSON via synchronous FileReader |
| **State persistence** | None (fully ephemeral) |
| **Rendering strategy** | Pure dynamic DOM injection via native HTML templates |
| **Navigation model** | Single-question linear progression (no backtracking) |
| **Validation strategy** | Strict schema rejection via isolated try/catch processing |
| **Security model** | Text-only rendering (`textContent`) to prevent XSS injection |

---

# 2. Requirements

## Functional Requirements

### Quiz Loading

* Support drag-and-drop and file-picker JSON uploads.
* Validate JSON immediately after upload.
* Reject the entire file if any structural or logical validation check fails.
* Show a generic red error banner (`Oops — invalid file 😅`) without exposing inner error codes.

### Question Processing

* Randomly select up to 50 questions (use all if total questions $N < 50$).
* Break all reference links to the source array using an explicit deep copy.
* Normalize schemas, transforming original single-letter keys into evaluation-safe string representations.

### Quiz Execution & Timing

* Global session timer calculating total duration dynamically.
* 72 seconds allocated per question.
* The timer starts immediately upon the first question view.
* Progress bar updates every second using a strict timestamp delta.
* **Immediate Pause/Resume Action:** The timer stops immediately once an option is clicked, freezing remaining session time during feedback. It continues only when the user triggers the "Next Question" action.

### Answering & Feedback Rules

* Single answer selection only.
* Selecting an answer immediately locks it as the choice (no intermediate confirmation step required).
* **Immediate visual response:**
* Correct selection $\rightarrow$ Green highlight
* Incorrect selection $\rightarrow$ Red highlight
* Correct answer $\rightarrow$ Always revealed in green
* Remaining unselected/incorrect items $\rightarrow$ Faded gray


* No backtracking or skipping allowed.

### Navigation

* A "Next" button appears only after an answer is submitted or when a global timeout occurs.
* No auto-advancing; manual interaction is mandatory.

### Completion Rules

The quiz ends instantly when:

* The cumulative session timer hits zero.
* All parsed questions have been answered.

### Summary & Review Screen

* Displays score percentage, total correct items, and total time elapsed.
* Provides a **Restart Button** to clear state and reinitialize the app.
* Provides a **Review Mode Button** allowing users to review incorrect answers while preserving original shuffled item order, selections, and correctness states.

---

## Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| **Performance** | Seamless support for a 1,000-question JSON file |
| **Persistence** | None (all data drops on page refresh or session restart) |
| **Offline Capability** | Mandatory (zero external APIs, CDNs, or network calls) |
| **Security** | Rigid text-only assignments; zero usage of `innerHTML` or dynamic markup parsing |
| **Browser Support** | Modern Chromium, Firefox, and Safari engines |

---

# 3. System Context

## Context Diagram

```text
User  ──────►  [ Browser Application ]  ◄──────  Local JSON File
                    (Static SPA)

```

The application executes within an entirely isolated sandbox inside the user's web browser. There are no server dependencies, analytics hooks, databases, or cloud sync channels.

---

# 4. High-Level Architecture

## Component Ownership Boundaries

To eliminate structural state corruption and DOM synchronization side effects, the system applies non-negotiable code boundaries.

| Component | Responsibility | Mutation Rights (STATE) |
| --- | --- | --- |
| `sessionController` | Authoritative state orchestration and lifecycle execution | **YES** |
| `renderEngine` | Pure UI template rendering, DOM mounting, and event-binding | NO |
| `timerManager` | Emits timing state pulses based on hardware-clock deltas | NO |
| `validator` | Structural and schema testing engine | NO |
| `questionManager` | Dataset parsing, deep cloning, and array randomization | NO |
| `eventBus` | Decoupled event emission and dispatching channel | NO |

> ### Authoritative State Mutation Rule
> 
> 
> Only the `sessionController` may directly mutate the centralized global `STATE` object. No other module or handler is permitted to perform inline adjustments, alter step state, or alter progression counters.

---

## Internal Application Layout

```text
index.html (Contains native HTML <template> views)
styles.css (App structural layouts and color-state indicators)
app.js
 ├── CONFIG
 ├── STATE
 ├── eventBus
 ├── fileHandler
 ├── validator
 ├── questionManager
 ├── timerManager
 ├── renderEngine
 ├── sessionController
 ├── summaryController
 └── reviewController

```

---

## State Machine

```text
  IDLE ──► FILE_LOADED ──► READY ──► IN_PROGRESS ──► QUESTION_FEEDBACK
                                           ▲                  │
                                           └──────────────────┤
                                                              ▼
                                       REVIEW_MODE ◄───── COMPLETED

```

---

## Event Bus Architecture

Communication across components is completely decoupled via a minimal synchronous Pub/Sub dispatcher interface. The Event Bus possesses no business logic and stores no state.

### Interface Implementation

```javascript
on(eventName, handler)
off(eventName, handler)
emit(eventName, payload)

```

### Supported System Events

```javascript
emit("TIMEOUT")
emit("ANSWER_SELECTED")
emit("NEXT_QUESTION")
emit("QUIZ_COMPLETED")
emit("RESTART_SESSION")
emit("FILE_REJECTED")

```

---

## Render Lifecycle Management

The `renderEngine` operates as a pure function. It reads data from an immutable state wrapper, clones the target template view, binds event listeners to the fresh fragment elements, and replaces the active view node.

```text
User Action ──► Event Emitted ──► sessionController Updates State ──► render(ReadOnlyState)
                                                                             │
  Fresh Listeners Bound ◄── New DOM Swapped ◄── Old DOM Cleaned ◄────────────┘

```

### Template-Based View Swapping

All layout definitions reside within native HTML `<template>` tags inside `index.html`.

* The `renderEngine` selects the appropriate screen template fragment via its ID (e.g., `#tpl-quiz`, `#tpl-summary`).
* The fragment is deep-cloned: `document.importNode(template.content, true)`.
* Content values are safely applied using `.textContent`.
* Event listeners bind directly to these newly generated elements before mounting them into the primary root viewport container, minimizing cross-render listener leaks.

---

# 5. Data & Configuration Architecture

## Application Configuration (`CONFIG`)

```javascript
const CONFIG = {
  MAX_QUESTIONS: 50,
  SEC_PER_QUESTION: 72,
  ALLOWED_CHOICES: ['a', 'b', 'c', 'd']
};

```

### Total Session Duration Formula

The aggregate time budget allocated for a quiz session is calculated dynamically at runtime using the following equation:

$$\text{Total Duration} = \min(\text{Questions Array Length}, 50) \times 72\text{ seconds}$$

---

## In-Memory State Model

```javascript
let STATE = {
  phase: "idle",                    // "idle" | "ready" | "in_progress" | "feedback" | "completed" | "review"
  allQuestions: [],                 // Complete structural backup
  selectedQuestions: [],            // Normalized collection (max 50)
  currentQuestionIndex: 0,
  pausedRemainingMs: 0,             // Tracking countdown remaining time during feedback steps
  endTimestamp: 0,                  // Absolute expiration millisecond mark
  timerInterval: null,
  startedAt: null,
  finishedAt: null
};

```

---

## Input Schema & Target Normalization

The input JSON format must conform to a flat array configuration containing a question string, four distinct answer options, and an explicit lowercase indicator mapping back to the correct source key.

### Input JSON Structure Example

```json
[
  {
    "question": "Which protocol operates client-side only?",
    "a": "HTTP",
    "b": "FTP",
    "c": "Local file protocol",
    "d": "SSH",
    "correct": "c"
  }
]

```

### Normalized Internal Runtime Structure

To prevent runtime lookup problems and evaluate values directly, `questionManager` maps input entries into the following normalized schema during selection. Instead of tracking choice letters, it resolves and binds the absolute correct answer value explicitly:

```javascript
{
  questionText: raw.question,
  choices: [raw.a, raw.b, raw.c, raw.d], // Randomized during initial session setup
  correctAnswerValue: raw[raw.correct],   // Hard value reference mapping
  selectedAnswerValue: null,             // User input tracking string
  isCorrect: false,
  originalShuffledOrder: []              // Preserved to ensure stable view rendering during Review Mode
}

```

---

# 6. File Handling & Question Ingestion

## Pipeline Order Execution

The `questionManager` enforces an explicit sequence of pipeline tasks when preparing the final active question pool:

$$\text{Parse Input} \longrightarrow \text{Shuffle Master Array} \longrightarrow \text{Slice Top } \min(50, N) \longrightarrow \text{Shuffle Individual Answers}$$

To guarantee that source modifications do not pollute the operational session parameters, reference arrays must be deep-copied via a reference-severing serialization clone:

```javascript
// Reference break during selection slice execution
const processingPool = JSON.parse(JSON.stringify(masterArray.slice(0, limit)));

```

---

## File Ingestion Guardrail

The file upload workflow wraps processing tasks inside an explicit `try/catch` architecture. This design cleanly isolates parsing anomalies from programmatic rule failures, routing error outcomes safely back to the interface through designated event channels.

```javascript
try {
  const rawData = JSON.parse(fileText);
  validateSchema(rawData); // Throws explicit Error if structural constraints are breached
  emit("FILE_VALIDATED", rawData);
} catch (e) {
  emit("FILE_REJECTED", { type: e instanceof SyntaxError ? "SYNTAX" : "SCHEMA" });
}

```

---

# 7. Timer & Lifecycle Architecture

## Timestamp-Delta Calculation Strategy

To bypass browser throttling quirks, tab suspending, and background thread lag, the countdown system does not rely on iterative sequential decrements (such as `remainingSeconds--`). Instead, it dynamically calculates remaining time by measuring the variance between the hardware clock and an absolute target expiration timestamp:

```javascript
const remainingMs = Math.max(0, STATE.endTimestamp - Date.now());
if (remainingMs === 0) {
  emit("TIMEOUT");
}

```

Using `Math.max(0, ...)` establishes a hard floor boundary, ensuring the user interface never displays negative time values if clock checks fall slightly out of sync.

---

## Pause, Resume, and Navigation Mechanics

To accommodate immediate feedback rendering rules while preserving accurate time budgets, the countdown execution model works as follows:

### 1. Answer Selection Loop

* The user selects an option.
* The system captures and locks the answer instantly.
* **Interval Halt:** The system immediately halts the active countdown interval using `clearInterval(STATE.timerInterval)`.
* **State Preservation:** The system computes and records the precise remaining time slice:
```javascript
STATE.pausedRemainingMs = STATE.endTimestamp - Date.now();

```


* The system shifts `STATE.phase` to `"feedback"` and issues an immutable `render(state)` command.

### 2. Next Question Transition

* The user clicks the "Next Question" button.
* **Timestamp Re-anchoring:** The system calculates a fresh expiration target using the preserved time slice:
```javascript
STATE.endTimestamp = Date.now() + STATE.pausedRemainingMs;

```


* The application increments `STATE.currentQuestionIndex`, updates `STATE.phase` to `"in_progress"`, re-arms the timing interval loop, and updates the display.

---

## Interval Cleanup Requirements

To prevent memory leaks, overlapping threads, and racing interface updates, active timer resources must be systematically cleared and nullified.

```javascript
if (STATE.timerInterval) {
  clearInterval(STATE.timerInterval);
  STATE.timerInterval = null;
}

```

This cleanup process must execute sequentially during the following lifecycle events:

* Global session timeouts (`TIMEOUT`)
* Step completion transitions (`QUIZ_COMPLETED`)
* Interactive application restarts (`RESTART_SESSION`)
* Uploading a new configuration file over an existing session

---

# 8. Rendering & Security Enforcement

## Immutable Render Pipeline Contracts

To enforce state security, the `renderEngine` accepts the primary application state reference strictly as an immutable parameter argument.

```javascript
// Render signature constraint enforcement
function render(frozenState) { /* Pure UI Construction Only */ }

```

Before passing state data to the layout generator, the orchestration layer freezes the object context, rendering it completely read-only to prevent unauthorized layout-level mutation side effects:

```javascript
render(Object.freeze({ ...STATE }));

```

---

## Security Restrictions

Because uploaded JSON configuration files represent untrusted user content, all string rendering routines must comply with strict XSS prevention measures.

### Permitted API Pattern

```javascript
targetDOMNode.textContent = value;

```

### Strictly Forbidden Operations

```javascript
// Any application of these injection mechanics will fail security code review:
element.innerHTML = value;
element.outerHTML = value;
element.insertAdjacentHTML(position, value);

```

All question content strings are rendered strictly as literal text. Script structures such as `<script>alert(1)</script>` will be safely rendered on-screen as text characters rather than being interpreted by the browser.

---

# 9. Architecture Decision Records (ADRs)

## ADR-005 — Template-Driven View Strategy

* **Context:** Emitting custom raw string segments or dynamically generating HTML components directly inside JS files breaks structural design separation and complicates listener cleanup.
* **Decision:** All structural layouts are declared inside standard HTML `<template>` blocks within `index.html`. The rendering engine clones these templates, populates fields via text assignments, and inserts them into the DOM.
* **Tradeoffs:**
* *Pros:* Clear division between display markup and app logic; simplified listener scoping; fast render execution.
* *Cons:* Requires manual management of DOM template nodes and attributes within native JS routines.



## ADR-006 — Intermittent Clock Pausing Strategy

* **Context:** The application requires immediate answer evaluation while using a shared global session timer. If the timer ticks continuously during the review stage, users encounter unequal pacing penalties while reading feedback screens.
* **Decision:** Freeze the countdown delta calculation immediately when an answer is selected. Recalculate and re-anchor the absolute expiration target timestamp (`endTimestamp`) only when the user clicks the "Next Question" button.
* **Tradeoffs:**
* *Pros:* Provides a fair, stress-free review experience on feedback screens; maintains precise time tracking.
* *Cons:* Requires managing intermediary state fields (`pausedRemainingMs`) across lifecycle steps.



---

# 10. Risks & Mitigations

| Identified Risk | Impact Level | Practical Mitigation Strategy |
| --- | --- | --- |
| **DOM State Drift** | Medium | Maintain a pure, top-down rendering flow. Wipe target viewport containers completely before inserting freshly cloned template fragments. |
| **Timer Lag in Background Tabs** | Medium | Abandon standard iterative loop decrements. Use hardware-based clock deltas (`Date.now()`) to accurately compute remaining time when tabs resume focus. |
| **Cross-Site Scripting (XSS)** | High | Enforce a strict ban on text injection methods like `innerHTML`. Use `.textContent` for all text assignments to ensure browser engines treat inputs as non-executable text literals. |

---

# 11. Final Engineering Directive

When implementing this application, developers must treat the following architectural priorities as mandatory:

1. **Immutable State Flow:** Ensure state mutations occur exclusively within the `sessionController`. Pass state data down as a read-only, frozen snapshot.
2. **Strict Time Tracking:** Rely entirely on hardware clock differences to update the timer, making sure to apply a strict floor boundary of zero.
3. **Template Isolation:** Utilize native HTML `<template>` tags for view swapping, and clear out older event subscriptions completely between screen transitions.
4. **XSS Protection:** Use text-only DOM injection methods exclusively to isolate and neutralize untrusted input strings.
