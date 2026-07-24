/**
 * ArrowToolbar Component: Floating style editor bar when an SVG arrow connector is selected
 */

import { stateStore } from '../core/StateStore.js';
import { historyManager } from '../core/HistoryManager.js';

class ArrowToolbar {
  constructor() {
    this.el = null;
  }

  init(containerEl) {
    this.el = containerEl;
    this.render();

    stateStore.subscribe('selectedArrowId', (arrowId) => this.updateVisibility(arrowId));
  }

  render() {
    this.el.className = 'arrow-toolbar hidden';
    this.el.innerHTML = `
      <button class="tool-btn" data-style="curved" title="Curved Path"><i class="fas fa-route"></i></button>
      <button class="tool-btn" data-style="orthogonal" title="Orthogonal Path"><i class="fas fa-ruler-combined"></i></button>
      <button class="tool-btn" data-style="straight" title="Straight Path"><i class="fas fa-slash"></i></button>
      <div class="toolbar-divider"></div>
      <button class="tool-btn" data-stroke="solid" title="Solid Line">―</button>
      <button class="tool-btn" data-stroke="dashed" title="Dashed Line">╌</button>
      <button class="tool-btn" data-stroke="dotted" title="Dotted Line">┈</button>
      <div class="toolbar-divider"></div>
      <input type="text" class="arrow-label-input" id="arrowLabelInput" placeholder="Add label...">
      <button class="tool-btn danger" id="deleteArrowBtn" title="Delete Connector"><i class="fas fa-trash"></i></button>
    `;

    this.attachEvents();
  }

  updateVisibility(arrowId) {
    if (arrowId) {
      this.el.classList.remove('hidden');
      const { arrows } = stateStore.getState();
      const currentArrow = arrows.find((a) => a.id === arrowId);
      if (currentArrow) {
        this.el.querySelector('#arrowLabelInput').value = currentArrow.label || '';
      }
    } else {
      this.el.classList.add('hidden');
    }
  }

  attachEvents() {
    this.el.addEventListener('click', (e) => {
      const btn = e.target.closest('.tool-btn');
      if (!btn) return;

      const { selectedArrowId, arrows } = stateStore.getState();
      if (!selectedArrowId) return;

      const style = btn.dataset.style;
      const stroke = btn.dataset.stroke;

      if (style) {
        historyManager.saveSnapshot();
        const updated = arrows.map((a) => (a.id === selectedArrowId ? { ...a, style } : a));
        stateStore.setState({ arrows: updated });
      }

      if (stroke) {
        historyManager.saveSnapshot();
        const updated = arrows.map((a) => (a.id === selectedArrowId ? { ...a, strokeStyle: stroke } : a));
        stateStore.setState({ arrows: updated });
      }

      if (btn.id === 'deleteArrowBtn') {
        historyManager.saveSnapshot();
        stateStore.deleteSelected();
      }
    });

    const labelInput = this.el.querySelector('#arrowLabelInput');
    labelInput.addEventListener('change', (e) => {
      const { selectedArrowId, arrows } = stateStore.getState();
      if (!selectedArrowId) return;

      historyManager.saveSnapshot();
      const newLabel = e.target.value;
      const updated = arrows.map((a) => (a.id === selectedArrowId ? { ...a, label: newLabel } : a));
      stateStore.setState({ arrows: updated });
    });
  }
}

export const arrowToolbar = new ArrowToolbar();
