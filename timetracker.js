let timeTrackerState = {
    productive: 0, // in seconds
    wasted: 0, // in seconds
    lastDate: null,
    activeCategory: null, // 'productive', 'wasted', or null
    lastTimestamp: null,
    history: [] // Array of { date: string, productive: number, wasted: number }
};

let timeTrackerInterval;

function initTimeTracker() {
    loadTimeTrackerData();
    updateTimeTrackerUI();

    // Start the interval if it's not already running
    if (!timeTrackerInterval) {
        timeTrackerInterval = setInterval(timeTrackerTick, 1000);
    }
}

function loadTimeTrackerData() {
    const saved = localStorage.getItem('timeTrackerData');
    const today = new Date().toDateString();

    if (saved) {
        timeTrackerState = JSON.parse(saved);

        // Ensure history exists (migration for existing users)
        if (!timeTrackerState.history) {
            timeTrackerState.history = [];
        }

        // Check for daily reset
        if (timeTrackerState.lastDate !== today) {
            // Save yesterday's data to history if it has any data
            if (timeTrackerState.productive > 0 || timeTrackerState.wasted > 0) {
                timeTrackerState.history.unshift({
                    date: timeTrackerState.lastDate,
                    productive: timeTrackerState.productive,
                    wasted: timeTrackerState.wasted
                });

                // Keep only last 30 days
                if (timeTrackerState.history.length > 30) {
                    timeTrackerState.history.pop();
                }
            }

            // Reset for today
            timeTrackerState.productive = 0;
            timeTrackerState.wasted = 0;
            timeTrackerState.lastDate = today;
            timeTrackerState.activeCategory = null;
            saveTimeTrackerData();
        }
    } else {
        timeTrackerState.lastDate = today;
        timeTrackerState.history = [];
    }
}

function saveTimeTrackerData() {
    localStorage.setItem('timeTrackerData', JSON.stringify(timeTrackerState));
}

function toggleTimeTracker(category) {
    if (timeTrackerState.activeCategory === category) {
        // Stop if clicking the active one
        timeTrackerState.activeCategory = null;
    } else {
        // Switch to new category
        timeTrackerState.activeCategory = category;
    }

    timeTrackerState.lastTimestamp = Date.now();
    saveTimeTrackerData();
    updateTimeTrackerUI();
}

function timeTrackerTick() {
    if (!timeTrackerState.activeCategory) return;

    // Increment time
    if (timeTrackerState.activeCategory === 'productive') {
        timeTrackerState.productive++;
    } else if (timeTrackerState.activeCategory === 'wasted') {
        timeTrackerState.wasted++;
    }

    saveTimeTrackerData();
    updateTimeTrackerUI();
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateTimeTrackerUI() {
    const prodBtn = document.getElementById('btnProductive');
    const wasteBtn = document.getElementById('btnWasted');
    const prodTime = document.getElementById('timeProductive');
    const wasteTime = document.getElementById('timeWasted');
    const totalTimeEl = document.getElementById('timeTotal');
    const dateEl = document.getElementById('trackerDate');

    if (!prodBtn) return; // UI not loaded yet

    // Update Date
    if (dateEl) {
        const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
        dateEl.innerText = new Date().toLocaleDateString('en-US', dateOptions);
    }

    prodTime.innerText = formatTime(timeTrackerState.productive);
    wasteTime.innerText = formatTime(timeTrackerState.wasted);

    const total = timeTrackerState.productive + timeTrackerState.wasted;
    totalTimeEl.innerText = `Total: ${formatTime(total)}`;

    // Update Visualization
    const barProd = document.getElementById('barProductive');
    const barWaste = document.getElementById('barWasted');
    const labelProd = document.getElementById('labelProductive');
    const labelWaste = document.getElementById('labelWasted');

    if (barProd && barWaste) {
        if (total === 0) {
            // Default state
            barProd.style.width = '50%';
            barWaste.style.width = '50%';
            barProd.style.opacity = '0.3';
            barWaste.style.opacity = '0.3';
            labelProd.innerText = '0%';
            labelWaste.innerText = '0%';
        } else {
            const prodPercent = (timeTrackerState.productive / total) * 100;
            const wastePercent = (timeTrackerState.wasted / total) * 100;

            barProd.style.width = `${prodPercent}%`;
            barWaste.style.width = `${wastePercent}%`;
            barProd.style.opacity = '1';
            barWaste.style.opacity = '1';

            labelProd.innerText = `${Math.round(prodPercent)}%`;
            labelWaste.innerText = `${Math.round(wastePercent)}%`;
        }
    }

    // Update button states
    if (timeTrackerState.activeCategory === 'productive') {
        prodBtn.classList.add('active');
        prodBtn.innerText = "Tracking Productive...";
        wasteBtn.classList.remove('active');
        wasteBtn.innerText = "Start Wasted";
    } else if (timeTrackerState.activeCategory === 'wasted') {
        wasteBtn.classList.add('active');
        wasteBtn.innerText = "Tracking Wasted...";
        prodBtn.classList.remove('active');
        prodBtn.innerText = "Start Productive";
    } else {
        prodBtn.classList.remove('active');
        prodBtn.innerText = "Start Productive";
        wasteBtn.classList.remove('active');
        wasteBtn.innerText = "Start Wasted";
    }
}

function showHistory() {
    const historyView = document.getElementById('trackerHistoryView');
    const historyList = document.getElementById('trackerHistoryList');

    historyList.innerHTML = '';

    if (timeTrackerState.history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No history yet. Start tracking!</div>';
    } else {
        timeTrackerState.history.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'history-item';

            // Calculate percentage
            const total = entry.productive + entry.wasted;
            const prodPercent = total > 0 ? Math.round((entry.productive / total) * 100) : 0;

            item.innerHTML = `
                <div class="history-date">${entry.date}</div>
                <div class="history-stats">
                    <div class="stat prod">
                        <span class="label">Productive</span>
                        <span class="value">${formatTime(entry.productive)}</span>
                    </div>
                    <div class="stat waste">
                        <span class="label">Wasted</span>
                        <span class="value">${formatTime(entry.wasted)}</span>
                    </div>
                </div>
                <div class="history-bar">
                    <div class="bar-fill" style="width: ${prodPercent}%"></div>
                </div>
            `;
            historyList.appendChild(item);
        });
    }

    historyView.classList.remove('hidden');
}

function closeHistory() {
    document.getElementById('trackerHistoryView').classList.add('hidden');
}

// Expose
window.initTimeTracker = initTimeTracker;
window.toggleTimeTracker = toggleTimeTracker;
window.showHistory = showHistory;
window.closeHistory = closeHistory;
