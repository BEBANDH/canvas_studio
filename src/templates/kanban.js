import { generateId } from '../utils/helpers.js';

export function createKanbanTemplate() {
  const c1 = generateId('el');
  const c2 = generateId('el');
  const c3 = generateId('el');

  const t1 = generateId('el');
  const t2 = generateId('el');
  const t3 = generateId('el');
  const t4 = generateId('el');

  return {
    title: 'Kanban Task Clusters',
    elements: [
      { id: c1, type: 'text', shape: 'rectangle', color: 'blue', x: 100, y: 80, width: 220, height: 50, content: '📌 TO DO' },
      { id: c2, type: 'text', shape: 'rectangle', color: 'yellow', x: 360, y: 80, width: 220, height: 50, content: '⚡ IN PROGRESS' },
      { id: c3, type: 'text', shape: 'rectangle', color: 'green', x: 620, y: 80, width: 220, height: 50, content: '✅ DONE' },

      { id: t1, type: 'text', shape: 'rectangle', color: 'coral', x: 100, y: 160, width: 220, height: 90, content: 'Design System Tokens & Typography' },
      { id: t2, type: 'text', shape: 'rectangle', color: 'purple', x: 100, y: 270, width: 220, height: 90, content: 'Write Unit Tests for Store Engine' },

      { id: t3, type: 'text', shape: 'rectangle', color: 'orange', x: 360, y: 160, width: 220, height: 90, content: 'SVG Connector Line Routing' },
      { id: t4, type: 'text', shape: 'rectangle', color: 'teal', x: 620, y: 160, width: 220, height: 90, content: 'IndexedDB Storage Adapter' }
    ],
    arrows: []
  };
}
