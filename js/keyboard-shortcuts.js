// === KEYBOARD SHORTCUTS MANAGER ===

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        const ctrl = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();

        // Ctrl + N: New Board
        if (ctrl && key === 'n') {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('newBoardBtn')?.click();
            return;
        }

        // Ctrl + D: Duplicate selected elements
        if (ctrl && key === 'd') {
            e.preventDefault();
            e.stopPropagation();
            duplicateSelected();
            return;
        }

        // Delete: Delete selected elements
        if (key === 'delete') {
            e.preventDefault();
            e.stopPropagation();
            deleteSelected();
            return;
        }

        // Ctrl + A: Select all elements
        if (ctrl && key === 'a') {
            e.preventDefault();
            e.stopPropagation();
            selectAll();
            return;
        }

        // Ctrl + S: Save (already auto-saves, but show feedback)
        if (ctrl && key === 's') {
            e.preventDefault();
            e.stopPropagation();
            showSaveFeedback();
            return;
        }

        // Ctrl + Z: Undo
        if (ctrl && key === 'z' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            undo();
            return;
        }

        // Ctrl + Y or Ctrl + Shift + Z: Redo
        if ((ctrl && key === 'y') || (ctrl && e.shiftKey && key === 'z')) {
            e.preventDefault();
            e.stopPropagation();
            redo();
            return;
        }

        // Arrow keys: Move selected elements
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            e.preventDefault();
            e.stopPropagation();
            moveSelected(key);
            return;
        }

        // Esc: Deselect all
        if (key === 'escape') {
            e.preventDefault();
            e.stopPropagation();
            SelectionManager.clearSelection();
            return;
        }

        // T: Add text element
        if (key === 't') {
            e.preventDefault();
            e.stopPropagation();
            addTextElement();
            return;
        }

        // I: Add image element
        if (key === 'i') {
            e.preventDefault();
            e.stopPropagation();
            addImageElement();
            return;
        }

        // A: Toggle arrow mode
        if (key === 'a') {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('arrowModeBtn')?.click();
            return;
        }
    }, true); // Use capture phase to intercept before browser
}

function duplicateSelected() {
    const selected = SelectionManager.getSelectedElements();
    if (selected.length === 0) return;

    selected.forEach(element => {
        const action = { action: 'duplicate' };
        window.ContextMenuManager?.handleAction(action, element);
    });
}

function deleteSelected() {
    const selected = SelectionManager.getSelectedElements();
    if (selected.length === 0) return;

    selected.forEach(element => {
        ElementManager.deleteElement(element.dataset.id);
    });
    SelectionManager.clearSelection();
}

function selectAll() {
    const canvas = document.getElementById('canvas');
    const elements = canvas.querySelectorAll('.canvas-element');

    SelectionManager.clearSelection();
    elements.forEach(element => {
        SelectionManager.addToSelection(element);
    });
}

function showSaveFeedback() {
    const saveStatus = document.getElementById('saveStatus');
    if (saveStatus) {
        saveStatus.textContent = 'Saved!';
        setTimeout(() => {
            saveStatus.textContent = 'Synced';
        }, 1500);
    }
}

// Undo/Redo functionality (simple implementation)
let undoStack = [];
let redoStack = [];
const MAX_UNDO_STACK = 50;

function saveState() {
    if (!AppState.activeBoard) return;

    const state = JSON.parse(JSON.stringify(AppState.activeBoard.elements));
    undoStack.push(state);

    if (undoStack.length > MAX_UNDO_STACK) {
        undoStack.shift();
    }

    // Clear redo stack when new action is performed
    redoStack = [];
}

function undo() {
    if (undoStack.length === 0) return;

    // Save current state to redo stack
    const currentState = JSON.parse(JSON.stringify(AppState.activeBoard.elements));
    redoStack.push(currentState);

    // Restore previous state
    const previousState = undoStack.pop();
    AppState.activeBoard.elements = previousState;

    // Re-render canvas
    ElementManager.renderElements();
    StorageManager.saveBoard(AppState.activeBoardId, AppState.activeBoard);
}

function redo() {
    if (redoStack.length === 0) return;

    // Save current state to undo stack
    const currentState = JSON.parse(JSON.stringify(AppState.activeBoard.elements));
    undoStack.push(currentState);

    // Restore next state
    const nextState = redoStack.pop();
    AppState.activeBoard.elements = nextState;

    // Re-render canvas
    ElementManager.renderElements();
    StorageManager.saveBoard(AppState.activeBoardId, AppState.activeBoard);
}

function moveSelected(direction) {
    const selected = SelectionManager.getSelectedElements();
    if (selected.length === 0) return;

    const moveAmount = 10; // pixels

    selected.forEach(element => {
        const id = element.dataset.id;
        const elementData = AppState.activeBoard.elements.find(el => el.id == id);

        if (!elementData) return;

        switch (direction) {
            case 'arrowup':
                elementData.y -= moveAmount;
                break;
            case 'arrowdown':
                elementData.y += moveAmount;
                break;
            case 'arrowleft':
                elementData.x -= moveAmount;
                break;
            case 'arrowright':
                elementData.x += moveAmount;
                break;
        }

        element.style.left = elementData.x + 'px';
        element.style.top = elementData.y + 'px';

        StorageManager.savePatch(AppState.activeBoardId, id, { x: elementData.x, y: elementData.y });
    });

    ElementManager.updateSaveStatus();
}

function addTextElement() {
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();

    // Add text at center of viewport
    const x = canvas.scrollLeft + rect.width / 2 - 100;
    const y = canvas.scrollTop + rect.height / 2 - 50;

    ElementManager.addElement('text', x, y);
}

function addImageElement() {
    // Trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target.result;
            const compressed = await SettingsManager.compressImage(dataUrl);

            const canvas = document.getElementById('canvas');
            const rect = canvas.getBoundingClientRect();

            const x = canvas.scrollLeft + rect.width / 2 - 100;
            const y = canvas.scrollTop + rect.height / 2 - 100;

            ElementManager.addElement('img', x, y, compressed);
        };
        reader.readAsDataURL(file);
    };

    input.click();
}

// Export functions
window.KeyboardShortcutsManager = {
    initKeyboardShortcuts,
    saveState,
    undo,
    redo
};
