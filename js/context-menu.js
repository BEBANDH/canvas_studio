// === CONTEXT MENU MANAGEMENT ===

let contextMenuTarget = null;

function showContextMenu(element, x, y) {
    const contextMenu = document.getElementById('contextMenu');
    contextMenuTarget = element;
    contextMenu.classList.add('active');

    // Position menu
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';

    // Adjust if menu goes off screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        contextMenu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = (y - rect.height) + 'px';
    }
}

function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.classList.remove('active');
    contextMenuTarget = null;
}

function handleContextMenuAction(action) {
    const id = contextMenuTarget?.dataset.id;
    if (!id) return;

    // Check if operating on multiple elements
    const isMultiSelect = AppState.selectedElements.includes(id);

    switch (action) {
        case 'delete':
            if (isMultiSelect) {
                ElementManager.removeSelectedElements();
            } else {
                ElementManager.removeElement(id);
            }
            break;
        case 'duplicate':
            if (isMultiSelect) {
                ElementManager.duplicateSelectedElements();
            } else {
                ElementManager.duplicateElement(id);
            }
            break;
        case 'bring-forward':
            if (isMultiSelect) {
                // Bring all selected forward
                AppState.selectedElements.forEach(selectedId => {
                    ElementManager.bringForward(selectedId);
                });
            } else {
                ElementManager.bringForward(id);
            }
            break;
        case 'send-backward':
            if (isMultiSelect) {
                // Send all selected backward
                AppState.selectedElements.forEach(selectedId => {
                    ElementManager.sendBackward(selectedId);
                });
            } else {
                ElementManager.sendBackward(id);
            }
            break;
    }

    hideContextMenu();
}

// Export functions
window.ContextMenuManager = {
    showContextMenu,
    hideContextMenu,
    handleContextMenuAction
};
