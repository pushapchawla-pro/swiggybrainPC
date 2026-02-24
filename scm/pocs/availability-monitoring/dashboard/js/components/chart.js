/**
 * Chart Components
 * Wrappers for Chart.js and custom canvas charts
 */

import { formatGmv } from '../data/mock-data.js';

/**
 * Draw a sparkline on a canvas element
 * Lightweight alternative to Chart.js for small trend indicators
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<number>} data - Array of values
 * @param {string} [color='#3b82f6'] - Line color
 */
export function drawSparkline(canvas, data, color = '#3b82f6') {
  if (!canvas || !data || data.length < 2) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 2;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Find min/max for scaling
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Calculate points
  const stepX = (width - padding * 2) / (data.length - 1);
  const points = data.map((value, i) => ({
    x: padding + i * stepX,
    y: height - padding - ((value - min) / range) * (height - padding * 2)
  }));

  // Draw line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(point => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Draw endpoint dot
  const lastPoint = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(lastPoint.x, lastPoint.y, 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Create a horizontal bar chart (custom HTML/CSS)
 * @param {Object} options - Chart options
 * @param {string} options.title - Chart title
 * @param {Array} options.data - Array of {label, value, icon, color}
 * @param {boolean} [options.isGmv=false] - Format values as GMV
 * @param {boolean} [options.showPercentage=false] - Show as percentage
 * @returns {string} HTML string
 */
export function createHorizontalBarChart({ title, data, isGmv = false, showPercentage = false }) {
  const maxValue = Math.max(...data.map(d => d.value));

  const barsHtml = data.map(item => {
    const percentage = (item.value / maxValue) * 100;
    const displayValue = isGmv ? formatGmv(item.value) :
                         showPercentage ? `${item.value}%` : item.value;
    const barColor = item.color || 'var(--color-primary)';

    return `
      <div class="h-bar-chart__item">
        <div class="h-bar-chart__label">
          ${item.icon ? `<span class="h-bar-chart__icon">${item.icon}</span>` : ''}
          <span>${item.label}</span>
        </div>
        <div class="h-bar-chart__bar-container">
          <div class="h-bar-chart__bar" style="width: ${percentage}%; background: ${barColor}"></div>
        </div>
        <span class="h-bar-chart__value">${displayValue}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="chart-container">
      <div class="chart-container__header">
        <h4 class="chart-container__title">${title}</h4>
      </div>
      <div class="h-bar-chart">
        ${barsHtml}
      </div>
    </div>
  `;
}

/**
 * Create a breakdown list (vertical list with progress bars)
 * @param {Object} options - Options
 * @param {string} options.title - Section title
 * @param {Array} options.data - Array of {label, value, percentage, color}
 * @returns {string} HTML string
 */
export function createBreakdownList({ title, data }) {
  const itemsHtml = data.map(item => `
    <div class="breakdown-item">
      <span class="breakdown-item__label">${item.label || item.range}</span>
      <span class="breakdown-item__value">${item.percentage}%</span>
      <div class="breakdown-item__bar">
        <div class="breakdown-item__bar-fill" style="width: ${item.percentage}%; background: ${item.color || 'var(--color-primary)'}"></div>
      </div>
    </div>
  `).join('');

  return `
    <div class="chart-container">
      <div class="chart-container__header">
        <h4 class="chart-container__title">${title}</h4>
      </div>
      <div class="breakdown-list">
        ${itemsHtml}
      </div>
    </div>
  `;
}

/**
 * Create a Chart.js line chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} options - Chart options
 * @param {string} options.title - Chart title
 * @param {Array} options.labels - X-axis labels
 * @param {Array} options.data - Data values
 * @param {string} [options.label='Value'] - Dataset label
 * @param {string} [options.color='#3b82f6'] - Line color
 * @returns {string} HTML string for chart container
 */
export function createLineChartContainer({ canvasId, title, subtitle }) {
  return `
    <div class="chart-container">
      <div class="chart-container__header">
        <div>
          <h4 class="chart-container__title">${title}</h4>
          ${subtitle ? `<span class="chart-container__subtitle">${subtitle}</span>` : ''}
        </div>
      </div>
      <div class="chart-container__canvas">
        <canvas id="${canvasId}" height="250"></canvas>
      </div>
    </div>
  `;
}

/**
 * Initialize a Chart.js line chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} config - Chart configuration
 */
export function initLineChart(canvasId, { labels, data, label = 'Value', color = '#3b82f6' }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return null;

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: `${color}20`,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
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
          intersect: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxTicksLimit: 8,
            font: {
              size: 11
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
              size: 11
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
}

/**
 * Create a doughnut chart container
 */
export function createDoughnutChartContainer({ canvasId, title }) {
  return `
    <div class="chart-container">
      <div class="chart-container__header">
        <h4 class="chart-container__title">${title}</h4>
      </div>
      <div class="chart-container__canvas" style="height: 250px; display: flex; justify-content: center;">
        <canvas id="${canvasId}"></canvas>
      </div>
    </div>
  `;
}

/**
 * Initialize a Chart.js doughnut chart
 */
export function initDoughnutChart(canvasId, { labels, data, colors }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return null;

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 12,
            font: {
              size: 11
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
}

/**
 * Create a bar chart container
 */
export function createBarChartContainer({ canvasId, title }) {
  return `
    <div class="chart-container">
      <div class="chart-container__header">
        <h4 class="chart-container__title">${title}</h4>
      </div>
      <div class="chart-container__canvas">
        <canvas id="${canvasId}" height="250"></canvas>
      </div>
    </div>
  `;
}

/**
 * Initialize a Chart.js horizontal bar chart
 */
export function initHorizontalBarChart(canvasId, { labels, data, colors, isGmv = false }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return null;

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors || '#3b82f6',
        borderRadius: 4,
        barThickness: 24
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return isGmv ? formatGmv(context.raw) : context.raw;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: '#e5e7eb'
          },
          ticks: {
            callback: function(value) {
              return isGmv ? formatGmv(value) : value;
            },
            font: {
              size: 11
            }
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            }
          }
        }
      }
    }
  });
}
