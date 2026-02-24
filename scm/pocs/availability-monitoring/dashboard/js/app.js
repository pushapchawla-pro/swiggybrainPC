/**
 * Main Application Entry Point
 * Initializes router and renders sidebar navigation
 */

import { Router, getNavItems } from './router.js';

/**
 * Render the sidebar navigation
 * @returns {string} HTML string
 */
function renderSidebar() {
  const navSections = getNavItems();

  const sectionsHtml = navSections.map(section => {
    const itemsHtml = section.items.map(item => {
      const badgeHtml = item.badge
        ? `<span class="nav-item__badge" title="${item.badgeLabel || 'Count'}">${item.badge}</span>`
        : '';

      return `
        <a href="#${item.path}" class="nav-item" data-route="${item.path}">
          <span class="nav-item__icon">${item.icon}</span>
          <span class="nav-item__label">${item.name}</span>
          ${badgeHtml}
        </a>
      `;
    }).join('');

    return `
      <div class="sidebar__section">
        <div class="sidebar__section-title">${section.section}</div>
        ${itemsHtml}
      </div>
    `;
  }).join('');

  return `
    <div class="sidebar__header">
      <div class="sidebar__logo">
        <div class="sidebar__logo-icon">🧠</div>
        <div>
          <div class="sidebar__logo-text">Supply Chain Brain</div>
          <div class="sidebar__logo-subtitle">Availability ActionBoard</div>
        </div>
      </div>
    </div>
    <nav class="sidebar__nav">
      ${sectionsHtml}
    </nav>
    <div class="sidebar__footer" style="padding: var(--space-4); border-top: 1px solid rgba(255,255,255,0.1); margin-top: auto;">
      <div style="font-size: var(--text-xs); color: var(--color-gray-400);">
        Mock Dashboard v0.1<br>
        Last updated: Jan 14, 2026
      </div>
    </div>
  `;
}

/**
 * Initialize the application
 */
function initApp() {
  // Get DOM elements
  const sidebarElement = document.getElementById('sidebar');
  const contentElement = document.getElementById('main-content');

  if (!sidebarElement || !contentElement) {
    console.error('Required DOM elements not found');
    return;
  }

  // Render sidebar
  sidebarElement.innerHTML = renderSidebar();

  // Initialize router
  const router = new Router(contentElement);

  // Setup mobile menu toggle
  setupMobileMenu();

  // Log initialization
  console.log('Availability Monitoring Dashboard initialized');
}

/**
 * Setup mobile menu functionality
 */
function setupMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobile-overlay');
  const menuToggle = document.getElementById('mobile-menu-toggle');

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('visible');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }

  // Close menu on nav item click (mobile)
  document.addEventListener('click', (e) => {
    if (e.target.closest('.nav-item') && window.innerWidth < 768) {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
