/**
 * SnapEngine: Calculates magnetic alignment guidelines & snaps node coordinates
 */

import { stateStore } from '../core/StateStore.js';

class SnapEngine {
  constructor() {
    this.snapThreshold = 6; // pixels
    this.svgContainer = null;
    this.snapLines = [];
  }

  init(svgOverlayEl) {
    this.svgContainer = svgOverlayEl;
  }

  calculateSnap(draggingNodeId, targetX, targetY, width, height) {
    const { elements } = stateStore.getState();
    const otherNodes = elements.filter(
      (el) => el.id !== draggingNodeId && (!el.groupId || el.groupId !== draggingNodeId)
    );

    let snappedX = targetX;
    let snappedY = targetY;

    const activeLines = [];

    // Dragging edges & center points
    const left = targetX;
    const centerX = targetX + width / 2;
    const right = targetX + width;

    const top = targetY;
    const centerY = targetY + height / 2;
    const bottom = targetY + height;

    let minDiffX = this.snapThreshold + 1;
    let minDiffY = this.snapThreshold + 1;

    otherNodes.forEach((node) => {
      const nLeft = node.x;
      const nCenterX = node.x + node.width / 2;
      const nRight = node.x + node.width;

      const nTop = node.y;
      const nCenterY = node.y + node.height / 2;
      const nBottom = node.y + node.height;

      // Vertical Alignments (X matches)
      const xMatches = [
        { type: 'left-left', diff: Math.abs(left - nLeft), snapVal: nLeft, lineX: nLeft },
        { type: 'center-center', diff: Math.abs(centerX - nCenterX), snapVal: nCenterX - width / 2, lineX: nCenterX },
        { type: 'right-right', diff: Math.abs(right - nRight), snapVal: nRight - width, lineX: nRight },
        { type: 'left-right', diff: Math.abs(left - nRight), snapVal: nRight, lineX: nRight },
        { type: 'right-left', diff: Math.abs(right - nLeft), snapVal: nLeft - width, lineX: nLeft }
      ];

      xMatches.forEach((m) => {
        if (m.diff < minDiffX) {
          minDiffX = m.diff;
          snappedX = m.snapVal;
          activeLines.push({ type: 'v', x: m.lineX });
        }
      });

      // Horizontal Alignments (Y matches)
      const yMatches = [
        { type: 'top-top', diff: Math.abs(top - nTop), snapVal: nTop, lineY: nTop },
        { type: 'center-center', diff: Math.abs(centerY - nCenterY), snapVal: nCenterY - height / 2, lineY: nCenterY },
        { type: 'bottom-bottom', diff: Math.abs(bottom - nBottom), snapVal: nBottom - height, lineY: nBottom },
        { type: 'top-bottom', diff: Math.abs(top - nBottom), snapVal: nBottom, lineY: nBottom },
        { type: 'bottom-top', diff: Math.abs(bottom - nTop), snapVal: nTop - height, lineY: nTop }
      ];

      yMatches.forEach((m) => {
        if (m.diff < minDiffY) {
          minDiffY = m.diff;
          snappedY = m.snapVal;
          activeLines.push({ type: 'h', y: m.lineY });
        }
      });
    });

    this.renderSnapLines(activeLines);

    return {
      x: Math.round(snappedX),
      y: Math.round(snappedY)
    };
  }

  renderSnapLines(lines) {
    this.clearSnapLines();
    if (!this.svgContainer || lines.length === 0) return;

    lines.forEach((line) => {
      const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineEl.setAttribute('class', 'snap-line');

      if (line.type === 'v') {
        lineEl.setAttribute('x1', line.x);
        lineEl.setAttribute('y1', '-100000');
        lineEl.setAttribute('x2', line.x);
        lineEl.setAttribute('y2', '100000');
      } else {
        lineEl.setAttribute('x1', '-100000');
        lineEl.setAttribute('y1', line.y);
        lineEl.setAttribute('x2', '100000');
        lineEl.setAttribute('y2', line.y);
      }

      this.svgContainer.appendChild(lineEl);
      this.snapLines.push(lineEl);
    });
  }

  clearSnapLines() {
    this.snapLines.forEach((el) => el.remove());
    this.snapLines = [];
  }
}

export const snapEngine = new SnapEngine();
