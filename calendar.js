// ===== Calendar =====

// Storage
const Storage = {
    getTheme: () => localStorage.getItem('studytrack_theme') || 'dark',
    saveTheme: (theme) => localStorage.setItem('studytrack_theme', theme),

    getEvents: () => JSON.parse(localStorage.getItem('studytrack_events')) || {},
    saveEvents: (events) => localStorage.setItem('studytrack_events', JSON.stringify(events)),

    getGoals: () => JSON.parse(localStorage.getItem('studytrack_goals')) || [],
    saveGoals: (goals) => localStorage.setItem('studytrack_goals', JSON.stringify(goals))
};

// Helper function
function getToday() {
    return new Date().toISOString().split('T')[0];
}

// DOM Elements
const DOM = {
    calendarTitle: document.getElementById('calendarTitle'),
    calendarGrid: document.getElementById('calendarGrid'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    selectedDateTitle: document.getElementById('selectedDateTitle'),
    addEventBtn: document.getElementById('addEventBtn'),
    eventForm: document.getElementById('eventForm'),
    eventTitle: document.getElementById('eventTitle'),
    eventTime: document.getElementById('eventTime'),
    eventColor: document.getElementById('eventColor'),
    cancelEventBtn: document.getElementById('cancelEventBtn'),
    saveEventBtn: document.getElementById('saveEventBtn'),
    eventsList: document.getElementById('eventsList'),
    emptyEvents: document.getElementById('emptyEvents'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    toast: document.getElementById('toast')
};

// Calendar State
let calendarState = {
    currentDate: new Date(),
    selectedDate: null
};

// ===== Calendar Functions =====
function renderCalendar() {
    const year = calendarState.currentDate.getFullYear();
    const month = calendarState.currentDate.getMonth();

    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    DOM.calendarTitle.textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Get starting day (0 = Sunday, adjust for Monday start)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    // Get events
    const events = Storage.getEvents();
    const today = new Date();

    // Generate calendar HTML
    let html = '';

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    const todayStr = getToday();
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
        const isSelected = calendarState.selectedDate === dateStr;
        const dayEvents = events[dateStr] || [];
        const hasEvents = dayEvents.length > 0;

        // Check if any goal events are overdue
        const hasOverdue = dayEvents.some(e => e.goalId && dateStr < todayStr);

        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (hasEvents) classes += ' has-events';
        if (hasOverdue) classes += ' has-overdue';

        html += `<div class="${classes}" data-date="${dateStr}">${day}</div>`;
    }

    DOM.calendarGrid.innerHTML = html;

    // Add click listeners
    DOM.calendarGrid.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
        day.addEventListener('click', () => selectDate(day.dataset.date));
    });
}

function selectDate(dateStr) {
    calendarState.selectedDate = dateStr;
    renderCalendar();
    renderEvents(dateStr);

    // Update selected date title
    const date = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    DOM.selectedDateTitle.textContent = date.toLocaleDateString('en-US', options);
    DOM.addEventBtn.style.display = 'inline-flex';
}

function renderEvents(dateStr) {
    const events = Storage.getEvents();
    const dayEvents = events[dateStr] || [];

    if (dayEvents.length === 0) {
        DOM.emptyEvents.style.display = 'block';
        DOM.emptyEvents.querySelector('p').textContent = 'No events for this day';
        DOM.eventsList.innerHTML = '';
        DOM.eventsList.appendChild(DOM.emptyEvents);
    } else {
        DOM.emptyEvents.style.display = 'none';
        const todayStr = getToday();
        DOM.eventsList.innerHTML = dayEvents.map((event, index) => {
            const isOverdue = event.goalId && !event.completed && dateStr < todayStr;
            const isCompleted = event.goalId && event.completed;
            const isLate = event.goalId && event.completedLate;
            return `
            <div class="event-item color-${event.color} ${isOverdue ? 'event-overdue' : ''} ${isCompleted ? 'event-completed' : ''} ${isLate ? 'event-late' : ''}">
                <div class="event-info">
                    ${event.time ? `<span class="event-time">${event.time}</span>` : ''}
                    <span class="event-title">${escapeHtml(event.title)}${isOverdue ? ' <span class="overdue-tag">(Overdue!)</span>' : ''}${isLate ? ' <span class="late-tag">(Late)</span>' : ''}</span>
                </div>
                <button class="event-delete" onclick="deleteEvent('${dateStr}', ${index})">🗑️</button>
            </div>
        `}).join('');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addEvent() {
    const title = DOM.eventTitle.value.trim();
    if (!title) {
        showToast('Please enter an event title', 'error');
        return;
    }

    const event = {
        title: title,
        time: DOM.eventTime.value,
        color: DOM.eventColor.value
    };

    const events = Storage.getEvents();
    const dateStr = calendarState.selectedDate;

    if (!events[dateStr]) events[dateStr] = [];
    events[dateStr].push(event);

    // Sort by time
    events[dateStr].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    Storage.saveEvents(events);

    // Reset form
    DOM.eventTitle.value = '';
    DOM.eventTime.value = '';
    DOM.eventColor.value = 'purple';
    DOM.eventForm.style.display = 'none';

    renderCalendar();
    renderEvents(dateStr);
    showToast('Event added! 📅');
}

function deleteEvent(dateStr, index) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const events = Storage.getEvents();
    const eventToDelete = events[dateStr][index];

    // If this is a goal event, also delete from goals
    if (eventToDelete.goalId) {
        deleteGoalFromHome(eventToDelete.goalId);
    }

    events[dateStr].splice(index, 1);

    if (events[dateStr].length === 0) {
        delete events[dateStr];
    }

    Storage.saveEvents(events);
    renderCalendar();
    renderEvents(dateStr);
    showToast('Event deleted');
}

function deleteGoalFromHome(goalId) {
    const goals = Storage.getGoals().filter(g => g.id !== goalId);
    Storage.saveGoals(goals);
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
    DOM.prevMonth.addEventListener('click', () => {
        calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() - 1);
        renderCalendar();
    });

    DOM.nextMonth.addEventListener('click', () => {
        calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() + 1);
        renderCalendar();
    });

    DOM.addEventBtn.addEventListener('click', () => {
        DOM.eventForm.style.display = DOM.eventForm.style.display === 'none' ? 'flex' : 'none';
    });

    DOM.cancelEventBtn.addEventListener('click', () => {
        DOM.eventForm.style.display = 'none';
        DOM.eventTitle.value = '';
    });

    DOM.saveEventBtn.addEventListener('click', addEvent);

    DOM.eventTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addEvent();
    });

    DOM.themeToggle.addEventListener('click', toggleTheme);
}

// ===== Initialize =====
function init() {
    initTheme();
    initEventListeners();
    renderCalendar();
}

document.addEventListener('DOMContentLoaded', init);
