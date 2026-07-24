/**
 * TemplateGallery Component: Modal Dialog for picking pre-built board blueprints
 */

import { stateStore } from '../core/StateStore.js';
import { createMindmapTemplate } from '../templates/mindmap.js';
import { createFlowchartTemplate } from '../templates/flowchart.js';
import { createMoodboardTemplate } from '../templates/moodboard.js';
import { createKanbanTemplate } from '../templates/kanban.js';
import { createSwotTemplate } from '../templates/swot.js';

class TemplateGallery {
  constructor() {
    this.modalEl = null;
  }

  init(containerEl) {
    this.modalEl = containerEl;
    this.render();
  }

  render() {
    this.modalEl.className = 'template-modal-backdrop hidden';
    this.modalEl.innerHTML = `
      <div class="template-modal">
        <div class="modal-header">
          <h3>📑 Choose a Board Template Blueprint</h3>
          <button class="icon-btn" id="closeTemplateModalBtn"><i class="fas fa-times"></i></button>
        </div>
        <div class="template-grid">
          <div class="template-card" data-template="mindmap">
            <div class="template-icon" style="color:#a855f7;"><i class="fas fa-brain"></i></div>
            <h4>Brainstorming Mind Map</h4>
            <p>Central core topic node with branching ideas.</p>
          </div>
          <div class="template-card" data-template="flowchart">
            <div class="template-icon" style="color:#10b981;"><i class="fas fa-project-diagram"></i></div>
            <h4>User Flowchart / Logic Tree</h4>
            <p>Process start, decision nodes, and labeled branches.</p>
          </div>
          <div class="template-card" data-template="moodboard">
            <div class="template-icon" style="color:#ec4899;"><i class="fas fa-palette"></i></div>
            <h4>Moodboard Collage</h4>
            <p>Brand design swatches, note cards, and layout frames.</p>
          </div>
          <div class="template-card" data-template="kanban">
            <div class="template-icon" style="color:#3b82f6;"><i class="fas fa-columns"></i></div>
            <h4>Kanban Task Clusters</h4>
            <p>3-column task board (To Do, In Progress, Done).</p>
          </div>
          <div class="template-card" data-template="swot">
            <div class="template-icon" style="color:#f59e0b;"><i class="fas fa-th-large"></i></div>
            <h4>SWOT Analysis Matrix</h4>
            <p>4-quadrant strategic planning matrix.</p>
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

  attachEvents() {
    this.modalEl.querySelector('#closeTemplateModalBtn').addEventListener('click', () => this.hide());
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.hide();

      const card = e.target.closest('.template-card');
      if (!card) return;

      const templateType = card.dataset.template;
      let templateData = null;

      if (templateType === 'mindmap') templateData = createMindmapTemplate();
      if (templateType === 'flowchart') templateData = createFlowchartTemplate();
      if (templateType === 'moodboard') templateData = createMoodboardTemplate();
      if (templateType === 'kanban') templateData = createKanbanTemplate();
      if (templateType === 'swot') templateData = createSwotTemplate();

      if (templateData) {
        const newBoard = stateStore.createBoard(templateData.title);
        stateStore.setState({
          elements: templateData.elements,
          arrows: templateData.arrows
        });
        this.hide();
      }
    });
  }
}

export const templateGallery = new TemplateGallery();
