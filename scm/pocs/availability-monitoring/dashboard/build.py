#!/usr/bin/env python3
"""
Build script for Availability ActionBoard
Bundles all CSS and JS files into a single self-contained HTML file.

Usage:
    python3 build.py
    # or
    ./build.py

Output:
    dashboard-bundled.html (can be opened directly in browser or emailed)
"""

import os
import re
from pathlib import Path

# Change to script directory
SCRIPT_DIR = Path(__file__).parent.resolve()
os.chdir(SCRIPT_DIR)

# CSS files in order
CSS_FILES = [
    'css/variables.css',
    'css/base.css',
    'css/components.css',
    'css/dashboard.css',
    'css/responsive.css'
]

# JS files in dependency order
JS_FILES = [
    'js/data/mock-data.js',
    'js/components/chart.js',
    'js/components/kpi-card.js',
    'js/components/alert-card.js',
    'js/components/table.js',
    'js/components/actionable.js',
    'js/components/kpi-tree.js',
    'js/components/dropdown.js',
    'js/pages/executive.js',
    'js/pages/persona-dashboard.js',
    'js/router.js',
    'js/app.js'
]

OUTPUT_FILE = 'dashboard-bundled.html'


def read_file(filepath):
    """Read file contents."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def process_js(content):
    """Remove ES module import/export statements."""
    # Remove import statements
    content = re.sub(r"import\s+\{[^}]+\}\s+from\s+['\"][^'\"]+['\"];\n?", '', content)
    content = re.sub(r"import\s+['\"][^'\"]+['\"];\n?", '', content)
    # Remove export keywords but keep the code
    content = re.sub(r'\bexport\s+(function|const|let|var|class)', r'\1', content)
    content = re.sub(r'\bexport\s+\{[^}]+\};?\n?', '', content)
    return content


def build():
    """Build the bundled HTML file."""
    print("Building dashboard-bundled.html...")

    # Read and combine CSS
    print(f"  Reading {len(CSS_FILES)} CSS files...")
    all_css = '\n'.join([read_file(f) for f in CSS_FILES])

    # Read and process JS
    print(f"  Reading {len(JS_FILES)} JS files...")
    all_js = []
    for f in JS_FILES:
        content = read_file(f)
        content = process_js(content)
        all_js.append(f'// === {f} ===\n{content}')
    combined_js = '\n\n'.join(all_js)

    # Router fix for bundled version (no dynamic imports)
    router_fix = '''
// Router fix for bundled version (no dynamic imports)
const pageModules = {
  '/': { render: renderExecutiveDashboard, init: initExecutiveCharts },
  '/category': { render: () => renderPersonaDashboard('category'), init: () => initPersonaDashboard('category') },
  '/procurement': { render: () => renderPersonaDashboard('procurement'), init: () => initPersonaDashboard('procurement') },
  '/pod-ops': { render: () => renderPersonaDashboard('pod-ops'), init: () => initPersonaDashboard('pod-ops') },
  '/planning': { render: () => renderPersonaDashboard('planning'), init: () => initPersonaDashboard('planning') },
  '/warehouse': { render: () => renderPersonaDashboard('warehouse'), init: () => initPersonaDashboard('warehouse') },
  '/erp-team': { render: () => renderPersonaDashboard('erp-team'), init: () => initPersonaDashboard('erp-team') },
  '/product-support': { render: () => renderPersonaDashboard('product-support'), init: () => initPersonaDashboard('product-support') }
};

// Override Router handleRoute for bundled version
Router.prototype.handleRoute = async function() {
  const path = this.getPath();
  const route = routes[path];
  const pageModule = pageModules[path];

  if (!route || !pageModule) {
    this.navigate('/');
    return;
  }

  this.currentRoute = path;

  // Render the page
  if (pageModule.render) {
    this.contentElement.innerHTML = pageModule.render();
  }

  // Initialize page
  if (pageModule.init) {
    setTimeout(() => pageModule.init(), 100);
  }

  this.updateActiveNav(path);
};
'''

    # Build HTML
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Availability ActionBoard | Supply Chain Brain</title>
  <meta name="description" content="Availability ActionBoard - Supply Chain Brain MVP">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
{all_css}
  </style>
</head>
<body class="loaded">
  <div class="app">
    <button id="mobile-menu-toggle" class="mobile-menu-toggle" style="display: none; position: fixed; top: 12px; left: 12px; z-index: 300;">☰</button>
    <div id="mobile-overlay" class="mobile-menu-overlay"></div>
    <aside id="sidebar" class="sidebar"></aside>
    <main id="main-content" class="main-content">
      <div class="loading" style="min-height: 100vh;"><div class="loading__spinner"></div></div>
    </main>
  </div>
  <script>
{combined_js}

{router_fix}

// Mobile toggle
function updateMobileToggle() {{
  const toggle = document.getElementById('mobile-menu-toggle');
  if (toggle) toggle.style.display = window.innerWidth < 768 ? 'flex' : 'none';
}}
updateMobileToggle();
window.addEventListener('resize', updateMobileToggle);
  </script>
</body>
</html>'''

    # Write output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(html)

    size_kb = len(html) / 1024
    print(f"  Created {OUTPUT_FILE} ({size_kb:.1f} KB)")
    print(f"\nDone! Open {OUTPUT_FILE} in a browser or share via email.")


if __name__ == '__main__':
    build()
