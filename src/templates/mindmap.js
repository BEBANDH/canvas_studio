import { generateId } from '../utils/helpers.js';

export function createMindmapTemplate() {
  const rootId = generateId('el');
  const b1 = generateId('el');
  const b2 = generateId('el');
  const b3 = generateId('el');
  const b4 = generateId('el');

  return {
    title: 'Brainstorming Mind Map',
    elements: [
      { id: rootId, type: 'shape', shape: 'circle', color: 'purple', x: 400, y: 300, width: 160, height: 160, content: 'Core Idea' },
      { id: b1, type: 'text', shape: 'rectangle', color: 'blue', x: 150, y: 150, width: 160, height: 80, content: 'Branch 1: User Needs' },
      { id: b2, type: 'text', shape: 'rectangle', color: 'green', x: 650, y: 150, width: 160, height: 80, content: 'Branch 2: Technical Stack' },
      { id: b3, type: 'text', shape: 'rectangle', color: 'orange', x: 150, y: 450, width: 160, height: 80, content: 'Branch 3: Design Principles' },
      { id: b4, type: 'text', shape: 'rectangle', color: 'pink', x: 650, y: 450, width: 160, height: 80, content: 'Branch 4: Roadmap' }
    ],
    arrows: [
      { id: generateId('arrow'), fromNodeId: rootId, fromAnchor: 'top', toNodeId: b1, toAnchor: 'bottom', style: 'curved', strokeStyle: 'solid' },
      { id: generateId('arrow'), fromNodeId: rootId, fromAnchor: 'right', toNodeId: b2, toAnchor: 'left', style: 'curved', strokeStyle: 'solid' },
      { id: generateId('arrow'), fromNodeId: rootId, fromAnchor: 'bottom', toNodeId: b3, toAnchor: 'top', style: 'curved', strokeStyle: 'solid' },
      { id: generateId('arrow'), fromNodeId: rootId, fromAnchor: 'right', toNodeId: b4, toAnchor: 'left', style: 'curved', strokeStyle: 'solid' }
    ]
  };
}
