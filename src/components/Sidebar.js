/**
 * Sidebar Drawer Component for Board CRUD & Navigation
 */

import { stateStore } from '../core/StateStore.js';
import { storageAdapter } from '../core/StorageAdapter.js';
import { templateGallery } from './TemplateGallery.js';

class Sidebar {
  constructor() {
    this.el = null;
    this.searchQuery = '';
  }

  init(sidebarEl) {
    this.el = sidebarEl;
    this.render();

    stateStore.subscribe('boards', () => this.renderBoardList());
    stateStore.subscribe('activeBoardId', () => this.renderBoardList());
    stateStore.subscribe('isSidebarOpen', (isOpen) => {
      if (isOpen) this.el.classList.add('open');
      else this.el.classList.remove('open');
    });
  }

  render() {
    this.el.className = 'sidebar-drawer';
    this.el.innerHTML = `
      <div class="sidebar-header">
        <span class="sidebar-title">Your Boards</span>
        <button class="icon-btn" id="closeSidebarBtn" title="Close"><i class="fas fa-times"></i></button>
      </div>
      <div class="sidebar-search">
        <input type="text" class="search-field" id="boardSearchInput" placeholder="Search boards...">
      </div>
      <div class="board-list" id="sidebarBoardList"></div>
      <div style="padding: 12px; display:flex; flex-direction:column; gap:8px;">
        <button class="menu-item" id="sidebarNewBoardBtn" style="width:100%; justify-content: center; background: var(--accent); color:#fff;">
          <i class="fas fa-plus"></i> Blank Board
        </button>
        <button class="menu-item" id="sidebarTemplateBtn" style="width:100%; justify-content: center; background: var(--bg-secondary); border: 1px solid var(--border-medium); color: var(--text-primary);">
          <i class="fas fa-file-alt" style="color:var(--accent);"></i> Pick Template
        </button>
      </div>
    `;

    this.attachEvents();
    this.renderBoardList();
  }

  attachEvents() {
    this.el.querySelector('#closeSidebarBtn').addEventListener('click', () => {
      stateStore.setState({ isSidebarOpen: false });
    });

    this.el.querySelector('#sidebarNewBoardBtn').addEventListener('click', () => {
      stateStore.createBoard('Untitled Board');
      stateStore.setState({ isSidebarOpen: false });
    });

    this.el.querySelector('#sidebarTemplateBtn').addEventListener('click', () => {
      stateStore.setState({ isSidebarOpen: false });
      templateGallery.show();
    });

    const searchInput = this.el.querySelector('#boardSearchInput');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderBoardList();
    });

    const boardListEl = this.el.querySelector('#sidebarBoardList');
    boardListEl.addEventListener('click', async (e) => {
      const item = e.target.closest('.board-item');
      if (!item) return;

      const boardId = item.dataset.id;
      const deleteBtn = e.target.closest('.delete-board-btn');

      if (deleteBtn) {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this board?')) {
          await storageAdapter.deleteBoard(boardId);
          stateStore.deleteBoard(boardId);
        }
        return;
      }

      stateStore.setActiveBoard(boardId);
      stateStore.setState({ isSidebarOpen: false });
    });
  }

  renderBoardList() {
    const listContainer = this.el.querySelector('#sidebarBoardList');
    if (!listContainer) return;

    const { boards, activeBoardId } = stateStore.getState();
    const filtered = boards.filter((b) =>
      b.title.toLowerCase().includes(this.searchQuery)
    );

    listContainer.innerHTML = filtered
      .map(
        (board) => `
      <div class="board-item ${board.id === activeBoardId ? 'active' : ''}" data-id="${board.id}">
        <span>${board.title || 'Untitled Board'}</span>
        <div class="board-actions">
          <button class="icon-btn delete-board-btn" title="Delete Board"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `
      )
      .join('');
  }
}

export const sidebar = new Sidebar();
