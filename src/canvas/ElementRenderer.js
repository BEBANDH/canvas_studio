/**
 * ElementRenderer: Renders text cards, shapes, images, anchors, handles & lock badges
 */

import { stateStore } from '../core/StateStore.js';
import { historyManager } from '../core/HistoryManager.js';

class ElementRenderer {
  constructor() {
    this.container = null;
    this.renderedNodes = new Map(); // id -> DOMElement
  }

  init(containerEl) {
    this.container = containerEl;

    stateStore.subscribe('elements', (elements) => this.render(elements));
    stateStore.subscribe('selectedIds', () => this.updateSelectionStates());
  }

  render(elements) {
    if (!this.container) return;

    const currentIds = new Set(elements.map((el) => el.id));

    // Remove nodes no longer in state
    this.renderedNodes.forEach((nodeEl, id) => {
      if (!currentIds.has(id)) {
        nodeEl.remove();
        this.renderedNodes.delete(id);
      }
    });

    // Create or update existing elements
    elements.forEach((el) => {
      let nodeEl = this.renderedNodes.get(el.id);
      if (!nodeEl) {
        nodeEl = this.createElementDOM(el);
        this.container.appendChild(nodeEl);
        this.renderedNodes.set(el.id, nodeEl);
      }
      this.updateElementDOM(nodeEl, el);
    });

    this.updateSelectionStates();
  }

  createElementDOM(el) {
    const node = document.createElement('div');
    node.className = 'canvas-node';
    node.dataset.id = el.id;

    // Lock Badge
    const lockBadge = document.createElement('div');
    lockBadge.className = 'lock-badge hidden';
    lockBadge.innerHTML = '<i class="fas fa-lock"></i>';
    node.appendChild(lockBadge);

    // Inner shape background container
    const shapeBg = document.createElement('div');
    shapeBg.className = 'node-shape-bg';

    // Content container
    const content = document.createElement('div');
    content.className = 'node-content';
    content.contentEditable = 'false';
    shapeBg.appendChild(content);

    node.appendChild(shapeBg);

    // Anchors
    ['top', 'bottom', 'left', 'right'].forEach((pos) => {
      const anchor = document.createElement('div');
      anchor.className = `node-anchor anchor-${pos}`;
      anchor.dataset.anchor = pos;
      anchor.dataset.nodeId = el.id;
      node.appendChild(anchor);
    });

    // 8 Directional Resize Handles
    ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach((handlePos) => {
      const handle = document.createElement('div');
      handle.className = `resize-handle handle-${handlePos}`;
      handle.dataset.handle = handlePos;
      handle.dataset.nodeId = el.id;
      node.appendChild(handle);
    });

    // Double tap / double click to activate text editing
    node.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (el.type === 'image' || el.locked) return;

      content.contentEditable = 'true';
      content.focus();

      const range = document.createRange();
      range.selectNodeContents(content);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    content.addEventListener('blur', () => {
      content.contentEditable = 'false';
      const newText = content.innerText.trim();
      if (newText !== el.content) {
        historyManager.saveSnapshot();
        stateStore.updateElement(el.id, { content: newText });
      }
    });

    return node;
  }

  updateElementDOM(nodeEl, el) {
    nodeEl.style.transform = `translate(${el.x}px, ${el.y}px)`;
    nodeEl.style.width = `${el.width}px`;
    nodeEl.style.height = `${el.height}px`;
    nodeEl.style.zIndex = el.zIndex || 2;
    nodeEl.dataset.type = el.type || 'shape';

    const lockBadge = nodeEl.querySelector('.lock-badge');
    if (el.locked) {
      nodeEl.classList.add('locked');
      lockBadge.classList.remove('hidden');
    } else {
      nodeEl.classList.remove('locked');
      lockBadge.classList.add('hidden');
    }

    const shapeBg = nodeEl.querySelector('.node-shape-bg');
    shapeBg.dataset.color = el.color || 'default';

    const shapeClass = el.shape ? `shape-${el.shape}` : 'shape-rectangle';
    shapeBg.className = `node-shape-bg ${shapeClass}`;

    const content = nodeEl.querySelector('.node-content');

    if (el.type === 'image') {
      if (!content.querySelector('img')) {
        content.innerHTML = `<img src="${el.content}" class="node-image" alt="Uploaded Image" />`;
      }
    } else {
      if (content.innerText !== el.content && document.activeElement !== content) {
        content.innerText = el.content || '';
      }
    }
  }

  updateSelectionStates() {
    const selectedIds = new Set(stateStore.getState().selectedIds);
    this.renderedNodes.forEach((nodeEl, id) => {
      if (selectedIds.has(id)) {
        nodeEl.classList.add('selected');
      } else {
        nodeEl.classList.remove('selected');
      }
    });
  }
}

export const elementRenderer = new ElementRenderer();
