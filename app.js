/**
 * Interactive Local Quiz Application - Authoritative Client Engine
 * Implements strict specifications from HLD, PRD, and Task Breakdowns.
 */

(function () {
    "use strict";

    // ==========================================
    // 1. CONFIGURATION CONSTANTS
    // ==========================================
    const CONFIG = {
        MAX_QUESTIONS: 50,
        SEC_PER_QUESTION: 72,
        ALLOWED_CHOICES: ['a', 'b', 'c', 'd']
    };

    // ==========================================
    // 2. CENTRALIZED APPLICATION STATE
    // ==========================================
    let STATE = {
        phase: "idle", // "idle" | "ready" | "in_progress" | "feedback" | "completed" | "review"
        allQuestions: [],
        selectedQuestions: [],
        currentQuestionIndex: 0,
        pausedRemainingMs: 0,
        endTimestamp: 0,
        timerInterval: null,
        startedAt: null,
        finishedAt: null,
        reviewIndex: 0,
        reviewQuestions: []
    };

    // ==========================================
    // 3. SYNCHRONOUS EVENT BUS
    // ==========================================
    const eventBus = {
        listeners: {},
        on(eventName, handler) {
            if (!this.listeners[eventName]) {
                this.listeners[eventName] = [];
            }
            this.listeners[eventName].push(handler);
        },
        off(eventName, handler) {
            if (!this.listeners[eventName]) return;
            this.listeners[eventName] = this.listeners[eventName].filter(h => h !== handler);
        },
        emit(eventName, payload) {
            if (!this.listeners[eventName]) return;
            this.listeners[eventName].forEach(handler => {
                try {
                    handler(payload);
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                }
            });
        }
    };

    // ==========================================
    // 4. UTILS / HELPER MECHANISMS
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
    // 5. INPUT SCHEMA VALIDATOR
    // ==========================================
    const validator = {
        validateSchema(rawData) {
            if (!Array.isArray(rawData)) {
                throw new TypeError("Payload root must be an explicit array configuration.");
            }
            if (rawData.length === 0) {
                throw new RangeError("Configuration file cannot contain an empty data slice.");
            }

            for (let i = 0; i < rawData.length; i++) {
                const item = rawData[i];
                if (!item || typeof item !== "object") {
                    throw new TypeError(`Item at structural offset index ${i} is not valid object configuration.`);
                }

                // Check required elements
                const requiredFields = ["question", "a", "b", "c", "d", "correct"];
                for (let f = 0; f < requiredFields.length; f++) {
                    const field = requiredFields[f];
                    if (!(field in item)) {
                        throw new ReferenceError(`Missing required token parameter "${field}" inside question object index ${i}.`);
                    }
                    if (typeof item[field] !== "string" || item[field].trim().length === 0) {
                        throw new ValueError(`Element key constraint for "${field}" must be non-empty text entry at object index ${i}.`);
                    }
                }

                // Check enumeration parameters
                if (!CONFIG.ALLOWED_CHOICES.includes(item.correct.toLowerCase())) {
                    throw new ValueError(`Property field constraint "correct" must contain elements from target set [a,b,c,d] at item index ${i}.`);
                }
            }
            return true;
        }
    };

    // Custom errors to separate logical constraints cleanly
    function ValueError(message) {
        this.name = 'ValueError';
        this.message = message;
        this.stack = (new Error()).stack;
    }
    ValueError.prototype = Object.create(Error.prototype);
    ValueError.prototype.constructor = ValueError;

    // ==========================================
    // 6. QUESTION LIFECYCLE MANAGEMENT ENGINE
    // ==========================================
    const questionManager = {
        processAndNormalize(rawData) {
            // Sever reference pointers completely using explicit deep copying
            const copiedSource = JSON.parse(JSON.stringify(rawData));
            
            // Randomize position locations of the master input repository layout
            const shuffledMaster = shuffleArray(copiedSource);
            
            // Limit processing pool slice allocation parameters
            const sliceLimit = Math.min(shuffledMaster.length, CONFIG.MAX_QUESTIONS);
            const operationPool = shuffledMaster.slice(0, sliceLimit);

            // Construct normalized functional definitions
            return operationPool.map(raw => {
                const choicesArray = [raw.a, raw.b, raw.c, raw.d];
                const originalCorrectValue = raw[raw.correct.toLowerCase()];
                
                // Shuffle secondary individual choices presentation maps
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

    // ==========================================
    // 7. COUNTDOWN TIMING DRIVER
    // ==========================================
    const timerManager = {
        start(onTick, onTimeout) {
            this.stop();
            STATE.timerInterval = setInterval(() => {
                const remainingMs = Math.max(0, STATE.endTimestamp - Date.now());
                onTick(remainingMs);

                if (remainingMs <= 0) {
                    this.stop();
                    onTimeout();
                }
            }, 250); // High precision sub-interval tick rate prevents background clock frame skips
        },
        stop() {
            if (STATE.timerInterval) {
                clearInterval(STATE.timerInterval);
                STATE.timerInterval = null;
            }
        }
    };

    // ==========================================
    // 8. PURE IMMUTABLE RENDER ENGINE
    // ==========================================
    const renderEngine = {
        root: null,

        init(rootElementId) {
            this.root = document.getElementById(rootElementId);
            if (!this.root) {
                throw new ReferenceError(`Fatal Initialization Exception: UI mounting element target ID "${rootElementId}" not found.`);
            }
        },

        render(frozenState) {
            // Clear current layout context nodes completely to maintain clean state structures
            this.root.textContent = "";

            switch (frozenState.phase) {
                case "idle":
                    this.renderIdleScreen(frozenState);
                    break;
                case "ready":
                    this.renderReadyScreen(frozenState);
                    break;
                case "in_progress":
                case "feedback":
                    this.renderQuizScreen(frozenState);
                    break;
                case "completed":
                    this.renderSummaryScreen(frozenState);
                    break;
                case "review":
                    this.renderReviewScreen(frozenState);
                    break;
                default:
                    console.error("Unknown application operational state phase requested.");
            }
        },

        cloneTemplate(templateId) {
            const template = document.getElementById(templateId);
            if (!template) {
                throw new ReferenceError(`Layout Definition Exception: Native component configuration block "${templateId}" is missing.`);
            }
            return document.importNode(template.content, true);
        },

        renderIdleScreen(state) {
            const fragment = this.cloneTemplate("tpl-idle");
            const dropZone = fragment.getElementById("drop-zone");
            const fileInput = fragment.getElementById("file-input");
            const errorBanner = fragment.getElementById("error-banner");

            // Direct binding layout configurations
            if (state.fileErrorFlag) {
                errorBanner.classList.remove("hidden");
            }

            // Bind native processing event actions
            fileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) eventBus.emit("FILE_SELECTED", file);
            });

            dropZone.addEventListener("dragover", (e) => {
                e.preventDefault();
                dropZone.classList.add("dragover");
            });

            dropZone.addEventListener("dragleave", () => {
                dropZone.classList.remove("dragover");
            });

            dropZone.addEventListener("drop", (e) => {
                e.preventDefault();
                dropZone.classList.remove("dragover");
                const file = e.dataTransfer.files[0];
                if (file) eventBus.emit("FILE_SELECTED", file);
            });

            this.root.appendChild(fragment);
        },

        renderReadyScreen(state) {
            const fragment = this.cloneTemplate("tpl-ready");
            
            const countNode = fragment.getElementById("ready-count");
            const timeNode = fragment.getElementById("ready-time");
            const startBtn = fragment.getElementById("btn-start-quiz");
            const cancelBtn = fragment.getElementById("btn-cancel-ready");

            const totalAllocated = state.selectedQuestions.length;
            const totalDurationSec = totalAllocated * CONFIG.SEC_PER_QUESTION;

            countNode.textContent = totalAllocated.toString();
            timeNode.textContent = formatTime(totalDurationSec);

            startBtn.addEventListener("click", () => eventBus.emit("START_QUIZ"));
            cancelBtn.addEventListener("click", () => eventBus.emit("RESTART_SESSION"));

            this.root.appendChild(fragment);
        },

        renderQuizScreen(state) {
            const fragment = this.cloneTemplate("tpl-quiz");
            
            const progressText = fragment.getElementById("quiz-progress-text");
            const timerText = fragment.getElementById("quiz-timer");
            const progressBar = fragment.getElementById("quiz-progress-bar");
            const questionText = fragment.getElementById("question-text");
            const choicesGrid = fragment.getElementById("choices-grid");
            const nextBtn = fragment.getElementById("btn-next-question");

            const currentIndex = state.currentQuestionIndex;
            const currentQuestion = state.selectedQuestions[currentIndex];

            // Setup title tracking values
            progressText.textContent = `Question ${currentIndex + 1} of ${state.selectedQuestions.length}`;
            questionText.textContent = currentQuestion.questionText;

            // Compute countdown remaining calculations safely
            const currentRemainingMs = state.phase === "feedback" ? state.pausedRemainingMs : Math.max(0, state.endTimestamp - Date.now());
            const currentRemainingSec = Math.ceil(currentRemainingMs / 1000);
            timerText.textContent = formatTime(currentRemainingSec);

            const totalAllocatedSec = state.selectedQuestions.length * CONFIG.SEC_PER_QUESTION;
            const pctRatio = totalAllocatedSec > 0 ? (currentRemainingMs / (totalAllocatedSec * 1000)) * 100 : 0;
            progressBar.style.width = `${pctRatio}%`;

            // Enforce layout feedback properties mapping
            if (state.phase === "feedback") {
                nextBtn.classList.remove("invisible");
                choicesGrid.classList.add("context-locked");
            }

            // Inject option lists using literal properties mapping safely via textContent
            currentQuestion.choices.forEach(choiceString => {
                const btn = document.createElement("button");
                btn.className = "choice-item";
                btn.textContent = choiceString;

                if (state.phase === "feedback") {
                    btn.disabled = true;
                    const isUserSelection = (choiceString === currentQuestion.selectedAnswerValue);
                    const isCorrectChoice = (choiceString === currentQuestion.correctAnswerValue);

                    if (isCorrectChoice) {
                        btn.classList.add("correct");
                    } else if (isUserSelection) {
                        btn.classList.add("incorrect");
                    } else {
                        btn.classList.add("faded");
                    }
                } else {
                    // Interactive active listening hookups
                    btn.addEventListener("click", () => {
                        eventBus.emit("ANSWER_SELECTED", choiceString);
                    });
                }

                choicesGrid.appendChild(btn);
            });

            nextBtn.addEventListener("click", () => {
                eventBus.emit("NEXT_QUESTION");
            });

            this.root.appendChild(fragment);
        },

        renderSummaryScreen(state) {
            const fragment = this.cloneTemplate("tpl-summary");
            
            const pctText = fragment.getElementById("summary-percentage");
            const ratioText = fragment.getElementById("summary-ratio");
            const durationText = fragment.getElementById("summary-duration");
            const reviewBtn = fragment.getElementById("btn-review-mode");
            const restartBtn = fragment.getElementById("btn-restart-session");

            // Compute success counts metrics
            let correctCount = 0;
            state.selectedQuestions.forEach(q => { if (q.isCorrect) correctCount++; });
            
            const totalItems = state.selectedQuestions.length;
            const finalPercentage = totalItems > 0 ? Math.round((correctCount / totalItems) * 100) : 0;

            pctText.textContent = `${finalPercentage}%`;
            ratioText.textContent = `${correctCount} / ${totalItems}`;

            // Format total active elapsed timing calculations
            const totalAvailableMs = totalItems * CONFIG.SEC_PER_QUESTION * 1000;
            const actualElapsedMs = Math.max(0, totalAvailableMs - state.pausedRemainingMs);
            durationText.textContent = formatTime(Math.round(actualElapsedMs / 1000));

            reviewBtn.addEventListener("click", () => eventBus.emit("ENTER_REVIEW"));
            restartBtn.addEventListener("click", () => eventBus.emit("RESTART_SESSION"));

            this.root.appendChild(fragment);
        },

        renderReviewScreen(state) {
            const fragment = this.cloneTemplate("tpl-review");
            
            const progressText = fragment.getElementById("review-progress-text");
            const emptyState = fragment.getElementById("review-empty-state");
            const reviewBody = fragment.getElementById("review-body");
            const choicesGrid = fragment.getElementById("review-choices-grid");
            
            const prevBtn = fragment.getElementById("btn-prev-review");
            const nextBtn = fragment.getElementById("btn-next-review");
            const exitBtn = fragment.getElementById("btn-exit-review");

            if (state.reviewQuestions.length === 0) {
                emptyState.classList.remove("hidden");
                reviewBody.classList.add("hidden");
                progressText.textContent = "0 of 0";
                prevBtn.disabled = true;
                nextBtn.disabled = true;
            } else {
                const currentReviewQuestion = state.reviewQuestions[state.reviewIndex];
                progressText.textContent = `Error ${state.reviewIndex + 1} of ${state.reviewQuestions.length}`;
                
                const qTextNode = fragment.getElementById("review-question-text");
                qTextNode.textContent = currentReviewQuestion.questionText;

                // Build preserved configuration sequence
                currentReviewQuestion.originalShuffledOrder.forEach(choiceString => {
                    const block = document.createElement("button");
                    block.className = "choice-item";
                    block.textContent = choiceString;
                    block.disabled = true;

                    const isUserSelection = (choiceString === currentReviewQuestion.selectedAnswerValue);
                    const isCorrectChoice = (choiceString === currentReviewQuestion.correctAnswerValue);

                    if (isCorrectChoice) {
                        block.classList.add("correct");
                    } else if (isUserSelection) {
                        block.classList.add("incorrect");
                    } else {
                        block.classList.add("faded");
                    }

                    choicesGrid.appendChild(block);
                });

                prevBtn.disabled = (state.reviewIndex === 0);
                nextBtn.disabled = (state.reviewIndex === state.reviewQuestions.length - 1);
            }

            prevBtn.addEventListener("click", () => eventBus.emit("PREV_REVIEW_ITEM"));
            nextBtn.addEventListener("click", () => eventBus.emit("NEXT_REVIEW_ITEM"));
            exitBtn.addEventListener("click", () => eventBus.emit("EXIT_REVIEW"));

            this.root.appendChild(fragment);
        }
    };

    // ==========================================
    // 9. CENTRALIZED STATE LIFE LIFE CYCLE COORDINATOR
    // ==========================================
    const sessionController = {
        init() {
            this.registerEventBindings();
            // Perform system boot process
            this.routeToPhase("idle");
        },

        registerEventBindings() {
            eventBus.on("FILE_SELECTED", (file) => this.handleFileIngestion(file));
            eventBus.on("FILE_VALIDATED", (data) => this.handleFileSuccess(data));
            eventBus.on("FILE_REJECTED", () => this.handleFileFailure());
            eventBus.on("START_QUIZ", () => this.handleQuizCommencement());
            eventBus.on("ANSWER_SELECTED", (choice) => this.handleAnswerSelection(choice));
            eventBus.on("NEXT_QUESTION", () => this.handleNextQuestionProgression());
            eventBus.on("TIMEOUT", () => this.handleQuizTimeoutSessionExhaustion());
            eventBus.on("ENTER_REVIEW", () => this.handleReviewSubsystemEntry());
            eventBus.on("PREV_REVIEW_ITEM", () => this.handleReviewNavigation(-1));
            eventBus.on("NEXT_REVIEW_ITEM", () => this.handleReviewNavigation(1));
            eventBus.on("EXIT_REVIEW", () => this.routeToPhase("completed"));
            eventBus.on("RESTART_SESSION", () => this.handleSessionClearPurge());
        },

        routeToPhase(targetPhase) {
            STATE.phase = targetPhase;
            renderEngine.render(Object.freeze({ ...STATE }));
        },

        handleFileIngestion(file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsedData = JSON.parse(event.target.result);
                    validator.validateSchema(parsedData);
                    eventBus.emit("FILE_VALIDATED", parsedData);
                } catch (err) {
                    console.warn("Structural ingestion parsing failure:", err.message);
                    eventBus.emit("FILE_REJECTED");
                }
            };
            reader.onerror = () => {
                eventBus.emit("FILE_REJECTED");
            };
            // Enforce standard layout UTF-8 rules explicitly
            reader.readAsText(file, "UTF-8");
        },

        handleFileSuccess(rawData) {
            STATE.fileErrorFlag = false;
            STATE.allQuestions = rawData;
            STATE.selectedQuestions = questionManager.processAndNormalize(rawData);
            STATE.currentQuestionIndex = 0;
            
            // Calculate absolute global timer configurations ahead
            const totalAllocatedSec = STATE.selectedQuestions.length * CONFIG.SEC_PER_QUESTION;
            STATE.pausedRemainingMs = totalAllocatedSec * 1000;

            this.routeToPhase("ready");
        },

        handleFileFailure() {
            STATE.fileErrorFlag = true;
            this.routeToPhase("idle");
        },

        handleQuizCommencement() {
            STATE.startedAt = Date.now();
            // Anchor hardware target anchor points
            STATE.endTimestamp = Date.now() + STATE.pausedRemainingMs;
            
            this.routeToPhase("in_progress");

            timerManager.start(
                (remainingMs) => {
                    // Local ticker updates screen variables directly avoiding full node replacement loops
                    const timerText = document.getElementById("quiz-timer");
                    const progressBar = document.getElementById("quiz-progress-bar");
                    
                    if (timerText && progressBar && STATE.phase === "in_progress") {
                        const currentRemainingSec = Math.ceil(remainingMs / 1000);
                        timerText.textContent = formatTime(currentRemainingSec);

                        const totalAllocatedSec = STATE.selectedQuestions.length * CONFIG.SEC_PER_QUESTION;
                        const pctRatio = totalAllocatedSec > 0 ? (remainingMs / (totalAllocatedSec * 1000)) * 100 : 0;
                        progressBar.style.width = `${pctRatio}%`;
                    }
                },
                () => {
                    eventBus.emit("TIMEOUT");
                }
            );
        },

        handleAnswerSelection(choiceString) {
            timerManager.stop();
            
            // Preserve exact microsecond countdown balance snapshot instantly
            STATE.pausedRemainingMs = Math.max(0, STATE.endTimestamp - Date.now());
            
            const currentItem = STATE.selectedQuestions[STATE.currentQuestionIndex];
            currentItem.selectedAnswerValue = choiceString;
            currentItem.isCorrect = (choiceString === currentItem.correctAnswerValue);

            this.routeToPhase("feedback");
        },

        handleNextQuestionProgression() {
            STATE.currentQuestionIndex++;

            if (STATE.currentQuestionIndex >= STATE.selectedQuestions.length) {
                this.handleQuizCompletionSequence();
            } else {
                // Re-anchor target milestones forward using saved data balance
                STATE.endTimestamp = Date.now() + STATE.pausedRemainingMs;
                this.routeToPhase("in_progress");
                this.handleQuizCommencement();
            }
        },

        handleQuizTimeoutSessionExhaustion() {
            timerManager.stop();
            STATE.pausedRemainingMs = 0;

            // Enforce authoritative completion properties over un-answered steps
            for (let i = STATE.currentQuestionIndex; i < STATE.selectedQuestions.length; i++) {
                const item = STATE.selectedQuestions[i];
                if (item.selectedAnswerValue === null) {
                    item.selectedAnswerValue = ""; // Mark explicit blank configuration
                    item.isCorrect = false;
                }
            }
            this.handleQuizCompletionSequence();
        },

        handleQuizCompletionSequence() {
            timerManager.stop();
            STATE.finishedAt = Date.now();
            this.routeToPhase("completed");
        },

        handleReviewSubsystemEntry() {
            // Extract and isolate incorrect elements exclusively
            STATE.reviewQuestions = STATE.selectedQuestions.filter(q => !q.isCorrect);
            STATE.reviewIndex = 0;
            this.routeToPhase("review");
        },

        handleReviewNavigation(offsetDirection) {
            const nextIndex = STATE.reviewIndex + offsetDirection;
            if (nextIndex >= 0 && nextIndex < STATE.reviewQuestions.length) {
                STATE.reviewIndex = nextIndex;
                renderEngine.render(Object.freeze({ ...STATE }));
            }
        },

        handleSessionClearPurge() {
            timerManager.stop();
            
            // Reinitialize empty runtime configurations tracking allocations safely
            STATE = {
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
                reviewQuestions: []
            };

            this.routeToPhase("idle");
        }
    };

    // Initialize Viewport Mounting Configuration on DOM Content Ready
    document.addEventListener("DOMContentLoaded", () => {
        renderEngine.init("app-root");
        sessionController.init();
    });

})();