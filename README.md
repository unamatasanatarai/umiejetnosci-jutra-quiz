# Quizzer — Umiejętności Jutra

**Chcesz błyskawicznie i bezstresowo sprawdzić swoją wiedzę z Umiejętności Jutra 3.0?**

## 🚀 WYPRÓBUJ APLIKACJĘ ONLINE

### Nie czekaj i sprawdź swoje umiejętności już teraz! Kliknij w poniższy link, aby uruchomić wbudowany test bezpośrednio w przeglądarce:

### 👉 [URUCHOM INTERAKTYWNY QUIZ ONLINE](https://unamatasanatarai.github.io/umiejetnosci-jutra-quiz/)

---

**Quizzer — Umiejętności Jutra** to nowoczesna, responsywna aplikacja webowa stworzona z myślą o dynamicznej i skutecznej powtórce materiału. Zapomnij o skomplikowanej konfiguracji, zakładaniu kont czy przekazywaniu swoich danych. Narzędzie działa w 100% po stronie klienta (offline-first), oferując natychmiastową weryfikację odpowiedzi, pełną prywatność oraz zaawansowany tryb analizy błędów. Niezależnie od tego, czy przygotowujesz się do ważnego egzaminu, czy chcesz zweryfikować swoje cyfrowe kompetencje — Quizzer da Ci jasną odpowiedź, gdzie aktualnie się znajdujesz.

---

## Funkcje

* **Automatyczne preloading:** Próbuje natychmiast pobrać domyślny plik `quiz.json` zaraz po zainicjowaniu aplikacji.
* **Kompaktowa strefa zrzutu:** Obsługuje alternatywne ładowanie pytań metodą „przeciągnij i upuść” lub poprzez tradycyjne okno wyboru pliku w celu dynamicznego przetwarzania danych JSON.
* **Zdecentralizowany silnik i18n:** Posiada odizolowany moduł lokalizacji umożliwiający płynne przełączanie kontekstu językowego pomiędzy polskim (`pl`) a angielskim (`en`) w czasie rzeczywistym.
* **Precyzyjne śledzenie czasu:** Wykorzystuje różnicowy model obliczania czasu (`Date.now()`), co gwarantuje dokładne odliczanie i rejestrowanie czasu trwania testu nawet przy zmianie kart w przeglądarce.
* **Dynamiczne zarządzanie widokami:** Stosuje odsprzężoną szynę zdarzeń (Publish/Subscribe Event Bus), która czyści przestrzeń DOM i klonuje natywne szablony HTML5, eliminując ryzyko błędów stanów interfejsu.
* **Normalizacja zestawu pytań:** Automatycznie miesza kolejność pytań oraz dostępnych odpowiedzi, losując unikalny zestaw ograniczony do maksymalnie 50 pytań na sesję.
* **Przejrzysty tryb przeglądu:** Generuje natychmiastowe podsumowania statystyczne oraz uruchamia dedykowany Tryb Przeglądu, wyświetlający wyłącznie błędnie zaznaczone pytania wraz z ich oryginalnym układem odpowiedzi.

## Tech Stack

* **Rdzeń aplikacji:** Vanilla JavaScript (ECMAScript 6, architektura Strict Mode)
* **Interfejs i układ:** Arkusz CSS3 wykorzystujący zmienne CSS (tokeny skalibrowane pod kątem ochrony wzroku i urządzeń mobilnych)
* **Szablony widoków:** Natywne znaczniki HTML5 Templates (`<template>`)
* **Format danych:** Strukturalne pliki JSON

## Struktura projektu

```text
index.html        Szkielet aplikacji zawierający natywne fragmenty UI oraz pływający panel językowy
styles.css        Globalny arkusz stylów definiujący tokeny, stany adaptacyjne oraz zapytania media queries
app.js            Główny skrypt sterujący maszyną stanów, szyną zdarzeń, silnikiem i18n i kontrolerem widoków
quiz.json         Domyślna, wbudowana baza pytań zawierająca zwalidowane obiekty testowe
PRD.md            Dokument wymagań produktowych określający zakres funkcjonalny i reguły wdrożenia
HLD.md            Projekt wysokopoziomowy szczegółowo opisujący przejścia stanów i formuły czasowe
TASKS.md          Harmonogram prac deweloperskich rejestrujący sekwencje faz i ograniczenia techniczne

```

## Instalacja

Aplikacja została zaprojektowana zgodnie z filozofią offline-first bez zewnętrznych bibliotek, etapów kompilacji czy serwerów uruchomieniowych. Proces instalacji sprowadza się do pobrania plików źródłowych.

1. Sklonuj lub pobierz zawartość repozytorium do jednego lokalnego katalogu.
2. Upewnij się, że plik `quiz.json` znajduje się w tym samym folderze co `index.html`, `styles.css` oraz `app.js`, aby automatyczne wstępne ładowanie zakończyło się powodzeniem.

## Użycie

### Uruchomienie aplikacji

Otwórz plik `index.html` bezpośrednio w dowolnej nowoczesnej przeglądarce internetowej lub uruchom go za pomocą lokalnego serwera HTTP.

### Przebieg testu

1. **Faza Idle (Bezczynność):** Aplikacja automatycznie sprawdza dostępność pliku `quiz.json`. Jeśli zostanie wykryty, kliknij **Uruchom wbudowany quiz**, aby przejść dalej. Możesz też przeciągnąć i upuścić własny plik JSON w kompaktową strefę wejściową.
2. **Faza Ready (Gotowość):** Przejrzyj parametry konfiguracji — liczbę przydzielonych pytań oraz całkowity budżet czasowy. Naciśnij klawisz `Enter` lub kliknij przycisk główny, aby rozpocząć, albo naciśnij `Esc`, aby anulować.
3. **Faza In Progress (W toku):** Zaznaczaj odpowiedzi myszą, dotykiem lub za pomocą skrótów klawiaturowych (`1`, `2`, `3`, `4` lub `A`, `B`, `C`, `D`). Kolorowanie poprawności aplikowane jest natychmiast po wyborze.
4. **Faza Feedback (Informacja zwrotna):** Naciśnij klawisz `Enter` lub kliknij przycisk nawigacyjny, aby przejść do kolejnego pytania.
5. **Faza Summary (Podsumowanie):** Zapoznaj się z procentowym wynikiem końcowym, stosunkiem poprawnych odpowiedzi oraz realnym czasem trwania testu. Kliknij przycisk przeglądu, aby przejść do analizy błędów.
6. **Faza Review (Przegląd):** Nawiguj pomiędzy błędnymi odpowiedziami za pomocą przycisków na ekranie lub skrótów klawiszowych (`Strzałka w lewo` / `H` oraz `Strzałka w prawo` / `L`). Naciśnij `Esc`, aby zamknąć tryb przeglądu.

## Konfiguracja

Główne parametry operacyjne aplikacji są zdefiniowane wewnątrz stałego bloku konfiguracyjnego na początku pliku `app.js`:

```javascript
const CONFIG = {
    MAX_QUESTIONS: 50,          // Maksymalna liczba pytań losowana do jednej sesji quizu
    SEC_PER_QUESTION: 72,       // Czas w sekundach przeznaczony na jedno pytanie
    ALLOWED_CHOICES: ['a', 'b', 'c', 'd'], // Kryteria walidacji struktury wejściowej JSON
    PASS_THRESHOLD_PCT: 80,     // Procentowy próg poprawnych odpowiedzi wymagany do zaliczenia
    DEFAULT_LANGUAGE: "pl",     // Domyślny język ładowany przy starcie aplikacji
    PRELOADED_FILE: "quiz.json" // Ścieżka do domyślnego pliku z pytaniami
};

```

### Specyfikacja pliku wejściowego JSON

Własne pliki z pytaniami wgrywane do aplikacji muszą być zgodne z poniższą strukturą tabeli obiektów. Każdy obiekt musi zawierać wyłącznie niepuste ciągi tekstowe:

```json
[
  {
    "question": "Treść przykładowego pytania testowego?",
    "a": "Wariant odpowiedzi numer jeden",
    "b": "Wariant odpowiedzi numer dwa",
    "c": "Wariant odpowiedzi numer trzy",
    "d": "Wariant odpowiedzi numer cztery",
    "correct": "b"
  }
]

```
