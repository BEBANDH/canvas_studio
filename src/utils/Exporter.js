/**
 * Exporter: Standalone SVG Vector & PDF Exporter Utilities
 */

import { stateStore } from '../core/StateStore.js';
import { getAnchorCoordinates, calculateArrowPath } from './geometry.js';

export function exportBoardAsSVG() {
  const { elements, arrows, activeBoardId, boards } = stateStore.getState();
  const currentBoard = boards.find((b) => b.id === activeBoardId);
  const title = currentBoard?.title || 'canvas-board';

  if (elements.length === 0) {
    alert('Canvas is empty!');
    return;
  }

  // Calculate bounding box encompassing all nodes
  const minX = Math.min(...elements.map((el) => el.x)) - 40;
  const minY = Math.min(...elements.map((el) => el.y)) - 40;
  const maxX = Math.max(...elements.map((el) => el.x + el.width)) + 40;
  const maxY = Math.max(...elements.map((el) => el.y + el.height)) + 40;

  const width = maxX - minX;
  const height = maxY - minY;

  const elementsMap = new Map(elements.map((el) => [el.id, el]));

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}" style="background-color: #0f0f12; font-family: sans-serif;">\n`;

  // Render Arrows
  arrows.forEach((arrow) => {
    const fromNode = elementsMap.get(arrow.fromNodeId);
    const toNode = elementsMap.get(arrow.toNodeId);
    if (!fromNode || !toNode) return;

    const fromPos = getAnchorCoordinates(fromNode, arrow.fromAnchor);
    const toPos = getAnchorCoordinates(toNode, arrow.toAnchor);
    const d = calculateArrowPath(fromPos, toPos, arrow.style || 'curved');

    const strokeDash = arrow.strokeStyle === 'dashed' ? 'stroke-dasharray="6,6"' : arrow.strokeStyle === 'dotted' ? 'stroke-dasharray="3,3"' : '';

    svgContent += `  <path d="${d}" fill="none" stroke="#6366f1" stroke-width="2.5" ${strokeDash} />\n`;

    if (arrow.label) {
      const midX = (fromPos.x + toPos.x) / 2;
      const midY = (fromPos.y + toPos.y) / 2;
      svgContent += `  <text x="${midX}" y="${midY}" fill="#f3f4f6" font-size="12" text-anchor="middle">${arrow.label}</text>\n`;
    }
  });

  // Render Nodes
  elements.forEach((el) => {
    if (el.type === 'image') {
      svgContent += `  <image href="${el.content}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" />\n`;
    } else {
      svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="10" fill="#1e1e24" stroke="#6366f1" stroke-width="1.5" />\n`;
      svgContent += `  <text x="${el.x + el.width / 2}" y="${el.y + el.height / 2 + 5}" fill="#f3f4f6" font-size="14" text-anchor="middle">${el.content || ''}</text>\n`;
    }
  });

  svgContent += `</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportBoardAsPDF() {
  if (typeof window.html2canvas === 'function') {
    const worldEl = document.getElementById('canvasWorld');
    window.html2canvas(worldEl, { backgroundColor: '#0f0f12' }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const windowPdf = window.open('', '_blank');
      windowPdf.document.write(`
        <html>
          <head><title>Canvas Studio PDF Export</title></head>
          <body style="margin:0; display:flex; justify-content:center; align-items:center; background:#0f0f12;">
            <img src="${imgData}" style="max-width:100%; max-height:100vh; object-fit:contain;" />
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      windowPdf.document.close();
    });
  }
}
