// === SELECTION MANAGEMENT ===

let selectionBoxState = null;

function clearMultiSelect() {
    AppState.selectedElements = [];
    document.querySelectorAll('.multi-selected').forEach(el => {
        el.classList.remove('multi-selected');
    });
    updateSelectionCount();
}

function addToSelection(id) {
    if (!AppState.selectedElements.includes(id)) {
        AppState.selectedElements.push(id);
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.add('multi-selected');
        }
        updateSelectionCount();
    }
}

function removeFromSelection(id) {
    AppState.selectedElements = AppState.selectedElements.filter(sid => sid !== id);
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
        element.classList.remove('multi-selected');
    }
    updateSelectionCount();
}

function updateSelectionCount() {
    const titleElement = document.getElementById('activeBoardTitle');
    const count = AppState.selectedElements.length;

    if (count > 0) {
        const baseTitle = AppState.activeBoard?.title || "Untitled";
        titleElement.innerHTML = `${baseTitle} <span style="color: var(--accent); font-size: 14px; font-weight: normal;">(${count} selected)</span>`;
    } else {
        titleElement.innerText = AppState.activeBoard?.title || "Untitled";
    }
}

function startSelectionBox(startX, startY) {
    const selectionBox = document.getElementById('selectionBox');

    selectionBoxState = {
        startX: startX,
        startY: startY,
        currentX: startX,
        currentY: startY
    };

    selectionBox.classList.add('active');
    updateSelectionBoxVisual();

    document.addEventListener('mousemove', handleSelectionMove);
    document.addEventListener('mouseup', handleSelectionEnd);
}

function handleSelectionMove(e) {
    if (!selectionBoxState) return;

    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    selectionBoxState.currentX = e.clientX - canvasRect.left + canvas.scrollLeft;
    selectionBoxState.currentY = e.clientY - canvasRect.top + canvas.scrollTop;

    updateSelectionBoxVisual();
}

function updateSelectionBoxVisual() {
    if (!selectionBoxState) return;

    const selectionBox = document.getElementById('selectionBox');
    const left = Math.min(selectionBoxState.startX, selectionBoxState.currentX);
    const top = Math.min(selectionBoxState.startY, selectionBoxState.currentY);
    const width = Math.abs(selectionBoxState.currentX - selectionBoxState.startX);
    const height = Math.abs(selectionBoxState.currentY - selectionBoxState.startY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
}

function handleSelectionEnd() {
    if (!selectionBoxState) return;

    const selectionBox = document.getElementById('selectionBox');

    // Get elements within selection box
    const boxRect = {
        left: Math.min(selectionBoxState.startX, selectionBoxState.currentX),
        top: Math.min(selectionBoxState.startY, selectionBoxState.currentY),
        right: Math.max(selectionBoxState.startX, selectionBoxState.currentX),
        bottom: Math.max(selectionBoxState.startY, selectionBoxState.currentY)
    };

    AppState.selectedElements = [];
    document.querySelectorAll('.canvas-element').forEach(el => {
        const x = parseFloat(el.dataset.x);
        const y = parseFloat(el.dataset.y);
        const w = parseFloat(el.style.width);
        const h = parseFloat(el.style.height);

        const elRect = { left: x, top: y, right: x + w, bottom: y + h };

        if (checkOverlap(boxRect, elRect)) {
            AppState.selectedElements.push(el.dataset.id);
            el.classList.add('multi-selected');
        }
    });

    updateSelectionCount();

    // Hide selection box
    selectionBox.classList.remove('active');
    selectionBoxState = null;

    document.removeEventListener('mousemove', handleSelectionMove);
    document.removeEventListener('mouseup', handleSelectionEnd);
}

function checkOverlap(rect1, rect2) {
    return !(rect1.right <= rect2.left ||
        rect1.left >= rect2.right ||
        rect1.bottom <= rect2.top ||
        rect1.top >= rect2.bottom);
}

// Export functions
window.SelectionManager = {
    clearMultiSelect,
    addToSelection,
    removeFromSelection,
    updateSelectionCount,
    startSelectionBox,
    checkOverlap
};
