/**
 * ViewportManager: Pan & Zoom transformation engine with smooth touchpad scaling
 */

import { stateStore } from '../core/StateStore.js';
import { clamp } from '../utils/helpers.js';

class ViewportManager {
  constructor() {
    this.viewportEl = null;
    this.worldEl = null;
  }

  init(viewportEl, worldEl) {
    this.viewportEl = viewportEl;
    this.worldEl = worldEl;

    // Listen to state changes
    stateStore.subscribe('pan', () => this.updateTransform());
    stateStore.subscribe('zoom', () => this.updateTransform());

    this.setupWheelZoom();
  }

  updateTransform() {
    if (!this.worldEl) return;
    const { pan, zoom } = stateStore.getState();
    this.worldEl.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  }

  setupWheelZoom() {
    this.viewportEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const { pan, zoom } = stateStore.getState();

      // Smooth touchpad zoom calculation using exponential delta damping
      const delta = e.deltaY;
      const zoomFactor = Math.exp(-delta * 0.0015);
      const newZoom = clamp(zoom * zoomFactor, 0.15, 4.0);

      if (Math.abs(newZoom - zoom) < 0.0001) return;

      // Mouse focal zoom point
      const rect = this.viewportEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Maintain focal point invariant
      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      stateStore.setState({
        zoom: newZoom,
        pan: { x: newPanX, y: newPanY }
      });
    }, { passive: false });
  }

  zoomIn() {
    const { zoom } = stateStore.getState();
    this.setZoom(zoom * 1.2);
  }

  zoomOut() {
    const { zoom } = stateStore.getState();
    this.setZoom(zoom / 1.2);
  }

  setZoom(targetZoom) {
    const { pan, zoom } = stateStore.getState();
    const newZoom = clamp(targetZoom, 0.15, 4.0);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const newPanX = centerX - (centerX - pan.x) * (newZoom / zoom);
    const newPanY = centerY - (centerY - pan.y) * (newZoom / zoom);

    stateStore.setState({
      zoom: newZoom,
      pan: { x: newPanX, y: newPanY }
    });
  }

  resetZoom() {
    stateStore.setState({
      zoom: 1,
      pan: { x: 0, y: 0 }
    });
  }

  screenToWorld(clientX, clientY) {
    const rect = this.viewportEl.getBoundingClientRect();
    const { pan, zoom } = stateStore.getState();

    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  }

  worldToScreen(worldX, worldY) {
    const rect = this.viewportEl.getBoundingClientRect();
    const { pan, zoom } = stateStore.getState();

    return {
      x: worldX * zoom + pan.x + rect.left,
      y: worldY * zoom + pan.y + rect.top
    };
  }
}

export const viewportManager = new ViewportManager();
