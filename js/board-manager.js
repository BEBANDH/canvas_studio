// === BOARD MANAGEMENT ===

function renderBoardList() {
    const boardSelector = document.getElementById('boardSelector');
    if (!boardSelector) return;

    // Clear existing options except the first placeholder
    boardSelector.innerHTML = '<option value="">Select Board</option>';

    if (AppState.boardMetadata.length === 0) {
        return;
    }

    AppState.boardMetadata.forEach(meta => {
        const option = document.createElement('option');
        option.value = meta.id;
        option.textContent = meta.title || "Untitled";
        if (meta.id === AppState.activeBoardId) {
            option.selected = true;
        }
        boardSelector.appendChild(option);
    });
}

function loadBoard(id) {
    AppState.activeBoardId = id;

    // Load full board data on-demand (cached after first load)
    AppState.activeBoard = StorageManager.loadBoardData(id);

    const canvas = document.getElementById('canvas');
    canvas.innerHTML = '<div id="selectionBox" class="selection-box"></div>';

    const activeTitle = document.getElementById('activeBoardTitle');
    activeTitle.innerText = AppState.activeBoard.title || "Untitled";

    // Clear selection count
    SelectionManager.updateSelectionCount();

    // Ensure elements array exists
    if (!AppState.activeBoard.elements) AppState.activeBoard.elements = [];

    // OPTIMIZATION 3: DOCUMENT FRAGMENTS - Build everything in memory first
    const fragment = document.createDocumentFragment();

    AppState.activeBoard.elements.forEach(el => {
        try {
            const domElement = ElementManager.createElementDOM(el);
            fragment.appendChild(domElement);
        } catch (e) {
            console.warn("Skipping corrupted element:", el);
        }
    });

    // Single DOM insertion - prevents multiple reflows
    canvas.appendChild(fragment);

    renderBoardList(); // Update dropdown
}

function deleteBoard(id) {
    if (AppState.boardMetadata.length <= 1) {
        alert("Cannot delete the last board!");
        return;
    }

    StorageManager.deleteBoard(id);
    AppState.boardMetadata = AppState.boardMetadata.filter(m => m.id !== id);

    if (AppState.activeBoardId === id) {
        AppState.activeBoardId = AppState.boardMetadata[0]?.id || 'default';
        if (!AppState.activeBoardId || AppState.boardMetadata.length === 0) {
            AppState.boardMetadata = [{ id: 'default', title: 'Main Board', category: '' }];
            AppState.activeBoardId = 'default';
            StorageManager.updateBoard('default', { title: 'Main Board', elements: [] });
        }
        loadBoard(AppState.activeBoardId);
    }

    renderBoardList();
}

// Export functions
window.BoardManager = {
    renderBoardList,
    loadBoard,
    deleteBoard
};
