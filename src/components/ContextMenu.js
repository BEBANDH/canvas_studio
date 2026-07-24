/**
 * ContextMenu Component: Right-click menu for elements & canvas
 */

import { stateStore } from '../core/StateStore.js';
import { historyManager } from '../core/HistoryManager.js';
import { generateId } from '../utils/helpers.js';

class ContextMenu {
  constructor() {
    this.el = null;
  }

  init(containerEl) {
    this.el = containerEl;
    this.render();

    window.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    window.addEventListener('click', () => this.hide());
  }

  render() {
    this.el.className = 'context-menu hidden';
    this.el.innerHTML = `
      <div class="menu-header" style="font-size:0.75rem; color:var(--text-muted); padding:4px 8px; font-weight:600;">PASTEL COLORS</div>
      <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:6px; padding:4px 8px 8px 8px;">
        <div class="color-dot-opt" data-action="color-yellow" style="background:#fef9c3;" title="Yellow"></div>
        <div class="color-dot-opt" data-action="color-purple" style="background:#f3e8ff;" title="Purple"></div>
        <div class="color-dot-opt" data-action="color-blue" style="background:#dbeafe;" title="Blue"></div>
        <div class="color-dot-opt" data-action="color-green" style="background:#dcfce7;" title="Green"></div>
        <div class="color-dot-opt" data-action="color-pink" style="background:#fce7f3;" title="Pink"></div>
        <div class="color-dot-opt" data-action="color-orange" style="background:#ffedd5;" title="Orange"></div>
        <div class="color-dot-opt" data-action="color-teal" style="background:#ccfbf1;" title="Teal"></div>
        <div class="color-dot-opt" data-action="color-violet" style="background:#e0e7ff;" title="Violet"></div>
        <div class="color-dot-opt" data-action="color-coral" style="background:#ffe4e6;" title="Coral"></div>
        <div class="color-dot-opt" data-action="color-sand" style="background:#f5f5f4;" title="Sand"></div>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" data-action="lock"><i class="fas fa-lock"></i> Lock Element (Ctrl+L)</div>
      <div class="menu-item" data-action="unlock"><i class="fas fa-unlock"></i> Unlock All</div>
      <div class="menu-divider"></div>
      <div class="menu-item" data-action="group"><i class="fas fa-object-group"></i> Group (Ctrl+G)</div>
      <div class="menu-item" data-action="ungroup"><i class="fas fa-object-ungroup"></i> Ungroup</div>
      <div class="menu-divider"></div>
      <div class="menu-item" data-action="bring-forward"><i class="fas fa-arrow-up"></i> Bring Forward</div>
      <div class="menu-item" data-action="send-backward"><i class="fas fa-arrow-down"></i> Send Backward</div>
      <div class="menu-divider"></div>
      <div class="menu-item" data-action="duplicate"><i class="fas fa-clone"></i> Duplicate</div>
      <div class="menu-item danger" data-action="delete"><i class="fas fa-trash"></i> Delete</div>
    `;

    this.attachEvents();
  }

  onContextMenu(e) {
    const nodeTarget = e.target.closest('.canvas-node');
    if (!nodeTarget) {
      this.hide();
      return;
    }

    e.preventDefault();
    const nodeId = nodeTarget.dataset.id;
    if (!stateStore.getState().selectedIds.includes(nodeId)) {
      stateStore.setSelectedIds([nodeId]);
    }

    this.el.style.left = `${e.clientX}px`;
    this.el.style.top = `${e.clientY}px`;
    this.el.classList.remove('hidden');
  }

  hide() {
    this.el.classList.add('hidden');
  }

  attachEvents() {
    this.el.addEventListener('click', (e) => {
      const item = e.target.closest('.menu-item') || e.target.closest('.color-dot-opt');
      if (!item) return;

      const action = item.dataset.action;
      const { selectedIds, elements } = stateStore.getState();

      if (action && action.startsWith('color-')) {
        const color = action.replace('color-', '');
        historyManager.saveSnapshot();
        selectedIds.forEach((id) => stateStore.updateElement(id, { color }));
      }

      if (action === 'lock') {
        historyManager.saveSnapshot();
        selectedIds.forEach((id) => stateStore.updateElement(id, { locked: true }));
        stateStore.setSelectedIds([]);
      }

      if (action === 'unlock') {
        historyManager.saveSnapshot();
        elements.forEach((el) => {
          if (el.locked) stateStore.updateElement(el.id, { locked: false });
        });
      }

      if (action === 'group') {
        if (selectedIds.length >= 2) {
          historyManager.saveSnapshot();
          const groupId = generateId('group');
          selectedIds.forEach((id) => stateStore.updateElement(id, { groupId }));
        }
      }

      if (action === 'ungroup') {
        historyManager.saveSnapshot();
        selectedIds.forEach((id) => stateStore.updateElement(id, { groupId: null }));
      }

      if (action === 'bring-forward') {
        historyManager.saveSnapshot();
        selectedIds.forEach((id) => {
          const el = elements.find((node) => node.id === id);
          if (el) stateStore.updateElement(id, { zIndex: (el.zIndex || 2) + 1 });
        });
      }

      if (action === 'send-backward') {
        historyManager.saveSnapshot();
        selectedIds.forEach((id) => {
          const el = elements.find((node) => node.id === id);
          if (el) stateStore.updateElement(id, { zIndex: Math.max(1, (el.zIndex || 2) - 1) });
        });
      }

      if (action === 'duplicate') {
        historyManager.saveSnapshot();
        const duplicates = [];
        selectedIds.forEach((id) => {
          const original = elements.find((node) => node.id === id);
          if (original) {
            const clone = {
              ...original,
              id: generateId('el'),
              x: original.x + 20,
              y: original.y + 20
            };
            stateStore.addElement(clone);
            duplicates.push(clone.id);
          }
        });
        stateStore.setSelectedIds(duplicates);
      }

      if (action === 'delete') {
        historyManager.saveSnapshot();
        stateStore.deleteSelected();
      }

      this.hide();
    });
  }
}

export const contextMenu = new ContextMenu();
