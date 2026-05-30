# Feature Request: Keyboard Navigation & Shortcut Visibility

## Summary

Add comprehensive keyboard support throughout the quiz experience to improve accessibility, speed, and usability for power users and students taking exams.

Keyboard shortcuts should be discoverable directly in the UI through subtle, visually consistent shortcut indicators displayed on the relevant controls.

Additionally, update the final quiz navigation behavior so that the last question presents a "Finish Quiz" action instead of "Next Question".

---

# Problem

Currently the quiz is primarily mouse-driven.

Students taking multiple quizzes benefit from keyboard navigation because it:

* reduces interaction time
* improves accessibility
* mirrors desktop exam software
* enables uninterrupted focus
* supports power-user workflows

The application currently provides no visible shortcut guidance, making keyboard functionality undiscoverable.

---

# Goals

## Primary Goals

* Enable complete quiz navigation using the keyboard.
* Make all supported shortcuts visible within the UI.
* Improve accessibility and efficiency.
* Reduce mouse dependency.

## Secondary Goals

* Introduce Vim-style navigation (`h` / `l`) during review mode.
* Maintain a clean, modern interface.
* Ensure shortcut hints do not distract from quiz content.

---

# User Stories

### Answer Questions

As a student,

I want to answer questions using keyboard shortcuts,

so that I can move through quizzes faster.

### Navigate Questions

As a student,

I want to advance through the quiz using Enter,

so that I do not need to move my hand to the mouse.

### Review Results

As a student,

I want keyboard controls while reviewing answers,

so that I can quickly inspect mistakes.

### Discoverability

As a student,

I want to see available shortcuts directly on controls,

so that I can learn them naturally without reading documentation.

---

# Functional Requirements

## FR-001: Start Quiz Shortcut

When the quiz start screen is visible:

| Key   | Action     |
| ----- | ---------- |
| Enter | Start Quiz |

### Acceptance Criteria

* Pressing Enter triggers the same action as clicking "Start Quiz".
* Shortcut indicator is visible on the Start Quiz button.

---

## FR-002: Answer Selection Shortcuts

While a quiz question is active:

| Answer | Keys   |
| ------ | ------ |
| A      | 1 or A |
| B      | 2 or B |
| C      | 3 or C |
| D      | 4 or D |

### Acceptance Criteria

* Either key variant selects the answer.
* Selection updates immediately.
* Existing mouse behavior remains unchanged.
* Active answer state updates visually.

---

## FR-003: Next Question Shortcut

While answering questions:

| Key   | Action        |
| ----- | ------------- |
| Enter | Next Question |

### Acceptance Criteria

* Enter advances only when the current state allows progression.
* Behavior matches clicking the primary navigation button.
* No duplicate submissions occur.

---

## FR-004: Finish Quiz Label

When viewing the final question:

Current:

```text
Next Question
```

Replace with:

```text
Finish Quiz
```

### Acceptance Criteria

* Label changes only on the final question.
* Clicking button completes quiz.
* Enter key performs the same finish action.

---

## FR-005: Review Navigation Shortcuts

While in review mode:

| Action            | Keys             |
| ----------------- | ---------------- |
| Previous Question | Left Arrow or H  |
| Next Question     | Right Arrow or L |
| Exit Review       | Esc              |

### Acceptance Criteria

* Navigation updates immediately.
* Navigation respects first/last question boundaries.
* Exit Review returns to previous screen.

---

## FR-006: Cancel Shortcut

For any modal, dialog, overlay, or cancellable action:

| Key | Action |
| --- | ------ |
| Esc | Cancel |

### Acceptance Criteria

* Esc closes active dialogs.
* Esc cancels pending interactions.
* Esc has no destructive side effects.

---

# Shortcut Visibility Requirements

## FR-007: Shortcut Indicators

All keyboard shortcuts must be visible directly on related UI controls.

Examples:

### Start Quiz Button

```text
Start Quiz    ⏎
```

### Next Question Button

```text
Next Question    ⏎
```

### Finish Quiz Button

```text
Finish Quiz    ⏎
```

### Answer Options

```text
A. Option Text    [1/A]
B. Option Text    [2/B]
C. Option Text    [3/C]
D. Option Text    [4/D]
```

---

## Visual Design Requirements

Shortcut indicators should:

* appear subtle
* have reduced opacity
* not compete with primary content
* be consistently positioned
* adapt to light/dark mode

Recommended styling:

* opacity: 0.5–0.7
* smaller font size
* muted color
* rounded pill badge or minimal icon treatment

---

## SVG Icon Support

Where appropriate, shortcut hints may use lightweight SVG icons.

Examples:

| Shortcut    | Visual    |
| ----------- | --------- |
| Enter       | ⏎ icon    |
| Esc         | Esc badge |
| Arrow Left  | ← icon    |
| Arrow Right | → icon    |

Requirements:

* SVG must be inline.
* Theme-aware coloring.
* No external assets.

---

# Non-Functional Requirements

## Accessibility

* Keyboard shortcuts must not interfere with screen readers.
* Focus management must remain intact.
* All controls remain operable via Tab navigation.

## Performance

* Single global keyboard listener preferred.
* No noticeable input lag.

## Compatibility

Must work in:

* Chrome
* Firefox
* Safari
* Edge

---

# Edge Cases

### Text Inputs

Keyboard shortcuts must not trigger while:

* typing in text fields
* typing in search fields
* editing textareas

### Modals

If a modal is open:

* modal shortcuts take priority
* background shortcuts are disabled

### Review Boundaries

At first review item:

* Previous action does nothing.

At last review item:

* Next action does nothing.

---

# Implementation Notes

Suggested key map:

```javascript
{
  startQuiz: ["Enter"],

  answerA: ["1", "a"],
  answerB: ["2", "b"],
  answerC: ["3", "c"],
  answerD: ["4", "d"],

  nextQuestion: ["Enter"],

  reviewPrevious: ["ArrowLeft", "h"],
  reviewNext: ["ArrowRight", "l"],

  cancel: ["Escape"],
  exitReview: ["Escape"]
}
```

---

# Acceptance Checklist

* [ ] Enter starts quiz.
* [ ] 1/A selects answer A.
* [ ] 2/B selects answer B.
* [ ] 3/C selects answer C.
* [ ] 4/D selects answer D.
* [ ] Enter advances question.
* [ ] Last question button reads "Finish Quiz".
* [ ] Enter finishes quiz on final question.
* [ ] Left Arrow navigates review backward.
* [ ] H navigates review backward.
* [ ] Right Arrow navigates review forward.
* [ ] L navigates review forward.
* [ ] Esc exits review.
* [ ] Esc cancels dialogs/actions.
* [ ] Shortcut hints visible on all related controls.
* [ ] Hints support dark mode.
* [ ] Hints support light mode.
* [ ] Shortcuts disabled while typing in inputs.
* [ ] Existing mouse interactions continue to work.
