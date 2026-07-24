/**
 * Floating Dock Toolbar Component with Template, Export & Shortcuts Toolkit Actions
 */

import { stateStore } from '../core/StateStore.js';
import { historyManager } from '../core/HistoryManager.js';
import { compressImage } from '../utils/helpers.js';
import { viewportManager } from '../canvas/ViewportManager.js';
import { interactionEngine } from '../canvas/InteractionEngine.js';
import { templateGallery } from './TemplateGallery.js';
import { shortcutsModal } from './ShortcutsModal.js';
import { exportBoardAsSVG } from '../utils/Exporter.js';

class Toolbar {
  constructor() {
    this.el = null;
    this.shapePopup = null;
    this.colorPopup = null;
  }

  init(toolbarContainerEl) {
    this.el = toolbarContainerEl;
    this.render();

    stateStore.subscribe('activeTool', (tool) => this.updateActiveStates(tool));
    stateStore.subscribe('theme', (theme) => this.updateThemeIcon(theme));
  }

  render() {
    this.el.className = 'floating-toolbar';
    this.el.innerHTML = `
      <button class="tool-btn active" data-tool="select" title="Select (V)"><i class="fas fa-mouse-pointer"></i></button>
      <button class="tool-btn" data-tool="pan" title="Pan Canvas (H)"><i class="fas fa-hand-paper"></i></button>
      <div class="toolbar-divider"></div>
      <button class="tool-btn" data-tool="text" title="Add Note (T)"><i class="fas fa-sticky-note"></i></button>
      <button class="tool-btn" id="shapeToolBtn" data-tool="shape" title="Add Shape"><i class="fas fa-shapes"></i></button>
      <button class="tool-btn" id="colorToolBtn" title="Color Theme"><i class="fas fa-palette"></i></button>
      <button class="tool-btn" data-tool="arrow" title="Draw Connector (A)"><i class="fas fa-long-arrow-alt-right"></i></button>
      <button class="tool-btn" id="imageUploadBtn" title="Upload Image"><i class="fas fa-image"></i></button>
      <input type="file" id="imageFileInput" hidden accept="image/*">
      <div class="toolbar-divider"></div>
      <button class="tool-btn" id="templateGalleryBtn" title="Template Blueprints (📑)"><i class="fas fa-file-alt"></i></button>
      <button class="tool-btn" id="exportSvgBtn" title="Export Vector SVG"><i class="fas fa-file-code"></i></button>
      <button class="tool-btn" id="shortcutsBtn" title="Shortcuts Toolkit (?)"><i class="fas fa-question-circle"></i></button>
      <div class="toolbar-divider"></div>
      <button class="tool-btn" id="undoBtn" title="Undo (Ctrl+Z)"><i class="fas fa-undo"></i></button>
      <button class="tool-btn" id="redoBtn" title="Redo (Ctrl+Y)"><i class="fas fa-redo"></i></button>
      <div class="toolbar-divider"></div>
      <button class="tool-btn" id="themeToggleBtn" title="Toggle Theme"><i class="fas fa-moon" id="themeIcon"></i></button>
    `;

    this.createPopups();
    this.attachEvents();
  }

  createPopups() {
    this.shapePopup = document.createElement('div');
    this.shapePopup.className = 'shape-picker-popup hidden';
    this.shapePopup.innerHTML = `
      <button class="shape-opt-btn active" data-shape="rectangle" title="Rectangle"><i class="far fa-square"></i></button>
      <button class="shape-opt-btn" data-shape="circle" title="Circle"><i class="far fa-circle"></i></button>
      <button class="shape-opt-btn" data-shape="diamond" title="Diamond"><i class="fas fa-rhombus"></i></button>
      <button class="shape-opt-btn" data-shape="triangle" title="Triangle"><i class="fas fa-caret-up"></i></button>
      <button class="shape-opt-btn" data-shape="hexagon" title="Hexagon"><i class="fas fa-cube"></i></button>
      <button class="shape-opt-btn" data-shape="star" title="Star"><i class="far fa-star"></i></button>
    `;
    this.el.parentNode.appendChild(this.shapePopup);

    this.colorPopup = document.createElement('div');
    this.colorPopup.className = 'color-picker-popup hidden';
    this.colorPopup.innerHTML = `
      <div class="color-dot" data-color="default" style="background:#1e1e24;" title="Default"></div>
      <div class="color-dot" data-color="yellow" style="background:#fef9c3;" title="Yellow"></div>
      <div class="color-dot" data-color="purple" style="background:#f3e8ff;" title="Purple"></div>
      <div class="color-dot" data-color="blue" style="background:#dbeafe;" title="Blue"></div>
      <div class="color-dot" data-color="green" style="background:#dcfce7;" title="Green"></div>
      <div class="color-dot" data-color="pink" style="background:#fce7f3;" title="Pink"></div>
      <div class="color-dot" data-color="orange" style="background:#ffedd5;" title="Orange"></div>
      <div class="color-dot" data-color="teal" style="background:#ccfbf1;" title="Teal"></div>
      <div class="color-dot" data-color="violet" style="background:#e0e7ff;" title="Violet"></div>
      <div class="color-dot" data-color="coral" style="background:#ffe4e6;" title="Coral"></div>
      <div class="color-dot" data-color="sand" style="background:#f5f5f4;" title="Sand"></div>
      <div class="color-dot" data-color="bw" style="background:#18181b;" title="Charcoal"></div>
    `;
    this.el.parentNode.appendChild(this.colorPopup);
  }

  attachEvents() {
    this.el.addEventListener('click', (e) => {
      const btn = e.target.closest('.tool-btn');
      if (!btn) return;

      if (btn.id === 'shapeToolBtn') {
        this.shapePopup.classList.toggle('hidden');
        this.colorPopup.classList.add('hidden');
        stateStore.setTool('shape');
        return;
      }

      if (btn.id === 'colorToolBtn') {
        this.colorPopup.classList.toggle('hidden');
        this.shapePopup.classList.add('hidden');
        return;
      }

      this.shapePopup.classList.add('hidden');
      this.colorPopup.classList.add('hidden');

      if (btn.id === 'templateGalleryBtn') {
        templateGallery.show();
        return;
      }

      if (btn.id === 'shortcutsBtn') {
        shortcutsModal.show();
        return;
      }

      if (btn.id === 'exportSvgBtn') {
        exportBoardAsSVG();
        return;
      }

      const tool = btn.dataset.tool;
      if (tool) stateStore.setTool(tool);
    });

    this.shapePopup.addEventListener('click', (e) => {
      const optBtn = e.target.closest('.shape-opt-btn');
      if (!optBtn) return;

      const shape = optBtn.dataset.shape;
      stateStore.setState({ activeShapeType: shape, activeTool: 'shape' });
      this.shapePopup.querySelectorAll('.shape-opt-btn').forEach((b) => b.classList.remove('active'));
      optBtn.classList.add('active');
      this.shapePopup.classList.add('hidden');
    });

    this.colorPopup.addEventListener('click', (e) => {
      const dot = e.target.closest('.color-dot');
      if (!dot) return;

      const color = dot.dataset.color;
      stateStore.setState({ activeColor: color });

      const selectedIds = stateStore.getState().selectedIds;
      if (selectedIds.length > 0) {
        historyManager.saveSnapshot();
        selectedIds.forEach((id) => stateStore.updateElement(id, { color }));
      }

      this.colorPopup.classList.add('hidden');
    });

    const fileInput = this.el.querySelector('#imageFileInput');
    const uploadBtn = this.el.querySelector('#imageUploadBtn');

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const base64 = await compressImage(file);
      const centerWorld = viewportManager.screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
      interactionEngine.createNode('image', centerWorld.x, centerWorld.y, {
        content: base64,
        width: 240,
        height: 180
      });
      fileInput.value = '';
    });

    this.el.querySelector('#undoBtn').addEventListener('click', () => historyManager.undo());
    this.el.querySelector('#redoBtn').addEventListener('click', () => historyManager.redo());

    this.el.querySelector('#themeToggleBtn').addEventListener('click', () => {
      const currentTheme = stateStore.getState().theme;
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      stateStore.setTheme(newTheme);
    });
  }

  updateActiveStates(tool) {
    this.el.querySelectorAll('.tool-btn').forEach((btn) => {
      if (btn.dataset.tool === tool) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  updateThemeIcon(theme) {
    const icon = this.el.querySelector('#themeIcon');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
  }
}

export const toolbar = new Toolbar();
