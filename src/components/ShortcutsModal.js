/**
 * ShortcutsModal Component: Toolkit modal listing all keyboard & mouse controls
 */

class ShortcutsModal {
  constructor() {
    this.modalEl = null;
  }

  init(containerEl) {
    this.modalEl = containerEl;
    this.render();

    window.addEventListener('keydown', (e) => {
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (document.activeElement && (document.activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(activeTag))) {
          return;
        }
        e.preventDefault();
        this.toggle();
      }
    });
  }

  render() {
    this.modalEl.className = 'shortcuts-modal-backdrop hidden';
    this.modalEl.innerHTML = `
      <div class="shortcuts-modal">
        <div class="modal-header">
          <h3>⌨️ Keyboard & Mouse Controls Toolkit</h3>
          <button class="icon-btn" id="closeShortcutsModalBtn"><i class="fas fa-times"></i></button>
        </div>
        <div class="shortcuts-content">
          <div class="shortcut-group">
            <h4>Tools & Modes</h4>
            <div class="shortcut-row"><span class="shortcut-key">V</span> <span>Select Tool</span></div>
            <div class="shortcut-row"><span class="shortcut-key">H</span> <span>Pan Tool</span></div>
            <div class="shortcut-row"><span class="shortcut-key">T</span> <span>Note Tool</span></div>
            <div class="shortcut-row"><span class="shortcut-key">A</span> <span>Connector Line Tool</span></div>
          </div>

          <div class="shortcut-group">
            <h4>Canvas Interactions</h4>
            <div class="shortcut-row"><span class="shortcut-key">Double Click</span> <span>Add Note on Canvas</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Double Click Note</span> <span>Edit Text Content</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Space + Drag</span> <span>Pan Canvas Workspace</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Ctrl + Scroll</span> <span>Zoom In / Out</span></div>
          </div>

          <div class="shortcut-group">
            <h4>Editing & Organization</h4>
            <div class="shortcut-row"><span class="shortcut-key">Ctrl + Z</span> <span>Undo Action</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Ctrl + Y</span> <span>Redo Action</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Ctrl + G</span> <span>Group Selection</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Ctrl + L</span> <span>Lock Selection 🔒</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Ctrl + A</span> <span>Select All</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Ctrl + V</span> <span>Paste Image</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Delete</span> <span>Delete Selected</span></div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  show() {
    this.modalEl.classList.remove('hidden');
  }

  hide() {
    this.modalEl.classList.add('hidden');
  }

  toggle() {
    this.modalEl.classList.toggle('hidden');
  }

  attachEvents() {
    this.modalEl.querySelector('#closeShortcutsModalBtn').addEventListener('click', () => this.hide());
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.hide();
    });
  }
}

export const shortcutsModal = new ShortcutsModal();
