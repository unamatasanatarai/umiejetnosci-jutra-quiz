# Feature Request: Localization & Internationalization Framework

## Summary

Introduce a mandatory localization framework for all user-facing text within the application.

All visible strings must be externalized into language resource files and loaded through a centralized localization mechanism.

The application must never render hardcoded user-facing text directly from HTML templates, JavaScript modules, or configuration objects.

Even when only a single language is supported, all text must still flow through the localization system to ensure future language expansion without architectural refactoring.

---

# Problem

The current architecture assumes a single language experience and contains user-facing text that may be embedded directly within templates, controls, messages, and labels.

This creates several long-term risks:

* difficult future language expansion
* inconsistent terminology
* duplicated text management
* inability to perform localization review
* inability to support regional deployments

Adding localization later would require significant template and rendering changes.

A localization framework should be introduced before additional features increase the amount of UI text.

---

# Goals

## Primary Goals

* Externalize all user-facing text.
* Support multiple languages through configuration only.
* Eliminate hardcoded UI strings.
* Ensure all text rendering flows through a centralized localization service.
* Maintain full offline capability.

## Secondary Goals

* Enable future translation efforts without code changes.
* Support language-specific formatting rules.
* Support regional variants in future releases.
* Maintain compatibility with existing rendering architecture.

---

# User Stories

### Language Selection

As a user,

I want the application to load a language pack,

so that the interface appears in my preferred language.

### Future Translation Support

As a product owner,

I want all text externalized,

so that translators can modify language resources without touching application logic.

### Consistency

As a developer,

I want all UI labels to originate from a centralized localization source,

so that terminology remains consistent across screens.

---

# Functional Requirements

## FR-001: Mandatory Localization Pipeline

All user-visible text must be retrieved through the localization service.

This includes:

* screen titles
* buttons
* labels
* status messages
* validation messages
* review screens
* summary screens
* timer labels
* progress indicators
* empty states
* upload instructions
* error banners

### Acceptance Criteria

* No user-facing strings exist inside rendering logic.
* No user-facing strings exist inside HTML templates.
* Localization service provides all displayed text.
* Application functions correctly with one or more language packs.

---

## FR-002: Single Language Still Uses Localization

The localization framework is mandatory even if only one language is shipped.

Example:

Current:

```javascript
button.textContent = "Start Quiz";
```

Required:

```javascript
button.textContent = i18n.t("quiz.start");
```

### Acceptance Criteria

* English-only deployments still load localization resources.
* No direct text assignments bypass localization.

---

## FR-003: Language Resource Loading

Language resources shall be loaded from static JSON files.

Example:

```text
/locales
 ├── en.json
 ├── pl.json
 ├── de.json
```

### Acceptance Criteria

* Resource files load successfully from static hosting.
* No backend services required.
* Application remains fully offline capable.

---

## FR-004: Language Selection

Application configuration shall define the active language.

Example:

```javascript
const CONFIG = {
  DEFAULT_LANGUAGE: "en"
};
```

Future implementations may support:

* language selector UI
* browser language detection
* URL language parameters

These are out of scope for this feature.

### Acceptance Criteria

* Application loads configured language.
* Missing configuration falls back to default language.

---

## FR-005: Missing Translation Fallback

If a translation key is unavailable in the active language:

1. Attempt fallback language lookup.
2. If unavailable:

   * return key name
   * log warning to console

Example:

```javascript
i18n.t("summary.score")
```

Fallback output:

```text
summary.score
```

### Acceptance Criteria

* Missing translations never crash rendering.
* Missing keys are detectable during testing.

---

## FR-006: Parameterized Text Support

Localization entries must support dynamic placeholders.

Example:

Language file:

```json
{
  "summary.correct": "Correct Answers: {count}"
}
```

Usage:

```javascript
i18n.t("summary.correct", {
  count: 37
});
```

Rendered:

```text
Correct Answers: 37
```

### Acceptance Criteria

* Multiple parameters supported.
* Missing parameters do not crash rendering.

---

## FR-007: Review and Summary Support

All review and summary screen text must originate from localization resources.

Examples:

* Score
* Correct Answers
* Time Elapsed
* Restart Quiz
* Review Incorrect Answers
* Previous
* Next
* Exit Review

### Acceptance Criteria

* Entire review workflow supports language switching.
* No review-specific hardcoded strings remain.

---

## FR-008: Error Message Localization

All error states must be localized.

Example:

Current:

```text
Oops — invalid file 😅
```

Required:

```javascript
i18n.t("errors.invalidFile")
```

### Acceptance Criteria

* All user-facing errors originate from language resources.
* Internal error details remain hidden.

---

# Localization Architecture

## New Module

```text
app.js
 ├── CONFIG
 ├── STATE
 ├── eventBus
 ├── i18n
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

## i18n Module Responsibilities

The localization module shall:

* load language resources
* resolve translation keys
* apply fallback behavior
* perform placeholder replacement
* expose translation APIs

Example:

```javascript
i18n.load("en");
i18n.t("quiz.start");
```

---

# Localization File Format

## Mandatory Structure

All languages must use identical key structures.

Example:

### en.json

```json
{
  "quiz": {
    "start": "Start Quiz",
    "next": "Next Question",
    "finish": "Finish Quiz"
  },

  "summary": {
    "title": "Quiz Results",
    "score": "Score",
    "correctAnswers": "Correct Answers",
    "timeElapsed": "Time Elapsed",
    "restart": "Restart Quiz",
    "review": "Review Incorrect Answers"
  },

  "errors": {
    "invalidFile": "Oops — invalid file 😅"
  }
}
```

### pl.json

```json
{
  "quiz": {
    "start": "Rozpocznij Quiz",
    "next": "Następne Pytanie",
    "finish": "Zakończ Quiz"
  },

  "summary": {
    "title": "Wyniki Quizu",
    "score": "Wynik",
    "correctAnswers": "Poprawne Odpowiedzi",
    "timeElapsed": "Czas Trwania",
    "restart": "Uruchom Ponownie",
    "review": "Przejrzyj Błędne Odpowiedzi"
  },

  "errors": {
    "invalidFile": "Ups — nieprawidłowy plik 😅"
  }
}
```

---

# Localization Key Standards

## Required Rules

Keys must:

* use lowercase
* use dot notation
* remain stable across releases
* never contain translated text

Valid:

```text
quiz.start
quiz.finish
summary.score
errors.invalidFile
```

Invalid:

```text
StartQuiz
START_BUTTON
Start Quiz
```

---

# Rendering Requirements

## Template Restrictions

Templates must not contain visible hardcoded text.

Forbidden:

```html
<button>Start Quiz</button>
```

Required:

```html
<button data-i18n="quiz.start"></button>
```

Or:

```html
<button></button>
```

with runtime assignment:

```javascript
button.textContent = i18n.t("quiz.start");
```

### Acceptance Criteria

* Templates remain language-neutral.
* Language switching requires no template modification.

---

# Non-Functional Requirements

## Performance

* Translation lookup must be O(1).
* Language resources loaded once per session.
* No noticeable rendering delay.

---

## Offline Support

* Localization files must be bundled locally.
* No external translation services.
* No runtime network requests after initial load.

---

## Maintainability

* Adding a new language requires only a new language file.
* Existing application code remains unchanged.

---

## Security

Localization values remain subject to existing security requirements.

Permitted:

```javascript
element.textContent = i18n.t(key);
```

Forbidden:

```javascript
element.innerHTML = i18n.t(key);
```

Localization content must never bypass XSS protections defined in the HLD.

---

# Edge Cases

## Missing Language File

If requested language cannot be loaded:

1. Attempt fallback language.
2. If fallback unavailable:

   * prevent application initialization
   * display localized startup error if possible

---

## Missing Translation Key

Application continues functioning.

Fallback sequence:

```text
Active Language
    ↓
Fallback Language
    ↓
Translation Key
```

---

## Parameter Mismatch

If placeholder values are missing:

Example:

```json
{
  "summary.correct": "Correct Answers: {count}"
}
```

Output:

```text
Correct Answers: {count}
```

Application must not crash.

---

# Implementation Notes

Suggested API:

```javascript
const i18n = {
  load(languageCode),
  t(key, params = {})
};
```

Example:

```javascript
i18n.t("summary.correctAnswers");

i18n.t("summary.correct", {
  count: 15
});
```

---

# Acceptance Checklist

* [ ] All user-facing text externalized.
* [ ] No hardcoded UI strings remain.
* [ ] Localization mandatory even for single-language deployments.
* [ ] Language resources stored in JSON files.
* [ ] Translation lookup uses centralized service.
* [ ] Missing keys use fallback mechanism.
* [ ] Missing language files use fallback language.
* [ ] Placeholder replacement supported.
* [ ] Review mode fully localized.
* [ ] Summary screen fully localized.
* [ ] Error messages fully localized.
* [ ] Templates remain language-neutral.
* [ ] Offline operation preserved.
* [ ] Existing XSS protections preserved.
* [ ] Adding a new language requires only a new localization file.
