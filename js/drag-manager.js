// === DRAG & DROP MANAGEMENT ===

let dragState = null;
let ghostElement = null;

function startDrag(el, startX, startY) {
    const id = el.dataset.id;
    const rect = el.getBoundingClientRect();
    const isImage = el.classList.contains('img-type');

    // Check if dragging a multi-selected element
    const isDraggingMultiple = AppState.selectedElements.includes(id);

    // Only create ghost for text elements, not images
    if (!isImage && !isDraggingMultiple) {
        ghostElement = el.cloneNode(true);
        ghostElement.className = el.className + ' drag-ghost';
        ghostElement.style.position = 'fixed';
        ghostElement.style.left = rect.left + 'px';
        ghostElement.style.top = rect.top + 'px';
        ghostElement.style.width = rect.width + 'px';
        ghostElement.style.height = rect.height + 'px';
        ghostElement.style.pointerEvents = 'none';
        document.body.appendChild(ghostElement);

        el.classList.add('being-dragged');
    }

    const initialX = parseFloat(el.dataset.x) || 0;
    const initialY = parseFloat(el.dataset.y) || 0;

    dragState = {
        element: el,
        id: id,
        startMouseX: startX,
        startMouseY: startY,
        initialX: initialX,
        initialY: initialY,
        width: rect.width,
        height: rect.height,
        isImage: isImage,
        isDraggingMultiple: isDraggingMultiple,
        multipleElements: isDraggingMultiple ? getMultipleElementsData() : null
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
}

function getMultipleElementsData() {
    return AppState.selectedElements.map(id => {
        const el = document.querySelector(`[data-id="${id}"]`);
        return {
            id: id,
            element: el,
            initialX: parseFloat(el.dataset.x) || 0,
            initialY: parseFloat(el.dataset.y) || 0
        };
    });
}

function handleDragMove(e) {
    if (!dragState) return;

    const deltaX = e.clientX - dragState.startMouseX;
    const deltaY = e.clientY - dragState.startMouseY;

    if (dragState.isDraggingMultiple) {
        // Move all selected elements
        dragState.multipleElements.forEach(item => {
            const newX = item.initialX + deltaX;
            const newY = item.initialY + deltaY;
            item.element.style.left = newX + 'px';
            item.element.style.top = newY + 'px';
        });
    } else if (dragState.isImage) {
        // For images, move the element directly
        const newX = dragState.initialX + deltaX;
        const newY = dragState.initialY + deltaY;
        dragState.element.style.left = newX + 'px';
        dragState.element.style.top = newY + 'px';
    } else if (ghostElement) {
        // For text, move the ghost with transform (GPU accelerated)
        ghostElement.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
    }
}

function handleDragEnd(e) {
    if (!dragState) return;

    const deltaX = e.clientX - dragState.startMouseX;
    const deltaY = e.clientY - dragState.startMouseY;

    if (dragState.isDraggingMultiple) {
        // Update all selected elements
        dragState.multipleElements.forEach(item => {
            const newX = item.initialX + deltaX;
            const newY = item.initialY + deltaY;

            item.element.style.left = newX + 'px';
            item.element.style.top = newY + 'px';
            item.element.dataset.x = newX;
            item.element.dataset.y = newY;

            // Update in-memory data
            const elementData = AppState.activeBoard.elements.find(el => el.id == item.id);
            if (elementData) {
                elementData.x = newX;
                elementData.y = newY;
            }

            // Update arrows connected to this element
            if (typeof ArrowManager !== 'undefined') {
                ArrowManager.updateArrowsForElement(item.id);
            }
        });

        // Save all changes
        StorageManager.updateBoard(AppState.activeBoardId, AppState.activeBoard);
    } else {
        const newX = dragState.initialX + deltaX;
        const newY = dragState.initialY + deltaY;

        // Update actual element position
        dragState.element.style.left = newX + 'px';
        dragState.element.style.top = newY + 'px';
        dragState.element.dataset.x = newX;
        dragState.element.dataset.y = newY;

        // Remove dragging state (only for text elements with ghost)
        if (!dragState.isImage) {
            dragState.element.classList.remove('being-dragged');
        }

        // OPTIMIZATION 2: Differential saving - only save changed properties
        StorageManager.savePatch(AppState.activeBoardId, dragState.id, { x: newX, y: newY });

        // Update in-memory data
        const elementData = AppState.activeBoard.elements.find(el => el.id == dragState.id);
        if (elementData) {
            elementData.x = newX;
            elementData.y = newY;
        }

        // Update arrows connected to this element
        if (typeof ArrowManager !== 'undefined') {
            ArrowManager.updateArrowsForElement(dragState.id);
        }
    }

    // Remove ghost (only exists for text elements)
    if (ghostElement) {
        ghostElement.remove();
        ghostElement = null;
    }

    ElementManager.updateSaveStatus();

    // Cleanup
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    dragState = null;
}

// === RESIZE MANAGEMENT ===

let resizeState = null;

function startResize(el, handle, startX, startY) {
    const id = el.dataset.id;
    const rect = el.getBoundingClientRect();

    resizeState = {
        element: el,
        id: id,
        startWidth: rect.width,
        startHeight: rect.height,
        startMouseX: startX,
        startMouseY: startY
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
}

function handleResizeMove(e) {
    if (!resizeState) return;

    const deltaX = e.clientX - resizeState.startMouseX;
    const deltaY = e.clientY - resizeState.startMouseY;

    const newWidth = Math.max(50, resizeState.startWidth + deltaX);
    const newHeight = Math.max(30, resizeState.startHeight + deltaY);

    resizeState.element.style.width = newWidth + 'px';
    resizeState.element.style.height = newHeight + 'px';
}

function handleResizeEnd() {
    if (!resizeState) return;

    const w = parseInt(resizeState.element.style.width);
    const h = parseInt(resizeState.element.style.height);

    // OPTIMIZATION 2: Differential saving
    StorageManager.savePatch(AppState.activeBoardId, resizeState.id, { w, h });

    // Update in-memory data
    const elementData = AppState.activeBoard.elements.find(el => el.id == resizeState.id);
    if (elementData) {
        elementData.w = w;
        elementData.h = h;
    }

    // Update arrows connected to this element
    if (typeof ArrowManager !== 'undefined') {
        ArrowManager.updateArrowsForElement(resizeState.id);
    }

    ElementManager.updateSaveStatus();

    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    resizeState = null;
}

// Export functions
window.DragManager = {
    startDrag,
    startResize
};
