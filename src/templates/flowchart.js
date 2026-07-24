import { generateId } from '../utils/helpers.js';

export function createFlowchartTemplate() {
  const start = generateId('el');
  const process1 = generateId('el');
  const decision = generateId('el');
  const pathYes = generateId('el');
  const pathNo = generateId('el');

  return {
    title: 'User Flowchart / Logic Tree',
    elements: [
      { id: start, type: 'shape', shape: 'circle', color: 'green', x: 380, y: 80, width: 140, height: 70, content: 'Start Process' },
      { id: process1, type: 'text', shape: 'rectangle', color: 'blue', x: 360, y: 200, width: 180, height: 80, content: 'Validate Input Credentials' },
      { id: decision, type: 'shape', shape: 'diamond', color: 'yellow', x: 360, y: 340, width: 180, height: 120, content: 'Is Valid?' },
      { id: pathYes, type: 'text', shape: 'rectangle', color: 'teal', x: 580, y: 520, width: 160, height: 80, content: 'Proceed to Dashboard' },
      { id: pathNo, type: 'text', shape: 'rectangle', color: 'coral', x: 180, y: 520, width: 160, height: 80, content: 'Show Error Message' }
    ],
    arrows: [
      { id: generateId('arrow'), fromNodeId: start, fromAnchor: 'bottom', toNodeId: process1, toAnchor: 'top', style: 'curved', strokeStyle: 'solid' },
      { id: generateId('arrow'), fromNodeId: process1, fromAnchor: 'bottom', toNodeId: decision, toAnchor: 'top', style: 'curved', strokeStyle: 'solid' },
      { id: generateId('arrow'), fromNodeId: decision, fromAnchor: 'right', toNodeId: pathYes, toAnchor: 'top', style: 'curved', strokeStyle: 'solid', label: 'Yes' },
      { id: generateId('arrow'), fromNodeId: decision, fromAnchor: 'left', toNodeId: pathNo, toAnchor: 'top', style: 'curved', strokeStyle: 'dashed', label: 'No' }
    ]
  };
}
