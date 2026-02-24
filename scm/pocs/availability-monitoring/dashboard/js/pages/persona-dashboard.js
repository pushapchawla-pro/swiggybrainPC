/**
 * Unified Persona Dashboard Template
 * Renders any persona dashboard using configuration from mock-data.js
 */

import { mockData, getTopActionablesFromAlerts } from '../data/mock-data.js';
import { createPersonaKpis } from '../components/kpi-card.js';
import { createAlertSection, initAlertSparklines } from '../components/alert-card.js';
import { createActionablesSection } from '../components/actionable.js';
import { createFilterBar } from '../components/dropdown.js';

/**
 * Persona configuration mapping
 * Maps persona keys to their data keys and KPI prefixes
 */
const PERSONA_CONFIG = {
  'category': {
    dataKey: 'categoryManagement',
    kpiPrefix: 'cat',
    filters: [
      {
        placeholder: 'All Brands',
        field: 'entity',
        items: [
          { value: '', label: 'All Brands' },
          { value: 'Coca-Cola', label: 'Coca-Cola' },
          { value: 'Britannia', label: 'Britannia' },
          { value: 'Nestle', label: 'Nestle' },
          { value: 'Amul', label: 'Amul' }
        ]
      }
    ]
  },
  'procurement': {
    dataKey: 'procurement',
    kpiPrefix: 'proc',
    filters: [
      {
        placeholder: 'All Warehouses',
        field: 'entity',
        items: [
          { value: '', label: 'All Warehouses' },
          { value: 'Central WH', label: 'Central WH' },
          { value: 'Whitefield Hub', label: 'Whitefield Hub' },
          { value: 'Bommanahalli Hub', label: 'Bommanahalli Hub' },
          { value: 'Yelahanka Hub', label: 'Yelahanka Hub' }
        ]
      }
    ]
  },
  'pod-ops': {
    dataKey: 'podOps',
    kpiPrefix: 'pod',
    filters: [
      {
        placeholder: 'All Pods',
        field: 'entity',
        items: [
          { value: '', label: 'All Pods' },
          { value: 'HSR Layout Store', label: 'HSR Layout' },
          { value: 'Koramangala Store', label: 'Koramangala' },
          { value: 'Indiranagar Store', label: 'Indiranagar' },
          { value: 'Whitefield Store', label: 'Whitefield' },
          { value: 'Jayanagar Store', label: 'Jayanagar' }
        ]
      }
    ]
  },
  'planning': {
    dataKey: 'planning',
    kpiPrefix: 'plan',
    filters: [
      {
        placeholder: 'All Warehouses',
        field: 'entity',
        items: [
          { value: '', label: 'All Warehouses' },
          { value: 'Central WH', label: 'Central WH' },
          { value: 'Whitefield Hub', label: 'Whitefield Hub' },
          { value: 'Electronic City Hub', label: 'Electronic City' },
          { value: 'Bommanahalli Hub', label: 'Bommanahalli' }
        ]
      }
    ]
  },
  'warehouse': {
    dataKey: 'warehouse',
    kpiPrefix: 'wh',
    filters: [
      {
        placeholder: 'All Warehouses',
        field: 'entity',
        items: [
          { value: '', label: 'All Warehouses' },
          { value: 'Whitefield Hub', label: 'Whitefield Hub' },
          { value: 'Bommanahalli Hub', label: 'Bommanahalli Hub' },
          { value: 'Central WH', label: 'Central WH' },
          { value: 'Yelahanka Hub', label: 'Yelahanka Hub' }
        ]
      }
    ]
  },
  'erp-team': {
    dataKey: 'erpTeam',
    kpiPrefix: 'erp',
    filters: [
      {
        placeholder: 'All Cities',
        field: 'entity',
        items: [
          { value: '', label: 'All Cities' },
          { value: 'Bangalore', label: 'Bangalore' }
        ]
      }
    ]
  },
  'product-support': {
    dataKey: 'productSupport',
    kpiPrefix: 'ps',
    filters: [
      {
        placeholder: 'All Issue Types',
        field: 'entity',
        items: [
          { value: '', label: 'All Issue Types' },
          { value: 'Stale Override Rules', label: 'Stale Rules' },
          { value: 'Holiday Calendar Config', label: 'Holiday Config' },
          { value: 'OOS Override Accumulation', label: 'OOS Overrides' },
          { value: 'CR Rule Conflicts', label: 'CR Conflicts' }
        ]
      }
    ]
  }
};

/**
 * Get common filter options (shared across all personas)
 * Values come from dashboardConfig.persona.filters
 */
function getCommonFilters() {
  const filterConfig = mockData.dashboardConfig.persona.filters;
  return {
    priority: {
      placeholder: filterConfig.priority.placeholder,
      field: 'priority',
      items: [
        { value: '', label: filterConfig.priority.options[0] },
        { value: 'P0', label: filterConfig.priority.options[1] },
        { value: 'P1', label: filterConfig.priority.options[2] },
        { value: 'P2', label: filterConfig.priority.options[3] }
      ]
    },
    sort: {
      placeholder: filterConfig.sort.placeholder,
      field: 'sort',
      items: [
        { value: 'gmv', label: filterConfig.sort.options[0] },
        { value: 'days', label: filterConfig.sort.options[1] },
        { value: 'priority', label: filterConfig.sort.options[2] }
      ]
    }
  };
}

/**
 * Render a persona dashboard
 * @param {string} personaKey - Key identifying the persona (e.g., 'category', 'procurement')
 * @returns {string} HTML string
 */
export function renderPersonaDashboard(personaKey) {
  const config = PERSONA_CONFIG[personaKey];
  if (!config) {
    return `<div class="error">Unknown persona: ${personaKey}</div>`;
  }

  const personaData = mockData[config.dataKey];
  if (!personaData) {
    return `<div class="error">No data for persona: ${personaKey}</div>`;
  }

  const { persona, kpis, alerts } = personaData;
  const dashConfig = mockData.dashboardConfig.persona;

  // Build KPIs section
  const kpisHtml = createPersonaKpis(kpis, config.kpiPrefix);

  // Build alerts section
  const alertsHtml = createAlertSection(alerts, dashConfig.sections.alerts, 5);

  // Build actionables section - derived from alerts, top 5 by GMV
  const topActionables = getTopActionablesFromAlerts(alerts, 5);
  const actionablesHtml = createActionablesSection(topActionables, dashConfig.sections.actionables);

  // Build filters: persona-specific + common filters
  const commonFilters = getCommonFilters();
  const allFilters = [
    ...config.filters,
    commonFilters.priority,
    commonFilters.sort
  ];

  const labels = dashConfig.labels;

  return `
    <div class="dashboard-header">
      <div class="dashboard-header__top">
        <h1 class="dashboard-header__title">
          <span class="dashboard-header__icon">${persona.icon}</span>
          ${persona.name}
        </h1>
      </div>
      <div class="dashboard-header__meta pill-group">
        <span class="pill">
          <span class="pill__label">${labels.level}:</span>
          <span class="pill__value">${persona.level}</span>
        </span>
        <span class="pill">
          <span class="pill__label">${labels.aggregateBy}:</span>
          <span class="pill__value">${persona.aggregateBy ? persona.aggregateBy.join(', ') : persona.level}</span>
        </span>
        <span class="pill">
          <span class="pill__label">${labels.focus}:</span>
          <span class="pill__value">${persona.description}</span>
        </span>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- KPIs Row -->
      ${kpisHtml}

      <!-- Filter Bar -->
      ${createFilterBar(allFilters)}

      <!-- Alerts Section -->
      <div class="mb-6">
        ${alertsHtml}
      </div>

      <!-- Actionables Section -->
      ${actionablesHtml}
    </div>
  `;
}

/**
 * Initialize a persona dashboard after render
 * @param {string} personaKey - Key identifying the persona
 */
export function initPersonaDashboard(personaKey) {
  const config = PERSONA_CONFIG[personaKey];
  if (!config) return;

  const personaData = mockData[config.dataKey];
  if (!personaData) return;

  initAlertSparklines(personaData.alerts);
}

/**
 * Get persona configuration
 * @param {string} personaKey - Key identifying the persona
 * @returns {Object} Persona configuration
 */
export function getPersonaConfig(personaKey) {
  return PERSONA_CONFIG[personaKey] || null;
}

/**
 * Get all available persona keys
 * @returns {string[]} Array of persona keys
 */
export function getAllPersonaKeys() {
  return Object.keys(PERSONA_CONFIG);
}
