/**
 * ZoomWidget Component: Bottom-Right Zoom Controls & Percentage Selector
 */

import { stateStore } from '../core/StateStore.js';
import { viewportManager } from '../canvas/ViewportManager.js';

class ZoomWidget {
  constructor() {
    this.el = null;
    this.dropdown = null;
  }

  init(containerEl) {
    this.el = containerEl;
    this.render();

    stateStore.subscribe('zoom', (zoom) => this.updateZoomDisplay(zoom));
  }

  render() {
    this.el.className = 'zoom-widget';
    this.el.innerHTML = `
      <button class="zoom-btn" id="zoomOutBtn" title="Zoom Out (-)"><i class="fas fa-minus"></i></button>
      <button class="zoom-percent-btn" id="zoomPercentBtn" title="Zoom Presets">100%</button>
      <button class="zoom-btn" id="zoomInBtn" title="Zoom In (+)"><i class="fas fa-plus"></i></button>
    `;

    this.createDropdown();
    this.attachEvents();
    this.updateZoomDisplay(stateStore.getState().zoom);
  }

  createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'zoom-preset-menu hidden';
    this.dropdown.innerHTML = `
      <div class="zoom-menu-item" data-zoom="0.25">25%</div>
      <div class="zoom-menu-item" data-zoom="0.5">50%</div>
      <div class="zoom-menu-item" data-zoom="0.75">75%</div>
      <div class="zoom-menu-item" data-zoom="1.0">100%</div>
      <div class="zoom-menu-item" data-zoom="1.25">125%</div>
      <div class="zoom-menu-item" data-zoom="1.5">150%</div>
      <div class="zoom-menu-item" data-zoom="2.0">200%</div>
      <div class="menu-divider"></div>
      <div class="zoom-menu-item" data-action="reset"><i class="fas fa-expand"></i> Reset View</div>
    `;
    this.el.parentNode.appendChild(this.dropdown);
  }

  attachEvents() {
    this.el.querySelector('#zoomOutBtn').addEventListener('click', () => viewportManager.zoomOut());
    this.el.querySelector('#zoomInBtn').addEventListener('click', () => viewportManager.zoomIn());

    const percentBtn = this.el.querySelector('#zoomPercentBtn');
    percentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dropdown.classList.toggle('hidden');
    });

    this.dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.zoom-menu-item');
      if (!item) return;

      const targetZoom = parseFloat(item.dataset.zoom);
      const action = item.dataset.action;

      if (!isNaN(targetZoom)) {
        viewportManager.setZoom(targetZoom);
      } else if (action === 'reset') {
        viewportManager.resetZoom();
      }

      this.dropdown.classList.add('hidden');
    });

    window.addEventListener('click', () => this.dropdown.classList.add('hidden'));
  }

  updateZoomDisplay(zoom) {
    const percentBtn = this.el.querySelector('#zoomPercentBtn');
    if (percentBtn) {
      percentBtn.innerText = `${Math.round(zoom * 100)}%`;
    }
  }
}

export const zoomWidget = new ZoomWidget();
