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
        console.log('Found elements:', elements.length);

        if (elements.length === 0) {
            alert('No elements to export! Add some text or images first.');
            return;
        }

        const controls = canvasElement.querySelectorAll('.del-btn, .color-picker-btn, .resize-handle, .selection-box');
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

        elements.forEach(el => {
            const clone = el.cloneNode(true);
            clone.querySelectorAll('.del-btn, .color-picker-btn, .resize-handle').forEach(c => c.remove());

            const x = parseFloat(el.style.left) || 0;
            const y = parseFloat(el.style.top) || 0;

            clone.style.position = 'absolute';
            clone.style.left = (x - minX + padding) + 'px';
            clone.style.top = (y - minY + padding) + 'px';
            clone.classList.remove('selected', 'multi-selected');

            exportWrapper.appendChild(clone);
        });

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
    }
};