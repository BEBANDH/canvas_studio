// === SHAPE MANAGER ===

let currentShape = 'rectangle';

function initShapeSelector() {
    const shapeOptions = document.querySelectorAll('.shape-option');

    // Set default active shape
    document.querySelector('[data-shape="rectangle"]')?.classList.add('active');

    shapeOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active from all
            shapeOptions.forEach(opt => opt.classList.remove('active'));

            // Set active on clicked
            option.classList.add('active');

            // Update current shape
            currentShape = option.dataset.shape;
        });
    });
}

function applyShapeToElement(element, shape) {
    // Remove all shape classes
    const shapeClasses = ['shape-rectangle', 'shape-circle', 'shape-triangle',
        'shape-hexagon', 'shape-star', 'shape-diamond',
        'shape-rounded', 'shape-flower', 'shape-pentagon', 'shape-octagon'];

    shapeClasses.forEach(cls => element.classList.remove(cls));

    // Add new shape class
    element.classList.add(`shape-${shape}`);

    // Store shape in dataset
    element.dataset.shape = shape;

    // Save to storage
    const id = element.dataset.id;
    if (id && AppState.activeBoardId) {
        StorageManager.savePatch(AppState.activeBoardId, id, { shape });

        // Update in-memory data
        const elementData = AppState.activeBoard.elements.find(el => el.id == id);
        if (elementData) {
            elementData.shape = shape;
        }

        ElementManager.updateSaveStatus();
    }
}

// Export functions
window.ShapeManager = {
    initShapeSelector,
    applyShapeToElement,
    getCurrentShape: () => currentShape
};
