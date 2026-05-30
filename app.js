/**
 * Interactive Local Quiz Application - Authoritative Client Engine
 * Features Fully Integrated Decentralized Global i18n Localization Engine.
 */

(function () {
    "use strict";

    // ==========================================
    // 1. CONFIGURATION CONSTANTS
    // ==========================================
    const CONFIG = {
        MAX_QUESTIONS: 50,
        SEC_PER_QUESTION: 72,
        ALLOWED_CHOICES: ['a', 'b', 'c', 'd'],
        PASS_THRESHOLD_PCT: 80,
        DEFAULT_LANGUAGE: "pl", // Set active default target dictionary
        PRELOADED_FILE: "quiz.json"
    };

    // ==========================================
    // 2. TRANSLATION DICTIONARY DIALECT RESOURCE BUNDLES
    // ==========================================
    const LOCALES = {
        en: {
            quiz: {
                start: "Start Quiz",
                next: "Next Question",
                finish: "Finish Quiz",
                progress: "Question {current} of {total}"
            },
            idle: {
                title: "Umiejętności Jutra",
                subtitle: "Test your AI knowlege",
                launchBtn: "Launch Preloaded Quiz",
                dropzone: "You are ready to go, or you can load your own questions by dragging and dropping here"
            },
            ready: {
                title: "Quiz Structure Approved",
                subtitle: "Questions loaded, and ready to go!",
                allocated: "Allocated Questions",
                budget: "Total Time",
                cancel: "Cancel"
            },
            summary: {
                correctAnswers: "Correct Answers",
                timeElapsed: "Time Elapsed",
                passedBadge: "Passed",
                failedBadge: "Not quite",
                passedMsg: "Outstanding performance!",
                failedMsg: "Review session recommended. Minimum passing target is 80%.",
                reviewBtn: "Review Incorrect Answers",
                noErrorsBtn: "No Errors to Review",
                restartBtn: "Restart",
                ratio: "{correct} / {total}"
            },
            review: {
                title: "Review Mode",
                progress: "Question {current} of {total}",
                empty: "Perfect score! 🎉",
                prev: "Previous",
                next: "Next",
                exit: "Exit Review"
            },
            errors: {
                invalidFile: "Oops — I can't read this file 😅"
            }
        },
        pl: {
            quiz: {
                start: "Rozpocznij Quiz",
                next: "Następne Pytanie",
                finish: "Zakończ Quiz",
                progress: "Pytanie {current} z {total}"
            },
            idle: {
                title: "Umiejętności Jutra",
                subtitle: "Przetestuj swoją wiedzę AI.",
                launchBtn: "Uruchom wbudowany quiz",
                dropzone: "Wszystko gotowe! Możesz też załadować własne pytania przeciągając i upuszczając plik tutaj"
            },
            ready: {
                title: "Struktura Quizu Zatwierdzona",
                subtitle: "Pytania wgrane, gotowe, możesz ruszać.",
                allocated: "Przydzielone Pytania",
                budget: "Całkowity Czas",
                cancel: "Anuluj"
            },
            summary: {
                correctAnswers: "Poprawne Odpowiedzi",
                timeElapsed: "Czas",
                passedBadge: "Zaliczony",
                failedBadge: "Niecałkiem",
                passedMsg: "Doskonały wynik!",
                failedMsg: "Próg zdawalności to 80%",
                reviewBtn: "Przejrzyj Błędne Odpowiedzi",
                noErrorsBtn: "Brak Błędów do Przejrzenia",
                restartBtn: "Uruchom Ponownie",
                ratio: "{correct} z {total}"
            },
            review: {
                title: "Przegląd",
                progress: "Pytnaie {current} z {total}",
                empty: "Idealny wynik! 🎉",
                prev: "Poprzednie",
                next: "Następne",
                exit: "Wyjdź z Przeglądu"
            },
            errors: {
                invalidFile: "Ups — nie umiem odczytać tego pliku 😅"
            }
        }
    };

    // ==========================================
    // 3. MANDATORY CENTRAL LOCALIZATION ENGINE (i18n)
    // ==========================================
    const i18n = {
        activeLang: CONFIG.DEFAULT_LANGUAGE,
        fallbackLang: "en",

        load(languageCode) {
            if (LOCALES[languageCode]) {
                this.activeLang = languageCode;
            } else {
                console.warn(`Requested language pack "${languageCode}" is not bundled. Retaining default setup.`);
                this.activeLang = this.fallbackLang;
            }
        },

        t(keyPath, params = {}) {
            let translation = this.resolveKey(this.activeLang, keyPath);

            if (translation === null && this.activeLang !== this.fallbackLang) {
                translation = this.resolveKey(this.fallbackLang, keyPath);
            }

            if (translation === null) {
                console.warn(`Missing translation key path token match encountered: "${keyPath}"`);
                return keyPath;
            }

            return this.interpolate(translation, params);
        },

        resolveKey(lang, path) {
            const keys = path.split(".");
            let currentScope = LOCALES[lang];

            for (let i = 0; i < keys.length; i++) {
                if (currentScope && typeof currentScope === "object" && keys[i] in currentScope) {
                    currentScope = currentScope[keys[i]];
                } else {
                    return null;
                }
            }

            return typeof currentScope === "string" ? currentScope : null;
        },

        interpolate(templateStr, params) {
            return templateStr.replace(/\{([^{}]+)\}/g, (match, key) => {
                const trimmedKey = key.trim();
                return trimmedKey in params ? String(params[trimmedKey]) : match;
            });
        }
    };

    // ==========================================
    // 4. CENTRALIZED APPLICATION STATE
    // ==========================================
    let STATE = {
        phase: "idle",
        allQuestions: [],
        selectedQuestions: [],
        currentQuestionIndex: 0,
        pausedRemainingMs: 0,
        endTimestamp: 0,
        timerInterval: null,
        startedAt: null,
        finishedAt: null,
        reviewIndex: 0,
        reviewQuestions: [],
        fileErrorFlag: false,
        preloadedQuestions: null
    };

    // ==========================================
    // 5. SYNCHRONOUS EVENT BUS
    // ==========================================
    const eventBus = {
        listeners: {},
        on(eventName, handler) {
            if (!this.listeners[eventName]) this.listeners[eventName] = [];
            this.listeners[eventName].push(handler);
        },
        emit(eventName, payload) {
            if (!this.listeners[eventName]) return;
            this.listeners[eventName].forEach(handler => {
                try { handler(payload); } catch (e) { console.error(e); }
            });
        }
    };

    // ==========================================
    // 6. UTILS / DATA TRANSFORMATION CORNERSTONE
    // ==========================================
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // ==========================================
    // 7. INPUT VALIDATOR & PROCESSING SCHEMAS
    // ==========================================
    const validator = {
        validateSchema(rawData) {
            if (!Array.isArray(rawData)) throw new TypeError("Root structure constraint error.");
            if (rawData.length === 0) throw new RangeError("Empty source limits exception.");
            
            for (let i = 0; i < rawData.length; i++) {
                const item = rawData[i];
                if (!item || typeof item !== "object") throw new TypeError("Invalid item instance structural type.");
                const checks = ["question", "a", "b", "c", "d", "correct"];
                checks.forEach(f => {
                    if (!(f in item) || typeof item[f] !== "string" || item[f].trim().length === 0) {
                        throw new ReferenceError(`Structural failure matching constraint parameter: ${f}`);
                    }
                });
                if (!CONFIG.ALLOWED_CHOICES.includes(item.correct.toLowerCase())) {
                    throw new RangeError("Enumeration criteria limit violation.");
                }
            }
            return true;
        }
    };

    const questionManager = {
        processAndNormalize(rawData) {
            const copiedSource = JSON.parse(JSON.stringify(rawData));
            const shuffledMaster = shuffleArray(copiedSource);
            const sliceLimit = Math.min(shuffledMaster.length, CONFIG.MAX_QUESTIONS);
            return shuffledMaster.slice(0, sliceLimit).map(raw => {
                const choicesArray = [raw.a, raw.b, raw.c, raw.d];
                const originalCorrectValue = raw[raw.correct.toLowerCase()];
                const shuffledChoices = shuffleArray([...choicesArray]);
                return {
                    questionText: raw.question,
                    choices: shuffledChoices,
                    correctAnswerValue: originalCorrectValue,
                    selectedAnswerValue: null,
                    isCorrect: false,
                    originalShuffledOrder: [...shuffledChoices]
                };
            });
        }
    };

    const timerManager = {
        stop() { if (STATE.timerInterval) { clearInterval(STATE.timerInterval); STATE.timerInterval = null; } },
        start(onTick, onTimeout) {
            this.stop();
            STATE.timerInterval = setInterval(() => {
                const remainingMs = Math.max(0, STATE.endTimestamp - Date.now());
                onTick(remainingMs);
                if (remainingMs <= 0) { this.stop(); onTimeout(); }
            }, 250);
        }
    };

    // ==========================================
    // 8. RENDER INFRASTRUCTURE (PURE OVERRIDES)
    // ==========================================
    const renderEngine = {
        root: null,
        init(id) { this.root = document.getElementById(id); },
        cloneTemplate(id) { return document.importNode(document.getElementById(id).content, true); },

        render(state) {
            this.root.textContent = "";
            switch (state.phase) {
                case "idle": this.renderIdle(state); break;
                case "ready": this.renderReady(state); break;
                case "in_progress":
                case "feedback": this.renderQuiz(state); break;
                case "completed": this.renderSummary(state); break;
                case "review": this.renderReview(state); break;
            }
        },

        renderIdle(state) {
            const frag = this.cloneTemplate("tpl-idle");
            frag.getElementById("lbl-idle-title").textContent = i18n.t("idle.title");
            frag.getElementById("lbl-idle-subtitle").textContent = i18n.t("idle.subtitle");
            frag.getElementById("lbl-idle-dropzone").textContent = i18n.t("idle.dropzone");

            const launchBtn = frag.getElementById("btn-launch-preloaded");
            launchBtn.textContent = i18n.t("idle.launchBtn");
            if (!state.preloadedQuestions) {
                launchBtn.disabled = true;
            } else {
                launchBtn.addEventListener("click", () => eventBus.emit("LAUNCH_PRELOADED"));
            }

            const banner = frag.getElementById("error-banner");
            const errorMsg = frag.getElementById("error-message");
            if (state.fileErrorFlag) {
                errorMsg.textContent = i18n.t("errors.invalidFile");
                banner.classList.remove("hidden");
            }

            const dropZone = frag.getElementById("drop-zone");
            const fileInput = frag.getElementById("file-input");

            fileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) eventBus.emit("FILE_SELECTED", file);
            });
            dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("dragover"); });
            dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
            dropZone.addEventListener("drop", (e) => {
                e.preventDefault(); dropZone.classList.remove("dragover");
                const file = e.dataTransfer.files[0];
                if (file) eventBus.emit("FILE_SELECTED", file);
            });

            this.root.appendChild(frag);
        },

        renderReady(state) {
            const frag = this.cloneTemplate("tpl-ready");
            frag.getElementById("lbl-ready-title").textContent = i18n.t("ready.title");
            frag.getElementById("lbl-ready-subtitle").textContent = i18n.t("ready.subtitle");
            frag.getElementById("lbl-ready-allocated").textContent = i18n.t("ready.allocated");
            frag.getElementById("lbl-ready-budget").textContent = i18n.t("ready.budget");
            frag.getElementById("lbl-ready-btn-cancel").textContent = i18n.t("ready.cancel");
            frag.getElementById("lbl-ready-btn-start").textContent = i18n.t("quiz.start");

            const total = state.selectedQuestions.length;
            frag.getElementById("ready-count").textContent = total.toString();
            frag.getElementById("ready-time").textContent = formatTime(total * CONFIG.SEC_PER_QUESTION);

            frag.getElementById("btn-start-quiz").addEventListener("click", () => eventBus.emit("START_QUIZ"));
            frag.getElementById("btn-cancel-ready").addEventListener("click", () => eventBus.emit("RESTART_SESSION"));

            this.root.appendChild(frag);
        },

        renderQuiz(state) {
            const frag = this.cloneTemplate("tpl-quiz");
            const currIdx = state.currentQuestionIndex;
            const currentQuestion = state.selectedQuestions[currIdx];

            frag.getElementById("quiz-progress-text").textContent = i18n.t("quiz.progress", {
                current: currIdx + 1,
                total: state.selectedQuestions.length
            });
            frag.getElementById("question-text").textContent = currentQuestion.questionText;

            const nextBtn = frag.getElementById("btn-next-question");
            const nextBtnText = frag.getElementById("next-btn-text");
            const isLast = (currIdx === state.selectedQuestions.length - 1);
            nextBtnText.textContent = isLast ? i18n.t("quiz.finish") : i18n.t("quiz.next");

            const currentRemMs = state.phase === "feedback" ? state.pausedRemainingMs : Math.max(0, state.endTimestamp - Date.now());
            frag.getElementById("quiz-timer").textContent = formatTime(Math.ceil(currentRemMs / 1000));
            
            const trackingPct = state.selectedQuestions.length > 0 ? ((currIdx + (state.phase === "feedback" ? 1 : 0)) / state.selectedQuestions.length) * 100 : 0;
            frag.getElementById("quiz-progress-bar").style.width = `${trackingPct}%`;

            const choicesGrid = frag.getElementById("choices-grid");
            if (state.phase === "feedback") {
                nextBtn.classList.remove("invisible");
                choicesGrid.classList.add("context-locked");
            }

            currentQuestion.choices.forEach((choice, idx) => {
                const btn = document.createElement("button");
                btn.className = "choice-item";
                
                const txt = document.createElement("span");
                txt.className = "choice-text-wrapper";
                txt.textContent = choice;
                btn.appendChild(txt);

                const kbd = document.createElement("kbd");
                kbd.className = "kbd-badge";
                kbd.textContent = `${idx + 1}/${String.fromCharCode(65 + idx)}`;
                btn.appendChild(kbd);

                if (state.phase === "feedback") {
                    btn.disabled = true;
                    if (choice === currentQuestion.correctAnswerValue) btn.classList.add("correct");
                    else if (choice === currentQuestion.selectedAnswerValue) btn.classList.add("incorrect");
                    else btn.classList.add("faded");
                } else {
                    btn.addEventListener("click", () => eventBus.emit("ANSWER_SELECTED", choice));
                }
                choicesGrid.appendChild(btn);
            });

            nextBtn.addEventListener("click", () => eventBus.emit("NEXT_QUESTION"));
            this.root.appendChild(frag);
        },

        renderSummary(state) {
            const frag = this.cloneTemplate("tpl-summary");
            frag.getElementById("lbl-summary-correct").textContent = i18n.t("summary.correctAnswers");
            frag.getElementById("lbl-summary-duration").textContent = i18n.t("summary.timeElapsed");

            const rBtn = frag.getElementById("btn-review-mode");
            const rstBtn = frag.getElementById("btn-restart-session");
            rstBtn.textContent = i18n.t("summary.restartBtn");

            let correctCount = 0;
            state.selectedQuestions.forEach(q => { if (q.isCorrect) correctCount++; });
            const total = state.selectedQuestions.length;
            const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

            frag.getElementById("summary-percentage").textContent = `${pct}%`;
            frag.getElementById("summary-ratio").textContent = i18n.t("summary.ratio", { correct: correctCount, total: total });

            const hero = frag.getElementById("summary-score-hero");
            const badge = frag.getElementById("summary-status-badge");
            const msg = frag.getElementById("summary-status-msg");

            if (pct >= CONFIG.PASS_THRESHOLD_PCT) {
                hero.className = "score-hero pass";
                badge.textContent = i18n.t("summary.passedBadge");
                msg.textContent = i18n.t("summary.passedMsg");
            } else {
                hero.className = "score-hero fail";
                badge.textContent = i18n.t("summary.failedBadge");
                msg.textContent = i18n.t("summary.failedMsg");
            }

            const totalMs = total * CONFIG.SEC_PER_QUESTION * 1000;
            frag.getElementById("summary-duration").textContent = formatTime(Math.round(Math.max(0, totalMs - state.pausedRemainingMs) / 1000));

            if (correctCount === total) {
                rBtn.disabled = true;
                rBtn.textContent = i18n.t("summary.noErrorsBtn");
            } else {
                rBtn.textContent = i18n.t("summary.reviewBtn");
                rBtn.addEventListener("click", () => eventBus.emit("ENTER_REVIEW"));
            }
            rstBtn.addEventListener("click", () => eventBus.emit("RESTART_SESSION"));

            this.root.appendChild(frag);
        },

        renderOriginalReview(state) {
            // Deprecated structural reference backup node
        },

        renderReview(state) {
            const frag = this.cloneTemplate("tpl-review");
            frag.getElementById("lbl-review-title").textContent = i18n.t("review.title");
            frag.getElementById("lbl-review-empty").textContent = i18n.t("review.empty");
            frag.getElementById("lbl-review-btn-prev").textContent = i18n.t("review.prev");
            frag.getElementById("lbl-review-btn-next").textContent = i18n.t("review.next");
            frag.getElementById("lbl-review-btn-exit").textContent = i18n.t("review.exit");

            const progressText = frag.getElementById("review-progress-text");
            const emptyState = frag.getElementById("review-empty-state");
            const reviewBody = frag.getElementById("review-body");
            const choicesGrid = frag.getElementById("review-choices-grid");
            const prevBtn = frag.getElementById("btn-prev-review");
            const nextBtn = frag.getElementById("btn-next-review");

            if (state.reviewQuestions.length === 0) {
                emptyState.classList.remove("hidden");
                reviewBody.classList.add("hidden");
                progressText.textContent = i18n.t("review.progress", { current: 0, total: 0 });
                prevBtn.disabled = true;
                nextBtn.disabled = true;
            } else {
                const cur = state.reviewIndex;
                const q = state.reviewQuestions[cur];
                progressText.textContent = i18n.t("review.progress", { current: cur + 1, total: state.reviewQuestions.length });
                frag.getElementById("review-question-text").textContent = q.questionText;

                q.originalShuffledOrder.forEach(choice => {
                    const block = document.createElement("button");
                    block.className = "choice-item";
                    const span = document.createElement("span");
                    span.className = "choice-text-wrapper";
                    span.textContent = choice;
                    block.appendChild(span);
                    block.disabled = true;

                    if (choice === q.correctAnswerValue) block.classList.add("correct");
                    else if (choice === q.selectedAnswerValue) block.classList.add("incorrect");
                    else block.classList.add("faded");

                    choicesGrid.appendChild(block);
                });

                prevBtn.disabled = (cur === 0);
                nextBtn.disabled = (cur === state.reviewQuestions.length - 1);
            }

            prevBtn.addEventListener("click", () => eventBus.emit("PREV_REVIEW_ITEM"));
            nextBtn.addEventListener("click", () => eventBus.emit("NEXT_REVIEW_ITEM"));
            frag.getElementById("btn-exit-review").addEventListener("click", () => eventBus.emit("EXIT_REVIEW"));

            this.root.appendChild(frag);
        }
    };

    // ==========================================
    // 9. STATE MACHINE CONTROLLER INTERCEPTORS
    // ==========================================
    const sessionController = {
        init() {
            i18n.load(CONFIG.DEFAULT_LANGUAGE);
            this.updateFloatingFlagUI();
            this.bindEvents();
            this.bindKeys();
            this.bindFloatingControls();
            this.preloadDefaultFile();
            this.route("idle");
        },

        bindEvents() {
            eventBus.on("FILE_SELECTED", (f) => this.processFile(f));
            eventBus.on("LAUNCH_PRELOADED", () => this.launchPreloaded());
            eventBus.on("START_QUIZ", () => this.startQuiz());
            eventBus.on("ANSWER_SELECTED", (c) => this.selectAnswer(c));
            eventBus.on("NEXT_QUESTION", () => this.nextQuestion());
            eventBus.on("ENTER_REVIEW", () => {
                STATE.reviewQuestions = STATE.selectedQuestions.filter(q => !q.isCorrect);
                STATE.reviewIndex = 0;
                this.route("review");
            });
            eventBus.on("PREV_REVIEW_ITEM", () => this.navReview(-1));
            eventBus.on("NEXT_REVIEW_ITEM", () => this.navReview(1));
            eventBus.on("EXIT_REVIEW", () => this.route("completed"));
            eventBus.on("RESTART_SESSION", () => this.resetSession());
        },

        bindKeys() {
            window.addEventListener("keydown", (e) => {
                if (e.target.tagName === "INPUT" || e.target.isContentEditable) return;
                const key = e.key;
                const lKey = key.toLowerCase();

                if (STATE.phase === "ready") {
                    if (key === "Enter") { e.preventDefault(); eventBus.emit("START_QUIZ"); }
                    else if (key === "Escape") { e.preventDefault(); eventBus.emit("RESTART_SESSION"); }
                } else if (STATE.phase === "in_progress") {
                    const idx = ["1","2","3","4"].indexOf(key) !== -1 ? ["1","2","3","4"].indexOf(key) : ["a","b","c","d"].indexOf(lKey);
                    if (idx !== -1) {
                        e.preventDefault();
                        const curQ = STATE.selectedQuestions[STATE.currentQuestionIndex];
                        if (curQ && curQ.choices[idx]) eventBus.emit("ANSWER_SELECTED", curQ.choices[idx]);
                    }
                } else if (STATE.phase === "feedback" && key === "Enter") {
                    e.preventDefault(); eventBus.emit("NEXT_QUESTION");
                } else if (STATE.phase === "review") {
                    if (key === "ArrowLeft" || lKey === "h") { e.preventDefault(); eventBus.emit("PREV_REVIEW_ITEM"); }
                    else if (key === "ArrowRight" || lKey === "l") { e.preventDefault(); eventBus.emit("NEXT_REVIEW_ITEM"); }
                    else if (key === "Escape") { e.preventDefault(); eventBus.emit("EXIT_REVIEW"); }
                }
            });
        },

        bindFloatingControls() {
            const dropdownWrapper = document.getElementById("lang-dropdown-ui");
            const dropdownBtn = document.getElementById("btn-lang-active");

            dropdownBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                dropdownWrapper.classList.toggle("open");
            });

            document.addEventListener("click", () => {
                dropdownWrapper.classList.remove("open");
            });

            dropdownWrapper.querySelectorAll(".lang-dropdown-content button").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const selectedLang = btn.getAttribute("data-lang-target");
                    if (selectedLang && selectedLang !== i18n.activeLang) {
                        i18n.load(selectedLang);
                        this.updateFloatingFlagUI();
                        renderEngine.render(STATE);
                    }
                });
            });
        },

        updateFloatingFlagUI() {
            const dropdownBtn = document.getElementById("btn-lang-active");
            const targetContentButton = document.querySelector(`button[data-lang-target="${i18n.activeLang}"]`);
            if (dropdownBtn && targetContentButton) {
                const svgClone = targetContentButton.querySelector("svg").cloneNode(true);
                dropdownBtn.textContent = "";
                dropdownBtn.appendChild(svgClone);
            }
        },

        preloadDefaultFile() {
            fetch(CONFIG.PRELOADED_FILE)
                .then(response => {
                    if (!response.ok) throw new Error("Network configuration file load fault.");
                    return response.json();
                })
                .then(parsed => {
                    validator.validateSchema(parsed);
                    STATE.preloadedQuestions = parsed;
                    if (STATE.phase === "idle") {
                        renderEngine.render(STATE);
                    }
                })
                .catch(err => {
                    console.warn("Failed to automatically preload quiz.json asset file.", err);
                });
        },

        launchPreloaded() {
            if (!STATE.preloadedQuestions) return;
            STATE.fileErrorFlag = false;
            STATE.allQuestions = STATE.preloadedQuestions;
            STATE.selectedQuestions = questionManager.processAndNormalize(STATE.preloadedQuestions);
            STATE.currentQuestionIndex = 0;
            STATE.pausedRemainingMs = STATE.selectedQuestions.length * CONFIG.SEC_PER_QUESTION * 1000;
            this.route("ready");
        },

        route(phase) { STATE.phase = phase; renderEngine.render(STATE); },

        processFile(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    validator.validateSchema(parsed);
                    STATE.fileErrorFlag = false;
                    STATE.allQuestions = parsed;
                    STATE.selectedQuestions = questionManager.processAndNormalize(parsed);
                    STATE.currentQuestionIndex = 0;
                    STATE.pausedRemainingMs = STATE.selectedQuestions.length * CONFIG.SEC_PER_QUESTION * 1000;
                    this.route("ready");
                } catch (err) {
                    STATE.fileErrorFlag = true;
                    this.route("idle");
                }
            };
            reader.onerror = () => { STATE.fileErrorFlag = true; this.route("idle"); };
            reader.readAsText(file, "UTF-8");
        },

        startQuiz() {
            STATE.startedAt = Date.now();
            STATE.endTimestamp = Date.now() + STATE.pausedRemainingMs;
            this.route("in_progress");
            timerManager.start(
                (rem) => {
                    const el = document.getElementById("quiz-timer");
                    if (el && STATE.phase === "in_progress") el.textContent = formatTime(Math.ceil(rem / 1000));
                },
                () => this.timeoutQuiz()
            );
        },

        selectAnswer(choice) {
            timerManager.stop();
            STATE.pausedRemainingMs = Math.max(0, STATE.endTimestamp - Date.now());
            const q = STATE.selectedQuestions[STATE.currentQuestionIndex];
            q.selectedAnswerValue = choice;
            q.isCorrect = (choice === q.correctAnswerValue);
            this.route("feedback");
        },

        nextQuestion() {
            STATE.currentQuestionIndex++;
            if (STATE.currentQuestionIndex >= STATE.selectedQuestions.length) {
                this.completeQuiz();
            } else {
                STATE.endTimestamp = Date.now() + STATE.pausedRemainingMs;
                this.route("in_progress");
                this.startQuiz();
            }
        },

        timeoutQuiz() {
            timerManager.stop();
            STATE.pausedRemainingMs = 0;
            for (let i = STATE.currentQuestionIndex; i < STATE.selectedQuestions.length; i++) {
                const q = STATE.selectedQuestions[i];
                if (q.selectedAnswerValue === null) { q.selectedAnswerValue = ""; q.isCorrect = false; }
            }
            this.completeQuiz();
        },

        completeQuiz() { timerManager.stop(); STATE.finishedAt = Date.now(); this.route("completed"); },
        navReview(dir) {
            const n = STATE.reviewIndex + dir;
            if (n >= 0 && n < STATE.reviewQuestions.length) { STATE.reviewIndex = n; renderEngine.render(STATE); }
        },

        resetSession() {
            timerManager.stop();
            const storedPreload = STATE.preloadedQuestions;
            STATE = { phase: "idle", allQuestions: [], selectedQuestions: [], currentQuestionIndex: 0, pausedRemainingMs: 0, endTimestamp: 0, timerInterval: null, startedAt: null, finishedAt: null, reviewIndex: 0, reviewQuestions: [], fileErrorFlag: false, preloadedQuestions: storedPreload };
            this.route("idle");
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        renderEngine.init("app-root");
        sessionController.init();
    });
})();
