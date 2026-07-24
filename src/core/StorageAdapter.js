/**
 * StorageAdapter: IndexedDB with LocalStorage fallback for high scalability & robust saving
 */

const DB_NAME = 'CanvasStudioDB';
const DB_VERSION = 1;
const STORE_BOARDS = 'boards';

class StorageAdapter {
  constructor() {
    this.db = null;
    this.isReady = this.initDB();
  }

  async initDB() {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported, using LocalStorage fallback.');
      return false;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => {
        console.warn('IndexedDB failed to open, fallback to LocalStorage');
        resolve(false);
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(true);
      };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_BOARDS)) {
          db.createObjectStore(STORE_BOARDS, { keyPath: 'id' });
        }
      };
    });
  }

  async saveBoard(boardData) {
    const ready = await this.isReady;
    if (ready && this.db) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(STORE_BOARDS, 'readwrite');
        const store = tx.objectStore(STORE_BOARDS);
        const req = store.put(boardData);
        req.onsuccess = () => resolve(true);
        req.onerror = (err) => reject(err);
      });
    }

    // LocalStorage Fallback
    try {
      const boards = this.getBoardsFromLocalStorage();
      boards[boardData.id] = boardData;
      localStorage.setItem('canvas_studio_boards', JSON.stringify(boards));
      return true;
    } catch (e) {
      console.error('Failed to save to LocalStorage:', e);
      return false;
    }
  }

  async loadAllBoards() {
    const ready = await this.isReady;
    if (ready && this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction(STORE_BOARDS, 'readonly');
        const store = tx.objectStore(STORE_BOARDS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(this.getBoardsFromLocalStorageArray());
      });
    }
    return this.getBoardsFromLocalStorageArray();
  }

  async deleteBoard(boardId) {
    const ready = await this.isReady;
    if (ready && this.db) {
      return new Promise((resolve) => {
        const tx = this.db.transaction(STORE_BOARDS, 'readwrite');
        const store = tx.objectStore(STORE_BOARDS);
        const req = store.delete(boardId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    }

    const boards = this.getBoardsFromLocalStorage();
    delete boards[boardId];
    localStorage.setItem('canvas_studio_boards', JSON.stringify(boards));
    return true;
  }

  getBoardsFromLocalStorage() {
    try {
      return JSON.parse(localStorage.getItem('canvas_studio_boards')) || {};
    } catch {
      return {};
    }
  }

  getBoardsFromLocalStorageArray() {
    const obj = this.getBoardsFromLocalStorage();
    return Object.values(obj);
  }
}

export const storageAdapter = new StorageAdapter();
