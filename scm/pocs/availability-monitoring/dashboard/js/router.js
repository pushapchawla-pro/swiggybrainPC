/**
 * Hash-based Client-side Router
 * Handles SPA navigation without server configuration
 */

import { mockData } from './data/mock-data.js';

/**
 * Route definitions
 * Executive dashboard uses its own module, persona dashboards use unified template
 */
export const routes = {
  '/': {
    name: 'Executive',
    module: () => import('./pages/executive.js'),
    render: 'renderExecutiveDashboard',
    init: 'initExecutiveCharts'
  },
  // Persona dashboards - all use unified template with personaKey
  '/category': {
    name: 'Category Management',
    module: () => import('./pages/persona-dashboard.js'),
    render: 'renderPersonaDashboard',
    init: 'initPersonaDashboard',
    personaKey: 'category'
  },
  '/procurement': {
    name: 'Procurement',
    module: () => import('./pages/persona-dashboard.js'),
    render: 'renderPersonaDashboard',
    init: 'initPersonaDashboard',
    personaKey: 'procurement'
  },
  '/pod-ops': {
    name: 'Pod Ops',
    module: () => import('./pages/persona-dashboard.js'),
    render: 'renderPersonaDashboard',
    init: 'initPersonaDashboard',
    personaKey: 'pod-ops'
  },
  '/planning': {
    name: 'Planning',
    module: () => import('./pages/persona-dashboard.js'),
    render: 'renderPersonaDashboard',
    init: 'initPersonaDashboard',
    personaKey: 'planning'
  },
  '/warehouse': {
    name: 'Warehouse',
    module: () => import('./pages/persona-dashboard.js'),
    render: 'renderPersonaDashboard',
    init: 'initPersonaDashboard',
    personaKey: 'warehouse'
  },
  '/erp-team': {
    name: 'ERP Team',
    module: () => import('./pages/persona-dashboard.js'),
    render: 'renderPersonaDashboard',
    init: 'initPersonaDashboard',
    personaKey: 'erp-team'
  },
  '/product-support': {
    name: 'Product Support',
    module: () => import('./pages/persona-dashboard.js'),
    render: 'renderPersonaDashboard',
    init: 'initPersonaDashboard',
    personaKey: 'product-support'
  }
};

/**
 * Router class
 */
export class Router {
  constructor(contentElement) {
    this.contentElement = contentElement;
    this.currentRoute = null;

    // Bind the hashchange handler
    window.addEventListener('hashchange', () => this.handleRoute());

    // Handle initial route
    this.handleRoute();
  }

  /**
   * Get current route path from hash
   * @returns {string} Route path
   */
  getPath() {
    const hash = window.location.hash.slice(1); // Remove #
    return hash || '/';
  }

  /**
   * Navigate to a route
   * @param {string} path - Route path
   */
  navigate(path) {
    window.location.hash = path;
  }

  /**
   * Handle route change
   */
  async handleRoute() {
    const path = this.getPath();
    const route = routes[path];

    if (!route) {
      // 404 - redirect to home
      this.navigate('/');
      return;
    }

    // Update current route
    this.currentRoute = path;

    // Show loading state
    this.contentElement.innerHTML = `
      <div class="loading">
        <div class="loading__spinner"></div>
      </div>
    `;

    try {
      // Dynamically import the page module
      const module = await route.module();

      // Render the page (pass personaKey if defined)
      const renderFn = module[route.render];
      if (renderFn) {
        this.contentElement.innerHTML = route.personaKey
          ? renderFn(route.personaKey)
          : renderFn();
      }

      // Initialize page (charts, sparklines, etc.)
      if (route.init && module[route.init]) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          route.personaKey
            ? module[route.init](route.personaKey)
            : module[route.init]();
        }, 100);
      }

      // Update active nav item
      this.updateActiveNav(path);

    } catch (error) {
      console.error('Error loading route:', error);
      this.contentElement.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__title">Error Loading Page</div>
          <div class="empty-state__description">${error.message}</div>
        </div>
      `;
    }
  }

  /**
   * Update active state on nav items
   * @param {string} path - Current route path
   */
  updateActiveNav(path) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to current nav item
    const activeItem = document.querySelector(`.nav-item[href="#${path}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }
}

/**
 * Get navigation items for sidebar
 * Badge counts are calculated dynamically from alert data
 * @returns {Array} Navigation items
 */
export function getNavItems() {
  // Get alert counts from mock data
  const alertCounts = {
    category: mockData.categoryManagement?.alerts?.length || 0,
    procurement: mockData.procurement?.alerts?.length || 0,
    podOps: mockData.podOps?.alerts?.length || 0,
    planning: mockData.planning?.alerts?.length || 0,
    warehouse: mockData.warehouse?.alerts?.length || 0,
    erpTeam: mockData.erpTeam?.alerts?.length || 0,
    productSupport: mockData.productSupport?.alerts?.length || 0
  };

  return [
    {
      section: 'Overview',
      items: [
        { path: '/', name: 'Executive Dashboard', icon: '📊' }
      ]
    },
    {
      section: 'Team Dashboards',
      items: [
        { path: '/category', name: 'Category Management', icon: '📦', badge: alertCounts.category, badgeLabel: 'Active Alerts' },
        { path: '/procurement', name: 'Procurement', icon: '🏭', badge: alertCounts.procurement, badgeLabel: 'Active Alerts' },
        { path: '/pod-ops', name: 'Pod Ops', icon: '🏪', badge: alertCounts.podOps, badgeLabel: 'Active Alerts' },
        { path: '/planning', name: 'Planning', icon: '📋', badge: alertCounts.planning, badgeLabel: 'Active Alerts' },
        { path: '/warehouse', name: 'Warehouse', icon: '🏢', badge: alertCounts.warehouse, badgeLabel: 'Active Alerts' },
        { path: '/erp-team', name: 'ERP Team', icon: '⚙️', badge: alertCounts.erpTeam, badgeLabel: 'Active Alerts' },
        { path: '/product-support', name: 'Product Support', icon: '🔧', badge: alertCounts.productSupport, badgeLabel: 'Active Alerts' }
      ]
    }
  ];
}
