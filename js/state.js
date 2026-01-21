// === STATE MANAGEMENT ===
let boardMetadata = []; // Lightweight metadata only
let activeBoardId = null;
let activeBoard = null; // Full board data (loaded on demand)
let selectedId = null;
let selectedElements = []; // For multi-select

// === SETTINGS ===
let settings = {
    theme: 'dark'
};

// === COLOR PALETTE ===
const TEXT_COLORS = {
    default: { bg: '#1e1e1e', text: '#e0e0e0' },
    yellow: { bg: '#fef3c7', text: '#78350f' },
    purple: { bg: '#e9d5ff', text: '#581c87' },
    blue: { bg: '#dbeafe', text: '#1e3a8a' },
    green: { bg: '#d1fae5', text: '#065f46' },
    pink: { bg: '#fce7f3', text: '#831843' },
    orange: { bg: '#fed7aa', text: '#7c2d12' }
};

// Export state for other modules
window.AppState = {
    get boardMetadata() { return boardMetadata; },
    set boardMetadata(value) { boardMetadata = value; },
    get activeBoardId() { return activeBoardId; },
    set activeBoardId(value) { activeBoardId = value; },
    get activeBoard() { return activeBoard; },
    set activeBoard(value) { activeBoard = value; },
    get selectedId() { return selectedId; },
    set selectedId(value) { selectedId = value; },
    get selectedElements() { return selectedElements; },
    set selectedElements(value) { selectedElements = value; },
    get settings() { return settings; },
    set settings(value) { settings = value; },
    TEXT_COLORS
};
