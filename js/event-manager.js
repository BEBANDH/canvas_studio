// === EVENT DELEGATION & HANDLERS ===

function setupCanvasEventDelegation() {
    const canvas = document.getElementById('canvas');

    // Click events
    canvas.addEventListener('click', (e) => {
        const colorBtn = e.target.closest('.color-picker-btn');
        if (colorBtn) {
            e.stopPropagation();
            const element = colorBtn.closest('.canvas-element');
            if (element) {
                const rect = colorBtn.getBoundingClientRect();
                SettingsManager.showColorPicker(element, rect.left, rect.bottom + 5);
            }
            return;
        }

        const deleteBtn = e.target.closest('.del-btn');
        if (deleteBtn) {
            e.stopPropagation();
            const element = deleteBtn.closest('.canvas-element');
            if (element) {
                ElementManager.removeElement(element.dataset.id);
            }
            return;
        }

        const canvasElement = e.target.closest('.canvas-element');
        if (canvasElement) {
            e.stopPropagation();

            // Multi-select with Ctrl
            if (e.ctrlKey || e.metaKey) {
                const id = canvasElement.dataset.id;
                if (AppState.selectedElements.includes(id)) {
                    SelectionManager.removeFromSelection(id);
                } else {
                    SelectionManager.addToSelection(id);
                }
            } else {
                // Single select
                SelectionManager.clearMultiSelect();
                AppState.selectedId = canvasElement.dataset.id;
                document.querySelectorAll('.canvas-element').forEach(item => item.classList.remove('selected'));
                canvasElement.classList.add('selected');
            }
        } else if (e.target === canvas) {
            // Clicked on empty canvas
            SelectionManager.clearMultiSelect();
            AppState.selectedId = null;
            document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        }
    });

    // Mouse down for dragging, resizing, and selection box
    canvas.addEventListener('mousedown', (e) => {
        const resizeHandle = e.target.closest('.resize-handle');
        if (resizeHandle) {
            const element = resizeHandle.closest('.canvas-element');
            if (element) {
                e.preventDefault();
                e.stopPropagation();
                DragManager.startResize(element, resizeHandle, e.clientX, e.clientY);
            }
            return;
        }

        if (e.target.contentEditable === "true") {
            return;
        }

        if (e.target.closest('.del-btn') || e.target.closest('.color-picker-btn')) {
            return;
        }

        const canvasElement = e.target.closest('.canvas-element');
        if (canvasElement) {
            e.preventDefault();
            DragManager.startDrag(canvasElement, e.clientX, e.clientY);
            return;
        }

        // Start selection box
        if (e.target === canvas || e.target.id === 'selectionBox') {
            const canvasRect = canvas.getBoundingClientRect();
            const startX = e.clientX - canvasRect.left + canvas.scrollLeft;
            const startY = e.clientY - canvasRect.top + canvas.scrollTop;
            SelectionManager.startSelectionBox(startX, startY);
        }
    });

    // Input events for text editing
    canvas.addEventListener('input', (e) => {
        if (e.target.contentEditable === "true") {
            const element = e.target.closest('.canvas-element');
            if (element) {
                const id = element.dataset.id;
                const content = e.target.innerText;

                StorageManager.savePatch(AppState.activeBoardId, id, { content });

                const elementData = AppState.activeBoard.elements.find(el => el.id == id);
                if (elementData) {
                    elementData.content = content;
                }

                ElementManager.updateSaveStatus();
            }
        }
    });
}

function setupHeaderAutoHide() {
    let lastScrollTop = 0;
    const header = document.querySelector('.workspace-header');
    const canvas = document.getElementById('canvas');

    canvas.addEventListener('scroll', () => {
        const scrollTop = canvas.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header.classList.add('hidden');
        } else {
            // Scrolling up
            header.classList.remove('hidden');
        }

        lastScrollTop = scrollTop;
    });
}

function setupEventListeners() {
    setupCanvasEventDelegation();

    // Theme toggle
    document.getElementById('themeToggleBtn').onclick = SettingsManager.toggleTheme;

    // Context menu actions
    document.querySelectorAll('.context-menu-item').forEach(item => {
        item.onclick = () => {
            ContextMenuManager.handleContextMenuAction(item.dataset.action);
        };
    });

    // Hide context menu on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#contextMenu') && !e.target.closest('.canvas-element')) {
            ContextMenuManager.hideContextMenu();
        }
    });

    // Prevent default context menu
    document.getElementById('canvas').addEventListener('contextmenu', (e) => {
        const element = e.target.closest('.canvas-element');
        if (element) {
            e.preventDefault();
            ContextMenuManager.showContextMenu(element, e.clientX, e.clientY);
        }
    });

    // Color picker
    document.querySelectorAll('.color-option').forEach(option => {
        option.onclick = () => {
            SettingsManager.applyColor(option.dataset.color);
        };
    });

    // Click outside color picker to close
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#colorPicker') && !e.target.closest('.color-picker-btn')) {
            SettingsManager.hideColorPicker();
        }
    });

    // New Board
    document.getElementById('newBoardBtn').onclick = () => {
        const id = 'b' + Date.now();
        const newBoard = { title: 'New Board', elements: [] };

        AppState.boardMetadata.push({ id, title: 'New Board', category: '' });
        StorageManager.updateBoard(id, newBoard);
        BoardManager.loadBoard(id);
    };

    // Board Selector
    const boardSelector = document.getElementById('boardSelector');
    if (boardSelector) {
        boardSelector.onchange = (e) => {
            const selectedId = e.target.value;
            if (selectedId) {
                BoardManager.loadBoard(selectedId);
            }
        };
    }

    // Rename Board
    document.getElementById('renameBoardBtn').onclick = () => {
        const name = prompt('Rename to:', AppState.activeBoard.title);
        if (name) {
            AppState.activeBoard.title = name;

            const meta = AppState.boardMetadata.find(m => m.id === AppState.activeBoardId);
            if (meta) meta.title = name;

            StorageManager.updateBoard(AppState.activeBoardId, AppState.activeBoard);
            BoardManager.renderBoardList();
            document.getElementById('activeBoardTitle').innerText = name;
        }
    };

    // Delete Board
    const deleteBoardBtn = document.getElementById('deleteBoardBtn');
    if (deleteBoardBtn) {
        deleteBoardBtn.onclick = () => {
            if (confirm(`Delete "${AppState.activeBoard.title}"? This cannot be undone.`)) {
                BoardManager.deleteBoard(AppState.activeBoardId);
            }
        };
    }

    // Double-click to create text element
    document.getElementById('canvas').ondblclick = (e) => {
        if (e.target !== document.getElementById('canvas')) return;

        const id = Date.now();
        const canvas = document.getElementById('canvas');
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left + canvas.scrollLeft;
        const y = e.clientY - canvasRect.top + canvas.scrollTop;

        const data = {
            id,
            type: 'text',
            content: 'New Idea...',
            x: x,
            y: y,
            w: 180,
            h: 100,
            color: 'default'
        };

        ElementManager.addElement(data);
    };

    // Paste image with compression
    window.addEventListener('paste', async (e) => {
        const item = Array.from(e.clipboardData.items).find(x => x.type.startsWith('image'));
        if (item) {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const compressed = await SettingsManager.compressImage(ev.target.result);

                const data = {
                    id: Date.now(),
                    type: 'img',
                    content: compressed,
                    x: 50,
                    y: 50,
                    w: 250,
                    h: 180
                };
                ElementManager.addElement(data);
            };
            reader.readAsDataURL(item.getAsFile());
        }
    });

    // Delete selected element(s)
    window.onkeydown = (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && (AppState.selectedId || AppState.selectedElements.length > 0)) {
            if (document.activeElement.contentEditable === "true") return;
            ElementManager.removeSelectedElements();
        }

        // Escape to clear selection
        if (e.key === 'Escape') {
            SelectionManager.clearMultiSelect();
            AppState.selectedId = null;
            document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        }
    };

    // Export/Import
    document.getElementById('exportJsonBtn').onclick = () => StorageManager.exportJSON(AppState.activeBoard);
    document.getElementById('exportPdfBtn').onclick = () => StorageManager.exportPDF(document.getElementById('canvas'), AppState.activeBoard.title);

    document.getElementById('importBtn').onclick = () => document.getElementById('fileInput').click();
    document.getElementById('fileInput').onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const id = 'imp' + Date.now();
                const importedBoard = JSON.parse(ev.target.result);

                AppState.boardMetadata.push({ id, title: importedBoard.title || 'Imported Board', category: '' });
                StorageManager.updateBoard(id, importedBoard);
                BoardManager.loadBoard(id);
            } catch (err) {
                alert("Corrupted JSON file.");
            }
        };
        reader.readAsText(e.target.files[0]);
    };
}

// Export functions
window.EventManager = {
    setupEventListeners,
    setupHeaderAutoHide
};
