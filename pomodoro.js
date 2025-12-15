// ===== Pomodoro Timer =====

// Theme Management (shared)
const Storage = {
    getTheme: () => localStorage.getItem('studytrack_theme') || 'dark',
    saveTheme: (theme) => localStorage.setItem('studytrack_theme', theme),

    getSessions: () => {
        const data = JSON.parse(localStorage.getItem('studytrack_pomodoro')) || {};
        const today = new Date().toISOString().split('T')[0];
        return data[today] || { sessions: 0, minutes: 0 };
    },
    saveSessions: (sessions, minutes) => {
        const data = JSON.parse(localStorage.getItem('studytrack_pomodoro')) || {};
        const today = new Date().toISOString().split('T')[0];
        data[today] = { sessions, minutes };
        localStorage.setItem('studytrack_pomodoro', JSON.stringify(data));
    },

    // Study logs (shared with home page)
    getStudyLogs: () => JSON.parse(localStorage.getItem('studytrack_logs')) || [],
    saveStudyLogs: (logs) => localStorage.setItem('studytrack_logs', JSON.stringify(logs))
};

// Helper function
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

// DOM Elements
const DOM = {
    timerDisplay: document.getElementById('timerDisplay'),
    progressRing: document.getElementById('progressRing'),
    startBtn: document.getElementById('startBtn'),
    startBtnText: document.getElementById('startBtnText'),
    resetBtn: document.getElementById('resetBtn'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    sessionsCompleted: document.getElementById('sessionsCompleted'),
    totalFocusTime: document.getElementById('totalFocusTime'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    toast: document.getElementById('toast')
};

// Timer State
let timerState = {
    isRunning: false,
    currentMode: 'work',
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    intervalId: null
};

// Progress ring setup
const circumference = 2 * Math.PI * 130;
DOM.progressRing.style.strokeDasharray = circumference;
DOM.progressRing.style.strokeDashoffset = 0;

// ===== Timer Functions =====
function updateDisplay() {
    const minutes = Math.floor(timerState.remainingSeconds / 60);
    const seconds = timerState.remainingSeconds % 60;
    DOM.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update progress ring
    const progress = timerState.remainingSeconds / timerState.totalSeconds;
    const offset = circumference * (1 - progress);
    DOM.progressRing.style.strokeDashoffset = offset;
}

function startTimer() {
    if (timerState.isRunning) {
        // Pause
        clearInterval(timerState.intervalId);
        timerState.isRunning = false;
        DOM.startBtnText.textContent = 'Resume';
    } else {
        // Start
        timerState.isRunning = true;
        DOM.startBtnText.textContent = 'Pause';

        timerState.intervalId = setInterval(() => {
            timerState.remainingSeconds--;
            updateDisplay();

            if (timerState.remainingSeconds <= 0) {
                clearInterval(timerState.intervalId);
                timerState.isRunning = false;
                onTimerComplete();
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerState.intervalId);
    timerState.isRunning = false;
    timerState.remainingSeconds = timerState.totalSeconds;
    DOM.startBtnText.textContent = 'Start';
    updateDisplay();
}

function setMode(mode, minutes) {
    clearInterval(timerState.intervalId);
    timerState.isRunning = false;
    timerState.currentMode = mode;
    timerState.totalSeconds = minutes * 60;
    timerState.remainingSeconds = timerState.totalSeconds;
    DOM.startBtnText.textContent = 'Start';

    // Update active button
    DOM.modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    updateDisplay();
}

function onTimerComplete() {
    showToast(timerState.currentMode === 'work' ? 'Great job! Time for a break! 🎉' : 'Break over! Ready to focus? 💪');

    // Play notification sound (if available)
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1pZ2ZnaGZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm');
        audio.volume = 0.3;
        audio.play().catch(() => { });
    } catch (e) { }

    // Update sessions if work mode completed
    if (timerState.currentMode === 'work') {
        const current = Storage.getSessions();
        const sessionMinutes = Math.round(timerState.totalSeconds / 60);
        Storage.saveSessions(current.sessions + 1, current.minutes + sessionMinutes);
        updateSessionStats();

        // Add to study logs on home page
        addToStudyLogs(sessionMinutes);
    }

    DOM.startBtnText.textContent = 'Start';
}

function addToStudyLogs(minutes) {
    const log = {
        id: generateId(),
        date: getToday(),
        hours: minutes / 60,
        subject: 'Pomodoro Session',
        createdAt: new Date().toISOString()
    };

    const logs = Storage.getStudyLogs();
    logs.unshift(log);
    Storage.saveStudyLogs(logs);
}

function updateSessionStats() {
    const stats = Storage.getSessions();
    DOM.sessionsCompleted.textContent = stats.sessions;
    DOM.totalFocusTime.textContent = stats.minutes;
}

function showToast(message, type = 'success') {
    DOM.toast.textContent = message;
    DOM.toast.className = `toast ${type} show`;
    setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, 3000);
}

// ===== Theme Functions =====
function initTheme() {
    const savedTheme = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    Storage.saveTheme(newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    DOM.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

// ===== Event Listeners =====
function initEventListeners() {
    DOM.startBtn.addEventListener('click', startTimer);
    DOM.resetBtn.addEventListener('click', resetTimer);

    DOM.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setMode(btn.dataset.mode, parseInt(btn.dataset.time));
        });
    });

    DOM.themeToggle.addEventListener('click', toggleTheme);
}

// ===== Initialize =====
function init() {
    initTheme();
    initEventListeners();
    updateDisplay();
    updateSessionStats();
}

document.addEventListener('DOMContentLoaded', init);
