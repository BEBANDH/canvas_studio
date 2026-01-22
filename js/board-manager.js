// === BOARD MANAGEMENT ===

const boardIcons = ['📋', '🎨', '💡', '📝', '🎯', '🚀', '⭐', '🔥', '💼', '🎪'];

function renderBoardList() {
    const boardList = document.getElementById('boardList');
    if (!boardList) return;

    boardList.innerHTML = '';

    if (AppState.boardMetadata.length === 0) {
        boardList.innerHTML = '<p style="text-align: center; color: var(--text-dim); font-size: 12px; padding: 20px 0;">No boards yet</p>';
        return;
    }

    AppState.boardMetadata.forEach((meta, index) => {
        const boardItem = document.createElement('button');
        boardItem.className = 'board-item';
        if (meta.id === AppState.activeBoardId) {
            boardItem.classList.add('active');
        }

        const icon = document.createElement('div');
        icon.className = 'board-icon';
        icon.textContent = boardIcons[index % boardIcons.length];

        const info = document.createElement('div');
        info.className = 'board-info';

        const name = document.createElement('p');
        name.className = 'board-name';
        name.textContent = meta.title || 'Untitled';

        info.appendChild(name);
        boardItem.appendChild(icon);
        boardItem.appendChild(info);

        boardItem.onclick = () => {
            BoardManager.loadBoard(meta.id);
        };

        boardList.appendChild(boardItem);
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
