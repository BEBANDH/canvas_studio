// === ELEMENT MANAGEMENT ===

function createElementDOM(data) {
    const el = document.createElement('div');
    el.className = `canvas-element ${data.type}-type`;

    // Store position in data attributes
    el.dataset.id = data.id;
    el.dataset.x = data.x || 0;
    el.dataset.y = data.y || 0;

    // Initial positioning
    el.style.left = (data.x || 0) + 'px';
    el.style.top = (data.y || 0) + 'px';
    el.style.width = (data.w || 150) + 'px';
    el.style.height = (data.h || 80) + 'px';

    const del = document.createElement('div');
    del.className = 'del-btn';
    del.innerHTML = '&times;';
    del.dataset.action = 'delete';

    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.dataset.action = 'resize';

    const content = document.createElement('div');
    content.className = 'element-content';
    content.style.width = '100%';
    content.style.height = '100%';

    if (data.type === 'text') {
        content.contentEditable = true;
        content.innerText = data.content || "";
        content.dataset.action = 'edit';

        // Apply color theme
        if (data.color) {
            el.dataset.color = data.color;
        }

        // Apply shape
        if (data.shape) {
            el.classList.add(`shape-${data.shape}`);
            el.dataset.shape = data.shape;
        } else {
            el.classList.add('shape-rectangle');
            el.dataset.shape = 'rectangle';
        }

        // Add color picker button
        const colorBtn = document.createElement('div');
        colorBtn.className = 'color-picker-btn';
        colorBtn.innerHTML = '🎨';
        colorBtn.dataset.action = 'color';
        el.appendChild(colorBtn);
    } else {
        content.innerHTML = `<img src="${data.content}" style="width:100%; height:100%; pointer-events:none;">`;
    }

    el.append(del, content, handle);
    return el;
}

function removeElement(id) {
    AppState.activeBoard.elements = AppState.activeBoard.elements.filter(e => e.id != id);
    StorageManager.updateBoard(AppState.activeBoardId, AppState.activeBoard);
    BoardManager.loadBoard(AppState.activeBoardId);
    updateSaveStatus();
}

function removeSelectedElements() {
    if (AppState.selectedElements.length > 0) {
        AppState.activeBoard.elements = AppState.activeBoard.elements.filter(e =>
            !AppState.selectedElements.includes(e.id.toString())
        );
        StorageManager.updateBoard(AppState.activeBoardId, AppState.activeBoard);
        BoardManager.loadBoard(AppState.activeBoardId);
        SelectionManager.clearMultiSelect();
        updateSaveStatus();
    } else if (AppState.selectedId) {
        removeElement(AppState.selectedId);
        AppState.selectedId = null;
    }
}

function addElement(data) {
    AppState.activeBoard.elements.push(data);
    StorageManager.updateBoard(AppState.activeBoardId, AppState.activeBoard);

    const canvas = document.getElementById('canvas');
    const domElement = createElementDOM(data);
    canvas.appendChild(domElement);
    updateSaveStatus();
}

function duplicateElement(id) {
    const original = AppState.activeBoard.elements.find(el => el.id == id);
    if (!original) return;

    const duplicate = {
        ...original,
        id: Date.now(),
        x: original.x + 20,
        y: original.y + 20
    };

    addElement(duplicate);
}

function duplicateSelectedElements() {
    if (AppState.selectedElements.length === 0) return;

    const newElements = [];
    AppState.selectedElements.forEach(id => {
        const original = AppState.activeBoard.elements.find(el => el.id == id);
        if (original) {
            newElements.push({
                ...original,
                id: Date.now() + newElements.length,
                x: original.x + 20,
                y: original.y + 20
            });
        }
    });

    newElements.forEach(el => addElement(el));
}

function bringForward(id) {
    const index = AppState.activeBoard.elements.findIndex(el => el.id == id);
    if (index < AppState.activeBoard.elements.length - 1) {
        const temp = AppState.activeBoard.elements[index];
        AppState.activeBoard.elements[index] = AppState.activeBoard.elements[index + 1];
        AppState.activeBoard.elements[index + 1] = temp;
        StorageManager.updateBoard(AppState.activeBoardId, AppState.activeBoard);
        BoardManager.loadBoard(AppState.activeBoardId);
    }
}

function sendBackward(id) {
    const index = AppState.activeBoard.elements.findIndex(el => el.id == id);
    if (index > 0) {
        const temp = AppState.activeBoard.elements[index];
        AppState.activeBoard.elements[index] = AppState.activeBoard.elements[index - 1];
        AppState.activeBoard.elements[index - 1] = temp;
        StorageManager.updateBoard(AppState.activeBoardId, AppState.activeBoard);
        BoardManager.loadBoard(AppState.activeBoardId);
    }
}

function updateSaveStatus() {
    const status = document.getElementById('saveStatus');
    if (status) {
        status.innerText = 'Saving...';
        setTimeout(() => status.innerText = 'Synced', 1000);
    }
}

function renderElements() {
    const canvas = document.getElementById('canvas');
    const elements = canvas.querySelectorAll('.canvas-element');
    elements.forEach(el => el.remove());

    if (AppState.activeBoard && AppState.activeBoard.elements) {
        AppState.activeBoard.elements.forEach(data => {
            const domElement = createElementDOM(data);
            canvas.appendChild(domElement);
        });
    }
}

function deleteElement(id) {
    removeElement(id);
}

// Export functions
window.ElementManager = {
    createElementDOM,
    removeElement,
    removeSelectedElements,
    addElement,
    duplicateElement,
    duplicateSelectedElements,
    bringForward,
    sendBackward,
    updateSaveStatus,
    renderElements,
    deleteElement
};
