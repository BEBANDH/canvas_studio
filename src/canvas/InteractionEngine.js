/**
 * InteractionEngine: Unified Event Handling with SnapEngine, Grouping & Locking
 */

import { stateStore } from '../core/StateStore.js';
import { historyManager } from '../core/HistoryManager.js';
import { viewportManager } from './ViewportManager.js';
import { snapEngine } from './SnapEngine.js';
import { generateId, compressImage } from '../utils/helpers.js';
import { isRectIntersecting } from '../utils/geometry.js';

class InteractionEngine {
  constructor() {
    this.viewportEl = null;
    this.worldEl = null;

    this.isInteracting = false;
    this.interactionType = null; // 'pan' | 'drag' | 'resize' | 'arrow' | 'marquee'

    // Interaction State Cache
    this.startPointer = { x: 0, y: 0 };
    this.startPan = { x: 0, y: 0 };
    this.dragStartPositions = new Map(); // id -> {x, y}
    this.resizeTargetNode = null;
    this.resizeHandle = null;
    this.resizeStartBounds = null;

    // Arrow Drawing state
    this.arrowStart = null; // { nodeId, anchorPos }
    this.tempArrowLine = null;

    // Marquee State
    this.marqueeEl = null;
  }

  init(viewportEl, worldEl) {
    this.viewportEl = viewportEl;
    this.worldEl = worldEl;

    this.marqueeEl = document.createElement('div');
    this.marqueeEl.className = 'selection-marquee hidden';
    this.worldEl.appendChild(this.marqueeEl);

    snapEngine.init(document.getElementById('svgOverlay'));

    this.attachPointerEvents();
    this.attachKeyboardEvents();
    this.attachClipboardEvents();
  }

  attachPointerEvents() {
    this.viewportEl.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));

    // Double tap on blank canvas adds a note
    this.viewportEl.addEventListener('dblclick', (e) => {
      const targetNode = e.target.closest('.canvas-node');
      const targetAnchor = e.target.closest('.node-anchor');
      const targetHandle = e.target.closest('.resize-handle');

      if (!targetNode && !targetAnchor && !targetHandle) {
        const worldPos = viewportManager.screenToWorld(e.clientX, e.clientY);
        this.createNode('text', worldPos.x - 90, worldPos.y - 40);
        stateStore.setTool('select');
      }
    });
  }

  onPointerDown(e) {
    if (stateStore.getState().isSidebarOpen) {
      stateStore.setState({ isSidebarOpen: false });
    }

    if (e.button === 2) return;

    const { activeTool, pan, selectedIds, elements } = stateStore.getState();
    this.startPointer = { x: e.clientX, y: e.clientY };

    const targetNode = e.target.closest('.canvas-node');
    const targetAnchor = e.target.closest('.node-anchor');
    const targetHandle = e.target.closest('.resize-handle');

    // Pan Mode
    if (activeTool === 'pan' || e.spaceKey || e.button === 1) {
      this.isInteracting = true;
      this.interactionType = 'pan';
      this.startPan = { ...pan };
      this.viewportEl.classList.add('panning');
      return;
    }

    // Arrow Anchor
    if (targetAnchor || activeTool === 'arrow') {
      if (targetAnchor) {
        this.isInteracting = true;
        this.interactionType = 'arrow';
        this.arrowStart = {
          nodeId: targetAnchor.dataset.nodeId,
          anchor: targetAnchor.dataset.anchor
        };
        this.createTempArrow(e);
        return;
      }
    }

    // Resize Handle
    if (targetHandle) {
      const nodeId = targetHandle.dataset.nodeId;
      const targetEl = elements.find((el) => el.id === nodeId);
      if (targetEl && targetEl.locked) return; // Prevent resizing locked nodes

      this.isInteracting = true;
      this.interactionType = 'resize';
      this.resizeTargetNode = targetEl;
      this.resizeHandle = targetHandle.dataset.handle;
      this.resizeStartBounds = { ...this.resizeTargetNode };
      historyManager.saveSnapshot();
      return;
    }

    // Node Click / Drag
    if (targetNode) {
      const nodeId = targetNode.dataset.id;
      const clickedEl = elements.find((el) => el.id === nodeId);

      if (clickedEl && clickedEl.locked) return; // Ignore locked nodes

      let targetSelection = [nodeId];

      // Auto-select all elements in the same group
      if (clickedEl && clickedEl.groupId) {
        targetSelection = elements.filter((el) => el.groupId === clickedEl.groupId).map((el) => el.id);
      }

      let newSelection = [...selectedIds];
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        targetSelection.forEach((id) => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
      } else {
        if (!targetSelection.every((id) => newSelection.includes(id))) {
          newSelection = targetSelection;
        }
      }

      stateStore.setSelectedIds(newSelection);

      this.isInteracting = true;
      this.interactionType = 'drag';

      this.dragStartPositions.clear();
      const selectedSet = new Set(stateStore.getState().selectedIds);
      elements.forEach((el) => {
        if (selectedSet.has(el.id) && !el.locked) {
          this.dragStartPositions.set(el.id, { x: el.x, y: el.y });
        }
      });

      historyManager.saveSnapshot();
      return;
    }

    // Blank Canvas
    if (!targetNode && !targetAnchor && !targetHandle) {
      if (!e.shiftKey && !e.ctrlKey) {
        stateStore.setSelectedIds([]);
        stateStore.setSelectedArrowId(null);
      }

      if (activeTool === 'text') {
        const worldPos = viewportManager.screenToWorld(e.clientX, e.clientY);
        this.createNode('text', worldPos.x - 90, worldPos.y - 40);
        stateStore.setTool('select');
        return;
      }

      if (activeTool === 'shape') {
        const worldPos = viewportManager.screenToWorld(e.clientX, e.clientY);
        this.createNode('shape', worldPos.x - 70, worldPos.y - 50);
        stateStore.setTool('select');
        return;
      }

      this.isInteracting = true;
      this.interactionType = 'marquee';
      this.marqueeEl.classList.remove('hidden');
      this.updateMarquee(e);
    }
  }

  onPointerMove(e) {
    if (!this.isInteracting) return;

    const { zoom, elements } = stateStore.getState();
    const dx = (e.clientX - this.startPointer.x) / zoom;
    const dy = (e.clientY - this.startPointer.y) / zoom;

    switch (this.interactionType) {
      case 'pan': {
        const panDx = e.clientX - this.startPointer.x;
        const panDy = e.clientY - this.startPointer.y;
        stateStore.setState({
          pan: { x: this.startPan.x + panDx, y: this.startPan.y + panDy }
        });
        break;
      }

      case 'drag': {
        if (this.dragStartPositions.size === 1) {
          const [primaryId, startPos] = Array.from(this.dragStartPositions.entries())[0];
          const primaryEl = elements.find((el) => el.id === primaryId);

          if (primaryEl) {
            const rawX = startPos.x + dx;
            const rawY = startPos.y + dy;

            const snapped = snapEngine.calculateSnap(
              primaryId,
              rawX,
              rawY,
              primaryEl.width,
              primaryEl.height
            );

            stateStore.updateElement(primaryId, { x: snapped.x, y: snapped.y });
          }
        } else {
          this.dragStartPositions.forEach((startPos, id) => {
            stateStore.updateElement(id, {
              x: Math.round(startPos.x + dx),
              y: Math.round(startPos.y + dy)
            });
          });
        }
        break;
      }

      case 'resize': {
        if (!this.resizeTargetNode) return;
        const initial = this.resizeStartBounds;
        let newWidth = initial.width;
        let newHeight = initial.height;
        let newX = initial.x;
        let newY = initial.y;

        const handle = this.resizeHandle;

        if (handle.includes('e')) newWidth = Math.max(60, initial.width + dx);
        if (handle.includes('s')) newHeight = Math.max(40, initial.height + dy);
        if (handle.includes('w')) {
          const targetW = initial.width - dx;
          if (targetW >= 60) {
            newWidth = targetW;
            newX = initial.x + dx;
          }
        }
        if (handle.includes('n')) {
          const targetH = initial.height - dy;
          if (targetH >= 40) {
            newHeight = targetH;
            newY = initial.y + dy;
          }
        }

        stateStore.updateElement(this.resizeTargetNode.id, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight)
        });
        break;
      }

      case 'arrow': {
        this.updateTempArrow(e);
        break;
      }

      case 'marquee': {
        this.updateMarquee(e);
        break;
      }
    }
  }

  onPointerUp(e) {
    if (!this.isInteracting) return;

    this.viewportEl.classList.remove('panning');
    snapEngine.clearSnapLines();

    if (this.interactionType === 'arrow') {
      const targetAnchor = e.target.closest('.node-anchor');
      if (targetAnchor && this.arrowStart) {
        const toNodeId = targetAnchor.dataset.nodeId;
        const toAnchor = targetAnchor.dataset.anchor;

        if (toNodeId !== this.arrowStart.nodeId) {
          historyManager.saveSnapshot();
          stateStore.addArrow({
            id: generateId('arrow'),
            fromNodeId: this.arrowStart.nodeId,
            fromAnchor: this.arrowStart.anchor,
            toNodeId,
            toAnchor,
            style: 'curved',
            strokeStyle: 'solid'
          });
        }
      }
      this.removeTempArrow();
    }

    if (this.interactionType === 'marquee') {
      this.finishMarqueeSelect(e);
    }

    this.isInteracting = false;
    this.interactionType = null;
    this.dragStartPositions.clear();
    this.resizeTargetNode = null;
  }

  createNode(type, x, y, extraProps = {}) {
    historyManager.saveSnapshot();
    const state = stateStore.getState();
    const newNode = {
      id: generateId('el'),
      type,
      x: Math.round(x),
      y: Math.round(y),
      width: type === 'shape' ? 140 : 180,
      height: type === 'shape' ? 100 : 80,
      content: type === 'text' ? 'New Note' : '',
      shape: state.activeShapeType || 'rectangle',
      color: state.activeColor || 'default',
      zIndex: state.elements.length + 2,
      ...extraProps
    };

    stateStore.addElement(newNode);
    stateStore.setSelectedIds([newNode.id]);
  }

  createTempArrow(e) {
    const svgOverlay = document.querySelector('.svg-overlay');
    if (!svgOverlay) return;

    this.tempArrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.tempArrowLine.setAttribute('stroke', '#6366f1');
    this.tempArrowLine.setAttribute('stroke-width', '2.5');
    this.tempArrowLine.setAttribute('stroke-dasharray', '4 4');
    this.tempArrowLine.setAttribute('fill', 'none');
    svgOverlay.appendChild(this.tempArrowLine);

    this.updateTempArrow(e);
  }

  updateTempArrow(e) {
    if (!this.tempArrowLine) return;
    const worldStart = viewportManager.screenToWorld(this.startPointer.x, this.startPointer.y);
    const worldCurrent = viewportManager.screenToWorld(e.clientX, e.clientY);

    const dx = Math.abs(worldCurrent.x - worldStart.x) * 0.5;
    const dy = Math.abs(worldCurrent.y - worldStart.y) * 0.5;
    const curvature = Math.max(dx, dy, 40);

    const cx1 = worldStart.x + (worldCurrent.x > worldStart.x ? curvature : -curvature);
    const cy1 = worldStart.y;
    const cx2 = worldCurrent.x + (worldStart.x > worldStart.x ? curvature : -curvature);
    const cy2 = worldCurrent.y;

    const d = `M ${worldStart.x} ${worldStart.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${worldCurrent.x} ${worldCurrent.y}`;
    this.tempArrowLine.setAttribute('d', d);
  }

  removeTempArrow() {
    if (this.tempArrowLine) {
      this.tempArrowLine.remove();
      this.tempArrowLine = null;
    }
  }

  updateMarquee(e) {
    const startWorld = viewportManager.screenToWorld(this.startPointer.x, this.startPointer.y);
    const currentWorld = viewportManager.screenToWorld(e.clientX, e.clientY);

    const x = Math.min(startWorld.x, currentWorld.x);
    const y = Math.min(startWorld.y, currentWorld.y);
    const width = Math.abs(currentWorld.x - startWorld.x);
    const height = Math.abs(currentWorld.y - startWorld.y);

    this.marqueeEl.style.left = `${x}px`;
    this.marqueeEl.style.top = `${y}px`;
    this.marqueeEl.style.width = `${width}px`;
    this.marqueeEl.style.height = `${height}px`;
  }

  finishMarqueeSelect(e) {
    this.marqueeEl.classList.add('hidden');
    const startWorld = viewportManager.screenToWorld(this.startPointer.x, this.startPointer.y);
    const currentWorld = viewportManager.screenToWorld(e.clientX, e.clientY);

    const marqueeRect = {
      x: Math.min(startWorld.x, currentWorld.x),
      y: Math.min(startWorld.y, currentWorld.y),
      width: Math.abs(currentWorld.x - startWorld.x),
      height: Math.abs(currentWorld.y - startWorld.y)
    };

    if (marqueeRect.width < 5 && marqueeRect.height < 5) return;

    const selectedIds = stateStore.getState().elements
      .filter((el) => !el.locked && isRectIntersecting(marqueeRect, el))
      .map((el) => el.id);

    stateStore.setSelectedIds(selectedIds);
  }

  attachKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      // Fix: Ignore keyboard shortcuts if editing inside any input, textarea, or contentEditable element!
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (document.activeElement && (document.activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(activeTag))) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        const { selectedIds } = stateStore.getState();
        if (selectedIds.length >= 2) {
          historyManager.saveSnapshot();
          const groupId = generateId('group');
          selectedIds.forEach((id) => stateStore.updateElement(id, { groupId }));
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        const { selectedIds } = stateStore.getState();
        if (selectedIds.length > 0) {
          historyManager.saveSnapshot();
          selectedIds.forEach((id) => stateStore.updateElement(id, { locked: true }));
          stateStore.setSelectedIds([]);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) historyManager.redo();
        else historyManager.undo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        historyManager.redo();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        historyManager.saveSnapshot();
        stateStore.deleteSelected();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const allIds = stateStore.getState().elements.filter((el) => !el.locked).map((el) => el.id);
        stateStore.setSelectedIds(allIds);
      }

      if (e.key.toLowerCase() === 'a') stateStore.setTool('arrow');
      if (e.key.toLowerCase() === 'v') stateStore.setTool('select');
      if (e.key.toLowerCase() === 't') stateStore.setTool('text');
      if (e.key.toLowerCase() === 'h') stateStore.setTool('pan');
    });
  }

  attachClipboardEvents() {
    window.addEventListener('paste', async (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (document.activeElement && (document.activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(activeTag))) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const compressedBase64 = await compressImage(file);
            const worldPos = viewportManager.screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
            this.createNode('image', worldPos.x, worldPos.y, {
              content: compressedBase64,
              width: 240,
              height: 180
            });
          }
        }
      }
    });
  }
}

export const interactionEngine = new InteractionEngine();
