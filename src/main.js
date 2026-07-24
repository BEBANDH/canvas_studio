/**
 * Main Application Entry Point & Bootstrapper
 */

import { stateStore } from './core/StateStore.js';
import { storageAdapter } from './core/StorageAdapter.js';
import { authManager } from './core/AuthManager.js';
import { viewportManager } from './canvas/ViewportManager.js';
import { elementRenderer } from './canvas/ElementRenderer.js';
import { arrowRenderer } from './canvas/ArrowRenderer.js';
import { interactionEngine } from './canvas/InteractionEngine.js';
import { toolbar } from './components/Toolbar.js';
import { sidebar } from './components/Sidebar.js';
import { contextMenu } from './components/ContextMenu.js';
import { zoomWidget } from './components/ZoomWidget.js';
import { templateGallery } from './components/TemplateGallery.js';
import { shortcutsModal } from './components/ShortcutsModal.js';
import { alignToolbar } from './components/AlignToolbar.js';
import { arrowToolbar } from './components/ArrowToolbar.js';
import { exportBoardAsSVG, exportBoardAsPDF } from './utils/Exporter.js';
import { debounce } from './utils/helpers.js';

class Application {
  async init() {
    // 1. Initialize Theme
    const savedTheme = localStorage.getItem('canvas_studio_theme') || 'dark';
    stateStore.setTheme(savedTheme);

    // 2. DOM Containers
    const viewportEl = document.getElementById('canvasViewport');
    const worldEl = document.getElementById('canvasWorld');
    const svgEl = document.getElementById('svgOverlay');

    // 3. Initialize Engines & Renderers
    viewportManager.init(viewportEl, worldEl);
    elementRenderer.init(worldEl);
    arrowRenderer.init(svgEl);
    interactionEngine.init(viewportEl, worldEl);

    // 4. Initialize Components & Auth
    authManager.init();
    toolbar.init(document.getElementById('toolbarContainer'));
    sidebar.init(document.getElementById('sidebarDrawer'));
    contextMenu.init(document.getElementById('contextMenu'));
    zoomWidget.init(document.getElementById('zoomWidgetContainer'));
    templateGallery.init(document.getElementById('templateModalContainer'));
    shortcutsModal.init(document.getElementById('shortcutsModalContainer'));
    alignToolbar.init(document.getElementById('alignToolbarContainer'));
    arrowToolbar.init(document.getElementById('arrowToolbarContainer'));

    // 5. Header UI Listeners
    this.setupHeaderEvents();

    // 6. Persistence & Load Stored Boards
    await this.loadInitialData();
    this.setupAutoSave();
  }

  setupHeaderEvents() {
    const boardTitleInput = document.getElementById('boardTitleInput');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const importJsonBtn = document.getElementById('importJsonBtn');
    const importFileInput = document.getElementById('importFileInput');
    const exportSvgHeaderBtn = document.getElementById('exportSvgHeaderBtn');
    const exportPngBtn = document.getElementById('exportPngBtn');
    const headerTemplateBtn = document.getElementById('headerTemplateBtn');
    const headerShortcutsBtn = document.getElementById('headerShortcutsBtn');

    toggleSidebarBtn.addEventListener('click', () => {
      const isOpen = stateStore.getState().isSidebarOpen;
      stateStore.setState({ isSidebarOpen: !isOpen });
    });

    headerTemplateBtn.addEventListener('click', () => templateGallery.show());
    headerShortcutsBtn.addEventListener('click', () => shortcutsModal.show());

    boardTitleInput.addEventListener('change', (e) => {
      stateStore.updateActiveBoardTitle(e.target.value);
    });

    stateStore.subscribe('activeBoardId', () => {
      const { boards, activeBoardId } = stateStore.getState();
      const currentBoard = boards.find((b) => b.id === activeBoardId);
      if (currentBoard) {
        boardTitleInput.value = currentBoard.title || 'Untitled Board';
      }
    });

    exportJsonBtn.addEventListener('click', () => {
      const { boards, activeBoardId } = stateStore.getState();
      const currentBoard = boards.find((b) => b.id === activeBoardId);
      if (!currentBoard) return;

      const jsonStr = JSON.stringify(currentBoard, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentBoard.title || 'board'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    importJsonBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedBoard = JSON.parse(event.target.result);
          if (importedBoard && importedBoard.id) {
            const { boards } = stateStore.getState();
            stateStore.setBoards([...boards, importedBoard]);
            stateStore.setActiveBoard(importedBoard.id);
          }
        } catch (err) {
          alert('Invalid JSON board file.');
        }
      };
      reader.readAsText(file);
      importFileInput.value = '';
    });

    exportSvgHeaderBtn.addEventListener('click', () => exportBoardAsSVG());
    exportPngBtn.addEventListener('click', () => exportBoardAsPDF());
  }

  async loadInitialData() {
    const boards = await storageAdapter.loadAllBoards();
    if (boards && boards.length > 0) {
      stateStore.setBoards(boards);
      stateStore.setActiveBoard(boards[0].id);
    } else {
      const defaultBoard = stateStore.createBoard('My First Board');
      await storageAdapter.saveBoard(defaultBoard);
    }
  }

  setupAutoSave() {
    const saveStatusEl = document.getElementById('saveStatus');

    const debouncedSave = debounce(async () => {
      const { activeBoardId, elements, arrows, pan, zoom, boards } = stateStore.getState();
      if (!activeBoardId) return;

      const currentBoard = boards.find((b) => b.id === activeBoardId);
      if (!currentBoard) return;

      const updatedBoard = {
        ...currentBoard,
        elements,
        arrows,
        pan,
        zoom,
        updatedAt: Date.now()
      };

      saveStatusEl.innerText = 'Saving...';
      saveStatusEl.className = 'status-pill saving';

      const success = await storageAdapter.saveBoard(updatedBoard);

      if (success) {
        saveStatusEl.innerText = 'Saved';
        saveStatusEl.className = 'status-pill saved';
      } else {
        saveStatusEl.innerText = 'Error Saving';
        saveStatusEl.className = 'status-pill';
      }
    }, 600);

    stateStore.subscribe('elements', debouncedSave);
    stateStore.subscribe('arrows', debouncedSave);
    stateStore.subscribe('boards', debouncedSave);
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();
  app.init();
});
