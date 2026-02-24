/**
 * Table Component
 * Renders accountability tables and other data tables
 */

import { formatGmv, getStatusClass } from '../data/mock-data.js';

/**
 * Create an accountability table
 * @param {Array} data - Array of row objects
 * @param {string} [title] - Optional table title
 * @returns {string} HTML string
 */
export function createAccountabilityTable(data, title = 'Accountability by Owner') {
  const rowsHtml = data.map(row => {
    const gmvDisplay = formatGmv(row.gmvAtRisk);
    const statusBadge = `<span class="badge ${getStatusClass(row.status)}">${row.status}</span>`;

    return `
      <tr>
        <td>
          <div class="data-table__owner">
            <span class="data-table__owner-icon">${row.icon}</span>
            <span class="data-table__owner-name">${row.owner}</span>
          </div>
        </td>
        <td class="text-center">${row.alertCount}</td>
        <td class="data-table__gmv">${gmvDisplay}</td>
        <td class="data-table__issue" title="${row.topIssue}">${row.topIssue}</td>
        <td>${statusBadge}</td>
        <td>
          <a href="${row.dashboardLink}" class="btn btn--link">View →</a>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card">
      <div class="card__header">
        <h3 class="card__title">${title}</h3>
      </div>
      <div class="data-table">
        <div class="data-table__wrapper">
          <table>
            <thead>
              <tr>
                <th>Owner</th>
                <th class="text-center">Alerts</th>
                <th>GMV at Risk</th>
                <th>Top Issue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create a top alerts summary table
 * @param {Array} alerts - Array of top alert objects
 * @param {string} [title] - Optional table title
 * @returns {string} HTML string
 */
export function createTopAlertsTable(alerts, title = 'Top 5 P0 Alerts') {
  const rowsHtml = alerts.map(alert => {
    const gmvDisplay = formatGmv(alert.gmv_loss);

    return `
      <tr>
        <td class="top-alerts-table__rank">#${alert.rank}</td>
        <td>
          <span class="badge badge--neutral">${alert.scope}</span>
        </td>
        <td class="top-alerts-table__entity">${alert.entity}</td>
        <td>${alert.owner}</td>
        <td class="top-alerts-table__gmv">${gmvDisplay}</td>
        <td>${alert.chronic_days_avg}d</td>
        <td class="data-table__issue" title="${alert.l3_narrative}">${alert.l3_narrative}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card">
      <div class="card__header">
        <h3 class="card__title">${title}</h3>
      </div>
      <div class="data-table">
        <div class="data-table__wrapper">
          <table class="top-alerts-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Scope</th>
                <th>Entity</th>
                <th>Owner</th>
                <th>GMV</th>
                <th>Age</th>
                <th>Root Cause</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create a generic data table
 * @param {Object} options - Table options
 * @param {Array} options.columns - Column definitions [{key, label, align, format}]
 * @param {Array} options.data - Row data
 * @param {string} [options.title] - Table title
 * @returns {string} HTML string
 */
export function createDataTable({ columns, data, title }) {
  // Build header
  const headerHtml = columns.map(col =>
    `<th class="${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}">${col.label}</th>`
  ).join('');

  // Build rows
  const rowsHtml = data.map(row => {
    const cellsHtml = columns.map(col => {
      let value = row[col.key];

      // Apply format if specified
      if (col.format === 'gmv') {
        value = formatGmv(value);
      } else if (col.format === 'percentage') {
        value = `${value}%`;
      } else if (col.format === 'badge' && col.badgeKey) {
        const status = row[col.badgeKey];
        value = `<span class="badge ${getStatusClass(status)}">${value}</span>`;
      }

      const alignClass = col.align === 'center' ? 'text-center' :
                         col.align === 'right' ? 'text-right' : '';

      return `<td class="${alignClass}">${value}</td>`;
    }).join('');

    return `<tr>${cellsHtml}</tr>`;
  }).join('');

  const titleHtml = title ? `
    <div class="card__header">
      <h3 class="card__title">${title}</h3>
    </div>
  ` : '';

  return `
    <div class="card">
      ${titleHtml}
      <div class="data-table">
        <div class="data-table__wrapper">
          <table>
            <thead>
              <tr>${headerHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create a simple stats table (2 columns: label, value)
 * @param {Array} stats - Array of {label, value} objects
 * @param {string} [title] - Optional title
 * @returns {string} HTML string
 */
export function createStatsTable(stats, title) {
  const rowsHtml = stats.map(stat => `
    <tr>
      <td class="text-gray-600">${stat.label}</td>
      <td class="text-right font-semibold">${stat.value}</td>
    </tr>
  `).join('');

  const titleHtml = title ? `
    <div class="card__header">
      <h3 class="card__title">${title}</h3>
    </div>
  ` : '';

  return `
    <div class="card">
      ${titleHtml}
      <div class="data-table">
        <table>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
