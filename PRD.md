# Product Requirements Document (PRD)

## 1. Product Summary

### Product Definition

The **Interactive Local Quiz Application** is a lightweight, fully client-side single-page application (SPA) designed to act as a localized, zero-overhead assessment tool. Running entirely within the web browser via static HTML5, CSS3, and Vanilla JavaScript, the application operates locally without external backend dependencies, user accounts, or persistent data stores.

### Core Value Proposition

Users can instantly execute highly randomized, timed quizzes by uploading a local JSON question file. The application provides instant, frictionless validation, zero configuration setup, zero data tracking, and immediate performance feedback in a highly secure, offline-first execution environment.

### Problem Statement

Traditional digital quiz and assessment platforms suffer from bloated technical overhead, requiring mandatory account creation, continuous internet connectivity, and external database tracking. This compromises user privacy, limits usage in network-restricted environments, and introduces server-side maintenance costs. Furthermore, many lightweight offline tools allow cheating via browser tab-switching or suffer from inaccurate timers due to browser thread throttling in background tabs.

### Target Users

* **Self-Directed Learners / Students:** Individuals seeking a high-focus, private tool to test their knowledge using custom or shared question sets without data tracking.
* **Educators / Trainers:** Professionals needing a simple, localized utility to deploy instant, distraction-free digital quizzes in classrooms or offline labs directly from local files.

---

## 2. Goals & Non-Goals

### Goals

* **Zero-Dependency Portability:** The application must run seamlessly from a single index file structure across modern desktop and mobile browsers without requiring an internet connection or compilation steps.


* **Frictionless Assessment:** Deliver a zero-click setup experience where a user goes from file upload to active testing with absolute structural validation guarantees.


* **Hardened Session Security:** Prevent client-side scripting cross-site attacks (XSS) from untrusted JSON inputs while preserving accurate quiz timing metrics across background tab suspensions.



### Non-Goals

* **Multiplayer / Remote Syncing:** No inclusion of peer-to-peer syncing, server-side leaderboards, or remote instructor reporting interfaces.


* **Native Device Features:** No native integrations (e.g., local file system write access, hardware biometric locks, push notifications).
* **In-App Content Creation:** No UI features for editing, creating, or saving JSON question files within the app; files must be authored externally.


* **Universal Accessibility (A11y) Scope:** Comprehensive screen-reader optimization and advanced dynamic keyboard navigation maps are explicitly out of scope for this version.



---

## 3. Personas

+-----------------------------------------------------------------------+
|                       PERSONA 1: SELF-STUDYING ADULT                  |
+-----------------------------------------------------------------------+
| Profile    | 24-year-old certification candidate balancing study maps|
|            | on public transit and restricted corporate networks.    |
+------------+----------------------------------------------------------+
| Behaviors  | Utilizes high-density, custom-generated JSON files based |
|            | on study manuals; switches tabs frequently to verify info|
+------------+----------------------------------------------------------+
| Motivation | Fast execution, accurate time budgets, and zero tracking.|
+------------+----------------------------------------------------------+
| Pain Points| Complex cloud tools that log out or drop timer state when|
|            | mobile signal drops in transit tunnels.                  |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
|                      PERSONA 2: OFFLINE SYSTEM INSTRUCTOR             |
+-----------------------------------------------------------------------+
| Profile    | Technical trainer running sandbox workshops inside       |
|            | air-gapped laboratory environments.                      |
+------------+----------------------------------------------------------+
| Behaviors  | Distributes standard JSON question files via USB drives  |
|            | to a classroom of diverse user hardware devices.         |
+------------+----------------------------------------------------------+
| Motivation | Uniform UI rendering, predictable local parsing errors,  |
|            | and absolute assurance no external scripts can execute. |
+------------+----------------------------------------------------------+
| Pain Points| UI breakage across different browser engines and complex |
|            | localized network routing configurations.                |
+-----------------------------------------------------------------------+

```

---

## 4. User Problems & Jobs-To-Be-Done

### User Problems

* **Timer Manipulation Risks:** Users lose trust in assessment validity when backgrounding a browser tab freezes or artificially extends the allocated test duration.
* **Brittle Upload Handling:** Uploading a structurally flawed quiz configuration often causes silent UI crashes, leaving the user stuck on an unresponsive screen.
* **Review Frustration:** Standard local tools clear previous inputs upon completion, preventing users from reviewing their exact mistakes in context.

### Jobs-To-Be-Done (JTBD)

* **Core Assessment Job:** When I am preparing for a high-stakes examination, I want to execute a strictly timed simulation of custom question sets offline, so that I can accurately gauge my knowledge without server-side latency or tracking.
* **Error Identification Job:** When I complete a highly randomized quiz session, I want to review only my incorrect answers exactly as they were laid out during the test, so that I can analyze my logical errors without resetting my state.

---

## 5. Core User Flows

### 5.1 Identity Selection

* **Entry Point:** Application landing root (`IDLE` state).


* **Flow Steps:**
1. User lands on the single-screen view containing a file drop area.


2. Since the app operates under a single-user, fully ephemeral anonymous model, **no profile selection or login steps exist**.




* **Decision Points:** None.
* **Edge Cases:** Non-applicable due to the stateless single-user model.



### 5.2 Creating a Quiz Session (File Loading)

* **Entry Point:** `IDLE` state file landing drop area.


* **Flow Steps:**
1. User drags and drops a local JSON file or triggers the native system file picker.


2. System intercepts the file event and feeds it via synchronous `FileReader` to the validation pipeline.


3. On successful structure approval, the UI transitions from `IDLE` to `READY` state, displaying total question counts and calculated global available session time.




* **Decision Points:** If validation succeeds $\rightarrow$ move to `READY`. If validation fails $\rightarrow$ present error indicator banner and remain on `IDLE`.


* **Edge Cases:** Empty files or non-JSON payloads trigger an immediate, generic error banner without system detail exposure.



### 5.3 Commencing a Quiz & Answering

* **Entry Point:** `READY` state view screen.
* **Flow Steps:**
1. User clicks the "Start Quiz" button. State transitions to `IN_PROGRESS`.


2. Global timer is established via absolute hardware-clock timestamp delta anchor.


3. Active Question 1 displays randomized choices.


4. User selects a single choice directly via a pointer tap.


5. UI instantly locks input selections and freezes the hardware clock delta evaluation loop.




* **Decision Points:** Selection immediately shifts state to `QUESTION_FEEDBACK`.



```
[READY STATE]
      │
      ▼ (Click "Start Quiz")
[IN_PROGRESS] ──► (Hardware Clock Delta Active)
      │
      ▼ (User Choice Selection Click)
[QUESTION_FEEDBACK] ──► (Timer Interval Cleared / Remaining MS Saved)

```

### 5.4 Taking Over / Progressing a Quiz

* **Entry Point:** `QUESTION_FEEDBACK` view state.


* **Flow Steps:**
1. The screen displays absolute correctness status inline (Green/Red highlights).


2. The "Next Question" action element becomes visible at the bottom of the content container.


3. User clicks "Next Question".


4. System increments active index, recalculates the expiration timestamp anchor using the preserved time slice, re-arms the timing loop, and shifts back to `IN_PROGRESS`.




* **Decision Points:** If `currentQuestionIndex` equals total allocated slice $\rightarrow$ transition instantly to `COMPLETED`.



### 5.5 Review Mode Execution

* **Entry Point:** `COMPLETED` Summary Dashboard Screen.


* **Flow Steps:**
1. User clicks "Review Mode" action button.


2. UI swaps viewport context to the `REVIEW_MODE` screen layout.


3. The system renders only incorrect answers while strictly preserving the shuffled answer sequence, chosen option indicator, and correctness highlights from the live session.


4. User navigates through items linearly via "Previous" and "Next" sub-actions.


* **Decision Points:** User clicks "Exit Review" to return back to the main Summary Dashboard view.

### 5.6 Archiving & State Purging

* **Entry Point:** Summary Dashboard Screen or Review Screen.


* **Flow Steps:**
1. User clicks the "Restart Session" button.


2. System halts active interval tracks, completely clears the localized in-memory `STATE` parameters, and wipes container nodes.


3. Application drops back to the initial `IDLE` file upload screen layout.




* **Decision Points:** Hard browser reload achieves an identical state-purging effect.



---

## 6. Functional Requirements

### 6.1 Ingestion & Parsing Module (FR-ING-01)

* **Description:** The application must consume a single local JSON file uploaded by the user via file input elements or drag-and-drop actions, applying synchronous parsing and schema verification workflows.


* **Acceptance Criteria:**
* Must accept `.json` files via system file picker drop targets.


* Must utilize `FileReader` to parse data completely client-side with zero network tracking.


* On processing failure (JSON syntax or schema mismatch), must throw a localized exception and display the precise red error banner: `Oops — invalid file 😅`.




* **Edge Cases:** If a user uploads a valid JSON payload containing an empty array `[]`, the system must treat it as a schema validation failure and display the error banner.



### 6.2 Target Structural Normalization (FR-NORM-01)

* **Description:** Validated inputs must undergo serialization copying and array transformations to isolate operational execution context from the source payload.


* **Acceptance Criteria:**
* Break all array link bindings to the source upload using explicit serialization deep copying: `JSON.parse(JSON.stringify(master))`.


* Transform alphabetical answer keys (`"a"`, `"b"`, `"c"`, `"d"`) into an evaluation-safe runtime configuration layout tracking direct string values.


* The collection slice limit must be capped at $\min(N, 50)$ elements, where $N$ represents total parsed items.




* **Edge Cases:** If the input document contains less than 50 questions, the system must utilize all available questions ($N$) and adjust the runtime session duration accordingly.



### 6.3 Randomized Presentation Engine (FR-RND-01)

* **Description:** Provide dual-layer shuffling mechanisms covering question distribution sequences and option presentation arrays within a given session.


* **Acceptance Criteria:**
* Shuffle the root question collection prior to slicing the top operational data pool.


* Independently shuffle the selection options order array per question element during initial generation.


* Capture and preserve original shuffled visual orders inside `originalShuffledOrder` configurations to prevent layout shift during subsequent Review Modes.





### 6.4 Delta Timer & Intermittent Pause Engine (FR-TMR-01)

* **Description:** Establish robust session countdown behavior using hardware clock delta comparisons that pause during review steps to prevent background tab lag.


* **Acceptance Criteria:**
* Calculate global quiz time dynamically: $\text{Total Time} = \min(N, 50) \times 72 \text{ seconds}$.


* Derive countdown progress by subtracting current hardware clock values (`Date.now()`) from the calculated target timestamp anchor (`STATE.endTimestamp`).


* When an answer is clicked, halt the countdown interval tracking and store the remaining time slice explicitly within `STATE.pausedRemainingMs`.


* When navigating to the next question, re-anchor `STATE.endTimestamp` using the stored time slice: `Date.now() + STATE.pausedRemainingMs`.




* **Edge Cases:** If a user backgrounds the tab for longer than the remaining time slice while a question is active, the next clock delta evaluation loop execution must register a zero value floor, trigger `TIMEOUT`, and route directly to the completion phase.



### 6.5 Interactive Evaluation Loop (FR-EVL-01)

* **Description:** Intercept answer inputs and apply immediate visual evaluation treatments across option groups without intermediate confirmation modals.


* **Acceptance Criteria:**
* Lock all alternative choices against user input changes immediately after the first choice selection click.


* Apply color styling immediately to reflect correctness states across the active layout components.


* Render the "Next Question" navigation control element only after selection evaluation finishes or a `TIMEOUT` occurs.





### 6.6 Performance Summary Dashboard (FR-SUM-01)

* **Description:** Present core operational summary metrics upon concluding active sessions.


* **Acceptance Criteria:**
* Display final aggregate score as an integer percentage calculation.


* Display total correct count metrics against total questions evaluated.


* Display absolute session elapsed duration formatted clearly in minutes and seconds.





---

## 7. UX & Interaction Requirements

### 7.1 Feedback State Color Tokens

| Visual Component State | CSS Token / CSS Variable Rule | Behavioral Description / UX Application |
| --- | --- | --- |
| **Correct Option Highlight** | `--color-success: #2e7d32;` (Green) | Applied to the correct answer choice block immediately upon selection or timeout.

 |
| **Incorrect Option Selection** | `--color-error: #c62828;` (Red) | Applied explicitly to the clicked choice block if the user selects an incorrect answer.

 |
| **Neutral Faded Items** | `--color-faded: #9e9e9e;` (Gray) | Applied to all remaining unselected or incorrect answer choices to focus attention.

 |
| **Error Banner Accent** | `--color-alert: #d32f2f;` (Bright Red) | Used for global container borders and file ingestion error message text.

 |

### 7.2 UI State Transitions & Content Swapping

* **Pure Container Flushing:** Prior to mounting a new view fragment, the `renderEngine` must clear the primary viewport layout block entirely (`root.textContent = ""`) to prevent layout duplication or leftover DOM node issues.


* **Template Cloning:** Build views exclusively by deep cloning native markup template nodes found within the root document structure: `document.importNode(template.content, true)`.


* **Element Level Event Association:** Bind event handlers directly to elements within the cloned template fragment before inserting it into the live DOM tree.



### 7.3 Progressive Navigation Control Visibility

* **Initial State:** The navigation action element (`#btn-next-question`) must be hidden during standard `IN_PROGRESS` question presentation states.


* **Revealed State:** Smoothly display the button element within the viewport only after the user selects a choice or the global countdown triggers a timeout.



---

## 8. Data & System Constraints

### Always-Offline Execution Environment

The application must execute completely detached from remote network services. It cannot use content delivery networks (CDNs), external fonts, or API telemetry integrations. All application logic, styles, and markup must load from the local source bundle.

### Transient Ephemeral Data Lifecycle

The application state resides strictly within active client memory buffers. Performing a manual browser window reload, navigating away from the page, or clicking the "Restart Session" action will permanently erase all active quiz state data and history.

### Strict Input Structural Schema Definitions

Input JSON documents must match the explicit schema constraints below. Variations in object formatting will cause the parsing engine to reject the file immediately.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["question", "a", "b", "c", "d", "correct"],
    "additionalProperties": false,
    "properties": {
      "question": { "type": "string", "minLength": 1 },
      "a": { "type": "string", "minLength": 1 },
      "b": { "type": "string", "minLength": 1 },
      "c": { "type": "string", "minLength": 1 },
      "d": { "type": "string", "minLength": 1 },
      "correct": { "type": "string", "enum": ["a", "b", "c", "d"] }
    }
  }
}

```

---

## 9. Success Metrics

| Metric Category | Target Key Performance Indicator (KPI) | Measurement Approach / Methodology |
| --- | --- | --- |
| **Ingestion Resilience** | 100% Client-Side Validation Rate | Track zero runtime browser console errors across manual stress testing using malformed JSON payloads. |
| **Timing Integrity** | Zero Background Drift Variance | Verify that remaining quiz duration matches actual elapsed wall-clock time after backgrounding tabs for 5+ minutes. |
| **XSS Vulnerability Isolation** | Zero Executed Payload Injections | Confirm that test strings containing `<script>` tags are rendered strictly as plain text characters across the viewport.

 |

---

## 10. Edge Cases & Failure Scenarios

### 10.1 Global Countdown Expiration During Active Session

* **Scenario:** The absolute target timestamp expires (`remainingMs === 0`) while a user is actively reading an unanswered question screen.


* **System Action:** The system intercepts the timeout event via the delta verification track, automatically saves the active item as incorrect (`isCorrect = false`), stops the countdown interval, and forces a direct state transition to the `COMPLETED` phase.



### 10.2 Conflict Resolution via Monolithic Mutation Restrictions

* **Scenario:** Racing microtask loops or multiple rapid click inputs attempt to modify the active question index during transition steps.
* **System Action:** Enforce the **Authoritative State Mutation Rule**. Only the centralized `sessionController` is permitted to update global variables. The `renderEngine` receives state data as a frozen, read-only snapshot via `Object.freeze()`, preventing accidental double-click errors or UI state desyncs.



### 10.3 Input Malformation Handling

* **Scenario:** An uploaded JSON payload contains empty text strings `""` for questions or answers, or features invalid value flags within the `correct` answer parameter field.


* **System Action:** The schema validation layer catches the format violation during ingestion, throws an exception, halts further processing, and displays the standard error banner: `Oops — invalid file 😅`.



---

## 11. Open Questions & Assumptions

* **Assumption on File Volume Capabilities:** It is assumed that modern mobile client browsers can efficiently handle deep-copy serialization cloning on large JSON array structures (e.g., up to 1,000 question entries) without UI stuttering.


* **Open Question on Character Layout Containment:** How should the UI respond when rendering unusually long question blocks or highly detailed code snippets? *Product Recommendation:* Apply CSS word-break rules (`word-break: break-word;`) and containment scrolling to prevent long content from breaking mobile viewport layouts.
* **Open Question on Handling Modified Clock Settings:** What happens if a user manually changes their operating system clock time midway through an active quiz session? *Product Recommendation:* Accept this edge case constraint for MVP v1, given the application's offline-first, single-user deployment profile.



---

## 12. Future Considerations

* **Sub-Section Navigation Maps:** Introduce a structured navigation sidebar for the Review Mode layout, allowing users to jump directly to specific missed questions rather than clicking through them linearly.
* **Dynamic Client-Side File Export:** Allow users to export their customized review session results as a local markdown summary or automated performance report.
* **Adaptive Local Spaced Repetition:** Enable optional, browser-only storage tracking (via `localStorage`) to save missed questions across sessions for targeted review, while keeping data entirely private and local.

---

## 🛠️ Post-Generation Critical Review

### Missing Requirements Identified

1. **Strict Character Encoding Standards:** The HLD does not specify a preferred text encoding format. If a user uploads a file using UTF-16 or an older format, text characters could render incorrectly. *Fix applied in PRD:* Mandate standard UTF-8 parsing rules for the `FileReader` integration workflow.
2. **Explicit Focus States for Non-Mouse Pointers:** The design does not define how interactive elements should change state when touched on mobile viewports. *Fix applied in PRD:* Added mobile interaction descriptions to section 7.1.

### Ambiguities Addressed

1. **Tracking Total Elapsed Session Duration:** The HLD mentions tracking total elapsed time on the summary dashboard but does not specify how to calculate it if the clock pauses during review steps. *Resolution:* The PRD defines the total elapsed time as the original maximum duration minus the final remaining time snapshot.


2. **Review Mode Scope Limits:** The HLD states that users can review incorrect answers but does not specify if correct answers are completely hidden or simply skipped. *Resolution:* The PRD clarifies that only incorrect answers are displayed in Review Mode to optimize the post-quiz review flow.



### Potential Implementation Risks

1. **Garbage Collection and Memory Performance:** Running deep serialization copies (`JSON.parse(JSON.stringify())`) on large question arrays (e.g., 1,000 questions) may cause brief UI freezes or memory overhead on low-end mobile devices. Developers should profile memory use during the early phases of development.


2. **Event Subscription Leaks:** Because the application relies on dynamic view swapping via a custom event bus, old event listeners must be completely cleaned up during transitions to prevent memory leaks or multiple event triggers. Developers must use clean event removal patterns (`off()`) during all screen swaps.
