// === MAIN APPLICATION ===

function init() {
    try {
        // Load settings
        SettingsManager.loadSettings();

        // Apply theme
        SettingsManager.applyTheme(AppState.settings.theme);

        // OPTIMIZATION 1: LAZY LOADING - Load only metadata, not full boards
        AppState.boardMetadata = StorageManager.loadMetadata();

        // Set initial active board
        AppState.activeBoardId = AppState.boardMetadata[0]?.id || 'default';
        if (!AppState.activeBoardId) {
            AppState.boardMetadata = [{ id: 'default', title: 'Main Board', category: '' }];
            AppState.activeBoardId = 'default';
        }

        BoardManager.renderBoardList();
        BoardManager.loadBoard(AppState.activeBoardId);
        EventManager.setupEventListeners();
        EventManager.setupHeaderAutoHide();

        console.log("Canvas Studio Initialized Successfully");
    } catch (err) {
        console.error("Initialization error:", err);
    }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
