/**
 * KPI Tree Component
 * Renders a compact hierarchical tree of KPIs with dependencies, owners, and WoW comparison
 */

import { mockData } from '../data/mock-data.js';

/**
 * Build KPI Tree from mock data
 * Structure: Availability → Personas (by GMV contribution) → Persona KPIs
 */
function buildKpiTreeData() {
  const { summary, gmvByOwner, categoryManagement, procurement, podOps, planning, warehouse, erpTeam, productSupport } = mockData;

  // Calculate total GMV to derive percentages
  const totalGmv = gmvByOwner.reduce((sum, o) => sum + o.gmv, 0);

  // Helper to get GMV % for a persona
  const getGmvPct = (ownerName) => {
    const owner = gmvByOwner.find(o => o.owner === ownerName);
    return owner ? Math.round((owner.gmv / totalGmv) * 100) : 0;
  };

  return {
    id: 'availability',
    name: 'Availability',
    value: summary.availability,
    target: summary.target,
    unit: '%',
    owner: 'Executive',
    ownerIcon: '📊',
    wow: summary.sdlwComparison.chronicSkus > 0 ? -0.3 : +0.2,
    wowBad: true,
    children: [
      {
        id: 'category-branch',
        name: categoryManagement.persona.name,
        value: getGmvPct('Category Management'),
        unit: '%',
        owner: 'Category',
        ownerIcon: categoryManagement.persona.icon,
        wow: categoryManagement.kpis.avgFillRate.trend,
        wowBad: categoryManagement.kpis.avgFillRate.trend < 0,
        isTop: getGmvPct('Category Management') >= 30,
        link: '#/category',
        children: [
          { id: 'fill-rate', name: 'Avg Fill Rate', value: categoryManagement.kpis.avgFillRate.value, target: categoryManagement.kpis.avgFillRate.target, unit: '%', owner: 'Category', ownerIcon: categoryManagement.persona.icon, wow: categoryManagement.kpis.avgFillRate.trend, wowBad: categoryManagement.kpis.avgFillRate.trend < 0, isTop: true },
          { id: 'brands-risk', name: 'Brands at Risk', value: categoryManagement.kpis.brandsAtRisk.value, unit: '', owner: 'Category', ownerIcon: categoryManagement.persona.icon, wow: categoryManagement.kpis.brandsAtRisk.trend, wowBad: categoryManagement.kpis.brandsAtRisk.trend > 0 },
          { id: 'npi-pending', name: 'NPI Pending', value: categoryManagement.kpis.npiPending.value, target: categoryManagement.kpis.npiPending.threshold, unit: '', owner: 'Category', ownerIcon: categoryManagement.persona.icon, wow: categoryManagement.kpis.npiPending.trend, wowBad: categoryManagement.kpis.npiPending.trend > 0 },
          { id: 'escalations', name: 'Escalations', value: categoryManagement.kpis.escalations.value, unit: '', owner: 'Category', ownerIcon: categoryManagement.persona.icon, wow: categoryManagement.kpis.escalations.trend, wowBad: categoryManagement.kpis.escalations.trend > 0 }
        ]
      },
      {
        id: 'procurement-branch',
        name: procurement.persona.name,
        value: getGmvPct('Procurement'),
        unit: '%',
        owner: 'Procurement',
        ownerIcon: procurement.persona.icon,
        wow: procurement.kpis.otifRate.trend,
        wowBad: procurement.kpis.otifRate.trend < 0,
        isTop: getGmvPct('Procurement') >= 20,
        link: '#/procurement',
        children: [
          { id: 'otif', name: 'OTIF Rate', value: procurement.kpis.otifRate.value, target: procurement.kpis.otifRate.target, unit: '%', owner: 'Procurement', ownerIcon: procurement.persona.icon, wow: procurement.kpis.otifRate.trend, wowBad: procurement.kpis.otifRate.trend < 0 },
          { id: 'moq', name: 'MOQ Blocking', value: procurement.kpis.moqBlocking.value, unit: '%', owner: 'Procurement', ownerIcon: procurement.persona.icon, wow: procurement.kpis.moqBlocking.trend, wowBad: procurement.kpis.moqBlocking.trend > 0 },
          { id: 'pending-po', name: 'Pending POs', value: procurement.kpis.pendingPos.value, unit: '', owner: 'Procurement', ownerIcon: procurement.persona.icon, wow: procurement.kpis.pendingPos.trend, wowBad: procurement.kpis.pendingPos.trend > 0 },
          { id: 'contract-issues', name: 'Contract Issues', value: procurement.kpis.contractIssues.value, unit: '', owner: 'Procurement', ownerIcon: procurement.persona.icon, wow: procurement.kpis.contractIssues.trend, wowBad: procurement.kpis.contractIssues.trend > 0 }
        ]
      },
      {
        id: 'podops-branch',
        name: podOps.persona.name,
        value: getGmvPct('Pod Ops'),
        unit: '%',
        owner: 'Pod Ops',
        ownerIcon: podOps.persona.icon,
        wow: podOps.kpis.rackUtilization.trend,
        wowBad: podOps.kpis.rackUtilization.trend > 0,
        isTop: getGmvPct('Pod Ops') >= 15,
        link: '#/pod-ops',
        children: [
          { id: 'rack', name: 'Rack Utilization', value: podOps.kpis.rackUtilization.value, target: podOps.kpis.rackUtilization.target, unit: '%', owner: 'Pod Ops', ownerIcon: podOps.persona.icon, wow: podOps.kpis.rackUtilization.trend, wowBad: podOps.kpis.rackUtilization.trend > 0 },
          { id: 'inward', name: 'Inwarding TAT', value: podOps.kpis.inwardingTat.value, target: podOps.kpis.inwardingTat.target, unit: 'h', owner: 'Pod Ops', ownerIcon: podOps.persona.icon, wow: podOps.kpis.inwardingTat.trend, wowBad: podOps.kpis.inwardingTat.trend > 0 },
          { id: 'pods-risk', name: 'Pods at Risk', value: podOps.kpis.podsAtRisk.value, unit: '', owner: 'Pod Ops', ownerIcon: podOps.persona.icon, wow: podOps.kpis.podsAtRisk.trend, wowBad: podOps.kpis.podsAtRisk.trend > 0 },
          { id: 'ftr', name: 'FTR Rate', value: podOps.kpis.ftrRate.value, target: podOps.kpis.ftrRate.target, unit: '%', owner: 'Pod Ops', ownerIcon: podOps.persona.icon, wow: podOps.kpis.ftrRate.trend, wowBad: podOps.kpis.ftrRate.trend < 0 }
        ]
      },
      {
        id: 'planning-branch',
        name: planning.persona.name,
        value: getGmvPct('Planning'),
        unit: '%',
        owner: 'Planning',
        ownerIcon: planning.persona.icon,
        wow: planning.kpis.forecastAccuracy.trend,
        wowBad: planning.kpis.forecastAccuracy.trend < 0,
        link: '#/planning',
        children: [
          { id: 'wmape', name: 'Forecast Acc (wMAPE)', value: planning.kpis.forecastAccuracy.value, target: planning.kpis.forecastAccuracy.target, unit: '%', owner: 'Planning', ownerIcon: planning.persona.icon, wow: planning.kpis.forecastAccuracy.trend, wowBad: planning.kpis.forecastAccuracy.trend < 0 },
          { id: 'doh', name: 'DOH Breaches', value: planning.kpis.dohBreaches.value, target: planning.kpis.dohBreaches.threshold, unit: '', owner: 'Planning', ownerIcon: planning.persona.icon, wow: planning.kpis.dohBreaches.trend, wowBad: planning.kpis.dohBreaches.trend > 0 },
          { id: 'rr-gen', name: 'RR Generation', value: planning.kpis.rrGeneration.value, target: planning.kpis.rrGeneration.target, unit: '%', owner: 'Planning', ownerIcon: planning.persona.icon, wow: planning.kpis.rrGeneration.trend, wowBad: planning.kpis.rrGeneration.trend < 0 },
          { id: 'movement', name: 'Movement Gaps', value: planning.kpis.movementGaps.value, unit: '', owner: 'Planning', ownerIcon: planning.persona.icon, wow: planning.kpis.movementGaps.trend, wowBad: planning.kpis.movementGaps.trend > 0 }
        ]
      },
      {
        id: 'warehouse-branch',
        name: warehouse.persona.name,
        value: getGmvPct('Warehouse'),
        unit: '%',
        owner: 'Warehouse',
        ownerIcon: warehouse.persona.icon,
        wow: warehouse.kpis.grnTat.trend,
        wowBad: warehouse.kpis.grnTat.trend > 0,
        link: '#/warehouse',
        children: [
          { id: 'grn', name: 'GRN TAT', value: warehouse.kpis.grnTat.value, target: warehouse.kpis.grnTat.target, unit: 'h', owner: 'Warehouse', ownerIcon: warehouse.persona.icon, wow: warehouse.kpis.grnTat.trend, wowBad: warehouse.kpis.grnTat.trend > 0 },
          { id: 'outbound', name: 'Outbound Fill', value: warehouse.kpis.outboundFill.value, target: warehouse.kpis.outboundFill.target, unit: '%', owner: 'Warehouse', ownerIcon: warehouse.persona.icon, wow: warehouse.kpis.outboundFill.trend, wowBad: warehouse.kpis.outboundFill.trend < 0 },
          { id: 'wh-cap', name: 'Capacity Util', value: warehouse.kpis.capacityUtil.value, target: warehouse.kpis.capacityUtil.target, unit: '%', owner: 'Warehouse', ownerIcon: warehouse.persona.icon, wow: warehouse.kpis.capacityUtil.trend, wowBad: warehouse.kpis.capacityUtil.trend > 0 },
          { id: 'putaway', name: 'Putaway Pending', value: warehouse.kpis.putawayPending.value, unit: '', owner: 'Warehouse', ownerIcon: warehouse.persona.icon, wow: warehouse.kpis.putawayPending.trend, wowBad: warehouse.kpis.putawayPending.trend > 0 }
        ]
      },
      {
        id: 'erp-branch',
        name: erpTeam.persona.name,
        value: getGmvPct('ERP Team'),
        unit: '%',
        owner: 'ERP Team',
        ownerIcon: erpTeam.persona.icon,
        wow: erpTeam.kpis.enablementRate.trend,
        wowBad: erpTeam.kpis.enablementRate.trend < 0,
        link: '#/erp-team',
        children: [
          { id: 'enable', name: 'Enablement Rate', value: erpTeam.kpis.enablementRate.value, target: erpTeam.kpis.enablementRate.target, unit: '%', owner: 'ERP', ownerIcon: erpTeam.persona.icon, wow: erpTeam.kpis.enablementRate.trend, wowBad: erpTeam.kpis.enablementRate.trend < 0 },
          { id: 'vendor-codes', name: 'Missing Vendor Codes', value: erpTeam.kpis.missingVendorCodes.value, target: erpTeam.kpis.missingVendorCodes.threshold, unit: '', owner: 'ERP', ownerIcon: erpTeam.persona.icon, wow: erpTeam.kpis.missingVendorCodes.trend, wowBad: erpTeam.kpis.missingVendorCodes.trend > 0 },
          { id: 'contract-sync', name: 'Contract Sync', value: erpTeam.kpis.contractSync.value, target: erpTeam.kpis.contractSync.target, unit: '%', owner: 'ERP', ownerIcon: erpTeam.persona.icon, wow: erpTeam.kpis.contractSync.trend, wowBad: erpTeam.kpis.contractSync.trend < 0 },
          { id: 'config-err', name: 'Config Errors', value: erpTeam.kpis.configErrors.value, unit: '', owner: 'ERP', ownerIcon: erpTeam.persona.icon, wow: erpTeam.kpis.configErrors.trend, wowBad: erpTeam.kpis.configErrors.trend > 0 }
        ]
      },
      {
        id: 'product-branch',
        name: productSupport.persona.name,
        value: getGmvPct('Product Support'),
        unit: '%',
        owner: 'Product Support',
        ownerIcon: productSupport.persona.icon,
        wow: productSupport.kpis.staleRules.trend,
        wowBad: productSupport.kpis.staleRules.trend > 0,
        link: '#/product-support',
        children: [
          { id: 'oos-override', name: 'OOS Overrides', value: productSupport.kpis.oosOverrides.value, target: productSupport.kpis.oosOverrides.threshold, unit: '', owner: 'Product', ownerIcon: productSupport.persona.icon, wow: productSupport.kpis.oosOverrides.trend, wowBad: productSupport.kpis.oosOverrides.trend > 0 },
          { id: 'stale', name: 'Stale Rules', value: productSupport.kpis.staleRules.value, target: productSupport.kpis.staleRules.threshold, unit: '', owner: 'Product', ownerIcon: productSupport.persona.icon, wow: productSupport.kpis.staleRules.trend, wowBad: productSupport.kpis.staleRules.trend > 0 },
          { id: 'holiday', name: 'Holiday Misconfig', value: productSupport.kpis.holidayMisconfig.value, target: productSupport.kpis.holidayMisconfig.threshold, unit: '', owner: 'Product', ownerIcon: productSupport.persona.icon, wow: productSupport.kpis.holidayMisconfig.trend, wowBad: productSupport.kpis.holidayMisconfig.trend > 0 },
          { id: 'cr-rules', name: 'CR Rule Errors', value: productSupport.kpis.crRuleErrors.value, target: productSupport.kpis.crRuleErrors.threshold, unit: '', owner: 'Product', ownerIcon: productSupport.persona.icon, wow: productSupport.kpis.crRuleErrors.trend, wowBad: productSupport.kpis.crRuleErrors.trend > 0 }
        ]
      }
    ]
  };
}

/**
 * Get status class based on value vs target
 */
function getStatus(node) {
  if (!node.target) return '';
  const ratio = node.value / node.target;

  // IDs where higher is better
  const higherIsBetter = ['fill-rate', 'otif', 'wmape', 'ftr', 'outbound', 'enable', 'contract-sync', 'rr-gen'];

  if (higherIsBetter.includes(node.id)) {
    if (ratio >= 1) return 'good';
    if (ratio >= 0.85) return 'warn';
    return 'bad';
  }
  // Lower is better
  if (ratio <= 1) return 'good';
  if (ratio <= 1.5) return 'warn';
  return 'bad';
}

/**
 * Render a leaf node (no children)
 */
function renderLeaf(node) {
  const status = getStatus(node);
  const wowClass = node.wowBad ? 'bad' : 'good';
  const wowText = node.wow === 0 ? '—' : (node.wow > 0 ? `+${node.wow}` : node.wow);
  const targetText = node.target ? `/${node.target}` : '';

  return `
    <div class="ktree-leaf ${node.isTop ? 'ktree-leaf--top' : ''}" title="${node.name}">
      <span class="ktree-leaf__name">${node.name}</span>
      <span class="ktree-leaf__value ktree-leaf__value--${status}">${node.value}${targetText}${node.unit}</span>
      <span class="ktree-leaf__wow ktree-leaf__wow--${wowClass}">${wowText}</span>
    </div>
  `;
}

/**
 * Render a branch node (has children)
 */
function renderBranch(node, isRoot = false) {
  const hasChildren = node.children && node.children.length > 0;
  const wowClass = node.wowBad ? 'bad' : 'good';
  const wowText = node.wow === 0 ? '—' : (node.wow > 0 ? `+${node.wow}` : node.wow);

  const childrenHtml = hasChildren
    ? node.children.map(child =>
        child.children ? renderBranch(child) : renderLeaf(child)
      ).join('')
    : '';

  if (isRoot) {
    return `
      <div class="ktree-root">
        <div class="ktree-root__node">
          <div class="ktree-root__main">
            <span class="ktree-root__name">${node.name}</span>
            <span class="ktree-root__value">${node.value}${node.unit}</span>
            <span class="ktree-root__target">target: ${node.target}${node.unit}</span>
          </div>
          <div class="ktree-root__meta">
            <span class="ktree-root__wow ktree-leaf__wow--${wowClass}">${wowText} WoW</span>
          </div>
        </div>
        <div class="ktree-branches">
          ${node.children.map(child => renderBranch(child)).join('')}
        </div>
      </div>
    `;
  }

  const linkHtml = node.link ? `<a href="${node.link}" class="ktree-branch__link" title="Go to dashboard">→</a>` : '';

  return `
    <div class="ktree-branch ${node.isTop ? 'ktree-branch--top' : ''}" data-branch="${node.id}">
      <div class="ktree-branch__header" onclick="toggleKpiBranch('${node.id}')">
        <span class="ktree-branch__toggle">▶</span>
        <span class="ktree-branch__name">${node.name}</span>
        <span class="ktree-branch__pct">${node.value}%</span>
        <span class="ktree-branch__wow ktree-leaf__wow--${wowClass}">${wowText}</span>
        <span class="ktree-branch__owner">${node.ownerIcon} ${node.owner}</span>
        ${node.isTop ? '<span class="ktree-branch__top">TOP</span>' : ''}
        ${linkHtml}
      </div>
      <div class="ktree-branch__children">
        ${childrenHtml}
      </div>
    </div>
  `;
}

/**
 * Create the full KPI tree component
 */
export function createKpiTree(title = 'KPI Dependency Tree') {
  const kpiTreeData = buildKpiTreeData();
  const treeHtml = renderBranch(kpiTreeData, true);

  return `
    <div class="card ktree-card">
      <div class="card__header">
        <h3 class="card__title">${title}</h3>
        <div class="ktree-legend">
          <span class="ktree-legend__item"><span class="ktree-legend__dot ktree-legend__dot--good"></span>On Track</span>
          <span class="ktree-legend__item"><span class="ktree-legend__dot ktree-legend__dot--warn"></span>At Risk</span>
          <span class="ktree-legend__item"><span class="ktree-legend__dot ktree-legend__dot--bad"></span>Critical</span>
          <span class="ktree-legend__item ktree-legend__item--wow">WoW = Week over Week</span>
        </div>
      </div>
      <div class="card__body ktree-body">
        ${treeHtml}
      </div>
    </div>
  `;
}

/**
 * Toggle branch expansion
 */
window.toggleKpiBranch = function(branchId) {
  const branch = document.querySelector(`[data-branch="${branchId}"]`);
  if (branch) {
    branch.classList.toggle('expanded');
  }
};
