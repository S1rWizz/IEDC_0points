/**
 * Shared data management layer using localStorage + BroadcastChannel
 * for real-time sync between Home and Admin pages.
 */

const STORAGE_KEY = 'iedc_quiz_data';
const CHANNEL_NAME = 'iedc_quiz_sync';

// Categories for the Jeopardy board (no Rajagiri)
const CATEGORIES = ['Sports', 'Tech', 'Entertainment'];
const POINT_VALUES = [20, 40, 80, 100];

// BroadcastChannel for real-time cross-tab sync
let channel;
try {
    channel = new BroadcastChannel(CHANNEL_NAME);
} catch (e) {
    console.warn('BroadcastChannel not supported, falling back to storage events');
}

/**
 * Get the current quiz data from localStorage
 */
function getData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const defaults = {
            teams: [],
            selectedPoints: 20,
            revealedCells: {} // track which jeopardy cells have been used: "cat-points" -> true
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
    }
    return JSON.parse(raw);
}

/**
 * Save quiz data and broadcast to other tabs
 */
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (channel) {
        channel.postMessage({ type: 'DATA_UPDATE', data });
    }
}

/**
 * Add a new team
 */
function addTeam(name) {
    const data = getData();
    if (data.teams.find(t => t.name.toLowerCase() === name.toLowerCase())) {
        return false; // duplicate
    }
    data.teams.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: name,
        points: 1000
    });
    saveData(data);
    return true;
}

/**
 * Remove a team
 */
function removeTeam(teamId) {
    const data = getData();
    data.teams = data.teams.filter(t => t.id !== teamId);
    saveData(data);
}

/**
 * Award points to a team (subtract from their 1000 pool)
 * In Jeopardy: correct answer = keep points, wrong = lose points
 * Here: we subtract the question value on wrong, add on correct
 */
function modifyPoints(teamId, amount) {
    const data = getData();
    const team = data.teams.find(t => t.id === teamId);
    if (team) {
        team.points = Math.max(0, Math.min(2000, team.points + amount));
        saveData(data);
    }
}

/**
 * Set the currently selected point value for the round
 */
function setSelectedPoints(value) {
    const data = getData();
    data.selectedPoints = value;
    saveData(data);
}

/**
 * Mark a jeopardy cell as revealed
 */
function revealCell(category, points) {
    const data = getData();
    const key = `${category}-${points}`;
    data.revealedCells[key] = true;
    saveData(data);
}

/**
 * Reset a jeopardy cell
 */
function resetCell(category, points) {
    const data = getData();
    const key = `${category}-${points}`;
    delete data.revealedCells[key];
    saveData(data);
}

/**
 * Reset all data
 */
function resetAll() {
    const defaults = {
        teams: [],
        selectedPoints: 20,
        revealedCells: {}
    };
    saveData(defaults);
}

/**
 * Listen for data updates from other tabs
 */
function onDataUpdate(callback) {
    if (channel) {
        channel.onmessage = (e) => {
            if (e.data.type === 'DATA_UPDATE') {
                callback(e.data.data);
            }
        };
    }
    // Fallback: also listen for storage events
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            callback(JSON.parse(e.newValue));
        }
    });
}
