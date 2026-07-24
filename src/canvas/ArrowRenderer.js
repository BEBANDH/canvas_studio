/**
 * ArrowRenderer: SVG Connector Line routing and rendering engine (Labels & Stroke Styles)
 */

import { stateStore } from '../core/StateStore.js';
import { getAnchorCoordinates, calculateArrowPath } from '../utils/geometry.js';

class ArrowRenderer {
  constructor() {
    this.svgEl = null;
    this.renderedGroups = new Map(); // arrowId -> SVGGElement
  }

  init(svgContainerEl) {
    this.svgEl = svgContainerEl;

    stateStore.subscribe('arrows', (arrows) => this.render(arrows));
    stateStore.subscribe('elements', () => this.render(stateStore.getState().arrows));
    stateStore.subscribe('selectedArrowId', () => this.updateSelectionStates());
  }

  render(arrows) {
    if (!this.svgEl) return;

    const elementsMap = new Map(
      stateStore.getState().elements.map((el) => [el.id, el])
    );
    const currentArrowIds = new Set(arrows.map((a) => a.id));

    // Remove deleted SVG paths
    this.renderedGroups.forEach((groupEl, id) => {
      if (!currentArrowIds.has(id)) {
        groupEl.remove();
        this.renderedGroups.delete(id);
      }
    });

    // Create or update paths
    arrows.forEach((arrow) => {
      const fromNode = elementsMap.get(arrow.fromNodeId);
      const toNode = elementsMap.get(arrow.toNodeId);

      if (!fromNode || !toNode) return;

      const fromPos = getAnchorCoordinates(fromNode, arrow.fromAnchor);
      const toPos = getAnchorCoordinates(toNode, arrow.toAnchor);

      const d = calculateArrowPath(fromPos, toPos, arrow.style || 'curved');

      let groupEl = this.renderedGroups.get(arrow.id);
      if (!groupEl) {
        groupEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        groupEl.setAttribute('class', 'arrow-group');
        groupEl.dataset.id = arrow.id;

        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('class', 'arrow-path');

        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('class', 'arrow-text-label');
        textEl.setAttribute('text-anchor', 'middle');

        groupEl.appendChild(pathEl);
        groupEl.appendChild(textEl);

        groupEl.addEventListener('click', (e) => {
          e.stopPropagation();
          stateStore.setSelectedArrowId(arrow.id);
        });

        this.svgEl.appendChild(groupEl);
        this.renderedGroups.set(arrow.id, groupEl);
      }

      const pathEl = groupEl.querySelector('.arrow-path');
      const textEl = groupEl.querySelector('.arrow-text-label');

      pathEl.setAttribute('d', d);

      if (arrow.strokeStyle === 'dashed') {
        pathEl.setAttribute('stroke-dasharray', '8 6');
      } else if (arrow.strokeStyle === 'dotted') {
        pathEl.setAttribute('stroke-dasharray', '3 4');
      } else {
        pathEl.removeAttribute('stroke-dasharray');
      }

      if (arrow.label) {
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;
        textEl.setAttribute('x', midX);
        textEl.setAttribute('y', midY - 6);
        textEl.textContent = arrow.label;
      } else {
        textEl.textContent = '';
      }
    });

    this.updateSelectionStates();
  }

  updateSelectionStates() {
    const selectedArrowId = stateStore.getState().selectedArrowId;
    this.renderedGroups.forEach((groupEl, id) => {
      const pathEl = groupEl.querySelector('.arrow-path');
      if (id === selectedArrowId) {
        pathEl.classList.add('selected');
      } else {
        pathEl.classList.remove('selected');
      }
    });
  }
}

export const arrowRenderer = new ArrowRenderer();
