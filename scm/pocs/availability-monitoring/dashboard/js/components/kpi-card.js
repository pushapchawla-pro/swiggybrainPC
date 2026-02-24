/**
 * KPI Card Component
 * Renders a KPI card with value, target, trend, and status indicator
 * Now supports expandable trend charts with time period selectors
 */

import { formatGmv, formatTrend } from '../data/mock-data.js';

// Store Chart instances for expandable KPIs (global for cleanup)
window.kpiCharts = window.kpiCharts || {};
window.kpiTrendData = window.kpiTrendData || {};

/**
 * Create a KPI card HTML string
 * @param {Object} options - Card options
 * @param {string} options.title - Card title/label
 * @param {string|number} options.value - Main value to display
 * @param {string} [options.unit] - Unit suffix (%, hrs, etc.)
 * @param {string|number} [options.target] - Target value for comparison
 * @param {number} [options.trend] - Trend value (+/- number)
 * @param {string} [options.status] - Status: 'critical', 'warning', 'good'
 * @param {boolean} [options.invertTrend] - If true, positive trend is bad
 * @param {string} [options.subtitle] - Additional context below value
 * @param {boolean} [options.isGmv] - If true, format value as GMV
 * @param {Object} [options.trendHistory] - Trend history data for expandable chart
 * @param {string} [options.kpiId] - Unique ID for this KPI (for chart)
 * @returns {string} HTML string
 */
export function createKpiCard({
  title,
  value,
  unit = '',
  target,
  trend,
  status = 'neutral',
  invertTrend = false,
  subtitle,
  isGmv = false,
  trendHistory,
  kpiId
}) {
  // Format the main value
  let displayValue = isGmv ? formatGmv(value) : value;
  if (unit && !isGmv) {
    displayValue = `${value}${unit}`;
  }

  // Build target line
  let targetHtml = '';
  if (target !== undefined) {
    const targetDisplay = isGmv ? formatGmv(target) : `${target}${unit}`;
    targetHtml = `<span>Target: ${targetDisplay}</span>`;
  }

  // Build trend badge
  let trendHtml = '';
  if (trend !== undefined) {
    const trendData = formatTrend(trend, !invertTrend);
    trendHtml = `<span class="kpi-card__trend ${trendData.class}">${trendData.text}</span>`;
  }

  // Build subtitle
  let subtitleHtml = '';
  if (subtitle) {
    subtitleHtml = `<span class="text-gray-500">${subtitle}</span>`;
  }

  // Status class for left border
  const statusClass = status ? `kpi-card--${status}` : '';

  // Store trend data if provided (use window for global access in bundled file)
  if (trendHistory && kpiId) {
    window.kpiTrendData[kpiId] = trendHistory;
  }

  // Build expandable class and trend section if trendHistory exists
  const isExpandable = trendHistory && kpiId;
  const expandableClass = isExpandable ? 'kpi-card--expandable' : '';

  // Build trend section HTML for expandable KPIs
  let trendSectionHtml = '';
  if (isExpandable) {
    trendSectionHtml = `
      <div class="kpi-card__trend-section" onclick="event.stopPropagation()">
        <div class="kpi-card__period-selector">
          <button class="kpi-card__period-btn active" data-period="7d" onclick="updateKpiChart('${kpiId}', '7d')">7D</button>
          <button class="kpi-card__period-btn" data-period="30d" onclick="updateKpiChart('${kpiId}', '30d')">30D</button>
          <button class="kpi-card__period-btn" data-period="180d" onclick="updateKpiChart('${kpiId}', '180d')">180D</button>
        </div>
        <div class="kpi-card__chart">
          <canvas id="kpi-chart-${kpiId}" height="120"></canvas>
        </div>
      </div>
    `;
  }

  const clickHandler = isExpandable ? `onclick="toggleKpiCard('${kpiId}')"` : '';
  const dataAttr = kpiId ? `data-kpi-id="${kpiId}"` : '';

  return `
    <div class="kpi-card ${statusClass} ${expandableClass}" ${dataAttr} ${clickHandler}>
      <div class="kpi-card__header">
        <div class="kpi-card__label">${title}</div>
        ${isExpandable ? '<span class="kpi-card__expand-icon">▼</span>' : ''}
      </div>
      <div class="kpi-card__value">${displayValue}</div>
      <div class="kpi-card__target">
        ${targetHtml}
        ${trendHtml}
        ${subtitleHtml}
      </div>
      ${trendSectionHtml}
    </div>
  `;
}

/**
 * Create a row of KPI cards
 * @param {Array} kpis - Array of KPI configurations
 * @param {string} [gridClass] - Optional grid class override
 * @returns {string} HTML string
 */
export function createKpiGrid(kpis, gridClass = 'kpi-grid') {
  const cards = kpis.map(kpi => createKpiCard(kpi)).join('');
  return `<div class="${gridClass}">${cards}</div>`;
}

/**
 * Create KPI cards for Executive dashboard
 * @param {Object} summary - Summary data from mock data
 * @returns {string} HTML string
 */
export function createExecutiveKpis(summary) {
  const th = summary.trendHistory || {};
  const kpis = [
    {
      title: 'Availability',
      value: summary.availability,
      unit: '%',
      target: summary.target,
      status: summary.availability < summary.target - 1 ? 'critical' : 'warning',
      trend: -(summary.target - summary.availability).toFixed(1),
      invertTrend: true,
      kpiId: 'exec-availability',
      trendHistory: th.availability
    },
    {
      title: 'Chronic SKUs',
      value: summary.chronicIssues,
      trend: summary.sdlwComparison.chronicSkus,
      status: summary.sdlwComparison.chronicSkus > 0 ? 'critical' : 'good',
      subtitle: 'vs SDLW',
      kpiId: 'exec-chronic',
      trendHistory: th.chronicIssues
    },
    {
      title: 'GMV at Risk',
      value: summary.totalGmvAtRisk,
      isGmv: true,
      trend: summary.sdlwComparison.gmvAtRisk,
      invertTrend: true,
      status: summary.sdlwComparison.gmvAtRisk < 0 ? 'good' : 'warning',
      subtitle: '% vs SDLW',
      kpiId: 'exec-gmv',
      trendHistory: th.gmvAtRisk
    },
    {
      title: 'Total Alerts',
      value: summary.totalAlerts,
      subtitle: `P0:${summary.alertsByPriority.P0} P1:${summary.alertsByPriority.P1} P2:${summary.alertsByPriority.P2}`,
      status: summary.alertsByPriority.P0 > 3 ? 'critical' : 'warning',
      kpiId: 'exec-alerts',
      trendHistory: th.totalAlerts
    },
    {
      title: 'Resolution Rate',
      value: summary.resolutionRate,
      unit: '%',
      trend: summary.sdlwComparison.resolutionRate,
      invertTrend: false,
      status: summary.resolutionRate >= 70 ? 'good' : 'warning',
      subtitle: 'vs LW',
      kpiId: 'exec-resolution',
      trendHistory: th.resolutionRate
    }
  ];

  return createKpiGrid(kpis, 'kpi-grid kpi-grid--5');
}

/**
 * Create KPI cards for a persona dashboard
 * @param {Object} kpiData - KPI data object from persona
 * @param {string} [personaPrefix='kpi'] - Prefix for KPI IDs
 * @returns {string} HTML string
 */
export function createPersonaKpis(kpiData, personaPrefix = 'kpi') {
  const kpis = Object.entries(kpiData).map(([key, data]) => {
    const config = {
      title: formatKpiTitle(key),
      value: data.value,
      unit: data.unit || '',
      status: data.status,
      trend: data.trend,
      kpiId: `${personaPrefix}-${key}`,
      trendHistory: data.trendHistory
    };

    if (data.target) {
      config.target = data.target;
    }

    if (data.gmv) {
      config.subtitle = formatGmv(data.gmv) + ' GMV';
    }

    if (data.threshold) {
      config.subtitle = `Threshold: ${data.threshold}`;
    }

    if (data.avgAge) {
      config.subtitle = `Avg age: ${data.avgAge}d`;
    }

    return config;
  });

  return createKpiGrid(kpis, 'kpi-grid kpi-grid--4');
}

/**
 * Format KPI key to title
 */
function formatKpiTitle(key) {
  const titleMap = {
    avgFillRate: 'Avg Fill Rate',
    brandsAtRisk: 'Brands at Risk',
    npiPending: 'NPI Pending',
    escalations: 'Escalations',
    otifRate: 'OTIF Rate',
    moqBlocking: 'MOQ Blocking',
    pendingPos: 'Pending POs',
    contractIssues: 'Contract Issues',
    rackUtilization: 'Rack Utilization',
    inwardingTat: 'Inwarding TAT',
    podsAtRisk: 'Pods at Risk',
    ftrRate: 'FTR Rate',
    forecastAccuracy: 'Forecast Acc',
    dohBreaches: 'DOH Breaches',
    rrGeneration: 'RR Generation',
    movementGaps: 'Movement Gaps',
    grnTat: 'GRN TAT',
    outboundFill: 'Outbound Fill',
    capacityUtil: 'Capacity Util',
    putawayPending: 'Putaway Pending',
    enablementRate: 'Enablement Rate',
    missingVendorCodes: 'Missing Vendor Codes',
    contractSync: 'Contract Sync',
    configErrors: 'Config Errors',
    oosOverrides: 'OOS Overrides',
    staleRules: 'Stale Rules',
    holidayMisconfig: 'Holiday Misconfig',
    crRuleErrors: 'CR Rule Errors'
  };

  return titleMap[key] || key.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Initialize a KPI trend chart
 * @param {string} kpiId - KPI identifier
 * @param {string} period - Time period ('7d', '30d', '180d')
 */
function initKpiTrendChart(kpiId, period) {
  const canvas = document.getElementById(`kpi-chart-${kpiId}`);
  if (!canvas || typeof Chart === 'undefined') {
    console.warn('KPI Chart: Canvas or Chart.js not found for', kpiId);
    return null;
  }

  const data = window.kpiTrendData[kpiId]?.[period];
  if (!data) {
    console.warn('KPI Chart: No trend data found for', kpiId, period);
    return null;
  }

  // Determine chart color based on trend direction
  const firstVal = data.data[0];
  const lastVal = data.data[data.data.length - 1];
  const isImproving = lastVal >= firstVal;
  const color = isImproving ? '#16a34a' : '#dc2626'; // green or red

  window.kpiCharts[kpiId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.data,
        borderColor: color,
        backgroundColor: `${color}20`,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              return context.raw;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxTicksLimit: 5,
            font: {
              size: 10
            }
          }
        },
        y: {
          beginAtZero: false,
          grid: {
            color: '#e5e7eb'
          },
          ticks: {
            font: {
              size: 10
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });

  return window.kpiCharts[kpiId];
}

/**
 * Toggle ALL KPI cards expansion at once
 * Global function called from onclick on any KPI card
 */
window.toggleKpiCard = function(kpiId) {
  // Prevent event from firing multiple times
  if (window._kpiToggling) return;
  window._kpiToggling = true;

  // Get all expandable KPI cards
  const allCards = document.querySelectorAll('.kpi-card--expandable');
  if (!allCards.length) {
    window._kpiToggling = false;
    return;
  }

  // Check current state from the clicked card
  const clickedCard = document.querySelector(`[data-kpi-id="${kpiId}"]`);
  const isExpanding = clickedCard && !clickedCard.classList.contains('expanded');

  // Toggle all cards together
  allCards.forEach(card => {
    if (isExpanding) {
      card.classList.add('expanded');
    } else {
      card.classList.remove('expanded');
    }
  });

  // Initialize charts for all expanded cards
  if (isExpanding) {
    setTimeout(() => {
      allCards.forEach(card => {
        const cardKpiId = card.getAttribute('data-kpi-id');
        if (cardKpiId && !window.kpiCharts[cardKpiId] && window.kpiTrendData[cardKpiId]) {
          initKpiTrendChart(cardKpiId, '7d');
        }
      });
    }, 150);
  }

  // Reset toggle flag after animation
  setTimeout(() => {
    window._kpiToggling = false;
  }, 50);
};

/**
 * Update KPI chart for a different time period
 * Global function called from onclick
 */
window.updateKpiChart = function(kpiId, period) {
  const card = document.querySelector(`[data-kpi-id="${kpiId}"]`);
  if (!card) return;

  // Update active button
  card.querySelectorAll('.kpi-card__period-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });

  // Update chart data
  const data = window.kpiTrendData[kpiId]?.[period];
  if (window.kpiCharts[kpiId] && data) {
    // Update color based on trend direction
    const firstVal = data.data[0];
    const lastVal = data.data[data.data.length - 1];
    const isImproving = lastVal >= firstVal;
    const color = isImproving ? '#16a34a' : '#dc2626';

    window.kpiCharts[kpiId].data.labels = data.labels;
    window.kpiCharts[kpiId].data.datasets[0].data = data.data;
    window.kpiCharts[kpiId].data.datasets[0].borderColor = color;
    window.kpiCharts[kpiId].data.datasets[0].backgroundColor = `${color}20`;
    window.kpiCharts[kpiId].update();
  }
};

/**
 * Clean up KPI charts (call when navigating away)
 */
export function destroyKpiCharts() {
  Object.keys(window.kpiCharts).forEach(kpiId => {
    if (window.kpiCharts[kpiId]) {
      window.kpiCharts[kpiId].destroy();
      delete window.kpiCharts[kpiId];
    }
  });
}
