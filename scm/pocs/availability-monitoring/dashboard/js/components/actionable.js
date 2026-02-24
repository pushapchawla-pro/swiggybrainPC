/**
 * Actionable Component
 * Renders actionable items with checkboxes and action buttons
 */

import { formatGmv } from '../data/mock-data.js';

/**
 * Create a single actionable item
 * @param {Object} item - Actionable item data
 * @param {number} item.id - Item ID
 * @param {string} item.action - Action description
 * @param {number} item.gmv - GMV impact
 * @param {boolean} item.completed - Whether item is completed
 * @returns {string} HTML string
 */
export function createActionableItem(item) {
  const gmvDisplay = formatGmv(item.gmv);
  const checkedClass = item.completed ? 'checked' : '';
  const textClass = item.completed ? 'text-gray-400' : '';
  const strikeClass = item.completed ? 'style="text-decoration: line-through;"' : '';

  return `
    <div class="actionable-item" data-actionable-id="${item.id}">
      <div class="actionable-item__checkbox ${checkedClass}" onclick="toggleActionable(${item.id})"></div>
      <span class="actionable-item__text ${textClass}" ${strikeClass}>${item.action}</span>
      <span class="actionable-item__gmv">${gmvDisplay}</span>
      <div class="actionable-item__actions">
        ${!item.completed ? `
          <button class="btn btn--primary btn--sm" onclick="executeActionable(${item.id})">Execute</button>
          <button class="btn btn--secondary btn--sm" onclick="snoozeActionable(${item.id})">Snooze</button>
        ` : `
          <span class="badge badge--success">Done</span>
        `}
      </div>
    </div>
  `;
}

/**
 * Create an actionables list
 * @param {Array} items - Array of actionable items
 * @param {boolean} [showDisclaimer=true] - Whether to show LLM disclaimer
 * @returns {string} HTML string
 */
export function createActionablesList(items, showDisclaimer = true) {
  const itemsHtml = items.map(item => createActionableItem(item)).join('');

  const disclaimerHtml = showDisclaimer ? `
    <div class="actionable-list__disclaimer">
      <span>⚠️</span>
      <span>LLM generated recommendations - please verify before executing</span>
    </div>
  ` : '';

  return `
    <div class="actionables-list">
      ${itemsHtml}
    </div>
    ${disclaimerHtml}
  `;
}

/**
 * Create an actionables section with header
 * @param {Array} items - Array of actionable items
 * @param {string} [title='Top Actionables'] - Section title
 * @returns {string} HTML string
 */
export function createActionablesSection(items, title = 'Top Actionables') {
  const pendingCount = items.filter(i => !i.completed).length;
  const totalGmv = items.filter(i => !i.completed).reduce((sum, i) => sum + i.gmv, 0);

  return `
    <div class="actionables-section">
      <div class="actionables-section__header">
        <h3 class="actionables-section__title">${title}</h3>
        <span class="text-sm text-gray-500">
          ${pendingCount} pending · ${formatGmv(totalGmv)} GMV impact
        </span>
      </div>
      ${createActionablesList(items)}
    </div>
  `;
}

/**
 * Toggle actionable completion state
 * Global function called from onclick
 */
window.toggleActionable = function(id) {
  const item = document.querySelector(`[data-actionable-id="${id}"]`);
  if (item) {
    const checkbox = item.querySelector('.actionable-item__checkbox');
    const text = item.querySelector('.actionable-item__text');
    const actionsDiv = item.querySelector('.actionable-item__actions');

    checkbox.classList.toggle('checked');

    if (checkbox.classList.contains('checked')) {
      text.classList.add('text-gray-400');
      text.style.textDecoration = 'line-through';
      actionsDiv.innerHTML = '<span class="badge badge--success">Done</span>';
    } else {
      text.classList.remove('text-gray-400');
      text.style.textDecoration = 'none';
      actionsDiv.innerHTML = `
        <button class="btn btn--primary btn--sm" onclick="executeActionable(${id})">Execute</button>
        <button class="btn btn--secondary btn--sm" onclick="snoozeActionable(${id})">Snooze</button>
      `;
    }
  }
};

/**
 * Execute actionable (mock implementation)
 * Global function called from onclick
 */
window.executeActionable = function(id) {
  // In a real implementation, this would trigger the action
  alert(`Executing action #${id}...\n\nIn production, this would trigger the corresponding workflow.`);

  // Mark as completed
  window.toggleActionable(id);
};

/**
 * Snooze actionable (mock implementation)
 * Global function called from onclick
 */
window.snoozeActionable = function(id) {
  // In a real implementation, this would snooze for a period
  const item = document.querySelector(`[data-actionable-id="${id}"]`);
  if (item) {
    item.style.opacity = '0.5';
    setTimeout(() => {
      item.style.opacity = '1';
    }, 2000);
  }

  alert(`Action #${id} snoozed for 24 hours.\n\nIn production, this would reschedule the reminder.`);
};

/**
 * Create a quick actions panel
 * @param {Array} actions - Array of quick action buttons
 * @returns {string} HTML string
 */
export function createQuickActionsPanel(actions) {
  const buttonsHtml = actions.map(action => `
    <button class="btn btn--secondary" onclick="${action.onclick || ''}">
      ${action.icon ? `<span>${action.icon}</span>` : ''}
      ${action.label}
    </button>
  `).join('');

  return `
    <div class="card">
      <div class="card__header">
        <h3 class="card__title">Quick Actions</h3>
      </div>
      <div class="card__body">
        <div class="flex flex-wrap gap-2">
          ${buttonsHtml}
        </div>
      </div>
    </div>
  `;
}
