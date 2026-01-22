const StorageManager = {
    saveTimer: null,
    boardCache: {},
    pendingPatches: {},

    loadMetadata() {
        try {
            const data = localStorage.getItem('moodboards');
            if (!data) {
                return this.migrateAndGetMetadata();
            }

            const parsed = JSON.parse(data);

            if (parsed.metadata && parsed.boards) {
                return parsed.metadata;
            }

            return this.migrateAndGetMetadata();
        } catch (e) {
            console.error("Error loading metadata:", e);
            return [{ id: 'default', title: 'Main Board' }];
        }
    },

    loadBoardData(boardId) {
        if (this.boardCache[boardId]) {
            return this.boardCache[boardId];
        }

        try {
            const data = localStorage.getItem('moodboards');
            if (!data) return { title: 'Main Board', elements: [] };

            const parsed = JSON.parse(data);

            if (parsed.boards && parsed.boards[boardId]) {
                this.boardCache[boardId] = parsed.boards[boardId];
                return parsed.boards[boardId];
            }

            if (parsed[boardId]) {
                this.boardCache[boardId] = parsed[boardId];
                return parsed[boardId];
            }

            return { title: 'Untitled', elements: [] };
        } catch (e) {
            console.error("Error loading board data:", e);
            return { title: 'Error', elements: [] };
        }
    },

    migrateAndGetMetadata() {
        try {
            const data = localStorage.getItem('moodboards');
            if (!data) {
                const initial = { 'default': { title: 'Main Board', elements: [] } };
                this.saveFullState(initial);
                return [{ id: 'default', title: 'Main Board' }];
            }

            const oldFormat = JSON.parse(data);

            if (oldFormat.metadata && oldFormat.boards) {
                return oldFormat.metadata;
            }

            const metadata = [];
            const boards = {};

            Object.keys(oldFormat).forEach(id => {
                metadata.push({
                    id: id,
                    title: oldFormat[id].title || 'Untitled'
                });
                boards[id] = {
                    title: oldFormat[id].title || 'Untitled',
                    elements: oldFormat[id].elements || []
                };
            });

            const newFormat = { metadata, boards };
            localStorage.setItem('moodboards', JSON.stringify(newFormat));

            return metadata;
        } catch (e) {
            console.error("Migration error:", e);
            return [{ id: 'default', title: 'Main Board' }];
        }
    },

    savePatch(boardId, elementId, changes) {
        if (!this.pendingPatches[boardId]) {
            this.pendingPatches[boardId] = {};
        }
        if (!this.pendingPatches[boardId][elementId]) {
            this.pendingPatches[boardId][elementId] = {};
        }

        Object.assign(this.pendingPatches[boardId][elementId], changes);

        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.flushPatches(), 200);
    },

    flushPatches() {
        if (Object.keys(this.pendingPatches).length === 0) return;

        try {
            const data = localStorage.getItem('moodboards');
            const state = data ? JSON.parse(data) : { metadata: [], boards: {} };

            if (!state.boards) {
                state.boards = {};
                state.metadata = [];
            }

            Object.keys(this.pendingPatches).forEach(boardId => {
                if (!state.boards[boardId]) return;

                Object.keys(this.pendingPatches[boardId]).forEach(elementId => {
                    const element = state.boards[boardId].elements.find(el => el.id == elementId);
                    if (element) {
                        Object.assign(element, this.pendingPatches[boardId][elementId]);
                    }
                });

                if (this.boardCache[boardId]) {
                    Object.keys(this.pendingPatches[boardId]).forEach(elementId => {
                        const element = this.boardCache[boardId].elements.find(el => el.id == elementId);
                        if (element) {
                            Object.assign(element, this.pendingPatches[boardId][elementId]);
                        }
                    });
                }
            });

            localStorage.setItem('moodboards', JSON.stringify(state));
            this.pendingPatches = {};
            console.log("Patches applied successfully.");
        } catch (e) {
            console.error("Patch save failed:", e);
        }
    },

    saveFullState(boards) {
        try {
            let state;
            if (boards.metadata && boards.boards) {
                state = boards;
            } else {
                const metadata = [];
                const boardsObj = {};

                Object.keys(boards).forEach(id => {
                    metadata.push({
                        id: id,
                        title: boards[id].title || 'Untitled'
                    });
                    boardsObj[id] = boards[id];
                });

                state = { metadata, boards: boardsObj };
            }

            localStorage.setItem('moodboards', JSON.stringify(state));
            console.log("Full state synchronized.");
        } catch (e) {
            console.error("Full save failed:", e);
        }
    },

    updateBoard(boardId, boardData) {
        try {
            const data = localStorage.getItem('moodboards');
            const state = data ? JSON.parse(data) : { metadata: [], boards: {} };

            if (!state.boards) {
                state.boards = {};
                state.metadata = [];
            }

            state.boards[boardId] = boardData;

            const metaIndex = state.metadata.findIndex(m => m.id === boardId);
            if (metaIndex >= 0) {
                state.metadata[metaIndex].title = boardData.title;
            } else {
                state.metadata.push({ id: boardId, title: boardData.title });
            }

            this.boardCache[boardId] = boardData;

            localStorage.setItem('moodboards', JSON.stringify(state));
        } catch (e) {
            console.error("Board update failed:", e);
        }
    },

    deleteBoard(boardId) {
        try {
            const data = localStorage.getItem('moodboards');
            const state = data ? JSON.parse(data) : { metadata: [], boards: {} };

            if (state.boards) {
                delete state.boards[boardId];
                state.metadata = state.metadata.filter(m => m.id !== boardId);
            } else {
                delete state[boardId];
            }

            delete this.boardCache[boardId];

            localStorage.setItem('moodboards', JSON.stringify(state));
        } catch (e) {
            console.error("Board deletion failed:", e);
        }
    },

    exportJSON(board) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(board));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", (board.title || "board") + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    },

    exportPDF(canvasElement, title) {
        console.log('Starting PNG export...');

        const elements = canvasElement.querySelectorAll('.canvas-element');
        const arrows = canvasElement.querySelectorAll('.arrow-element');
        console.log('Found elements:', elements.length, 'arrows:', arrows.length);

        if (elements.length === 0) {
            alert('No elements to export! Add some text or images first.');
            return;
        }

        const controls = canvasElement.querySelectorAll('.del-btn, .color-picker-btn, .resize-handle, .selection-box, .arrow-anchor, .arrow-delete-btn');
        controls.forEach(ctrl => ctrl.style.display = 'none');

        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;

        elements.forEach(el => {
            const x = parseFloat(el.style.left) || 0;
            const y = parseFloat(el.style.top) || 0;
            const w = parseFloat(el.style.width) || 100;
            const h = parseFloat(el.style.height) || 100;

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
        });

        const padding = 50;
        const width = (maxX - minX) + (padding * 2);
        const height = (maxY - minY) + (padding * 2);

        console.log('Export dimensions:', width, 'x', height);

        const exportWrapper = document.createElement('div');
        exportWrapper.style.cssText = `
            position: absolute;
            left: -9999px;
            top: 0;
            width: ${width}px;
            height: ${height}px;
            background-color: #ffffff;
        `;

        // Clone elements
        elements.forEach(el => {
            const clone = el.cloneNode(true);
            clone.querySelectorAll('.del-btn, .color-picker-btn, .resize-handle, .arrow-anchor').forEach(c => c.remove());

            const x = parseFloat(el.style.left) || 0;
            const y = parseFloat(el.style.top) || 0;
            const w = parseFloat(el.style.width) || el.offsetWidth;
            const h = parseFloat(el.style.height) || el.offsetHeight;

            // Get computed styles to preserve exact appearance
            const computedStyle = window.getComputedStyle(el);

            clone.style.position = 'absolute';
            clone.style.left = (x - minX + padding) + 'px';
            clone.style.top = (y - minY + padding) + 'px';
            clone.style.width = w + 'px';
            clone.style.height = h + 'px';

            // Copy critical style properties to prevent layout shifts
            clone.style.padding = computedStyle.padding;
            clone.style.boxSizing = computedStyle.boxSizing;
            clone.style.margin = '0';
            clone.style.border = computedStyle.border;
            clone.style.display = computedStyle.display;
            clone.style.alignItems = computedStyle.alignItems;
            clone.style.justifyContent = computedStyle.justifyContent;
            clone.style.transform = 'none';

            clone.classList.remove('selected', 'multi-selected');

            exportWrapper.appendChild(clone);
        });

        // Create SVG container for arrows
        const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgContainer.setAttribute('width', width);
        svgContainer.setAttribute('height', height);
        svgContainer.style.position = 'absolute';
        svgContainer.style.left = '0';
        svgContainer.style.top = '0';
        svgContainer.style.pointerEvents = 'none';

        // Create arrowhead marker definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'export-arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');

        const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowPath.setAttribute('d', 'M0,0 L0,6 L9,3 z');
        arrowPath.setAttribute('fill', '#750cff');
        marker.appendChild(arrowPath);
        defs.appendChild(marker);
        svgContainer.appendChild(defs);

        // Render arrows from arrow data
        if (window.AppState && window.AppState.activeBoard && window.AppState.activeBoard.elements) {
            const arrowData = window.AppState.activeBoard.elements.filter(el => el.type === 'arrow');

            arrowData.forEach(arrow => {
                // Find the cloned elements in export wrapper
                const fromElement = Array.from(exportWrapper.querySelectorAll('.canvas-element'))
                    .find(el => el.dataset.id === arrow.fromElement);
                const toElement = Array.from(exportWrapper.querySelectorAll('.canvas-element'))
                    .find(el => el.dataset.id === arrow.toElement);

                if (!fromElement || !toElement) return;

                // Calculate anchor coordinates in export wrapper coordinate system
                const getAnchorPos = (element, position) => {
                    const x = parseFloat(element.style.left) || 0;
                    const y = parseFloat(element.style.top) || 0;
                    const w = parseFloat(element.style.width) || 100;
                    const h = parseFloat(element.style.height) || 100;

                    switch (position) {
                        case 'top': return { x: x + w / 2, y: y };
                        case 'right': return { x: x + w, y: y + h / 2 };
                        case 'bottom': return { x: x + w / 2, y: y + h };
                        case 'left': return { x: x, y: y + h / 2 };
                        default: return { x: x + w / 2, y: y + h / 2 };
                    }
                };

                const startPos = getAnchorPos(fromElement, arrow.fromAnchor);
                const endPos = getAnchorPos(toElement, arrow.toAnchor);

                // Use control point if exists, otherwise calculate default
                let controlX, controlY;
                if (arrow.controlPoint) {
                    controlX = arrow.controlPoint.x - minX + padding;
                    controlY = arrow.controlPoint.y - minY + padding;
                } else {
                    controlX = (startPos.x + endPos.x) / 2;
                    controlY = (startPos.y + endPos.y) / 2;
                }

                // Create arrow path using quadratic bezier
                const pathData = `M ${startPos.x} ${startPos.y} Q ${controlX} ${controlY} ${endPos.x} ${endPos.y}`;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathData);
                path.setAttribute('stroke', '#750cff');
                path.setAttribute('stroke-width', '1.5');
                path.setAttribute('fill', 'none');
                path.setAttribute('marker-end', 'url(#export-arrowhead)');

                svgContainer.appendChild(path);
            });
        }

        exportWrapper.appendChild(svgContainer);

        document.body.appendChild(exportWrapper);

        setTimeout(() => {
            html2canvas(exportWrapper, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: width,
                height: height
            }).then(canvas => {
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = (title || 'board') + '.png';
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);

                    console.log('PNG exported successfully!');

                    document.body.removeChild(exportWrapper);
                    controls.forEach(ctrl => ctrl.style.display = '');
                }, 'image/png', 1.0);
            }).catch(err => {
                console.error('Export failed:', err);
                alert('Export failed: ' + err.message);
                if (document.body.contains(exportWrapper)) {
                    document.body.removeChild(exportWrapper);
                }
                controls.forEach(ctrl => ctrl.style.display = '');
            });
        }, 100);
    },

    exportViewport(canvasElement, title) {
        console.log('Starting viewport screenshot export...');

        // Hide UI controls temporarily
        const controls = canvasElement.querySelectorAll('.del-btn, .color-picker-btn, .resize-handle, .selection-box, .arrow-anchor, .arrow-delete-btn, .arrow-control-point');
        controls.forEach(ctrl => ctrl.style.display = 'none');

        // Remove selection highlighting
        const selectedElements = canvasElement.querySelectorAll('.selected, .multi-selected, .arrow-selected');
        const originalClasses = Array.from(selectedElements).map(el => ({
            el,
            classes: [...el.classList]
        }));
        selectedElements.forEach(el => {
            el.classList.remove('selected', 'multi-selected', 'arrow-selected');
        });

        // Wait a moment for the DOM to update
        setTimeout(() => {
            html2canvas(canvasElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: canvasElement.clientWidth,
                height: canvasElement.clientHeight,
                scrollX: -canvasElement.scrollLeft,
                scrollY: -canvasElement.scrollTop,
                windowWidth: canvasElement.scrollWidth,
                windowHeight: canvasElement.scrollHeight
            }).then(canvas => {
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = (title || 'board') + '-viewport.png';
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);

                    console.log('Viewport screenshot exported successfully!');

                    // Restore controls and selection
                    controls.forEach(ctrl => ctrl.style.display = '');
                    originalClasses.forEach(({ el, classes }) => {
                        classes.forEach(cls => {
                            if (['selected', 'multi-selected', 'arrow-selected'].includes(cls)) {
                                el.classList.add(cls);
                            }
                        });
                    });
                }, 'image/png', 1.0);
            }).catch(err => {
                console.error('Export failed:', err);
                alert('Export failed: ' + err.message);
                controls.forEach(ctrl => ctrl.style.display = '');
                originalClasses.forEach(({ el, classes }) => {
                    classes.forEach(cls => {
                        if (['selected', 'multi-selected', 'arrow-selected'].includes(cls)) {
                            el.classList.add(cls);
                        }
                    });
                });
            });
        }, 100);
    }
};