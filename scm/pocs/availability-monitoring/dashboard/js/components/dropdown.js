/**
 * Custom Dropdown Component
 * Native HTML dropdown with consistent styling across all browsers
 */

/**
 * Create a custom dropdown
 * @param {Object} options - Dropdown options
 * @param {string} options.id - Unique identifier
 * @param {string} options.placeholder - Default text when nothing selected
 * @param {Array} options.items - Array of {value, label} objects
 * @returns {string} HTML string
 */
window.createDropdown = function({ id, placeholder, items }) {
  const optionsHtml = items.map(item => `
    <div class="dropdown__item" data-value="${item.value}" onclick="selectDropdownItem('${id}', '${item.value}', '${item.label}')">
      ${item.label}
    </div>
  `).join('');

  return `
    <div class="dropdown" data-dropdown-id="${id}">
      <button class="dropdown__trigger" onclick="toggleDropdown('${id}')">
        <span class="dropdown__value">${placeholder}</span>
        <span class="dropdown__arrow">▼</span>
      </button>
      <div class="dropdown__menu">
        ${optionsHtml}
      </div>
    </div>
  `;
}

/**
 * Create filter bar with dropdowns
 * @param {Array} filters - Array of filter configs
 * @returns {string} HTML string
 */
window.createFilterBar = function(filters) {
  const dropdownsHtml = filters.map((filter, index) =>
    window.createDropdown({
      id: `filter-${index}`,
      placeholder: filter.placeholder,
      items: filter.items
    })
  ).join('');

  return `
    <div class="filter-bar">
      <span class="filter-bar__label">Filter by:</span>
      ${dropdownsHtml}
    </div>
  `;
}

// Global dropdown functions
window.toggleDropdown = function(id) {
  const dropdown = document.querySelector(`[data-dropdown-id="${id}"]`);
  if (!dropdown) return;

  // Close all other dropdowns
  document.querySelectorAll('.dropdown.open').forEach(d => {
    if (d.getAttribute('data-dropdown-id') !== id) {
      d.classList.remove('open');
    }
  });

  dropdown.classList.toggle('open');
};

window.selectDropdownItem = function(id, value, label) {
  const dropdown = document.querySelector(`[data-dropdown-id="${id}"]`);
  if (!dropdown) return;

  const valueEl = dropdown.querySelector('.dropdown__value');
  if (valueEl) {
    valueEl.textContent = label;
    valueEl.classList.toggle('dropdown__value--selected', value !== '');
  }

  // Mark selected item
  dropdown.querySelectorAll('.dropdown__item').forEach(item => {
    item.classList.toggle('selected', item.getAttribute('data-value') === value);
  });

  dropdown.classList.remove('open');

  // Dispatch custom event for filtering logic
  dropdown.dispatchEvent(new CustomEvent('change', { detail: { value, label } }));
};

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

// Export for module imports
export const createDropdown = window.createDropdown;
export const createFilterBar = window.createFilterBar;
