import { generateId } from '../utils/helpers.js';

export function createSwotTemplate() {
  const s = generateId('el');
  const w = generateId('el');
  const o = generateId('el');
  const t = generateId('el');

  return {
    title: 'SWOT Analysis Matrix',
    elements: [
      { id: s, type: 'text', shape: 'rectangle', color: 'green', x: 100, y: 100, width: 320, height: 200, content: '💪 STRENGTHS\n\n• Zero-dependency Vanilla JS architecture\n• High performance DOM & SVG rendering\n• Offline local-first storage' },
      { id: w, type: 'text', shape: 'rectangle', color: 'coral', x: 460, y: 100, width: 320, height: 200, content: '⚠️ WEAKNESSES\n\n• High image counts can increase storage size\n• Complex SVG curves require precision math' },
      { id: o, type: 'text', shape: 'rectangle', color: 'blue', x: 100, y: 340, width: 320, height: 200, content: '🚀 OPPORTUNITIES\n\n• Add SVG vector export\n• WebRTC peer-to-peer room sync\n• Customizable template blueprints' },
      { id: t, type: 'text', shape: 'rectangle', color: 'orange', x: 460, y: 340, width: 320, height: 200, content: '⚡ THREATS\n\n• Browser IndexedDB quota limits on full storage\n• Cross-browser touch gesture quirks' }
    ],
    arrows: []
  };
}
