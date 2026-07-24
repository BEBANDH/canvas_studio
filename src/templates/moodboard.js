import { generateId } from '../utils/helpers.js';

export function createMoodboardTemplate() {
  const header = generateId('el');
  const sw1 = generateId('el');
  const sw2 = generateId('el');
  const sw3 = generateId('el');
  const sw4 = generateId('el');
  const note = generateId('el');

  return {
    title: 'Moodboard Collage',
    elements: [
      { id: header, type: 'text', shape: 'rectangle', color: 'purple', x: 100, y: 80, width: 700, height: 60, content: '🎨 Visual Brand Identity Moodboard' },
      { id: sw1, type: 'shape', shape: 'rectangle', color: 'teal', x: 100, y: 180, width: 150, height: 120, content: '#ccfbf1 Teal' },
      { id: sw2, type: 'shape', shape: 'rectangle', color: 'purple', x: 280, y: 180, width: 150, height: 120, content: '#f3e8ff Lavender' },
      { id: sw3, type: 'shape', shape: 'rectangle', color: 'coral', x: 460, y: 180, width: 150, height: 120, content: '#ffe4e6 Coral' },
      { id: sw4, type: 'shape', shape: 'rectangle', color: 'sand', x: 640, y: 180, width: 150, height: 120, content: '#f5f5f4 Sand' },
      { id: note, type: 'text', shape: 'rectangle', color: 'yellow', x: 100, y: 340, width: 690, height: 180, content: 'Typography: Google Sans & Clean Minimalist Sans-Serif\n\nDesign Tokens: Soft pastel highlights, generous white space, subtle 1px borders, smooth rounded corners.' }
    ],
    arrows: []
  };
}
