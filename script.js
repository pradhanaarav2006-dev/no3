// ===== Data Management =====
const Storage = {
    getGoals: () => JSON.parse(localStorage.getItem('studytrack_goals')) || [],
    saveGoals: (goals) => localStorage.setItem('studytrack_goals', JSON.stringify(goals)),

    getStudyLogs: () => JSON.parse(localStorage.getItem('studytrack_logs')) || [],
    saveStudyLogs: (logs) => localStorage.setItem('studytrack_logs', JSON.stringify(logs))
};

// ===== DOM Elements =====
const DOM = {
    // Stats
    totalGoals: document.getElementById('totalGoals'),
    completedGoals: document.getElementById('completedGoals'),
    todayHours: document.getElementById('todayHours'),
    weeklyHours: document.getElementById('weeklyHours'),

    // Goal Form
    addGoalBtn: document.getElementById('addGoalBtn'),
    goalForm: document.getElementById('goalForm'),
    goalTitle: document.getElementById('goalTitle'),
    goalDescription: document.getElementById('goalDescription'),
    goalPriority: document.getElementById('goalPriority'),
    goalDeadline: document.getElementById('goalDeadline'),
    cancelGoalBtn: document.getElementById('cancelGoalBtn'),
    saveGoalBtn: document.getElementById('saveGoalBtn'),
    goalsList: document.getElementById('goalsList'),
    emptyGoals: document.getElementById('emptyGoals'),

    // Study Form
    studyDate: document.getElementById('studyDate'),
    studyHours: document.getElementById('studyHours'),
    studySubject: document.getElementById('studySubject'),
    logHoursBtn: document.getElementById('logHoursBtn'),
    logList: document.getElementById('logList'),
    emptyStudy: document.getElementById('emptyStudy'),

    // Chart
    weeklyChart: document.getElementById('weeklyChart'),
    chartLabels: document.getElementById('chartLabels'),

    // Edit Modal
    editModal: document.getElementById('editModal'),
    closeModal: document.getElementById('closeModal'),
    editGoalId: document.getElementById('editGoalId'),
    editGoalTitle: document.getElementById('editGoalTitle'),
    editGoalDescription: document.getElementById('editGoalDescription'),
    editGoalPriority: document.getElementById('editGoalPriority'),
    editGoalDeadline: document.getElementById('editGoalDeadline'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    updateGoalBtn: document.getElementById('updateGoalBtn'),

    // Toast
    toast: document.getElementById('toast')
};

// ===== Utility Functions =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getDayName(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function showToast(message, type = 'success') {
    DOM.toast.textContent = message;
    DOM.toast.className = `toast ${type} show`;
    setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, 3000);
}

// ===== Goals Functions =====
function renderGoals() {
    const goals = Storage.getGoals();

    if (goals.length === 0) {
        DOM.emptyGoals.style.display = 'block';
        DOM.goalsList.innerHTML = '';
        DOM.goalsList.appendChild(DOM.emptyGoals);
    } else {
        DOM.emptyGoals.style.display = 'none';
        DOM.goalsList.innerHTML = goals.map(goal => `
            <div class="goal-item ${goal.completed ? 'completed' : ''}" data-id="${goal.id}">
                <div class="goal-header">
                    <div class="goal-title-wrapper">
                        <div class="goal-checkbox ${goal.completed ? 'checked' : ''}" onclick="toggleGoal('${goal.id}')"></div>
                        <span class="goal-title">${escapeHtml(goal.title)}</span>
                    </div>
                    <div class="goal-actions">
                        <button class="btn btn-icon btn-secondary" onclick="openEditModal('${goal.id}')" title="Edit">✏️</button>
                        <button class="btn btn-icon btn-secondary" onclick="deleteGoal('${goal.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
                ${goal.description ? `<p class="goal-description">${escapeHtml(goal.description)}</p>` : ''}
                <div class="goal-meta">
                    <span class="goal-badge badge-${goal.priority}">${goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}</span>
                    ${goal.deadline ? `<span class="goal-badge badge-date">📅 ${formatDate(goal.deadline)}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    updateStats();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addGoal() {
    const title = DOM.goalTitle.value.trim();
    if (!title) {
        showToast('Please enter a goal title', 'error');
        return;
    }

    const goal = {
        id: generateId(),
        title: title,
        description: DOM.goalDescription.value.trim(),
        priority: DOM.goalPriority.value,
        deadline: DOM.goalDeadline.value,
        completed: false,
        createdAt: new Date().toISOString()
    };

    const goals = Storage.getGoals();
    goals.unshift(goal);
    Storage.saveGoals(goals);

    // Reset form
    DOM.goalTitle.value = '';
    DOM.goalDescription.value = '';
    DOM.goalPriority.value = 'medium';
    DOM.goalDeadline.value = '';
    DOM.goalForm.style.display = 'none';

    renderGoals();
    showToast('Goal added successfully! 🎯');
}

function toggleGoal(id) {
    const goals = Storage.getGoals();
    const goal = goals.find(g => g.id === id);
    if (goal) {
        goal.completed = !goal.completed;
        Storage.saveGoals(goals);
        renderGoals();
        showToast(goal.completed ? 'Goal completed! 🎉' : 'Goal marked as incomplete');
    }
}

function deleteGoal(id) {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    const goals = Storage.getGoals().filter(g => g.id !== id);
    Storage.saveGoals(goals);
    renderGoals();
    showToast('Goal deleted');
}

function openEditModal(id) {
    const goals = Storage.getGoals();
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    DOM.editGoalId.value = goal.id;
    DOM.editGoalTitle.value = goal.title;
    DOM.editGoalDescription.value = goal.description || '';
    DOM.editGoalPriority.value = goal.priority;
    DOM.editGoalDeadline.value = goal.deadline || '';

    DOM.editModal.classList.add('active');
}

function closeEditModal() {
    DOM.editModal.classList.remove('active');
}

function updateGoal() {
    const id = DOM.editGoalId.value;
    const title = DOM.editGoalTitle.value.trim();

    if (!title) {
        showToast('Please enter a goal title', 'error');
        return;
    }

    const goals = Storage.getGoals();
    const goal = goals.find(g => g.id === id);
    if (goal) {
        goal.title = title;
        goal.description = DOM.editGoalDescription.value.trim();
        goal.priority = DOM.editGoalPriority.value;
        goal.deadline = DOM.editGoalDeadline.value;
        Storage.saveGoals(goals);
        closeEditModal();
        renderGoals();
        showToast('Goal updated! ✨');
    }
}

// ===== Study Hours Functions =====
function renderStudyLogs() {
    const logs = Storage.getStudyLogs();
    const recentLogs = logs.slice(0, 10);

    if (recentLogs.length === 0) {
        DOM.emptyStudy.style.display = 'block';
        DOM.logList.innerHTML = '';
        DOM.logList.appendChild(DOM.emptyStudy);
    } else {
        DOM.emptyStudy.style.display = 'none';
        DOM.logList.innerHTML = recentLogs.map(log => `
            <div class="log-item" data-id="${log.id}">
                <div class="log-info">
                    <span class="log-date">${formatDateShort(log.date)}</span>
                    ${log.subject ? `<span class="log-subject">${escapeHtml(log.subject)}</span>` : ''}
                </div>
                <span class="log-hours">${log.hours}h</span>
                <button class="log-delete" onclick="deleteLog('${log.id}')" title="Delete">🗑️</button>
            </div>
        `).join('');
    }

    updateStats();
    renderWeeklyChart();
}

function logStudyHours() {
    const date = DOM.studyDate.value;
    const hours = parseFloat(DOM.studyHours.value);

    if (!date) {
        showToast('Please select a date', 'error');
        return;
    }

    if (!hours || hours <= 0) {
        showToast('Please enter valid hours', 'error');
        return;
    }

    const log = {
        id: generateId(),
        date: date,
        hours: hours,
        subject: DOM.studySubject.value.trim(),
        createdAt: new Date().toISOString()
    };

    const logs = Storage.getStudyLogs();
    logs.unshift(log);
    Storage.saveStudyLogs(logs);

    // Reset form
    DOM.studyHours.value = '';
    DOM.studySubject.value = '';

    renderStudyLogs();
    showToast(`Logged ${hours} hours! 📚`);
}

function deleteLog(id) {
    if (!confirm('Are you sure you want to delete this study log?')) return;

    const logs = Storage.getStudyLogs().filter(l => l.id !== id);
    Storage.saveStudyLogs(logs);
    renderStudyLogs();
    showToast('Study log deleted');
}

// ===== Statistics =====
function updateStats() {
    const goals = Storage.getGoals();
    const logs = Storage.getStudyLogs();
    const today = getToday();

    // Goal stats
    DOM.totalGoals.textContent = goals.length;
    DOM.completedGoals.textContent = goals.filter(g => g.completed).length;

    // Today's hours
    const todayLogs = logs.filter(l => l.date === today);
    const todayTotal = todayLogs.reduce((sum, l) => sum + l.hours, 0);
    DOM.todayHours.textContent = todayTotal.toFixed(1);

    // Weekly hours
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const weekLogs = logs.filter(l => l.date >= weekAgoStr);
    const weekTotal = weekLogs.reduce((sum, l) => sum + l.hours, 0);
    DOM.weeklyHours.textContent = weekTotal.toFixed(1);
}

// ===== Weekly Chart =====
function renderWeeklyChart() {
    const logs = Storage.getStudyLogs();
    const days = [];
    const today = new Date();

    // Get Monday of current week
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, so go back 6 days
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    // Get Monday to Sunday of current week
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = logs.filter(l => l.date === dateStr);
        const totalHours = dayLogs.reduce((sum, l) => sum + l.hours, 0);

        days.push({
            date: dateStr,
            day: getDayName(dateStr),
            hours: totalHours
        });
    }

    const maxHours = Math.max(...days.map(d => d.hours), 1);

    // Render bars
    DOM.weeklyChart.innerHTML = days.map(d => {
        const height = (d.hours / maxHours) * 100;
        return `<div class="chart-bar" style="height: ${Math.max(height, 3)}%" data-hours="${d.hours}h"></div>`;
    }).join('');

    // Render labels
    DOM.chartLabels.innerHTML = days.map(d => `<span class="chart-label">${d.day}</span>`).join('');
}

// ===== Event Listeners =====
function initEventListeners() {
    // Goal form toggle
    DOM.addGoalBtn.addEventListener('click', () => {
        DOM.goalForm.style.display = DOM.goalForm.style.display === 'none' ? 'flex' : 'none';
    });

    DOM.cancelGoalBtn.addEventListener('click', () => {
        DOM.goalForm.style.display = 'none';
        DOM.goalTitle.value = '';
        DOM.goalDescription.value = '';
    });

    DOM.saveGoalBtn.addEventListener('click', addGoal);

    // Allow Enter to save goal
    DOM.goalTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addGoal();
    });

    // Study hours
    DOM.logHoursBtn.addEventListener('click', logStudyHours);

    // Edit modal
    DOM.closeModal.addEventListener('click', closeEditModal);
    DOM.cancelEditBtn.addEventListener('click', closeEditModal);
    DOM.updateGoalBtn.addEventListener('click', updateGoal);

    // Close modal on outside click
    DOM.editModal.addEventListener('click', (e) => {
        if (e.target === DOM.editModal) closeEditModal();
    });

    // Set default date to today
    DOM.studyDate.value = getToday();
}

// ===== Initialize =====
function init() {
    initEventListeners();
    renderGoals();
    renderStudyLogs();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
