/**
 * StateStore: Single Source of Truth for Canvas Studio using Pub/Sub pattern
 */

import { generateId } from '../utils/helpers.js';

class StateStore {
  constructor() {
    this.listeners = new Map();

    this.state = {
      boards: [],
      activeBoardId: null,
      elements: [], // Nodes on canvas
      arrows: [],    // Connectors
      selectedIds: [],
      selectedArrowId: null,

      // Viewport State
      pan: { x: 0, y: 0 },
      zoom: 1,

      // Tool State
      activeTool: 'select', // 'select' | 'pan' | 'text' | 'shape' | 'arrow' | 'image'
      activeShapeType: 'rectangle', // 'rectangle' | 'circle' | 'diamond' | 'triangle' | 'hexagon' | 'star'
      activeColor: 'default',

      // App Theme & System State
      theme: localStorage.getItem('canvas_studio_theme') || 'dark',
      saveStatus: 'saved', // 'saved' | 'saving' | 'error'
      isSidebarOpen: false
    };
  }

  // Subscribe to changes on state keys or '*'
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key) || [];
      this.listeners.set(key, callbacks.filter((cb) => cb !== callback));
    };
  }

  notify(key, data) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach((cb) => cb(data, this.state));
    }
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach((cb) => cb(key, data, this.state));
    }
  }

  getState() {
    return this.state;
  }

  // Mutators
  setState(partialState) {
    Object.assign(this.state, partialState);
    Object.keys(partialState).forEach((key) => {
      this.notify(key, this.state[key]);
    });
  }

  // Board Mutators
  setBoards(boards) {
    this.setState({ boards });
  }

  setActiveBoard(boardId) {
    const board = this.state.boards.find((b) => b.id === boardId);
    if (!board) return;

    this.setState({
      activeBoardId: boardId,
      elements: board.elements || [],
      arrows: board.arrows || [],
      selectedIds: [],
      selectedArrowId: null,
      pan: board.pan || { x: 0, y: 0 },
      zoom: board.zoom || 1
    });
  }

  createBoard(title = 'Untitled Board') {
    const newBoard = {
      id: generateId('board'),
      title,
      elements: [],
      arrows: [],
      pan: { x: 0, y: 0 },
      zoom: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const boards = [...this.state.boards, newBoard];
    this.setBoards(boards);
    this.setActiveBoard(newBoard.id);
    return newBoard;
  }

  updateActiveBoardTitle(newTitle) {
    const boards = this.state.boards.map((b) => {
      if (b.id === this.state.activeBoardId) {
        return { ...b, title: newTitle, updatedAt: Date.now() };
      }
      return b;
    });
    this.setState({ boards });
  }

  deleteBoard(boardId) {
    const boards = this.state.boards.filter((b) => b.id !== boardId);
    this.setState({ boards });
    if (this.state.activeBoardId === boardId && boards.length > 0) {
      this.setActiveBoard(boards[0].id);
    }
  }

  // Canvas Element Mutators
  setElements(elements) {
    this.setState({ elements });
  }

  addElement(element) {
    const elements = [...this.state.elements, element];
    this.setState({ elements });
  }

  updateElement(id, partialProps) {
    const elements = this.state.elements.map((el) => {
      if (el.id === id) {
        return { ...el, ...partialProps };
      }
      return el;
    });
    this.setState({ elements });
  }

  deleteSelected() {
    const { selectedIds, selectedArrowId, elements, arrows } = this.state;
    
    let newElements = elements;
    let newArrows = arrows;

    if (selectedIds.length > 0) {
      const selectedSet = new Set(selectedIds);
      newElements = elements.filter((el) => !selectedSet.has(el.id));
      // Delete arrows attached to deleted elements
      newArrows = arrows.filter(
        (a) => !selectedSet.has(a.fromNodeId) && !selectedSet.has(a.toNodeId)
      );
    }

    if (selectedArrowId) {
      newArrows = newArrows.filter((a) => a.id !== selectedArrowId);
    }

    this.setState({
      elements: newElements,
      arrows: newArrows,
      selectedIds: [],
      selectedArrowId: null
    });
  }

  // Arrow Mutators
  addArrow(arrow) {
    const arrows = [...this.state.arrows, arrow];
    this.setState({ arrows });
  }

  // Selection
  setSelectedIds(ids) {
    this.setState({ selectedIds: ids, selectedArrowId: null });
  }

  setSelectedArrowId(arrowId) {
    this.setState({ selectedArrowId: arrowId, selectedIds: [] });
  }

  // Tooling
  setTool(tool) {
    this.setState({ activeTool: tool });
  }

  setTheme(theme) {
    localStorage.setItem('canvas_studio_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.setState({ theme });
  }
}

export const stateStore = new StateStore();
