/**
 * Executive Dashboard Page
 * Main overview dashboard with KPIs, charts, and accountability table
 */

import { mockData, formatGmv } from '../data/mock-data.js';
import { createExecutiveKpis } from '../components/kpi-card.js';
// Charts removed for minimal view - KPI Tree and Accountability Table cover the same data
import { createAccountabilityTable, createTopAlertsTable } from '../components/table.js';
import { createKpiTree } from '../components/kpi-tree.js';

/**
 * Create the actionable completion widget
 * @param {Object} data - Completion data from mockData
 * @param {Object} config - Widget labels from config
 * @returns {string} HTML string
 */
function createCompletionWidget(data, config) {
  const overallPercentage = data.overall;
  const circumference = 2 * Math.PI * 50; // radius = 50
  const dashOffset = circumference - (circumference * overallPercentage / 100);

  // Determine status color
  let statusClass = 'good';
  if (overallPercentage < 50) statusClass = 'critical';
  else if (overallPercentage < 70) statusClass = 'warning';

  // Build team items
  const teamItemsHtml = data.byTeam.map(team => {
    let fillClass = 'good';
    if (team.percentage < 50) fillClass = 'critical';
    else if (team.percentage < 70) fillClass = 'warning';

    return `
      <div class="completion-widget__item">
        <div class="completion-widget__item-left">
          <span class="completion-widget__item-icon">${team.icon}</span>
          <span class="completion-widget__item-name">${team.name}</span>
        </div>
        <div class="completion-widget__item-right">
          <div class="completion-widget__item-bar">
            <div class="completion-widget__item-bar-fill completion-widget__item-bar-fill--${fillClass}" style="width: ${team.percentage}%"></div>
          </div>
          <span class="completion-widget__item-value">${team.completed}/${team.total}</span>
        </div>
      </div>
    `;
  }).join('');

  // Build impact items
  const impactItemsHtml = data.byImpact.map(impact => {
    let fillClass = 'good';
    if (impact.percentage < 50) fillClass = 'critical';
    else if (impact.percentage < 70) fillClass = 'warning';

    return `
      <div class="completion-widget__item">
        <div class="completion-widget__item-left">
          <span class="completion-widget__item-name">${impact.name}</span>
        </div>
        <div class="completion-widget__item-right">
          <div class="completion-widget__item-bar">
            <div class="completion-widget__item-bar-fill completion-widget__item-bar-fill--${fillClass}" style="width: ${impact.percentage}%"></div>
          </div>
          <span class="completion-widget__item-value">${impact.percentage}%</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="completion-widget">
      <div class="completion-widget__header">
        <h3 class="completion-widget__title">${config.title}</h3>
        <span class="text-sm text-gray-500">${data.todayStats.completed}/${data.todayStats.assigned} done</span>
      </div>

      <div class="completion-widget__overall">
        <div class="completion-widget__circle">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle class="completion-widget__circle-bg" cx="60" cy="60" r="50"></circle>
            <circle class="completion-widget__circle-progress completion-widget__circle-progress--${statusClass}"
                    cx="60" cy="60" r="50"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${dashOffset}"></circle>
          </svg>
          <span class="completion-widget__percentage">${overallPercentage}%</span>
        </div>
        <div class="completion-widget__label">${config.overallLabel}</div>
      </div>

      <div class="completion-widget__section">
        <div class="completion-widget__section-title">${config.byTeamLabel}</div>
        ${teamItemsHtml}
      </div>

      <div class="completion-widget__section">
        <div class="completion-widget__section-title">${config.byPriorityLabel}</div>
        ${impactItemsHtml}
      </div>
    </div>
  `;
}

/**
 * Render the Executive dashboard
 * @returns {string} HTML string
 */
export function renderExecutiveDashboard() {
  const { dashboardConfig, summary, accountabilityTable, topP0Alerts, actionableCompletion } = mockData;
  const execConfig = dashboardConfig.executive;

  // Build header meta info
  const labels = execConfig.headerLabels;
  const headerMeta = `
    <div class="dashboard-header__meta pill-group">
      <span class="pill">
        <span class="pill__label">${labels.date}:</span>
        <span class="pill__value">${summary.date}</span>
      </span>
      <span class="pill">
        <span class="pill__label">${labels.city}:</span>
        <span class="pill__value">${summary.city}</span>
      </span>
      <span class="pill">
        <span class="pill__label">${labels.category}:</span>
        <span class="pill__value">${summary.category}</span>
      </span>
      <span class="pill">
        <span class="pill__label">${labels.tracking}:</span>
        <span class="pill__value">${summary.trackedSkus.toLocaleString()} SKUs</span>
      </span>
    </div>
  `;

  // Build KPIs section
  const kpisHtml = createExecutiveKpis(summary);

  // Build accountability table
  const accountabilityHtml = createAccountabilityTable(accountabilityTable, execConfig.tables.accountability);

  // Build top P0 alerts table
  const topAlertsHtml = createTopAlertsTable(topP0Alerts, execConfig.tables.topAlerts);

  // Build completion widget
  const completionWidgetHtml = createCompletionWidget(actionableCompletion, execConfig.completionWidget);

  // Build KPI dependency tree
  const kpiTreeHtml = createKpiTree(dashboardConfig.kpiTree.title);

  return `
    <div class="dashboard-header">
      <div class="dashboard-header__top">
        <h1 class="dashboard-header__title">
          <span class="dashboard-header__icon">${execConfig.icon}</span>
          ${execConfig.name}
        </h1>
      </div>
      ${headerMeta}
    </div>

    <div class="dashboard-content">
      <!-- KPIs Row -->
      ${kpisHtml}

      <!-- KPI Dependency Tree (shows GMV breakdown by persona) -->
      ${kpiTreeHtml}

      <!-- Accountability Table -->
      <div class="mb-6">
        ${accountabilityHtml}
      </div>

      <!-- Top P0 Alerts + Completion Widget Row -->
      <div class="exec-row">
        <div>
          ${topAlertsHtml}
        </div>
        <div>
          ${completionWidgetHtml}
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize charts after render (placeholder for future chart.js integrations)
 */
export function initExecutiveCharts() {
  // No chart.js charts currently in use
  // KPI trees and other visualizations use HTML/CSS
}
