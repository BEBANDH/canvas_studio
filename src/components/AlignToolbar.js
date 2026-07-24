/**
 * AlignToolbar Component: Floating alignment & grouping bar for multi-selected elements
 */

import { stateStore } from '../core/StateStore.js';
import { historyManager } from '../core/HistoryManager.js';
import { generateId } from '../utils/helpers.js';

class AlignToolbar {
  constructor() {
    this.el = null;
  }

  init(containerEl) {
    this.el = containerEl;
    this.render();

    stateStore.subscribe('selectedIds', (selectedIds) => this.updateVisibility(selectedIds));
  }

  render() {
    this.el.className = 'align-toolbar hidden';
    this.el.innerHTML = `
      <button class="tool-btn" data-action="align-left" title="Align Left"><i class="fas fa-align-left"></i></button>
      <button class="tool-btn" data-action="align-center-x" title="Align Horizontal Center"><i class="fas fa-align-center"></i></button>
      <button class="tool-btn" data-action="align-right" title="Align Right"><i class="fas fa-align-right"></i></button>
      <div class="toolbar-divider"></div>
      <button class="tool-btn" data-action="align-top" title="Align Top"><i class="fas fa-arrow-up"></i></button>
      <button class="tool-btn" data-action="align-center-y" title="Align Vertical Center"><i class="fas fa-arrows-alt-v"></i></button>
      <button class="tool-btn" data-action="align-bottom" title="Align Bottom"><i class="fas fa-arrow-down"></i></button>
      <div class="toolbar-divider"></div>
      <button class="tool-btn" data-action="group" title="Group Selection (Ctrl+G)"><i class="fas fa-object-group"></i></button>
      <button class="tool-btn" data-action="lock" title="Lock Selection (Ctrl+L)"><i class="fas fa-lock"></i></button>
    `;

    this.attachEvents();
  }

  updateVisibility(selectedIds) {
    if (selectedIds && selectedIds.length >= 2) {
      this.el.classList.remove('hidden');
    } else {
      this.el.classList.add('hidden');
    }
  }

  attachEvents() {
    this.el.addEventListener('click', (e) => {
      const btn = e.target.closest('.tool-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      const { selectedIds, elements } = stateStore.getState();
      if (selectedIds.length < 2 && action !== 'group' && action !== 'lock') return;

      const selectedNodes = elements.filter((el) => selectedIds.includes(el.id));
      if (selectedNodes.length === 0) return;

      historyManager.saveSnapshot();

      if (action === 'align-left') {
        const minX = Math.min(...selectedNodes.map((n) => n.x));
        selectedNodes.forEach((n) => stateStore.updateElement(n.id, { x: minX }));
      }

      if (action === 'align-center-x') {
        const minX = Math.min(...selectedNodes.map((n) => n.x));
        const maxX = Math.max(...selectedNodes.map((n) => n.x + n.width));
        const midX = minX + (maxX - minX) / 2;
        selectedNodes.forEach((n) => stateStore.updateElement(n.id, { x: Math.round(midX - n.width / 2) }));
      }

      if (action === 'align-right') {
        const maxX = Math.max(...selectedNodes.map((n) => n.x + n.width));
        selectedNodes.forEach((n) => stateStore.updateElement(n.id, { x: maxX - n.width }));
      }

      if (action === 'align-top') {
        const minY = Math.min(...selectedNodes.map((n) => n.y));
        selectedNodes.forEach((n) => stateStore.updateElement(n.id, { y: minY }));
      }

      if (action === 'align-center-y') {
        const minY = Math.min(...selectedNodes.map((n) => n.y));
        const maxY = Math.max(...selectedNodes.map((n) => n.y + n.height));
        const midY = minY + (maxY - minY) / 2;
        selectedNodes.forEach((n) => stateStore.updateElement(n.id, { y: Math.round(midY - n.height / 2) }));
      }

      if (action === 'align-bottom') {
        const maxY = Math.max(...selectedNodes.map((n) => n.y + n.height));
        selectedNodes.forEach((n) => stateStore.updateElement(n.id, { y: maxY - n.height }));
      }

      if (action === 'group') {
        const groupId = generateId('group');
        selectedNodes.forEach((n) => stateStore.updateElement(n.id, { groupId }));
      }

      if (action === 'lock') {
        selectedNodes.forEach((n) => stateStore.updateElement(n.id, { locked: true }));
        stateStore.setSelectedIds([]);
      }
    });
  }
}

export const alignToolbar = new AlignToolbar();
