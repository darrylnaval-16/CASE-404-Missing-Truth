// ==========================================
// CASE 404: MISSING TRUTH
// COMPLETE GAME JAVASCRIPT
// TIMELINE: JANUARY - JULY 10, 2026
// AUTOMATIC GAME OVER SYSTEM
// ==========================================


// ==========================================
// GAME DATA
// ==========================================

let investigator = "";
let score = 100;
let seconds = 0;
let timerInterval = null;
let timerRunning = false;
let lastPenaltySecond = 0;
const TIME_LIMIT_SECONDS = 600; // 10 minutes
const PENALTY_INTERVAL_SECONDS = 30; // Every 30 seconds
const PENALTY_POINTS = 5;

let hintCount = 0;
let desktopHintCount = 0;
const MAX_DESKTOP_HINTS = 10;
let unlocked = false;
let gameOver = false;
let gameOverTimeout = null;
let notificationTimeout = null;

const correctPassword = "0907";
const TOTAL_EVIDENCE = 5;
const LEADERBOARD_KEY = "case404Leaderboard_v1";
let collectedEvidence = new Set();

// Files is always open; locked apps use the specified passwords:
// - photos: "pjih" (case-insensitive)
// - messages: "1179"
// - notes: "elena" (case-insensitive)
// - history: "1579"
let unlockedApps = new Set(["files"]);
let pendingUnlockApp = null;

const appUnlockConfig = {
    photos: {
        title: "UNLOCK PHOTO GALLERY",
        prompt: "Enter the password to unlock PHOTO GALLERY.",
        placeholder: "Enter password",
        check: val => val.trim().toLowerCase() === "pjih"
    },
    messages: {
        title: "UNLOCK MESSAGES",
        prompt: "Enter the 4-digit password to unlock MESSAGES.",
        placeholder: "4-digit password",
        check: val => val.trim() === "1179"
    },
    notes: {
        title: "UNLOCK PERSONAL NOTES",
        prompt: "Enter the password to unlock PERSONAL NOTES.",
        placeholder: "Enter password",
        check: val => val.trim().toLowerCase() === "elena"
    },
    history: {
        title: "UNLOCK BROWSER HISTORY",
        prompt: "Enter the 4-digit password to unlock BROWSER HISTORY.",
        placeholder: "4-digit password",
        check: val => val.trim() === "1579"
    }
};

const desktopHints = [
    "HINT 1 (Photos): It's a 4-letter code made from the first letters of the personal files.",
    "HINT 2 (Photos): Look at Personal Information, Journal Entry, Important Documents, and hidden_404.dat.",
    "HINT 3 (Photos): The 4 letters in order are P - J - I - H.",
    "HINT 4 (Messages): The password is a 4-digit number.",
    "HINT 5 (Messages): The 4-digit password for Messages is 1179.",
    "HINT 6 (Notes): Look at who owns the account and appears in the conversations.",
    "HINT 7 (Notes): The password for Notes is the victim's first name: elena.",
    "HINT 8 (Browser History): The password is a 4-digit number.",
    "HINT 9 (Browser History): The 4-digit password for Browser History is 1579.",
    "HINT 10 (Summary): Passwords — Photos: pjih | Messages: 1179 | Notes: elena | History: 1579."
];

let musicMuted = false;
let clickAudioCtx = null;


// ==========================================
// BACKGROUND MUSIC (ON FROM BEGINNING) & CLICK SOUND
// ==========================================

function updateAudioButtonUI() {
    const btn = document.getElementById("audioToggleBtn");
    if (!btn) return;

    if (musicMuted) {
        btn.textContent = "🔇 SOUND: OFF";
        btn.classList.add("muted");
    } else {
        btn.textContent = "🔊 SOUND: ON";
        btn.classList.remove("muted");
    }
}


function playBackgroundMusic() {
    const audio = document.getElementById("bgMusic");
    if (!audio) return;

    audio.loop = true;
    audio.volume = 0.35;
    audio.muted = musicMuted;

    if (!musicMuted) {
        audio.play().catch(() => {});
    }
}


function toggleBackgroundMusic() {
    const audio = document.getElementById("bgMusic");
    musicMuted = !musicMuted;
    updateAudioButtonUI();

    if (!audio) return;

    audio.muted = musicMuted;
    if (!musicMuted) {
        audio.volume = 0.35;
        audio.loop = true;
        audio.play().catch(() => {});
        showNotification("Background music enabled.");
    } else {
        showNotification("Background music muted.");
    }
}


function playClickSound() {
    if (musicMuted) return;

    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        if (!clickAudioCtx) {
            clickAudioCtx = new AudioContextClass();
        }
        if (clickAudioCtx.state === "suspended") {
            clickAudioCtx.resume().catch(() => {});
        }

        const now = clickAudioCtx.currentTime;
        const osc = clickAudioCtx.createOscillator();
        const gain = clickAudioCtx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.045);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        gain.connect(clickAudioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    } catch (_) {
        // Ignore audio synthesis restrictions
    }
}


function initBackgroundMusic() {
    musicMuted = false;
    updateAudioButtonUI();
    playBackgroundMusic();

    const unlockOnce = () => {
        playBackgroundMusic();
        document.removeEventListener("pointerdown", unlockOnce);
        document.removeEventListener("keydown", unlockOnce);
    };

    document.addEventListener("pointerdown", unlockOnce, { once: true });
    document.addEventListener("keydown", unlockOnce, { once: true });

    document.addEventListener("click", function(event) {
        if (event.target.closest("button, .clue-card, .app-icon")) {
            playClickSound();
        }
    });
}


// ==========================================
// SCORE SYNC
// ==========================================

function syncScoreDisplays() {
    const currentScore = document.getElementById("currentScore");
    const desktopScore = document.getElementById("desktopScore");

    if (currentScore) currentScore.textContent = String(score);
    if (desktopScore) desktopScore.textContent = String(score);
}


// ==========================================
// SCREEN NAVIGATION
// ==========================================

function showScreen(screenId) {

    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const target = document.getElementById(screenId);

    if (target) {
        target.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// BACK BUTTON NAVIGATION
// ==========================================

function backToStart() {
    showScreen("startScreen");
}

function backToInstructions() {
    showScreen("instructionsScreen");
}

function backToRegistration() {
    showScreen("registrationScreen");
}

function backToBriefing() {
    showScreen("briefingScreen");
}

function backToMission() {
    showScreen("missionScreen");
}

function backToInvestigation() {

    if (gameOver) return;

    closeApp();
    closeUnlockAppModal();
    closeCompileModal();
    showScreen("passwordScreen");

    showNotification("Returned to Password Investigation.");
}


// ==========================================
// INVESTIGATOR REGISTRATION
// ==========================================

function registerInvestigator() {

    if (gameOver) return;

    const nameInput = document.getElementById("investigatorName");
    const error = document.getElementById("registrationError");

    const name = nameInput.value.trim();

    if (name === "") {

        error.textContent = "Please enter your investigator name.";
        nameInput.focus();

        return;
    }

    investigator = name;
    error.textContent = "";

    showNotification(
        "Investigator identity confirmed: " + investigator
    );

    showScreen("briefingScreen");
}


// ==========================================
// TIMER SYSTEM (WITH 30s PENALTY & 10m LIMIT)
// ==========================================

function startInvestigation() {

    if (gameOver) return;

    if (!timerRunning && !unlocked) {

        if (timerInterval) {
            clearInterval(timerInterval);
        }

        seconds = 0;
        lastPenaltySecond = 0;
        timerRunning = true;

        updateTimer();

        timerInterval = setInterval(() => {

            if (!timerRunning || gameOver) return;

            seconds++;
            updateTimer();

            // Every 30 seconds elapsed: deduct 5 points
            if (
                seconds > 0 &&
                seconds % PENALTY_INTERVAL_SECONDS === 0 &&
                seconds !== lastPenaltySecond
            ) {
                lastPenaltySecond = seconds;
                score = Math.max(0, score - PENALTY_POINTS);
                syncScoreDisplays();

                if (score <= 0) {
                    triggerGameOver("You have run out of investigation points.");
                    return;
                }

                showNotification(
                    `30s passed: -${PENALTY_POINTS} points (${score} PTS left).`
                );
            }

            // 10-minute (600s) time limit check
            if (seconds >= TIME_LIMIT_SECONDS) {
                score = 0;
                syncScoreDisplays();
                triggerGameOver("Time limit reached (10:00). Investigation terminated.");
            }

        }, 1000);

        showNotification("Investigation timer started (10:00 limit).");
    }

    showScreen("passwordScreen");
}


function formatSeconds(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}


function updateTimer() {

    const formattedTime = formatSeconds(seconds);

    const timer = document.getElementById("timer");
    const desktopClock = document.getElementById("desktopClock");

    if (timer) {
        timer.textContent = formattedTime;
    }

    if (desktopClock) {
        desktopClock.textContent = formattedTime;
    }
}


function stopTimer() {

    timerRunning = false;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}


// ==========================================
// EVIDENCE LOCKS, DESKTOP HINTS & CONCLUSION HELPERS
// ==========================================

function syncDesktopAppBadges() {
    ["files", "photos", "messages", "notes", "history"].forEach(appName => {
        const btn = document.getElementById(`appBtn-${appName}`);
        const badge = document.getElementById(`appLock-${appName}`);
        const isAppUnlocked = unlockedApps.has(appName);
        const isCollected = collectedEvidence.has(appName);

        if (btn) {
            btn.classList.toggle("locked", !isAppUnlocked);
            btn.classList.toggle("collected", isCollected);
        }

        if (badge) {
            if (isCollected) {
                badge.textContent = "✓ COLLECTED";
            } else if (isAppUnlocked) {
                badge.textContent = "OPEN";
            } else {
                badge.textContent = "🔒 LOCKED";
            }
        }
    });
}


function updateDesktopHintUI() {
    const usedEl = document.getElementById("desktopHintsUsed");
    const btnEl = document.getElementById("desktopHintBtn");

    if (usedEl) {
        usedEl.textContent = String(desktopHintCount);
    }

    if (btnEl) {
        btnEl.disabled = desktopHintCount >= MAX_DESKTOP_HINTS;
        if (desktopHintCount >= MAX_DESKTOP_HINTS) {
            btnEl.textContent = `MAX HINTS REACHED (${MAX_DESKTOP_HINTS}/${MAX_DESKTOP_HINTS})`;
        } else {
            btnEl.innerHTML = `ASK FOR PASSWORD HINT (-5 PTS • <span id="desktopHintsUsed">${desktopHintCount}</span>/${MAX_DESKTOP_HINTS} USED)`;
        }
    }
}


function useDesktopHint() {
    if (!unlocked || gameOver) return;

    if (desktopHintCount >= MAX_DESKTOP_HINTS) {
        showNotification(`Maximum of ${MAX_DESKTOP_HINTS} desktop hints reached.`);
        return;
    }

    score = Math.max(0, score - 5);
    desktopHintCount++;

    syncScoreDisplays();
    updateDesktopHintUI();

    if (score <= 0) {
        triggerGameOver("You have run out of investigation points.");
        return;
    }

    const hintMsg = desktopHints[Math.min(desktopHintCount - 1, desktopHints.length - 1)];
    const outputEl = document.getElementById("desktopHintText");
    if (outputEl) {
        outputEl.textContent = hintMsg;
    }

    showNotification(hintMsg);
}


function resetEvidenceProgress() {
    collectedEvidence.clear();
    unlockedApps = new Set(["files"]);
    pendingUnlockApp = null;
    desktopHintCount = 0;

    const outputEl = document.getElementById("desktopHintText");
    if (outputEl) {
        outputEl.textContent = `Need help finding an app password? Up to ${MAX_DESKTOP_HINTS} hints available (-5 points each).`;
    }

    syncDesktopAppBadges();
    updateDesktopHintUI();
    updateEvidenceUI();
}


function updateEvidenceUI() {
    const count = collectedEvidence.size;
    const counterEl = document.getElementById("evidenceCount");
    const compileBtn = document.getElementById("compileCaseBtn");
    const statusText = document.getElementById("compileStatusText");

    if (counterEl) {
        counterEl.textContent = `${count}/${TOTAL_EVIDENCE}`;
    }

    if (compileBtn) {
        compileBtn.textContent = `COMPILE CASE (${count}/${TOTAL_EVIDENCE} EVIDENCE)`;
        compileBtn.disabled = count < TOTAL_EVIDENCE;
    }

    if (statusText) {
        statusText.textContent = count >= TOTAL_EVIDENCE
            ? "All 5/5 evidence collected. You can now compile why Elena was murdered."
            : `Collect all ${TOTAL_EVIDENCE}/${TOTAL_EVIDENCE} evidence items to compile why Elena was murdered.`;
    }
}


function openUnlockAppModal(appName) {
    const cfg = appUnlockConfig[appName];
    const modal = document.getElementById("unlockAppModal");
    const titleEl = document.getElementById("unlockAppTitle");
    const promptEl = document.getElementById("unlockAppPrompt");
    const inputEl = document.getElementById("appPassInput");
    const errEl = document.getElementById("unlockAppError");

    if (!cfg || !modal) return;

    pendingUnlockApp = appName;
    if (titleEl) titleEl.textContent = cfg.title;
    if (promptEl) promptEl.textContent = cfg.prompt;
    if (errEl) errEl.textContent = "";
    if (inputEl) {
        inputEl.value = "";
        inputEl.placeholder = cfg.placeholder;
    }

    modal.classList.add("show");
    if (inputEl) inputEl.focus();
}


function closeUnlockAppModal() {
    const modal = document.getElementById("unlockAppModal");
    if (modal) {
        modal.classList.remove("show");
    }
    pendingUnlockApp = null;
}


function submitAppPassword() {
    if (gameOver || !pendingUnlockApp) return;

    const appName = pendingUnlockApp;
    const cfg = appUnlockConfig[appName];
    const inputEl = document.getElementById("appPassInput");
    const errEl = document.getElementById("unlockAppError");

    if (!cfg || !inputEl) return;

    if (cfg.check(inputEl.value)) {
        unlockedApps.add(appName);
        syncDesktopAppBadges();
        closeUnlockAppModal();
        showNotification(`${appData[appName].title} unlocked.`);
        openApp(appName);
    } else {
        score = Math.max(0, score - 10);
        syncScoreDisplays();

        if (score <= 0) {
            triggerGameOver("You have run out of investigation points.");
            return;
        }

        if (errEl) {
            errEl.textContent = "Incorrect password. -10 POINTS.";
        }
        inputEl.value = "";
        inputEl.focus();
    }
}


function openCompileModal() {
    if (gameOver || !unlocked || collectedEvidence.size < TOTAL_EVIDENCE) return;

    const modal = document.getElementById("compileModal");
    const err = document.getElementById("compileError");
    if (err) err.textContent = "";

    document.querySelectorAll('input[name="murderMotive"]').forEach(radio => {
        radio.checked = false;
    });

    if (modal) {
        modal.classList.add("show");
    }
}


function closeCompileModal() {
    const modal = document.getElementById("compileModal");
    if (modal) {
        modal.classList.remove("show");
    }
}


function submitCaseConclusion() {
    if (gameOver || collectedEvidence.size < TOTAL_EVIDENCE) return;

    const selected = document.querySelector('input[name="murderMotive"]:checked');
    const err = document.getElementById("compileError");

    if (!selected) {
        if (err) {
            err.textContent = "Please select a conclusion before submitting.";
        }
        return;
    }

    if (err) err.textContent = "";

    const isCorrectMotive = selected.value === "evidence";
    if (!isCorrectMotive) {
        score = Math.max(0, score - 15);
    }

    stopTimer();
    closeApp();
    closeUnlockAppModal();
    closeCompileModal();

    const finalScore = score;
    const finalTimeFormatted = formatSeconds(seconds);
    const investigatorName = investigator || "Anonymous Investigator";

    saveLeaderboardEntry({
        name: investigatorName,
        score: finalScore,
        seconds: seconds,
        timeFormatted: finalTimeFormatted,
        solvedAccurately: isCorrectMotive
    });

    renderSolvedScreen(investigatorName, finalScore, finalTimeFormatted, isCorrectMotive);
    showScreen("solvedScreen");
    showNotification("Case report submitted.");
}


function saveLeaderboardEntry(entry) {
    let list = [];
    try {
        const raw = localStorage.getItem(LEADERBOARD_KEY);
        if (raw) {
            list = JSON.parse(raw);
        }
    } catch (_) {
        list = [];
    }

    list.push(entry);

    list.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.seconds - b.seconds;
    });

    list = list.slice(0, 10);

    try {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
    } catch (_) {
        // Ignore storage quota errors
    }
}


function renderSolvedScreen(name, finalScore, timeFormatted, accurate) {
    const verdictBox = document.getElementById("caseVerdictBox");
    const invEl = document.getElementById("summaryInvestigator");
    const scoreEl = document.getElementById("summaryScore");
    const timeEl = document.getElementById("summaryTime");
    const evEl = document.getElementById("summaryEvidence");
    const listEl = document.getElementById("leaderboardList");

    if (verdictBox) {
        verdictBox.innerHTML = accurate
            ? "<strong>CONCLUSION VERIFIED:</strong> Elena was targeted after uncovering sensitive evidence and refusing to delete her files and photos despite escalating stalking and threats."
            : "<strong>CONCLUSION FLAGGED (-15 PTS):</strong> Evidence points to stalking, threats, and hidden files rather than your selected theory. Final score adjusted.";
    }

    if (invEl) invEl.textContent = name;
    if (scoreEl) scoreEl.textContent = String(finalScore);
    if (timeEl) timeEl.textContent = timeFormatted;
    if (evEl) evEl.textContent = `${collectedEvidence.size}/${TOTAL_EVIDENCE}`;

    if (listEl) {
        let entries = [];
        try {
            const raw = localStorage.getItem(LEADERBOARD_KEY);
            if (raw) entries = JSON.parse(raw);
        } catch (_) {
            entries = [];
        }

        if (!entries.length) {
            listEl.innerHTML = `<div class="leaderboard-row"><span>No records yet.</span></div>`;
            return;
        }

        listEl.innerHTML = entries.map((item, idx) => `
            <div class="leaderboard-row">
                <div>
                    <strong>#${idx + 1} ${item.name}</strong>
                    <small style="display:block;color:#999197;">Time: ${item.timeFormatted}</small>
                </div>
                <span>${item.score} PTS</span>
            </div>
        `).join("");
    }
}


function resetToStartScreen() {
    resetAfterGameOver();
    showScreen("startScreen");
}


// ==========================================
// AUTOMATIC GAME OVER SYSTEM
// ==========================================

function triggerGameOver(reasonMessage = "You have run out of investigation points.") {

    if (gameOver) return;

    gameOver = true;
    score = 0;

    stopTimer();
    closeClue();
    closeApp();
    closeUnlockAppModal();
    closeCompileModal();

    const notification = document.getElementById("notification");

    if (notification) {
        notification.classList.remove("show");
    }

    syncScoreDisplays();

    const oldOverlay = document.getElementById("gameOverOverlay");

    if (oldOverlay) {
        oldOverlay.remove();
    }

    const overlay = document.createElement("div");

    overlay.id = "gameOverOverlay";

    overlay.innerHTML = `
        <div class="game-over-content">
            <p class="game-over-label">
                CASE 404 / INVESTIGATION TERMINATED
            </p>

            <h1>GAME OVER</h1>

            <p class="game-over-message">
                ${reasonMessage}
            </p>

            <p class="game-over-subtitle">
                RETURNING TO INVESTIGATION GUIDELINES...
            </p>
        </div>
    `;

    document.body.appendChild(overlay);

    gameOverTimeout = setTimeout(() => {

        overlay.remove();

        resetAfterGameOver();

        showScreen("instructionsScreen");

    }, 3000);
}


// ==========================================
// RESET AFTER GAME OVER
// ==========================================

function resetAfterGameOver() {

    gameOver = false;

    investigator = "";
    score = 100;
    seconds = 0;
    lastPenaltySecond = 0;
    hintCount = 0;
    unlocked = false;

    stopTimer();
    resetEvidenceProgress();

    const investigatorName =
        document.getElementById("investigatorName");

    const registrationError =
        document.getElementById("registrationError");

    const passwordInput =
        document.getElementById("passwordInput");

    const passwordFeedback =
        document.getElementById("passwordFeedback");

    if (investigatorName) {
        investigatorName.value = "";
    }

    if (registrationError) {
        registrationError.textContent = "";
    }

    if (passwordInput) {
        passwordInput.value = "";
    }

    if (passwordFeedback) {
        passwordFeedback.textContent = "";
        passwordFeedback.style.color = "";
    }

    syncScoreDisplays();
    updateTimer();

    closeClue();
    closeApp();
    closeUnlockAppModal();
    closeCompileModal();

    const notification = document.getElementById("notification");

    if (notification) {
        notification.classList.remove("show");
    }

    clearTimeout(notificationTimeout);
}


// ==========================================
// PASSWORD CLUES
// ==========================================

const clues = [

    {
        title: "PERSONAL NOTE",

        text: `"July has become an important month to me. July 9 is a date I never want to forget. I wish I could go back to that day."`
    },

    {
        title: "CALENDAR ENTRY",

        text: `"JULY 9 — A day I will always remember. No matter what happens, this date will stay with me."`
    },

    {
        title: "OLD REMINDER",

        text: `"If I ever forget my computer password, remember this: Enter the day first, followed by the month. Four digits only."`
    }

];


function openClue(index) {

    if (gameOver) return;

    const clue = clues[index];

    if (!clue) return;

    document.getElementById("clueTitle").textContent = clue.title;

    document.getElementById("clueText").textContent = clue.text;

    document.getElementById("clueModal").classList.add("show");
}


function closeClue() {

    const modal = document.getElementById("clueModal");

    if (modal) {
        modal.classList.remove("show");
    }
}


// ==========================================
// PASSWORD HINTS
// ==========================================

const hints = [

    "HINT 1: The password is connected to an important date in Elena's life.",

    "HINT 2: Look closely at the Personal Note and Calendar Entry.",

    "HINT 3: The password contains four digits. Enter the day first, followed by the month.",

    "HINT 4: The date is July 9. Remember the required order."

];


function useHint() {

    if (unlocked || gameOver) return;

    score = Math.max(0, score - 5);
    syncScoreDisplays();

    if (score <= 0) {
        triggerGameOver("You have run out of investigation points.");
        return;
    }

    const hintIndex = Math.min(
        hintCount,
        hints.length - 1
    );

    showNotification(hints[hintIndex]);

    hintCount++;
}


// ==========================================
// CHECK COMPUTER PASSWORD
// ==========================================

function checkPassword() {

    if (gameOver) return;

    const input = document.getElementById("passwordInput");
    const feedback = document.getElementById("passwordFeedback");

    if (!input || !feedback) return;

    const enteredPassword = input.value.trim();

    if (unlocked) return;

    if (enteredPassword === "") {

        feedback.textContent = "Please enter a password.";
        input.focus();

        return;
    }

    if (
        enteredPassword.length !== 4 ||
        !/^\d{4}$/.test(enteredPassword)
    ) {

        feedback.textContent =
            "Password must contain exactly 4 digits.";

        input.value = "";
        input.focus();

        return;
    }


    // CORRECT PASSWORD

    if (enteredPassword === correctPassword) {

        unlocked = true;

        feedback.style.color = "#72b58b";

        feedback.textContent =
            "ACCESS GRANTED. COMPUTER UNLOCKED.";

        showNotification(
            "Password correct! Computer unlocked."
        );

        setTimeout(() => {

            if (gameOver) return;

            closeApp();
            syncDesktopAppBadges();
            updateDesktopHintUI();
            updateEvidenceUI();
            syncScoreDisplays();

            showScreen("computerScreen");

            showNotification(
                "Welcome to Elena's personal computer."
            );

        }, 1000);

    }


    // INCORRECT PASSWORD

    else {

        score = Math.max(0, score - 10);
        syncScoreDisplays();

        feedback.style.color = "#e16c72";

        feedback.textContent =
            "ACCESS DENIED. Incorrect password. -10 POINTS.";

        input.value = "";

        if (score <= 0) {
            triggerGameOver("You have run out of investigation points.");
            return;
        }

        input.focus();
    }
}


// ==========================================
// COMPUTER APPLICATIONS
// ==========================================

const appData = {

    // --------------------------------------
    // FILES (ALWAYS OPEN)
    // --------------------------------------

    files: {

        title: "MY FILES",

        content: `

            <h3>ELENA'S PERSONAL FILES</h3>

            <div class="app-item">
                📄 <strong>Personal Information.txt</strong>
                <small>Last modified: June 12, 2026</small>
                <p>A document containing Elena's personal details.</p>
            </div>

            <div class="app-item">
                📄 <strong>Journal Entry.doc</strong>
                <small>Last modified: July 9, 2026</small>
                <p>A personal journal entry saved one day before her death.</p>
            </div>

            <div class="app-item">
                📄 <strong>Important Documents.pdf</strong>
                <small>Last modified: June 28, 2026</small>
                <p>Some documents about an unknown individual.</p>
            </div>

            <div class="app-item">
                🔒 <strong>hidden_404.dat</strong>
                <small>FILE STATUS: RESTRICTED</small>
                <p>A suspicious file that may contain important information.</p>
            </div>

            <div class="app-notice">
                SYSTEM NOTE: Some files may contain important evidence.
            </div>

        `
    },


    // --------------------------------------
    // PHOTOS - 11 PERSONAL PHOTOS
    // --------------------------------------

    photos: {

        title: "PHOTO GALLERY",

        content: `

            <h3>ELENA'S PERSONAL PHOTOS</h3>

            <div class="photo-gallery">

                <div class="photo-item">
                    <img
                        src="assets/images/bedroom.png"
                        alt="Elena's bedroom"
                    >
                    <p class="photo-caption">MAY 6, 2026</p>
                </div>

                <div class="photo-item">
                    <img
                        src="assets/images/dog.png"
                        alt="Elena's dog"
                    >
                    <p class="photo-caption">JUNE 14, 2026</p>
                </div>

                <div class="photo-item">
                    <img
                        src="assets/images/elenapic.png"
                        alt="Elena's personal photo"
                    >
                    <p class="photo-caption">JUNE 22, 2026</p>
                </div>

                <div class="photo-item">
                    <img
                        src="assets/images/friends.png"
                        alt="Elena with her friends"
                    >
                    <p class="photo-caption">JUNE 30, 2026</p>
                </div>

                <div class="photo-item">
                    <img
                        src="assets/images/stalker.png"
                        alt="A suspicious figure"
                    >
                    <p class="photo-caption">JULY 1, 2026</p>
                </div>

                <!-- NOTE IMAGE -->

                <div class="photo-item">
                    <img
                        src="assets/images/note.png"
                        alt="A handwritten message"
                    >
                    <p class="photo-caption">JULY 1, 2026</p>
                </div>

                <div class="photo-item">
                    <img
                        src="assets/images/friends1.png"
                        alt="Elena with her friends"
                    >
                    <p class="photo-caption">JULY 5, 2026</p>
                </div>

                <div class="photo-item">
                    <img
                        src="assets/images/hallway.png"
                        alt="A dark hallway"
                    >
                    <p class="photo-caption">JULY 7, 2026</p>
                </div>

                <div class="photo-item">
                    <img
                        src="assets/images/guy.png"
                        alt="A mysterious man"
                    >
                    <p class="photo-caption">JULY 8, 2026</p>
                </div>

                <div class="photo-item">
                    <img
                        src="assets/images/photos.png"
                        alt="A personal photo"
                    >
                    <p class="photo-caption">JULY 9, 2026</p>
                </div>

                <div class="photo-item">
                    <img
                        src="assets/images/friends2.png"
                        alt="Elena with her friends"
                    >
                    <p class="photo-caption">JANUARY 7, 2026</p>
                </div>

            </div>

            <div class="app-notice">
                PHOTO ARCHIVE: JANUARY - JULY 2026.
                LAST PHOTO SAVED: JULY 9, 2026.
                BODY DISCOVERED: JULY 10, 2026.
            </div>

        `
    },


    // --------------------------------------
    // MESSAGES
    // --------------------------------------

    messages: {

        title: "MESSAGES",

        content: `

            <h3>PRIVATE CONVERSATIONS</h3>

            <div class="app-notice">
                WARNING: Some conversations contain disturbing messages.
                Sender identity could not be verified.
            </div>

            <div class="app-item">
                <strong>UNKNOWN NUMBER</strong>
                <small>July 7 • 8:41 PM</small>
                <p>
                    "You should stop asking questions, Elena.
                    Some things are better left buried.
                    You have no idea what you're getting yourself into."
                </p>
            </div>

            <div class="app-item">
                <strong>Elena</strong>
                <small>July 7 • 8:46 PM</small>
                <p>
                    "Who is this? How do you know what I've been doing?
                    I've already told you that I won't stay quiet.
                    People deserve to know the truth."
                </p>
            </div>

            <div class="app-item">
                <strong>UNKNOWN NUMBER</strong>
                <small>July 7 • 8:49 PM</small>
                <p>
                    "You really think someone will believe you?
                    I've been watching you for a long time.
                    I know where you go, who you meet,
                    and when you come home."
                </p>
            </div>

            <div class="app-item">
                <strong>Elena</strong>
                <small>July 8 • 10:12 PM</small>
                <p>
                    "I saw you again today.
                    You were standing across the street,
                    just watching me.
                    Why are you doing this? What do you want from me?"
                </p>
            </div>

            <div class="app-item">
                <strong>UNKNOWN NUMBER</strong>
                <small>July 8 • 10:19 PM</small>
                <p>
                    "You shouldn't have noticed me.
                    I warned you to forget what you found.
                    Delete the pictures, erase the files,
                    and pretend none of this ever happened."
                </p>
            </div>

            <div class="app-item">
                <strong>Elena</strong>
                <small>July 9 • 9:14 PM</small>
                <p>
                    "I know what happened.
                    I have the evidence, and I've made copies of everything.
                    You can't keep hiding the truth forever.
                    If anything happens to me, someone will find out."
                </p>
            </div>

            <div class="app-item">
                <strong>UNKNOWN NUMBER</strong>
                <small>July 9 • 9:18 PM</small>
                <p>
                    "You have no idea how much trouble you've caused.
                    I gave you enough chances to walk away.
                    This is your last opportunity to fix your mistake.
                    Delete everything. Now."
                </p>
            </div>

            <div class="app-item">
                <strong>Elena</strong>
                <small>July 9 • 11:36 PM</small>
                <p>
                    "I'm scared. I can hear someone outside my apartment.
                    I've checked the door twice, but there's nobody there.
                    I don't know if I'm imagining things anymore.
                    I just want this to end."
                </p>
            </div>

            <div class="app-item">
                <strong>UNKNOWN NUMBER</strong>
                <small>July 9 • 11:48 PM</small>
                <p>
                    "You should have listened.
                    Check your door, Elena.
                    You forgot to lock it."
                </p>
            </div>

            <div class="app-item">
                <strong>Elena</strong>
                <small>July 9 • 11:51 PM</small>
                <p>
                    "HOW DO YOU KNOW THAT?
                    Who are you?!
                    Please, just leave me alone.
                    I haven't told anyone where I live..."
                </p>
            </div>

            <div class="app-notice">
                SYSTEM WARNING: No further messages were recovered
                after July 9, 2026.
                The sender's identity remains unknown.
            </div>

        `
    },


    // --------------------------------------
    // NOTES
    // --------------------------------------

    notes: {

        title: "PERSONAL NOTES",

        content: `

            <h3>ELENA'S PRIVATE NOTES</h3>

            <div class="app-item">
                <strong>January 15, 2026</strong>
                <p>
                    Someone has been following me lately.
                    I don't know who I can trust anymore.
                </p>
            </div>

            <div class="app-item">
                <strong>May 12, 2026</strong>
                <p>
                    I found something that could change everything.
                    I need to keep it somewhere safe.
                </p>
            </div>

            <div class="app-item">
                <strong>July 9, 2026</strong>
                <p>
                    If something happens to me, I hope someone
                    finds the truth hidden in this computer.
                </p>
            </div>

            <div class="app-notice">
                PRIVATE NOTE: Last entry saved on July 9, 2026.
            </div>

        `
    },


    // --------------------------------------
    // BROWSER HISTORY
    // --------------------------------------

    history: {

        title: "BROWSER HISTORY",

        content: `

            <h3>RECENT SEARCH HISTORY</h3>

            <div class="app-item">
                🌐 <strong>How to recover deleted files</strong>
                <small>January 15 • 9:20 PM</small>
            </div>

            <div class="app-item">
                🌐 <strong>Unknown phone number lookup</strong>
                <small>March 3 • 7:45 PM</small>
            </div>

            <div class="app-item">
                🌐 <strong>How to protect private information</strong>
                <small>May 12 • 10:10 PM</small>
            </div>

            <div class="app-item">
                🌐 <strong>What to do if someone is threatening you</strong>
                <small>July 9 • 11:48 PM</small>
            </div>

            <div class="app-notice">
                BROWSER ACTIVITY: Several searches suggest that Elena
                may have been experiencing a serious problem and
                trying to protect herself from someone.
            </div>

        `
    }

};


// ==========================================
// OPEN COMPUTER APPLICATION
// ==========================================

function openApp(appName) {

    if (!unlocked || gameOver) return;

    const app = appData[appName];

    if (!app) return;

    if (!unlockedApps.has(appName)) {
        openUnlockAppModal(appName);
        return;
    }

    const appTitle = document.getElementById("appTitle");
    const appContent = document.getElementById("appContent");
    const appWindow = document.getElementById("appWindow");

    if (!appTitle || !appContent || !appWindow) return;

    appTitle.textContent = app.title;
    appContent.innerHTML = app.content;

    appWindow.classList.add("show");

    const isNewEvidence = !collectedEvidence.has(appName);
    if (isNewEvidence) {
        collectedEvidence.add(appName);
        syncDesktopAppBadges();
        updateEvidenceUI();
        showNotification(
            `Evidence collected (${collectedEvidence.size}/${TOTAL_EVIDENCE}): ${app.title}`
        );
    } else {
        showNotification(
            `${app.title} already examined (${collectedEvidence.size}/${TOTAL_EVIDENCE} evidence).`
        );
    }
}


// ==========================================
// CLOSE COMPUTER APPLICATION
// ==========================================

function closeApp() {

    const appWindow = document.getElementById("appWindow");

    if (appWindow) {
        appWindow.classList.remove("show");
    }
}


// ==========================================
// NOTIFICATION SYSTEM
// ==========================================

function showNotification(message) {

    if (gameOver) return;

    const notification = document.getElementById("notification");

    if (!notification) return;

    notification.textContent = message;
    notification.classList.add("show");

    clearTimeout(notificationTimeout);

    notificationTimeout = setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}


// ==========================================
// RETURN TO MAIN MENU
// ==========================================

function returnToMainMenu() {

    if (gameOver) return;

    const confirmReturn = confirm(
        "Are you sure you want to return to the Main Menu? Your current investigation progress will be reset."
    );

    if (!confirmReturn) return;

    stopTimer();
    resetEvidenceProgress();

    investigator = "";
    score = 100;
    seconds = 0;
    lastPenaltySecond = 0;
    hintCount = 0;
    unlocked = false;

    const passwordInput =
        document.getElementById("passwordInput");

    const passwordFeedback =
        document.getElementById("passwordFeedback");

    const investigatorName =
        document.getElementById("investigatorName");

    const registrationError =
        document.getElementById("registrationError");

    if (passwordInput) {
        passwordInput.value = "";
    }

    if (passwordFeedback) {
        passwordFeedback.textContent = "";
        passwordFeedback.style.color = "";
    }

    if (investigatorName) {
        investigatorName.value = "";
    }

    if (registrationError) {
        registrationError.textContent = "";
    }

    syncScoreDisplays();
    closeApp();
    closeClue();
    closeUnlockAppModal();
    closeCompileModal();

    updateTimer();

    showScreen("startScreen");

    showNotification(
        "Returned to Main Menu. New investigation ready."
    );
}


// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener("keydown", function(event) {

    if (gameOver) {
        event.preventDefault();
        return;
    }

    if (event.key === "Escape") {
        closeClue();
        closeApp();
        closeUnlockAppModal();
        closeCompileModal();
    }

    if (
        event.key === "Enter" &&
        document.getElementById("unlockAppModal")?.classList.contains("show") &&
        document.activeElement.id === "appPassInput"
    ) {
        submitAppPassword();
    }

    if (
        event.key === "Enter" &&
        document.getElementById("passwordScreen")?.classList.contains("active") &&
        document.activeElement.id === "passwordInput"
    ) {
        checkPassword();
    }

});


// ==========================================
// INITIAL GAME DISPLAY
// ==========================================

document.addEventListener("DOMContentLoaded", function() {

    initBackgroundMusic();
    syncDesktopAppBadges();
    updateDesktopHintUI();
    updateEvidenceUI();
    syncScoreDisplays();
    updateTimer();

    showScreen("startScreen");

    console.log("CASE 404: MISSING TRUTH");
    console.log("Game initialized successfully.");

});
