/**
 * HistoryManager: Undo / Redo engine tracking snapshots of canvas state
 */

import { stateStore } from './StateStore.js';

class HistoryManager {
  constructor(maxHistory = 30) {
    this.maxHistory = maxHistory;
    this.undoStack = [];
    this.redoStack = [];
    this.isRecording = true;
  }

  saveSnapshot() {
    if (!this.isRecording) return;
    const { elements, arrows } = stateStore.getState();
    const snapshot = {
      elements: JSON.parse(JSON.stringify(elements)),
      arrows: JSON.parse(JSON.stringify(arrows))
    };

    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new operation
  }

  undo() {
    if (this.undoStack.length === 0) return;

    const currentSnapshot = {
      elements: JSON.parse(JSON.stringify(stateStore.getState().elements)),
      arrows: JSON.parse(JSON.stringify(stateStore.getState().arrows))
    };
    this.redoStack.push(currentSnapshot);

    const previousState = this.undoStack.pop();
    this.applySnapshot(previousState);
  }

  redo() {
    if (this.redoStack.length === 0) return;

    const currentSnapshot = {
      elements: JSON.parse(JSON.stringify(stateStore.getState().elements)),
      arrows: JSON.parse(JSON.stringify(stateStore.getState().arrows))
    };
    this.undoStack.push(currentSnapshot);

    const nextState = this.redoStack.pop();
    this.applySnapshot(nextState);
  }

  applySnapshot(snapshot) {
    this.isRecording = false;
    stateStore.setState({
      elements: snapshot.elements,
      arrows: snapshot.arrows,
      selectedIds: []
    });
    this.isRecording = true;
  }
}

export const historyManager = new HistoryManager();
