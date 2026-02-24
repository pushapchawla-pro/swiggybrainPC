/**
 * Alert Card Component
 * Renders an expandable alert card with RCA details
 * Uses data strategy schema exclusively
 */

import { formatGmv, getPriorityClass } from '../data/mock-data.js';
import { drawSparkline } from './chart.js';

/**
 * Create an alert card HTML string
 * @param {Object} alert - Alert data object (data strategy schema)
 * @param {boolean} [expanded=false] - Whether card starts expanded
 * @returns {string} HTML string
 */
export function createAlertCard(alert, expanded = false) {
  const priorityClass = getPriorityClass(alert.priority);
  const expandedClass = expanded ? 'expanded' : '';

  // Format GMV
  const gmvDisplay = formatGmv(alert.gmv_loss);

  // Build affected items list from affected_skus array
  let affectedItemsHtml = '';
  if (alert.affected_skus && alert.affected_skus.length > 0) {
    affectedItemsHtml = alert.affected_skus
      .map(sku => `<span class="alert-card__affected-item">${sku.sku_name} (${sku.chronic_days}d)</span>`)
      .join('');
    // Add count badge if there are more
    if (alert.affected_sku_count > alert.affected_skus.length) {
      affectedItemsHtml += `<span class="alert-card__affected-item alert-card__affected-item--more">+${alert.affected_sku_count - alert.affected_skus.length} more</span>`;
    }
  } else {
    affectedItemsHtml = '<span class="alert-card__affected-item">No items listed</span>';
  }

  // Build attribution bars from l1_reason_distribution object
  let attributionHtml = '';
  if (alert.l1_reason_distribution && Object.keys(alert.l1_reason_distribution).length > 0) {
    attributionHtml = Object.entries(alert.l1_reason_distribution)
      .map(([reason, pct]) => {
        const percentage = Math.round(pct * 100);
        return `
        <div class="alert-card__attribution-item">
          <span class="alert-card__attribution-label">${reason}</span>
          <div class="alert-card__attribution-bar">
            <div class="alert-card__attribution-fill" style="width: ${percentage}%"></div>
          </div>
          <span class="alert-card__attribution-value">${percentage}%</span>
        </div>
      `;
      })
      .join('');
  } else {
    attributionHtml = '<div class="alert-card__attribution-item">No attribution data</div>';
  }

  // Build actions list from actions array
  const actionsHtml = alert.actions
    .map(action => {
      const actionGmv = formatGmv(action.gmv_at_risk);
      const isCompleted = action.status === 'completed';
      const checkedClass = isCompleted ? 'checked' : '';
      const textClass = isCompleted ? 'text-gray-400 line-through' : '';
      const ownerHtml = action.owner ? `<span class="alert-action__owner">${action.owner}</span>` : '';

      return `
        <div class="alert-action" data-action-id="${action.action_id}">
          <div class="alert-action__checkbox ${checkedClass}" onclick="event.stopPropagation(); toggleAlertAction('${action.action_id}')"></div>
          <div class="alert-action__content">
            <span class="alert-action__text ${textClass}">${action.text}</span>
            ${ownerHtml}
          </div>
          <span class="alert-action__gmv">${actionGmv}</span>
          <div class="alert-action__buttons">
            ${!isCompleted ? `
              <button class="btn btn--primary btn--xs" onclick="event.stopPropagation(); executeAlertAction('${action.action_id}')">Execute</button>
              <button class="btn btn--secondary btn--xs" onclick="event.stopPropagation(); snoozeAlertAction('${action.action_id}')">Snooze</button>
            ` : `
              <span class="badge badge--success">Done</span>
            `}
          </div>
        </div>
      `;
    })
    .join('');

  // LLM disclaimer
  const disclaimerHtml = alert.is_llm_generated
    ? '<div class="alert-card__disclaimer">⚠️ LLM generated - verify before action</div>'
    : '';

  // Key metric display
  const keyMetricHtml = alert.key_metric
    ? `<span class="stat-pill stat-pill--metric">
        <span class="stat-pill__value">${alert.key_metric.value}${alert.key_metric.unit}</span>
        <span class="stat-pill__label">${alert.key_metric.label} (target: ${alert.key_metric.target}${alert.key_metric.unit})</span>
       </span>`
    : '';

  return `
    <div class="alert-card ${priorityClass} ${expandedClass}" data-alert-id="${alert.alert_id}">
      <div class="alert-card__header" onclick="toggleAlertCard('${alert.alert_id}')">
        <div class="alert-card__top-row">
          <div class="alert-card__left">
            <span class="alert-card__priority alert-card__priority--${alert.priority.toLowerCase()}">${alert.priority}</span>
            <span class="alert-card__scope">${alert.scope}</span>
            <span class="alert-card__entity">${alert.entity}</span>
          </div>
          <canvas class="alert-card__sparkline" id="sparkline-${alert.alert_id}" width="80" height="24"></canvas>
          <span class="alert-card__expand-icon">▼</span>
        </div>
        <div class="alert-card__meta-row">
          <span class="stat-pill">
            <span class="stat-pill__value">${gmvDisplay}</span>
            <span class="stat-pill__label">GMV</span>
          </span>
          <span class="stat-pill">
            <span class="stat-pill__value">${alert.chronic_days_avg}</span>
            <span class="stat-pill__label">days</span>
          </span>
          <span class="stat-pill">
            <span class="stat-pill__value">${alert.impact_scope.count}</span>
            <span class="stat-pill__label">${alert.impact_scope.unit} (${alert.impact_scope.percentage}%)</span>
          </span>
          ${keyMetricHtml}
        </div>
      </div>
      <div class="alert-card__details">
        <div class="alert-card__details-content">
          <!-- Top row: Affected Items + Attribution side by side -->
          <div class="alert-card__details-row">
            <div class="alert-card__section alert-card__section--items">
              <div class="alert-card__section-header">Affected Items</div>
              <div class="alert-card__affected-list">
                ${affectedItemsHtml}
              </div>
            </div>
            <div class="alert-card__section alert-card__section--attribution">
              <div class="alert-card__section-header">Attribution</div>
              <div class="alert-card__attribution">
                ${attributionHtml}
              </div>
            </div>
          </div>

          <!-- RCA section - full width with accent -->
          <div class="alert-card__section alert-card__section--rca">
            <div class="alert-card__section-header">
              <span>🔍</span> Root Cause Analysis
            </div>
            <div class="alert-card__rca">
              ${alert.l3_narrative}
            </div>
          </div>

          <!-- Actions section - full width with accent -->
          <div class="alert-card__section alert-card__section--actions">
            <div class="alert-card__section-header">
              <span>⚡</span> Recommended Actions
            </div>
            <div class="alert-card__actions-list">
              ${actionsHtml}
            </div>
          </div>

          ${disclaimerHtml}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create a list of alert cards
 * @param {Array} alerts - Array of alert objects
 * @param {number} [limit] - Maximum number of cards to show
 * @returns {string} HTML string
 */
export function createAlertList(alerts, limit) {
  const displayAlerts = limit ? alerts.slice(0, limit) : alerts;
  const cardsHtml = displayAlerts.map(alert => createAlertCard(alert)).join('');

  return `
    <div class="alert-list">
      ${cardsHtml}
    </div>
  `;
}

/**
 * Create alert list with header
 * @param {Array} alerts - Array of alert objects
 * @param {string} title - Section title
 * @param {number} [limit=5] - Maximum alerts to show
 * @returns {string} HTML string
 */
export function createAlertSection(alerts, title, limit = 5) {
  const displayAlerts = alerts.slice(0, limit);

  return `
    <div class="alert-section">
      <div class="alert-list__header">
        <h3 class="alert-list__title">${title}</h3>
        <span class="alert-list__count">${alerts.length} total alerts</span>
      </div>
      ${createAlertList(displayAlerts)}
    </div>
  `;
}

/**
 * Toggle alert card expansion
 * Global function called from onclick
 * @param {string} alertId - The alert_id from data strategy schema
 */
window.toggleAlertCard = function(alertId) {
  const card = document.querySelector(`[data-alert-id="${alertId}"]`);
  if (card) {
    card.classList.toggle('expanded');
  }
};

/**
 * Toggle alert action completion state
 * Global function called from onclick
 */
window.toggleAlertAction = function(actionId) {
  const action = document.querySelector(`[data-action-id="${actionId}"]`);
  if (action) {
    const checkbox = action.querySelector('.alert-action__checkbox');
    const text = action.querySelector('.alert-action__text');
    const buttonsDiv = action.querySelector('.alert-action__buttons');

    checkbox.classList.toggle('checked');

    if (checkbox.classList.contains('checked')) {
      text.classList.add('text-gray-400', 'line-through');
      buttonsDiv.innerHTML = '<span class="badge badge--success">Done</span>';
    } else {
      text.classList.remove('text-gray-400', 'line-through');
      buttonsDiv.innerHTML = `
        <button class="btn btn--primary btn--xs" onclick="event.stopPropagation(); executeAlertAction('${actionId}')">Execute</button>
        <button class="btn btn--secondary btn--xs" onclick="event.stopPropagation(); snoozeAlertAction('${actionId}')">Snooze</button>
      `;
    }
  }
};

/**
 * Execute alert action
 * Global function called from onclick
 */
window.executeAlertAction = function(actionId) {
  alert(`Executing action ${actionId}...\n\nIn production, this would trigger the corresponding workflow.`);
  window.toggleAlertAction(actionId);
};

/**
 * Snooze alert action
 * Global function called from onclick
 */
window.snoozeAlertAction = function(actionId) {
  const action = document.querySelector(`[data-action-id="${actionId}"]`);
  if (action) {
    action.style.opacity = '0.5';
    setTimeout(() => {
      action.style.opacity = '1';
    }, 2000);
  }
  alert(`Action ${actionId} snoozed for 24 hours.\n\nIn production, this would reschedule the reminder.`);
};

/**
 * Initialize sparklines for all alert cards
 * Should be called after alerts are rendered
 */
export function initAlertSparklines(alerts) {
  alerts.forEach(alert => {
    const canvas = document.getElementById(`sparkline-${alert.alert_id}`);
    if (canvas && alert.trend) {
      const color = alert.priority === 'P0' ? '#dc2626' :
                    alert.priority === 'P1' ? '#ea580c' : '#ca8a04';
      drawSparkline(canvas, alert.trend, color);
    }
  });
}
