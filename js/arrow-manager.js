// === ARROW MANAGEMENT ===

let isDrawingArrow = false;
let arrowStartElement = null;
let arrowStartAnchor = null;
let tempArrowLine = null;

// Anchor points for connecting arrows (top, right, bottom, left)
const ANCHOR_POSITIONS = ['top', 'right', 'bottom', 'left'];

// Arrow styles
const ARROW_STYLES = {
    straight: 'straight',
    curved: 'curved',
    orthogonal: 'orthogonal'
};

let currentArrowStyle = ARROW_STYLES.straight;

// Create anchor points on an element
function createAnchorPoints(element) {
    // Remove existing anchors
    element.querySelectorAll('.arrow-anchor').forEach(a => a.remove());

    ANCHOR_POSITIONS.forEach(position => {
        const anchor = document.createElement('div');
        anchor.className = `arrow-anchor anchor-${position}`;
        anchor.dataset.position = position;
        anchor.dataset.action = 'anchor';
        element.appendChild(anchor);
    });
}

// Show anchor points on element
function showAnchors(element) {
    if (!element) return;
    createAnchorPoints(element);
    element.classList.add('show-anchors');
}

// Hide anchor points on element
function hideAnchors(element) {
    if (!element) return;
    element.classList.remove('show-anchors');
}

// Get anchor point coordinates
function getAnchorCoordinates(element, position) {
    const rect = element.getBoundingClientRect();
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();

    const scrollX = canvas.scrollLeft;
    const scrollY = canvas.scrollTop;

    const x = rect.left - canvasRect.left + scrollX;
    const y = rect.top - canvasRect.top + scrollY;
    const w = rect.width;
    const h = rect.height;

    switch (position) {
        case 'top':
            return { x: x + w / 2, y: y };
        case 'right':
            return { x: x + w, y: y + h / 2 };
        case 'bottom':
            return { x: x + w / 2, y: y + h };
        case 'left':
            return { x: x, y: y + h / 2 };
        default:
            return { x: x + w / 2, y: y + h / 2 };
    }
}

// Start drawing arrow
function startArrowDrawing(element, anchor) {
    isDrawingArrow = true;
    arrowStartElement = element;
    arrowStartAnchor = anchor.dataset.position;

    // Create temporary arrow line for visual feedback
    const canvas = document.getElementById('canvas');
    tempArrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempArrowLine.classList.add('temp-arrow-line');
    tempArrowLine.style.position = 'absolute';
    tempArrowLine.style.top = '0';
    tempArrowLine.style.left = '0';
    tempArrowLine.style.width = '100%';
    tempArrowLine.style.height = '100%';
    tempArrowLine.style.pointerEvents = 'none';
    tempArrowLine.style.zIndex = '999';

    canvas.appendChild(tempArrowLine);

    // Show all anchors on other elements
    document.querySelectorAll('.canvas-element').forEach(el => {
        if (el !== element) {
            showAnchors(el);
        }
    });
}

// Update temporary arrow line while dragging
function updateTempArrow(mouseX, mouseY) {
    if (!isDrawingArrow || !tempArrowLine) return;

    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    const scrollX = canvas.scrollLeft;
    const scrollY = canvas.scrollTop;

    const startCoords = getAnchorCoordinates(arrowStartElement, arrowStartAnchor);
    const endX = mouseX - canvasRect.left + scrollX;
    const endY = mouseY - canvasRect.top + scrollY;

    // Clear previous line
    tempArrowLine.innerHTML = '';

    // Draw line with temp styling
    const line = createArrowSVGPath(startCoords.x, startCoords.y, endX, endY, currentArrowStyle, true);
    tempArrowLine.appendChild(line);
}

// Finish drawing arrow
function finishArrowDrawing(targetElement, targetAnchor) {
    if (!isDrawingArrow) return;

    // Remove temporary line
    if (tempArrowLine) {
        tempArrowLine.remove();
        tempArrowLine = null;
    }

    // Hide all anchors
    document.querySelectorAll('.canvas-element').forEach(el => {
        hideAnchors(el);
    });

    // Create permanent arrow if we have a valid target
    if (targetElement && targetElement !== arrowStartElement) {
        const startCoords = getAnchorCoordinates(arrowStartElement, arrowStartAnchor);
        const endCoords = getAnchorCoordinates(targetElement, targetAnchor.dataset.position);

        // Calculate default control point (midpoint)
        const controlX = (startCoords.x + endCoords.x) / 2;
        const controlY = (startCoords.y + endCoords.y) / 2;

        const arrowData = {
            id: 'arrow-' + Date.now(),
            type: 'arrow',
            fromElement: arrowStartElement.dataset.id,
            fromAnchor: arrowStartAnchor,
            toElement: targetElement.dataset.id,
            toAnchor: targetAnchor.dataset.position,
            style: currentArrowStyle,
            controlPoint: { x: controlX, y: controlY }, // For bending
            color: '#666',
            strokeWidth: 2
        };

        // Add to board data
        AppState.activeBoard.elements.push(arrowData);
        StorageManager.updateBoard(AppState.activeBoardId, AppState.activeBoard);

        // Render the arrow
        renderArrow(arrowData);
        ElementManager.updateSaveStatus();
    }

    // Reset state
    isDrawingArrow = false;
    arrowStartElement = null;
    arrowStartAnchor = null;
}

// Cancel arrow drawing
function cancelArrowDrawing() {
    if (!isDrawingArrow) return;

    if (tempArrowLine) {
        tempArrowLine.remove();
        tempArrowLine = null;
    }

    document.querySelectorAll('.canvas-element').forEach(el => {
        hideAnchors(el);
    });

    isDrawingArrow = false;
    arrowStartElement = null;
    arrowStartAnchor = null;
}

// Create SVG path for arrow
function createArrowSVGPath(x1, y1, x2, y2, style, isTemp = false) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const marker = createArrowMarker();

    let pathData;

    if (style === ARROW_STYLES.straight) {
        pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
    } else if (style === ARROW_STYLES.curved) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const offset = Math.sqrt(dx * dx + dy * dy) * 0.2;
        const controlX = midX - dy * 0.2;
        const controlY = midY + dx * 0.2;
        pathData = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
    } else if (style === ARROW_STYLES.orthogonal) {
        const midX = (x1 + x2) / 2;
        pathData = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    }

    path.setAttribute('d', pathData);
    path.setAttribute('stroke', '#750cff'); // Accent color
    path.setAttribute('stroke-width', isTemp ? '2' : '1.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    path.setAttribute('opacity', isTemp ? '0.7' : '1');

    return path;
}

// Create arrow marker (arrowhead)
function createArrowMarker() {
    const canvas = document.getElementById('canvas');
    let defs = canvas.querySelector('defs');

    if (!defs) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.width = '0';
        svg.style.height = '0';
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
        canvas.appendChild(svg);
    }

    if (!defs.querySelector('#arrowhead')) {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,0 L0,6 L9,3 z');
        path.setAttribute('fill', '#750cff'); // Accent color to match arrow

        marker.appendChild(path);
        defs.appendChild(marker);
    }
}

// Render a single arrow
function renderArrow(arrowData) {
    const canvas = document.getElementById('canvas');
    const fromElement = canvas.querySelector(`[data-id="${arrowData.fromElement}"]`);
    const toElement = canvas.querySelector(`[data-id="${arrowData.toElement}"]`);

    if (!fromElement || !toElement) return;

    const startCoords = getAnchorCoordinates(fromElement, arrowData.fromAnchor);
    const endCoords = getAnchorCoordinates(toElement, arrowData.toAnchor);

    // Use control point if exists, otherwise calculate default
    let controlX, controlY;
    if (arrowData.controlPoint) {
        controlX = arrowData.controlPoint.x;
        controlY = arrowData.controlPoint.y;
    } else {
        controlX = (startCoords.x + endCoords.x) / 2;
        controlY = (startCoords.y + endCoords.y) / 2;
        arrowData.controlPoint = { x: controlX, y: controlY };
    }

    // Create SVG container for this arrow
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('arrow-element');
    svg.dataset.id = arrowData.id;
    svg.dataset.type = 'arrow';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';

    // Create path using quadratic bezier with control point
    const pathData = `M ${startCoords.x} ${startCoords.y} Q ${controlX} ${controlY} ${endCoords.x} ${endCoords.y}`;

    // Create invisible wider path for easier clicking
    const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitPath.setAttribute('d', pathData);
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('stroke-width', '12'); // Wide invisible hit area
    hitPath.setAttribute('fill', 'none');
    hitPath.style.pointerEvents = 'stroke';
    hitPath.style.cursor = 'pointer';
    hitPath.dataset.arrowId = arrowData.id;
    hitPath.classList.add('arrow-hit-area');

    // Create the visible path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', '#750cff');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');

    path.style.pointerEvents = 'none'; // Only hit area is clickable
    path.classList.add('arrow-path');
    path.dataset.arrowId = arrowData.id;

    // Add both paths to SVG
    svg.appendChild(hitPath);
    svg.appendChild(path);

    // Create control point handle
    const controlHandle = document.createElement('div');
    controlHandle.className = 'arrow-control-point';
    controlHandle.dataset.arrowId = arrowData.id;
    controlHandle.style.left = controlX + 'px';
    controlHandle.style.top = controlY + 'px';
    controlHandle.style.display = 'none';

    // Create delete button
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'arrow-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.dataset.arrowId = arrowData.id;
    deleteBtn.style.display = 'none';

    // Position delete button with offset from control point to avoid overlap
    deleteBtn.style.left = (controlX + 25) + 'px';
    deleteBtn.style.top = (controlY - 25) + 'px';
    deleteBtn.style.transform = 'translate(-50%, -50%)';

    canvas.appendChild(svg);
    canvas.appendChild(controlHandle);
    canvas.appendChild(deleteBtn);

    // Initial visibility check
    if (selectedArrowId === arrowData.id) {
        svg.classList.add('arrow-selected');
        deleteBtn.style.display = 'flex';
        controlHandle.style.display = 'block';
    }

    // Remove hover events - only show on selection
    // hitPath.addEventListener('mouseenter', ...);
    // hitPath.addEventListener('mouseleave', ...);

    // Delete button click handler
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteArrow(arrowData.id);
    });

    // Click to select arrow
    hitPath.addEventListener('click', (e) => {
        e.stopPropagation();
        const canvas = document.getElementById('canvas');
        if (canvas.classList.contains('arrow-mode')) {
            selectArrow(arrowData.id);
        }
    });

    // Control point dragging
    let isDraggingControl = false;

    controlHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        isDraggingControl = true;
        controlHandle.classList.add('dragging');

        const canvas = document.getElementById('canvas');
        const canvasRect = canvas.getBoundingClientRect();

        const handleMouseMove = (e) => {
            if (!isDraggingControl) return;

            const scrollX = canvas.scrollLeft;
            const scrollY = canvas.scrollTop;
            const newX = e.clientX - canvasRect.left + scrollX;
            const newY = e.clientY - canvasRect.top + scrollY;

            // Update control point position
            controlHandle.style.left = newX + 'px';
            controlHandle.style.top = newY + 'px';

            // Update delete button position with offset
            deleteBtn.style.left = (newX + 25) + 'px';
            deleteBtn.style.top = (newY - 25) + 'px';

            // Update arrow path
            const newPathData = `M ${startCoords.x} ${startCoords.y} Q ${newX} ${newY} ${endCoords.x} ${endCoords.y}`;
            path.setAttribute('d', newPathData);
            hitPath.setAttribute('d', newPathData);

            // Update arrow data
            arrowData.controlPoint = { x: newX, y: newY };
        };

        const handleMouseUp = () => {
            if (isDraggingControl) {
                isDraggingControl = false;
                controlHandle.classList.remove('dragging');

                // Save the new control point
                StorageManager.updateBoard(AppState.activeBoardId, AppState.activeBoard);
                ElementManager.updateSaveStatus();

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

// Helper function to get path data string
function getPathData(x1, y1, x2, y2, style) {
    if (style === ARROW_STYLES.straight) {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
    } else if (style === ARROW_STYLES.curved) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const controlX = midX - dy * 0.2;
        const controlY = midY + dx * 0.2;
        return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
    } else if (style === ARROW_STYLES.orthogonal) {
        const midX = (x1 + x2) / 2;
        return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    }
    return `M ${x1} ${y1} L ${x2} ${y2}`;
}

// Select arrow
let selectedArrowId = null;

function selectArrow(arrowId) {
    const canvas = document.getElementById('canvas');

    // Only allow selection in arrow mode
    if (!canvas.classList.contains('arrow-mode')) return;

    // Deselect previous
    if (selectedArrowId) {
        const prevArrow = document.querySelector(`.arrow-element[data-id="${selectedArrowId}"]`);
        if (prevArrow) prevArrow.classList.remove('arrow-selected');

        // Hide controls for previous
        const prevDelete = document.querySelector(`.arrow-delete-btn[data-arrow-id="${selectedArrowId}"]`);
        if (prevDelete) prevDelete.style.display = 'none';

        const prevControl = document.querySelector(`.arrow-control-point[data-arrow-id="${selectedArrowId}"]`);
        if (prevControl) prevControl.style.display = 'none';
    }

    // Toggle selection if clicking same arrow
    if (selectedArrowId === arrowId) {
        selectedArrowId = null;
        return;
    }

    // Select new
    selectedArrowId = arrowId;
    const arrow = document.querySelector(`.arrow-element[data-id="${arrowId}"]`);
    if (arrow) {
        arrow.classList.add('arrow-selected');

        // Show controls for new selection
        const newDelete = document.querySelector(`.arrow-delete-btn[data-arrow-id="${arrowId}"]`);
        if (newDelete) newDelete.style.display = 'flex';

        const newControl = document.querySelector(`.arrow-control-point[data-arrow-id="${arrowId}"]`);
        if (newControl) newControl.style.display = 'block';
    }
}

// Render all arrows
function renderAllArrows() {
    // Remove existing arrows, delete buttons, and control handles
    document.querySelectorAll('.arrow-element').forEach(el => el.remove());
    document.querySelectorAll('.arrow-delete-btn').forEach(el => el.remove());
    document.querySelectorAll('.arrow-control-point').forEach(el => el.remove());

    // Render each arrow
    if (AppState.activeBoard && AppState.activeBoard.elements) {
        AppState.activeBoard.elements
            .filter(el => el.type === 'arrow')
            .forEach(arrowData => renderArrow(arrowData));
    }
}

// Update arrows connected to a specific element
function updateArrowsForElement(elementId) {
    if (!AppState.activeBoard || !AppState.activeBoard.elements) return;

    const arrows = AppState.activeBoard.elements.filter(el =>
        el.type === 'arrow' &&
        (el.fromElement == elementId || el.toElement == elementId)
    );

    arrows.forEach(arrowData => {
        // Remove old arrow elements completely
        const oldArrow = document.querySelector(`.arrow-element[data-id="${arrowData.id}"]`);
        if (oldArrow) oldArrow.remove();

        const oldDelete = document.querySelector(`.arrow-delete-btn[data-arrow-id="${arrowData.id}"]`);
        if (oldDelete) oldDelete.remove();

        const oldControl = document.querySelector(`.arrow-control-point[data-arrow-id="${arrowData.id}"]`);
        if (oldControl) oldControl.remove();

        // Render updated arrow
        renderArrow(arrowData);
    });
}

// Delete arrow
function deleteArrow(arrowId) {
    AppState.activeBoard.elements = AppState.activeBoard.elements.filter(
        el => el.id !== arrowId
    );

    StorageManager.updateBoard(AppState.activeBoardId, AppState.activeBoard);

    // Remove arrow element
    const arrowElement = document.querySelector(`.arrow-element[data-id="${arrowId}"]`);
    if (arrowElement) arrowElement.remove();

    // Remove delete button
    const deleteBtn = document.querySelector(`.arrow-delete-btn[data-arrow-id="${arrowId}"]`);
    if (deleteBtn) deleteBtn.remove();

    // Remove control point
    const controlHandle = document.querySelector(`.arrow-control-point[data-arrow-id="${arrowId}"]`);
    if (controlHandle) controlHandle.remove();

    // Clear selection if this arrow was selected
    if (selectedArrowId === arrowId) {
        selectedArrowId = null;
    }

    ElementManager.updateSaveStatus();
}

// Delete all arrows connected to an element
function deleteArrowsForElement(elementId) {
    if (!AppState.activeBoard || !AppState.activeBoard.elements) return;

    const arrowsToDelete = AppState.activeBoard.elements
        .filter(el => el.type === 'arrow' && (el.fromElement == elementId || el.toElement == elementId))
        .map(el => el.id);

    arrowsToDelete.forEach(arrowId => deleteArrow(arrowId));
}

// Set arrow style
function setArrowStyle(style) {
    if (ARROW_STYLES[style]) {
        currentArrowStyle = style;
    }
}

// Toggle arrow mode
function toggleArrowMode() {
    const canvas = document.getElementById('canvas');
    const isArrowMode = canvas.classList.contains('arrow-mode');

    if (isArrowMode) {
        // Disable arrow mode
        canvas.classList.remove('arrow-mode');
        document.querySelectorAll('.canvas-element').forEach(el => {
            hideAnchors(el);
        });

        // Clear arrow selection and hide controls
        if (selectedArrowId) {
            const prevArrow = document.querySelector(`.arrow-element[data-id="${selectedArrowId}"]`);
            if (prevArrow) prevArrow.classList.remove('arrow-selected');

            const prevDelete = document.querySelector(`.arrow-delete-btn[data-arrow-id="${selectedArrowId}"]`);
            if (prevDelete) prevDelete.style.display = 'none';

            const prevControl = document.querySelector(`.arrow-control-point[data-arrow-id="${selectedArrowId}"]`);
            if (prevControl) prevControl.style.display = 'none';

            selectedArrowId = null;
        }

        return false;
    } else {
        // Enable arrow mode
        canvas.classList.add('arrow-mode');
        document.querySelectorAll('.canvas-element').forEach(el => {
            showAnchors(el);
        });
        return true;
    }
}

// Export functions
window.ArrowManager = {
    startArrowDrawing,
    updateTempArrow,
    finishArrowDrawing,
    cancelArrowDrawing,
    renderArrow,
    renderAllArrows,
    updateArrowsForElement,
    deleteArrow,
    deleteArrowsForElement,
    setArrowStyle,
    toggleArrowMode,
    showAnchors,
    hideAnchors,
    get isDrawingArrow() { return isDrawingArrow; }
};
