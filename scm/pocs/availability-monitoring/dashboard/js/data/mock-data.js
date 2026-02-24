/**
 * Mock Data for Availability Monitoring Dashboard
 * All data is structured to support the Executive and 7 Persona dashboards
 * Schema documented in DATA_STRATEGY.md
 */

export const mockData = {
  // ==========================================================================
  // Dashboard Configuration (UI metadata)
  // ==========================================================================
  dashboardConfig: {
    executive: {
      name: "Executive Dashboard",
      icon: "📊",
      description: "Cross-team availability overview with accountability tracking",
      headerLabels: {
        date: "Date",
        city: "City",
        category: "Category",
        tracking: "Tracking"
      },
      charts: {
        gmvByOwner: "GMV at Risk by Owner",
        chronicDuration: "Chronic Duration Distribution"
      },
      completionWidget: {
        title: "Today's Actions",
        overallLabel: "Overall Completion",
        byTeamLabel: "By Team",
        byPriorityLabel: "By Priority"
      },
      tables: {
        accountability: "Accountability by Owner",
        topAlerts: "Top 5 P0 Alerts"
      }
    },
    kpiTree: {
      title: "KPI Dependency Tree - Root Cause Analysis"
    },
    persona: {
      sections: {
        alerts: "Active Alerts",
        actionables: "Top Actionables"
      },
      labels: {
        level: "Level",
        aggregateBy: "Aggregates By",
        focus: "Focus"
      },
      filters: {
        priority: {
          placeholder: "All Priorities",
          options: ["All Priorities", "P0 Only", "P1 Only", "P2 Only"]
        },
        sort: {
          placeholder: "Sort by GMV",
          options: ["Sort by GMV", "Sort by Days", "Sort by Priority"]
        }
      }
    }
  },

  // ==========================================================================
  // Executive Summary Data
  // ==========================================================================
  summary: {
    date: "2026-01-14",
    city: "Bangalore",
    category: "FMCG",
    trackedSkus: 6000,
    availability: 98.2,
    target: 99.9,
    chronicIssues: 127,
    totalGmvAtRisk: 5230000, // ₹52.3L
    totalAlerts: 28,
    alertsByPriority: { P0: 5, P1: 12, P2: 11 },
    resolutionRate: 73,
    sdlwComparison: {
      chronicSkus: +12,
      gmvAtRisk: -13, // percentage change
      alerts: -3,
      resolutionRate: +5
    },
    // Executive KPI trend history
    trendHistory: {
      availability: {
        '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [98.5, 98.4, 98.3, 98.3, 98.2, 98.2, 98.2] },
        '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [99.1, 98.9, 98.7, 98.5, 98.4, 98.3, 98.2] },
        '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [99.5, 99.4, 99.2, 99.0, 98.7, 98.4, 98.2] }
      },
      chronicIssues: {
        '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [118, 120, 122, 124, 125, 126, 127] },
        '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [95, 102, 108, 114, 119, 124, 127] },
        '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [65, 78, 88, 98, 108, 118, 127] }
      },
      gmvAtRisk: {
        '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [5.8, 5.6, 5.5, 5.4, 5.3, 5.25, 5.23] },
        '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [6.5, 6.2, 5.9, 5.6, 5.4, 5.3, 5.23] },
        '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [4.2, 4.5, 4.9, 5.3, 5.8, 6.1, 5.23] }
      },
      totalAlerts: {
        '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [32, 31, 30, 29, 29, 28, 28] },
        '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [38, 36, 34, 32, 30, 29, 28] },
        '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [22, 25, 28, 32, 35, 32, 28] }
      },
      resolutionRate: {
        '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [68, 69, 70, 71, 72, 72, 73] },
        '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [62, 64, 66, 68, 70, 71, 73] },
        '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [55, 58, 62, 65, 68, 70, 73] }
      }
    }
  },

  // ==========================================================================
  // Actionable Completion Data (for Executive Dashboard)
  // ==========================================================================
  actionableCompletion: {
    overall: 62,
    byTeam: [
      { name: 'Category', icon: '📦', completed: 8, total: 12, percentage: 67 },
      { name: 'Procurement', icon: '🏭', completed: 5, total: 10, percentage: 50 },
      { name: 'Pod Ops', icon: '🏪', completed: 7, total: 9, percentage: 78 },
      { name: 'Planning', icon: '📋', completed: 4, total: 8, percentage: 50 },
      { name: 'Warehouse', icon: '🏢', completed: 6, total: 8, percentage: 75 },
      { name: 'ERP', icon: '⚙️', completed: 3, total: 5, percentage: 60 }
    ],
    byImpact: [
      { name: 'P0 (Critical)', completed: 3, total: 5, percentage: 60, gmvImpact: 2100000 },
      { name: 'P1 (High)', completed: 8, total: 12, percentage: 67, gmvImpact: 1850000 },
      { name: 'P2 (Medium)', completed: 22, total: 35, percentage: 63, gmvImpact: 1280000 }
    ],
    todayStats: {
      assigned: 52,
      completed: 33,
      inProgress: 12,
      pending: 7
    }
  },

  // ==========================================================================
  // GMV at Risk by Owner
  // ==========================================================================
  gmvByOwner: [
    { owner: "Category Management", gmv: 1820000, icon: "📦", alerts: 5, dashboardLink: "#/category" },
    { owner: "Procurement", gmv: 1280000, icon: "🏭", alerts: 6, dashboardLink: "#/procurement" },
    { owner: "Pod Ops", gmv: 840000, icon: "🏪", alerts: 5, dashboardLink: "#/pod-ops" },
    { owner: "Planning", gmv: 650000, icon: "📋", alerts: 4, dashboardLink: "#/planning" },
    { owner: "Warehouse", gmv: 420000, icon: "🏢", alerts: 4, dashboardLink: "#/warehouse" },
    { owner: "ERP Team", gmv: 180000, icon: "⚙️", alerts: 2, dashboardLink: "#/erp-team" },
    { owner: "Product Support", gmv: 40000, icon: "🔧", alerts: 2, dashboardLink: "#/product-support" }
  ],

  // ==========================================================================
  // Alerts by Issue Branch
  // ==========================================================================
  alertsByBranch: [
    { branch: "Branch 3: Supply-led", percentage: 35, color: "#dc2626" },
    { branch: "Branch 2: PO-led", percentage: 25, color: "#ea580c" },
    { branch: "Branch 5: Pod-led", percentage: 20, color: "#ca8a04" },
    { branch: "Branch 1: Forecast", percentage: 12, color: "#16a34a" },
    { branch: "Branch 4: Warehouse", percentage: 5, color: "#3b82f6" },
    { branch: "Branch 6: Config", percentage: 3, color: "#8b5cf6" }
  ],

  // ==========================================================================
  // Chronic Duration Breakdown
  // ==========================================================================
  chronicDuration: [
    { range: "15-18 days", count: 57, percentage: 45, color: "#fbbf24" },
    { range: "19-22 days", count: 38, percentage: 30, color: "#f97316" },
    { range: "23-26 days", count: 23, percentage: 18, color: "#ef4444" },
    { range: "27-30 days", count: 9, percentage: 7, color: "#b91c1c" }
  ],

  // ==========================================================================
  // 30-Day Trend Data
  // ==========================================================================
  trendData: [
    { day: 1, date: "Dec 15", count: 140, availability: 97.8 },
    { day: 2, date: "Dec 16", count: 138, availability: 97.9 },
    { day: 3, date: "Dec 17", count: 142, availability: 97.7 },
    { day: 4, date: "Dec 18", count: 145, availability: 97.6 },
    { day: 5, date: "Dec 19", count: 148, availability: 97.5 },
    { day: 6, date: "Dec 20", count: 152, availability: 97.4 },
    { day: 7, date: "Dec 21", count: 155, availability: 97.3 },
    { day: 8, date: "Dec 22", count: 151, availability: 97.5 },
    { day: 9, date: "Dec 23", count: 148, availability: 97.6 },
    { day: 10, date: "Dec 24", count: 145, availability: 97.7 },
    { day: 11, date: "Dec 25", count: 150, availability: 97.5 },
    { day: 12, date: "Dec 26", count: 147, availability: 97.6 },
    { day: 13, date: "Dec 27", count: 143, availability: 97.8 },
    { day: 14, date: "Dec 28", count: 140, availability: 97.9 },
    { day: 15, date: "Dec 29", count: 138, availability: 98.0 },
    { day: 16, date: "Dec 30", count: 135, availability: 98.1 },
    { day: 17, date: "Dec 31", count: 133, availability: 98.1 },
    { day: 18, date: "Jan 1", count: 136, availability: 98.0 },
    { day: 19, date: "Jan 2", count: 138, availability: 97.9 },
    { day: 20, date: "Jan 3", count: 140, availability: 97.8 },
    { day: 21, date: "Jan 4", count: 137, availability: 97.9 },
    { day: 22, date: "Jan 5", count: 134, availability: 98.0 },
    { day: 23, date: "Jan 6", count: 131, availability: 98.1 },
    { day: 24, date: "Jan 7", count: 128, availability: 98.2 },
    { day: 25, date: "Jan 8", count: 130, availability: 98.1 },
    { day: 26, date: "Jan 9", count: 132, availability: 98.0 },
    { day: 27, date: "Jan 10", count: 129, availability: 98.1 },
    { day: 28, date: "Jan 11", count: 127, availability: 98.2 },
    { day: 29, date: "Jan 12", count: 128, availability: 98.2 },
    { day: 30, date: "Jan 13", count: 127, availability: 98.2 }
  ],

  // ==========================================================================
  // Accountability Table
  // ==========================================================================
  accountabilityTable: [
    {
      owner: "Category Management",
      icon: "📦",
      alertCount: 5,
      gmvAtRisk: 1820000,
      topIssue: "Coca-Cola fill rate 45%",
      status: "critical",
      dashboardLink: "#/category"
    },
    {
      owner: "Procurement",
      icon: "🏭",
      alertCount: 6,
      gmvAtRisk: 1280000,
      topIssue: "3 POs stuck at MOQ",
      status: "critical",
      dashboardLink: "#/procurement"
    },
    {
      owner: "Pod Ops",
      icon: "🏪",
      alertCount: 5,
      gmvAtRisk: 840000,
      topIssue: "HSR Layout rack full",
      status: "warning",
      dashboardLink: "#/pod-ops"
    },
    {
      owner: "Planning",
      icon: "📋",
      alertCount: 4,
      gmvAtRisk: 650000,
      topIssue: "wMAPE 28% on beverages",
      status: "warning",
      dashboardLink: "#/planning"
    },
    {
      owner: "Warehouse",
      icon: "🏢",
      alertCount: 4,
      gmvAtRisk: 420000,
      topIssue: "GRN backlog 850 SKUs",
      status: "warning",
      dashboardLink: "#/warehouse"
    },
    {
      owner: "ERP Team",
      icon: "⚙️",
      alertCount: 2,
      gmvAtRisk: 180000,
      topIssue: "12 missing vendor codes",
      status: "warning",
      dashboardLink: "#/erp-team"
    },
    {
      owner: "Product Support",
      icon: "🔧",
      alertCount: 2,
      gmvAtRisk: 40000,
      topIssue: "Stale override rules",
      status: "good",
      dashboardLink: "#/product-support"
    }
  ],

  // ==========================================================================
  // Top 5 P0 Alerts (derived from persona alerts, sorted by gmv_loss)
  // ==========================================================================
  topP0Alerts: [
    {
      rank: 1,
      scope: "BRAND",
      entity: "Coca-Cola",
      owner: "Category Management",
      gmv_loss: 1250000,
      chronic_days_avg: 22,
      l3_narrative: "Supplier fill rate at 45% vs 80% target"
    },
    {
      rank: 2,
      scope: "WAREHOUSE",
      entity: "Central WH",
      owner: "Procurement",
      gmv_loss: 680000,
      chronic_days_avg: 18,
      l3_narrative: "PO blocked at MOQ threshold"
    },
    {
      rank: 3,
      scope: "POD",
      entity: "HSR Layout Store",
      owner: "Pod Ops",
      gmv_loss: 520000,
      chronic_days_avg: 25,
      l3_narrative: "Rack utilization at 98%"
    },
    {
      rank: 4,
      scope: "WAREHOUSE",
      entity: "Central WH",
      owner: "Planning",
      gmv_loss: 480000,
      chronic_days_avg: 16,
      l3_narrative: "wMAPE 28% underforecast on beverages"
    },
    {
      rank: 5,
      scope: "WAREHOUSE",
      entity: "Whitefield Hub",
      owner: "Warehouse",
      gmv_loss: 350000,
      chronic_days_avg: 19,
      l3_narrative: "GRN TAT 72+ hours"
    }
  ],

  // ==========================================================================
  // Category Management Dashboard Data
  // ==========================================================================
  categoryManagement: {
    persona: {
      name: "Category Management",
      icon: "📦",
      level: "Brand / Category",
      aggregateBy: ["brand", "l1_category"],
      description: "Brand POC escalations, selection gaps, fill rate issues"
    },
    kpis: {
      avgFillRate: {
        value: 68, target: 80, unit: "%", status: "critical", trend: -5,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [72, 71, 70, 69, 69, 68, 68] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [78, 76, 74, 72, 70, 69, 68] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [85, 82, 79, 76, 73, 70, 68] }
        }
      },
      brandsAtRisk: {
        value: 12, gmv: 1820000, status: "critical", trend: +3,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [9, 10, 10, 11, 11, 12, 12] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [6, 7, 8, 9, 10, 11, 12] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [3, 4, 5, 7, 8, 10, 12] }
        }
      },
      npiPending: {
        value: 5, threshold: 7, status: "warning", trend: +2,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [3, 3, 4, 4, 5, 5, 5] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [2, 2, 3, 3, 4, 4, 5] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [1, 2, 2, 3, 3, 4, 5] }
        }
      },
      escalations: {
        value: 3, avgAge: 4, status: "warning", trend: 0,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [3, 3, 3, 3, 3, 3, 3] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [2, 2, 3, 3, 3, 3, 3] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [1, 2, 2, 2, 3, 3, 3] }
        }
      }
    },
    alerts: [
      {
        alert_id: "CAT-001",
        owner: "Category Management",
        scope: "BRAND",
        entity: "Coca-Cola",
        gmv_loss: 1250000,
        rank: 1,
        priority: "P0",
        affected_sku_count: 8,
        affected_skus: [
          { sku_id: "SKU-CC-500", sku_name: "Coca-Cola 500ml", chronic_days: 22 },
          { sku_id: "SKU-CC-1L", sku_name: "Coca-Cola 1L", chronic_days: 20 },
          { sku_id: "SKU-CC-2L", sku_name: "Coca-Cola 2L", chronic_days: 18 },
          { sku_id: "SKU-CC-Z500", sku_name: "Coca-Cola Zero 500ml", chronic_days: 17 }
        ],
        chronic_days_avg: 22,
        l1_reason_distribution: {
          "Fill Rate issue": 0.65,
          "OTIF": 0.20,
          "Long Term Supply issue": 0.15
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Primary supplier HCCB failing fill targets due to production constraints at Bidadi plant. 3-week declining trend with no recovery signal.",
        key_signals: ["Fill Rate: 45% (target 80%)", "Chronic Days: 22", "PODs Affected: 15 (75%)"],
        actions: [
          { action_id: "CAT-001-A1", text: "Escalate to HCCB Brand POC", gmv_at_risk: 750000, owner: "Category", status: "pending" },
          { action_id: "CAT-001-A2", text: "Activate secondary supplier Reliance", gmv_at_risk: 500000, owner: "Procurement", status: "pending" }
        ],
        key_metric: { label: "Fill Rate", value: 45, target: 80, unit: "%" },
        trend: [65, 58, 52, 48, 45, 44, 45],
        impact_scope: { count: 15, unit: "pods", percentage: 75 }
      },
      {
        alert_id: "CAT-002",
        owner: "Category Management",
        scope: "BRAND",
        entity: "Britannia",
        gmv_loss: 420000,
        rank: 2,
        priority: "P1",
        affected_sku_count: 5,
        affected_skus: [
          { sku_id: "SKU-BR-GD", sku_name: "Good Day Butter", chronic_days: 16 },
          { sku_id: "SKU-BR-MG", sku_name: "Marie Gold", chronic_days: 15 },
          { sku_id: "SKU-BR-TG", sku_name: "Tiger Biscuits", chronic_days: 14 }
        ],
        chronic_days_avg: 16,
        l1_reason_distribution: {
          "Fill Rate issue": 0.55,
          "Contract Not Available": 0.30,
          "ERP Disabled": 0.15
        },
        is_primary: true,
        shared_with: "ERP Team",
        l3_narrative: "New product variants not enabled in system. Fill rate dropping on existing SKUs due to allocation priority.",
        key_signals: ["Fill Rate: 62% (target 80%)", "Chronic Days: 16", "PODs Affected: 8 (40%)"],
        actions: [
          { action_id: "CAT-002-A1", text: "Enable NPI SKUs in MIM", gmv_at_risk: 280000, owner: "ERP Team", status: "pending" },
          { action_id: "CAT-002-A2", text: "Request fill rate commitment from brand", gmv_at_risk: 140000, owner: "Category", status: "pending" }
        ],
        key_metric: { label: "Fill Rate", value: 62, target: 80, unit: "%" },
        trend: [75, 70, 68, 65, 63, 62, 62],
        impact_scope: { count: 8, unit: "pods", percentage: 40 }
      },
      {
        alert_id: "CAT-003",
        owner: "Category Management",
        scope: "BRAND",
        entity: "Amul",
        gmv_loss: 180000,
        rank: 3,
        priority: "P1",
        affected_sku_count: 1,
        affected_skus: [
          { sku_id: "SKU-AM-B500", sku_name: "Amul Butter 500g", chronic_days: 19 }
        ],
        chronic_days_avg: 19,
        l1_reason_distribution: {
          "Long Term Supply issue": 0.70,
          "Fill Rate issue": 0.30
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Cold chain capacity constraints at supplier end. Competing allocation with quick commerce players.",
        key_signals: ["Fill Rate: 55% (target 85%)", "Chronic Days: 19", "PODs Affected: 12 (60%)"],
        actions: [
          { action_id: "CAT-003-A1", text: "Escalate to Amul regional manager", gmv_at_risk: 120000, owner: "Category", status: "pending" },
          { action_id: "CAT-003-A2", text: "Request priority allocation", gmv_at_risk: 60000, owner: "Procurement", status: "pending" }
        ],
        key_metric: { label: "Fill Rate", value: 55, target: 85, unit: "%" },
        trend: [70, 65, 60, 58, 56, 55, 55],
        impact_scope: { count: 12, unit: "pods", percentage: 60 }
      },
      {
        alert_id: "CAT-004",
        owner: "Category Management",
        scope: "BRAND",
        entity: "Nestle",
        gmv_loss: 95000,
        rank: 4,
        priority: "P2",
        affected_sku_count: 5,
        affected_skus: [
          { sku_id: "SKU-NS-M2-70", sku_name: "Maggi 2-min 70g", chronic_days: 15 },
          { sku_id: "SKU-NS-NC-50", sku_name: "Nescafe Classic 50g", chronic_days: 14 }
        ],
        chronic_days_avg: 15,
        l1_reason_distribution: {
          "Fill Rate issue": 0.60,
          "MOV/MOQ/Tonnage Constraint": 0.40
        },
        is_primary: true,
        shared_with: "Procurement",
        l3_narrative: "Slight fill rate miss combined with MOQ constraints on smaller pods.",
        key_signals: ["Fill Rate: 72% (target 80%)", "Chronic Days: 15", "PODs Affected: 5 (25%)"],
        actions: [
          { action_id: "CAT-004-A1", text: "Monitor fill rate trend", gmv_at_risk: 55000, owner: "Category", status: "completed" },
          { action_id: "CAT-004-A2", text: "Review MOQ thresholds", gmv_at_risk: 40000, owner: "Procurement", status: "pending" }
        ],
        key_metric: { label: "Fill Rate", value: 72, target: 80, unit: "%" },
        trend: [78, 76, 74, 73, 72, 72, 72],
        impact_scope: { count: 5, unit: "pods", percentage: 25 }
      },
      {
        alert_id: "CAT-005",
        owner: "Category Management",
        scope: "CATEGORY",
        entity: "Baby Care",
        gmv_loss: 75000,
        rank: 5,
        priority: "P2",
        affected_sku_count: 6,
        affected_skus: [
          { sku_id: "SKU-PM-M-64", sku_name: "Pampers M 64 Count", chronic_days: 17 },
          { sku_id: "SKU-HG-L-46", sku_name: "Huggies L 46 Count", chronic_days: 16 },
          { sku_id: "SKU-JN-BO-200", sku_name: "Johnson Baby Oil 200ml", chronic_days: 15 }
        ],
        chronic_days_avg: 17,
        l1_reason_distribution: {
          "Contract Not Available": 0.80,
          "ERP Disabled": 0.20
        },
        is_primary: true,
        shared_with: "ERP Team",
        l3_narrative: "Missing key SKUs in assortment. Competitor benchmark shows 15 SKU gap.",
        key_signals: ["Selection Gap: 15 SKUs (target 5)", "Chronic Days: 17", "SKUs Affected: 6 (30%)"],
        actions: [
          { action_id: "CAT-005-A1", text: "Add missing SKUs to selection", gmv_at_risk: 50000, owner: "Category", status: "pending" },
          { action_id: "CAT-005-A2", text: "Enable via MIM", gmv_at_risk: 25000, owner: "ERP Team", status: "pending" }
        ],
        key_metric: { label: "Selection Gap", value: 15, target: 5, unit: "SKUs" },
        trend: [10, 11, 12, 13, 14, 15, 15],
        impact_scope: { count: 6, unit: "SKUs", percentage: 30 }
      }
    ]
  },

  // ==========================================================================
  // Procurement Dashboard Data
  // ==========================================================================
  procurement: {
    persona: {
      name: "Procurement",
      icon: "🏭",
      level: "City / WH",
      aggregateBy: ["city", "warehouse"],
      description: "PO generation, MOQ/MOV issues, supplier OTIF"
    },
    kpis: {
      otifRate: {
        value: 72, target: 90, unit: "%", status: "critical", trend: -8,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [78, 77, 75, 74, 73, 72, 72] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [85, 82, 80, 78, 75, 73, 72] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [92, 89, 86, 82, 78, 75, 72] }
        }
      },
      moqBlocking: {
        value: 18, unit: "%", status: "warning", trend: +5,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [14, 15, 16, 16, 17, 17, 18] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [10, 12, 13, 14, 15, 17, 18] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [5, 7, 9, 11, 13, 15, 18] }
        }
      },
      pendingPos: {
        value: 23, gmv: 850000, status: "critical", trend: +7,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [18, 19, 20, 21, 22, 22, 23] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [12, 14, 16, 18, 20, 22, 23] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [5, 8, 10, 13, 16, 20, 23] }
        }
      },
      contractIssues: {
        value: 4, status: "warning", trend: 0,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [4, 4, 4, 4, 4, 4, 4] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [3, 3, 4, 4, 4, 4, 4] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [2, 2, 3, 3, 3, 4, 4] }
        }
      }
    },
    alerts: [
      {
        alert_id: "PROC-001",
        owner: "Procurement",
        scope: "WAREHOUSE",
        entity: "Central WH",
        gmv_loss: 680000,
        rank: 1,
        priority: "P0",
        affected_sku_count: 45,
        affected_skus: [
          { sku_id: "SKU-PG-80", sku_name: "Parle-G 80g", chronic_days: 18 },
          { sku_id: "SKU-HS-120", sku_name: "Hide & Seek 120g", chronic_days: 17 },
          { sku_id: "SKU-ML-150", sku_name: "Milano 150g", chronic_days: 16 },
          { sku_id: "SKU-KJ-100", sku_name: "Krackjack 100g", chronic_days: 15 }
        ],
        chronic_days_avg: 18,
        l1_reason_distribution: {
          "OTIF": 0.50,
          "MOV/MOQ/Tonnage Constraint": 0.35,
          "Ordering / OTIF / Contract issue": 0.15
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Multiple POs stuck at MOQ threshold. OTIF declining due to transport issues from Bahadurgarh plant.",
        key_signals: ["OTIF Rate: 58% (target 90%)", "Chronic Days: 18", "SKUs Affected: 45 (60%)"],
        actions: [
          { action_id: "PROC-001-A1", text: "Negotiate MOQ reduction with Parle", gmv_at_risk: 400000, owner: "Procurement", status: "pending" },
          { action_id: "PROC-001-A2", text: "Escalate OTIF to vendor management", gmv_at_risk: 280000, owner: "Procurement", status: "pending" }
        ],
        key_metric: { label: "OTIF Rate", value: 58, target: 90, unit: "%" },
        trend: [75, 70, 65, 62, 60, 58, 58],
        impact_scope: { count: 45, unit: "SKUs", percentage: 60 }
      },
      {
        alert_id: "PROC-002",
        owner: "Procurement",
        scope: "WAREHOUSE",
        entity: "Whitefield Hub",
        gmv_loss: 320000,
        rank: 2,
        priority: "P1",
        affected_sku_count: 18,
        affected_skus: [
          { sku_id: "SKU-AA-1K", sku_name: "Aashirvaad Atta 1kg", chronic_days: 12 },
          { sku_id: "SKU-SF-BS-150", sku_name: "Sunfeast Dark Fantasy 150g", chronic_days: 11 },
          { sku_id: "SKU-BG-90", sku_name: "Bingo Tedhe Medhe 90g", chronic_days: 10 }
        ],
        chronic_days_avg: 12,
        l1_reason_distribution: {
          "Ordering / OTIF / Contract issue": 0.60,
          "MOV/MOQ/Tonnage Constraint": 0.40
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "PO pending approval due to MOV not met. Need to consolidate orders or adjust MOV.",
        key_signals: ["Days Pending: 12 (target 3)", "Chronic Days: 12", "SKUs Affected: 18 (35%)"],
        actions: [
          { action_id: "PROC-002-A1", text: "Consolidate with other pending POs", gmv_at_risk: 200000, owner: "Procurement", status: "pending" },
          { action_id: "PROC-002-A2", text: "Request MOV waiver from vendor", gmv_at_risk: 120000, owner: "Procurement", status: "pending" }
        ],
        key_metric: { label: "Days Pending", value: 12, target: 3, unit: "days" },
        trend: [3, 5, 7, 9, 10, 11, 12],
        impact_scope: { count: 18, unit: "SKUs", percentage: 35 }
      },
      {
        alert_id: "PROC-003",
        owner: "Procurement",
        scope: "WAREHOUSE",
        entity: "Bommanahalli Hub",
        gmv_loss: 280000,
        rank: 3,
        priority: "P1",
        affected_sku_count: 22,
        affected_skus: [
          { sku_id: "SKU-SE-1K", sku_name: "Surf Excel Easy Wash 1kg", chronic_days: 14 },
          { sku_id: "SKU-VM-250", sku_name: "Vim Bar 250g", chronic_days: 13 },
          { sku_id: "SKU-LB-100", sku_name: "Lifebuoy Total 100g", chronic_days: 12 }
        ],
        chronic_days_avg: 14,
        l1_reason_distribution: {
          "OTIF": 0.70,
          "Ordering / OTIF / Contract issue": 0.30
        },
        is_primary: true,
        shared_with: "Planning",
        l3_narrative: "HUL warehouse capacity issues causing fulfillment delays. Lead times extended by 2 days.",
        key_signals: ["OTIF Rate: 68% (target 90%)", "Chronic Days: 14", "SKUs Affected: 22 (28%)"],
        actions: [
          { action_id: "PROC-003-A1", text: "Escalate to HUL supply chain head", gmv_at_risk: 180000, owner: "Procurement", status: "pending" },
          { action_id: "PROC-003-A2", text: "Adjust safety stock levels", gmv_at_risk: 100000, owner: "Planning", status: "pending" }
        ],
        key_metric: { label: "OTIF Rate", value: 68, target: 90, unit: "%" },
        trend: [82, 78, 75, 72, 70, 68, 68],
        impact_scope: { count: 22, unit: "SKUs", percentage: 28 }
      },
      {
        alert_id: "PROC-004",
        owner: "Procurement",
        scope: "WAREHOUSE",
        entity: "Yelahanka Hub",
        gmv_loss: 120000,
        rank: 4,
        priority: "P2",
        affected_sku_count: 8,
        affected_skus: [
          { sku_id: "SKU-RJ-1L", sku_name: "Real Mixed Fruit Juice 1L", chronic_days: 20 },
          { sku_id: "SKU-HJ-120", sku_name: "Hajmola Regular 120 Tablets", chronic_days: 18 },
          { sku_id: "SKU-CY-500", sku_name: "Dabur Chyawanprash 500g", chronic_days: 16 }
        ],
        chronic_days_avg: 20,
        l1_reason_distribution: {
          "Contract Not Available": 1.00
        },
        is_primary: true,
        shared_with: "Category Management",
        l3_narrative: "Contract expired 20 days ago. Operating on interim terms with limited fill commitment.",
        key_signals: ["Contract Status: Expired (target Active)", "Chronic Days: 20", "SKUs Affected: 8 (15%)"],
        actions: [
          { action_id: "PROC-004-A1", text: "Fast-track contract renewal", gmv_at_risk: 80000, owner: "Category", status: "completed" },
          { action_id: "PROC-004-A2", text: "Negotiate interim fill guarantee", gmv_at_risk: 40000, owner: "Procurement", status: "pending" }
        ],
        key_metric: { label: "Contract Status", value: 0, target: 1, unit: "active" },
        trend: [0, 0, 0, 0, 0, 0, 0],
        impact_scope: { count: 8, unit: "SKUs", percentage: 15 }
      },
      {
        alert_id: "PROC-005",
        owner: "Procurement",
        scope: "WAREHOUSE",
        entity: "Electronic City Hub",
        gmv_loss: 85000,
        rank: 5,
        priority: "P2",
        affected_sku_count: 10,
        affected_skus: [
          { sku_id: "SKU-PC-200", sku_name: "Parachute Coconut Oil 200ml", chronic_days: 16 },
          { sku_id: "SKU-SF-1L", sku_name: "Saffola Gold 1L", chronic_days: 15 },
          { sku_id: "SKU-LV-100", sku_name: "Livon Serum 100ml", chronic_days: 14 }
        ],
        chronic_days_avg: 16,
        l1_reason_distribution: {
          "OTIF": 0.65,
          "MOV/MOQ/Tonnage Constraint": 0.35
        },
        is_primary: true,
        shared_with: "Planning",
        l3_narrative: "OTIF declining due to increased demand not matched by allocation.",
        key_signals: ["OTIF Rate: 75% (target 90%)", "Chronic Days: 16", "SKUs Affected: 10 (20%)"],
        actions: [
          { action_id: "PROC-005-A1", text: "Request allocation increase", gmv_at_risk: 55000, owner: "Procurement", status: "pending" },
          { action_id: "PROC-005-A2", text: "Review forecast accuracy", gmv_at_risk: 30000, owner: "Planning", status: "pending" }
        ],
        key_metric: { label: "OTIF Rate", value: 75, target: 90, unit: "%" },
        trend: [85, 82, 80, 78, 76, 75, 75],
        impact_scope: { count: 10, unit: "SKUs", percentage: 20 }
      }
    ]
  },

  // ==========================================================================
  // Pod Ops Dashboard Data
  // ==========================================================================
  podOps: {
    persona: {
      name: "Pod Ops",
      icon: "🏪",
      level: "Pod",
      aggregateBy: ["pod"],
      description: "Inwarding, rack capacity, processing, FTR"
    },
    kpis: {
      rackUtilization: {
        value: 94, target: 85, unit: "%", status: "critical", trend: +6,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [90, 91, 92, 93, 93, 94, 94] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [85, 87, 89, 90, 92, 93, 94] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [78, 80, 83, 86, 89, 92, 94] }
        }
      },
      inwardingTat: {
        value: 4.2, target: 2, unit: "hrs", status: "warning", trend: +1.5,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [3.2, 3.5, 3.8, 4.0, 4.1, 4.1, 4.2] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [2.5, 2.8, 3.2, 3.5, 3.8, 4.0, 4.2] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [1.8, 2.2, 2.6, 3.0, 3.4, 3.8, 4.2] }
        }
      },
      podsAtRisk: {
        value: 8, gmv: 840000, status: "critical", trend: +2,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [6, 6, 7, 7, 8, 8, 8] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [4, 5, 5, 6, 7, 7, 8] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [2, 3, 4, 5, 6, 7, 8] }
        }
      },
      ftrRate: {
        value: 88, target: 95, unit: "%", status: "warning", trend: -3,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [91, 90, 90, 89, 89, 88, 88] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [93, 92, 91, 90, 90, 89, 88] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [96, 95, 94, 93, 91, 90, 88] }
        }
      }
    },
    alerts: [
      {
        alert_id: "POD-001",
        owner: "Pod Ops",
        scope: "POD",
        entity: "HSR Layout Store",
        gmv_loss: 520000,
        rank: 1,
        priority: "P0",
        affected_sku_count: 85,
        affected_skus: [
          { sku_id: "SKU-TH-500", sku_name: "Thums Up 500ml", chronic_days: 25 },
          { sku_id: "SKU-LY-150", sku_name: "Lay's Classic 150g", chronic_days: 24 },
          { sku_id: "SKU-AM-TZ500", sku_name: "Amul Taaza 500ml", chronic_days: 22 }
        ],
        chronic_days_avg: 25,
        l1_reason_distribution: {
          "Pod Missed Qty": 0.70,
          "Movement Setting Design Issue": 0.20,
          "Pod_Space Issue_freezer": 0.10
        },
        is_primary: true,
        shared_with: "Category Management",
        l3_narrative: "Rack utilization at 98% causing stockout of fast movers. Need capacity expansion or SKU rationalization.",
        key_signals: ["Rack Util: 98% (target 85%)", "Chronic Days: 25", "SKUs Affected: 85 (42%)"],
        actions: [
          { action_id: "POD-001-A1", text: "Request rack expansion for HSR Layout", gmv_at_risk: 320000, owner: "Pod Ops", status: "pending" },
          { action_id: "POD-001-A2", text: "Identify slow movers for removal", gmv_at_risk: 200000, owner: "Category Management", status: "pending" }
        ],
        key_metric: { label: "Rack Util", value: 98, target: 85, unit: "%" },
        trend: [88, 90, 92, 94, 96, 97, 98],
        impact_scope: { count: 85, unit: "SKUs", percentage: 42 }
      },
      {
        alert_id: "POD-002",
        owner: "Pod Ops",
        scope: "POD",
        entity: "Koramangala Store",
        gmv_loss: 180000,
        rank: 2,
        priority: "P1",
        affected_sku_count: 45,
        affected_skus: [
          { sku_id: "SKU-HB-500", sku_name: "Harvest Bread 500g", chronic_days: 15 },
          { sku_id: "SKU-NS-CD200", sku_name: "Nestle Curd 200g", chronic_days: 14 }
        ],
        chronic_days_avg: 15,
        l1_reason_distribution: {
          "Pod Inward Delay Impact": 0.60,
          "Pod Missed Qty": 0.40
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Inwarding TAT 6 hours causing stockouts for morning orders. Staff shortage during peak hours.",
        key_signals: ["Inwarding TAT: 6 hrs (target 2)", "Chronic Days: 15", "SKUs Affected: 45 (28%)"],
        actions: [
          { action_id: "POD-002-A1", text: "Add morning shift staff at Koramangala", gmv_at_risk: 110000, owner: "Pod Ops", status: "pending" },
          { action_id: "POD-002-A2", text: "Optimize inwarding process", gmv_at_risk: 70000, owner: "Pod Ops", status: "pending" }
        ],
        key_metric: { label: "Inwarding TAT", value: 6, target: 2, unit: "hrs" },
        trend: [2.5, 3, 3.5, 4, 5, 5.5, 6],
        impact_scope: { count: 45, unit: "SKUs", percentage: 28 }
      },
      {
        alert_id: "POD-003",
        owner: "Pod Ops",
        scope: "POD",
        entity: "Indiranagar Store",
        gmv_loss: 95000,
        rank: 3,
        priority: "P1",
        affected_sku_count: 18,
        affected_skus: [
          { sku_id: "SKU-AM-ML500", sku_name: "Amul Gold Milk 500ml", chronic_days: 12 },
          { sku_id: "SKU-MT-CD400", sku_name: "Mother Dairy Curd 400g", chronic_days: 11 },
          { sku_id: "SKU-AM-PN200", sku_name: "Amul Fresh Paneer 200g", chronic_days: 10 }
        ],
        chronic_days_avg: 12,
        l1_reason_distribution: {
          "Pod_Space Issue_freezer": 0.50,
          "Pod Missed Qty": 0.30,
          "Pod Inward Delay Impact": 0.20
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "FTR dropping due to FEFO compliance issues in dairy. Short-dated stock not rotated properly.",
        key_signals: ["FTR: 78% (target 95%)", "Chronic Days: 12", "SKUs Affected: 18 (35%)"],
        actions: [
          { action_id: "POD-003-A1", text: "Conduct FEFO audit at Indiranagar", gmv_at_risk: 55000, owner: "Pod Ops", status: "pending" },
          { action_id: "POD-003-A2", text: "Staff training on dairy rotation", gmv_at_risk: 40000, owner: "Pod Ops", status: "pending" }
        ],
        key_metric: { label: "FTR", value: 78, target: 95, unit: "%" },
        trend: [92, 88, 85, 82, 80, 79, 78],
        impact_scope: { count: 18, unit: "SKUs", percentage: 35 }
      },
      {
        alert_id: "POD-004",
        owner: "Pod Ops",
        scope: "POD",
        entity: "Whitefield Store",
        gmv_loss: 65000,
        rank: 4,
        priority: "P2",
        affected_sku_count: 32,
        affected_skus: [
          { sku_id: "SKU-BG-100", sku_name: "Bingo Mad Angles 100g", chronic_days: 18 },
          { sku_id: "SKU-SP-750", sku_name: "Sprite 750ml", chronic_days: 17 }
        ],
        chronic_days_avg: 18,
        l1_reason_distribution: {
          "Pod Missed Qty": 0.60,
          "Movement Setting Design Issue": 0.40
        },
        is_primary: true,
        shared_with: "Category Management",
        l3_narrative: "Gradual capacity creep. Several slow movers occupying premium shelf space.",
        key_signals: ["Rack Util: 92% (target 85%)", "Chronic Days: 18", "SKUs Affected: 32 (22%)"],
        actions: [
          { action_id: "POD-004-A1", text: "SKU rationalization review at Whitefield", gmv_at_risk: 40000, owner: "Category Management", status: "pending" },
          { action_id: "POD-004-A2", text: "Identify delist candidates", gmv_at_risk: 25000, owner: "Category Management", status: "pending" }
        ],
        key_metric: { label: "Rack Util", value: 92, target: 85, unit: "%" },
        trend: [85, 86, 88, 89, 90, 91, 92],
        impact_scope: { count: 32, unit: "SKUs", percentage: 22 }
      },
      {
        alert_id: "POD-005",
        owner: "Pod Ops",
        scope: "POD",
        entity: "Jayanagar Store",
        gmv_loss: 45000,
        rank: 5,
        priority: "P2",
        affected_sku_count: 22,
        affected_skus: [
          { sku_id: "SKU-TS-1K", sku_name: "Tata Salt 1kg", chronic_days: 14 },
          { sku_id: "SKU-SF-500", sku_name: "Saffola Gold 500ml", chronic_days: 13 }
        ],
        chronic_days_avg: 14,
        l1_reason_distribution: {
          "Pod Inward Delay Impact": 0.70,
          "Pod Missed Qty": 0.30
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Staging area congested during peak delivery windows.",
        key_signals: ["Inwarding TAT: 4.5 hrs (target 2)", "Chronic Days: 14", "SKUs Affected: 22 (18%)"],
        actions: [
          { action_id: "POD-005-A1", text: "Stagger delivery appointments at Jayanagar", gmv_at_risk: 28000, owner: "Pod Ops", status: "pending" },
          { action_id: "POD-005-A2", text: "Expand staging area", gmv_at_risk: 17000, owner: "Pod Ops", status: "pending" }
        ],
        key_metric: { label: "Inwarding TAT", value: 4.5, target: 2, unit: "hrs" },
        trend: [2, 2.5, 3, 3.5, 4, 4.2, 4.5],
        impact_scope: { count: 22, unit: "SKUs", percentage: 18 }
      }
    ]
  },

  // ==========================================================================
  // Planning Dashboard Data
  // ==========================================================================
  planning: {
    persona: {
      name: "Planning",
      icon: "📋",
      level: "City / WH",
      aggregateBy: ["city", "warehouse"],
      description: "Forecast accuracy, DOH, replenishment rules"
    },
    kpis: {
      forecastAccuracy: {
        value: 72, target: 85, unit: "% (wMAPE)", status: "critical", trend: -5,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [76, 75, 74, 74, 73, 72, 72] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [82, 80, 78, 76, 74, 73, 72] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [88, 86, 83, 80, 77, 74, 72] }
        }
      },
      dohBreaches: {
        value: 34, threshold: 10, status: "critical", trend: +12,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [26, 28, 30, 31, 32, 33, 34] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [18, 21, 24, 27, 30, 32, 34] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [8, 12, 16, 20, 25, 30, 34] }
        }
      },
      rrGeneration: {
        value: 85, target: 95, unit: "%", status: "warning", trend: -3,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [88, 87, 87, 86, 86, 85, 85] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [91, 90, 89, 88, 87, 86, 85] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [95, 94, 92, 90, 88, 86, 85] }
        }
      },
      movementGaps: {
        value: 18, status: "warning", trend: +4,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [15, 16, 16, 17, 17, 18, 18] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [12, 13, 14, 15, 16, 17, 18] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [8, 10, 12, 14, 15, 17, 18] }
        }
      }
    },
    alerts: [
      {
        alert_id: "PLAN-001",
        owner: "Planning",
        scope: "WAREHOUSE",
        entity: "Central WH",
        gmv_loss: 480000,
        rank: 1,
        priority: "P0",
        affected_sku_count: 65,
        affected_skus: [
          { sku_id: "SKU-TU-750", sku_name: "Thums Up 750ml", chronic_days: 16 },
          { sku_id: "SKU-RL-1L", sku_name: "Real Mixed Fruit 1L", chronic_days: 15 },
          { sku_id: "SKU-RB-250", sku_name: "Red Bull 250ml", chronic_days: 14 },
          { sku_id: "SKU-KN-1L", sku_name: "Kinley Water 1L", chronic_days: 13 }
        ],
        chronic_days_avg: 16,
        l1_reason_distribution: {
          "Forecast Error": 0.75,
          "Movement Setting Design Issue": 0.25
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Systematic underforecasting in beverages due to unseasonally warm weather. TFT model not capturing weather signals.",
        key_signals: ["wMAPE: 28% (target 15%)", "Chronic Days: 16", "SKUs Affected: 65 (55%)"],
        actions: [
          { action_id: "PLAN-001-A1", text: "Retrain TFT model with weather features", gmv_at_risk: 300000, owner: "Planning", status: "pending" },
          { action_id: "PLAN-001-A2", text: "Manual uplift 15% for beverages (2 weeks)", gmv_at_risk: 180000, owner: "Planning", status: "pending" }
        ],
        key_metric: { label: "wMAPE", value: 28, target: 15, unit: "%" },
        trend: [18, 20, 22, 24, 26, 27, 28],
        impact_scope: { count: 65, unit: "SKUs", percentage: 55 }
      },
      {
        alert_id: "PLAN-002",
        owner: "Planning",
        scope: "WAREHOUSE",
        entity: "Whitefield Hub",
        gmv_loss: 120000,
        rank: 2,
        priority: "P1",
        affected_sku_count: 1,
        affected_skus: [
          { sku_id: "SKU-TS-1K", sku_name: "Tata Salt 1kg", chronic_days: 22 }
        ],
        chronic_days_avg: 22,
        l1_reason_distribution: {
          "Movement Setting Design Issue": 0.80,
          "Movement_Blocking": 0.20
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Safety stock depleted. RR generation delayed due to incorrect movement class.",
        key_signals: ["DOH: 0.5 days (target 3)", "Chronic Days: 22", "PODs Affected: 18 (90%)"],
        actions: [
          { action_id: "PLAN-002-A1", text: "Correct movement class to A for Tata Salt", gmv_at_risk: 75000, owner: "Planning", status: "pending" },
          { action_id: "PLAN-002-A2", text: "Trigger emergency replenishment", gmv_at_risk: 45000, owner: "Planning", status: "pending" }
        ],
        key_metric: { label: "DOH", value: 0.5, target: 3, unit: "days" },
        trend: [2.5, 2, 1.5, 1, 0.8, 0.6, 0.5],
        impact_scope: { count: 18, unit: "pods", percentage: 90 }
      },
      {
        alert_id: "PLAN-003",
        owner: "Planning",
        scope: "WAREHOUSE",
        entity: "Electronic City Hub",
        gmv_loss: 95000,
        rank: 3,
        priority: "P1",
        affected_sku_count: 42,
        affected_skus: [
          { sku_id: "SKU-FR-1L", sku_name: "Fortune Rice Bran Oil 1L", chronic_days: 14 }
        ],
        chronic_days_avg: 14,
        l1_reason_distribution: {
          "Movement_Blocking": 1.00
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "RR generation rate dropped due to system sync issues. Multiple SKUs missing replenishment triggers.",
        key_signals: ["RR Rate: 72% (target 95%)", "Chronic Days: 14", "SKUs Affected: 42 (35%)"],
        actions: [
          { action_id: "PLAN-003-A1", text: "Debug RR generation pipeline", gmv_at_risk: 60000, owner: "Planning", status: "pending" },
          { action_id: "PLAN-003-A2", text: "Manual RR for top 20 SKUs", gmv_at_risk: 35000, owner: "Planning", status: "pending" }
        ],
        key_metric: { label: "RR Rate", value: 72, target: 95, unit: "%" },
        trend: [90, 88, 85, 80, 78, 75, 72],
        impact_scope: { count: 42, unit: "SKUs", percentage: 35 }
      },
      {
        alert_id: "PLAN-004",
        owner: "Planning",
        scope: "WAREHOUSE",
        entity: "Bommanahalli Hub",
        gmv_loss: 75000,
        rank: 4,
        priority: "P2",
        affected_sku_count: 28,
        affected_skus: [
          { sku_id: "SKU-DV-200", sku_name: "Dove Shampoo 200ml", chronic_days: 12 },
          { sku_id: "SKU-LX-100", sku_name: "Lux Beauty Bar 100g", chronic_days: 11 },
          { sku_id: "SKU-AX-150", sku_name: "Axe Deo 150ml", chronic_days: 10 }
        ],
        chronic_days_avg: 12,
        l1_reason_distribution: {
          "Forecast Error": 0.60,
          "Movement Setting Design Issue": 0.40
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Promotional uplift not captured in forecast. Baseline drifting upward.",
        key_signals: ["wMAPE: 22% (target 15%)", "Chronic Days: 12", "SKUs Affected: 28 (22%)"],
        actions: [
          { action_id: "PLAN-004-A1", text: "Incorporate promo calendar into forecast", gmv_at_risk: 50000, owner: "Planning", status: "pending" },
          { action_id: "PLAN-004-A2", text: "Recalibrate personal care baseline", gmv_at_risk: 25000, owner: "Planning", status: "pending" }
        ],
        key_metric: { label: "wMAPE", value: 22, target: 15, unit: "%" },
        trend: [16, 17, 18, 19, 20, 21, 22],
        impact_scope: { count: 28, unit: "SKUs", percentage: 22 }
      },
      {
        alert_id: "PLAN-005",
        owner: "Planning",
        scope: "WAREHOUSE",
        entity: "Yelahanka Hub",
        gmv_loss: 45000,
        rank: 5,
        priority: "P2",
        affected_sku_count: 1,
        affected_skus: [
          { sku_id: "SKU-MG-70", sku_name: "Maggi 2-min 70g", chronic_days: 18 }
        ],
        chronic_days_avg: 18,
        l1_reason_distribution: {
          "Forecast Error": 0.70,
          "Movement Setting Design Issue": 0.30
        },
        is_primary: true,
        shared_with: "Category Management",
        l3_narrative: "Overstocked due to demand drop post-promotion. Occupying shelf space needed for faster movers.",
        key_signals: ["DOH: 8 days (target 5)", "Chronic Days: 18", "Overstock: 60%"],
        actions: [
          { action_id: "PLAN-005-A1", text: "Reduce incoming quantity for Maggi", gmv_at_risk: 30000, owner: "Planning", status: "pending" },
          { action_id: "PLAN-005-A2", text: "Consider markdown to clear stock", gmv_at_risk: 15000, owner: "Category Management", status: "pending" }
        ],
        key_metric: { label: "DOH", value: 8, target: 5, unit: "days" },
        trend: [4, 5, 5.5, 6, 7, 7.5, 8],
        impact_scope: { count: 1, unit: "pod", percentage: 100 }
      }
    ]
  },

  // ==========================================================================
  // Warehouse Dashboard Data
  // ==========================================================================
  warehouse: {
    persona: {
      name: "Warehouse",
      icon: "🏢",
      level: "Warehouse",
      aggregateBy: ["warehouse"],
      description: "GRN, putaway, outbound fill, capacity"
    },
    kpis: {
      grnTat: {
        value: 48, target: 24, unit: "hrs", status: "critical", trend: +12,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [38, 40, 42, 44, 46, 47, 48] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [28, 32, 36, 40, 43, 46, 48] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [20, 25, 30, 35, 40, 44, 48] }
        }
      },
      outboundFill: {
        value: 88, target: 95, unit: "%", status: "warning", trend: -4,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [91, 90, 90, 89, 89, 88, 88] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [94, 93, 92, 91, 90, 89, 88] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [96, 95, 94, 92, 91, 89, 88] }
        }
      },
      capacityUtil: {
        value: 92, target: 85, unit: "%", status: "warning", trend: +5,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [89, 90, 90, 91, 91, 92, 92] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [86, 87, 88, 89, 90, 91, 92] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [80, 82, 84, 87, 89, 91, 92] }
        }
      },
      putawayPending: {
        value: 850, status: "critical", trend: +200,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [700, 730, 760, 790, 810, 830, 850] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [500, 580, 640, 700, 760, 810, 850] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [200, 320, 440, 560, 680, 780, 850] }
        }
      }
    },
    alerts: [
      {
        alert_id: "WH-001",
        owner: "Warehouse",
        scope: "WAREHOUSE",
        entity: "Whitefield Hub",
        gmv_loss: 350000,
        rank: 1,
        priority: "P0",
        affected_sku_count: 850,
        affected_skus: [
          { sku_id: "SKU-AA-5K", sku_name: "Aashirvaad Atta 5kg", chronic_days: 19 },
          { sku_id: "SKU-DT-1K", sku_name: "Daawat Basmati 1kg", chronic_days: 18 }
        ],
        chronic_days_avg: 19,
        l1_reason_distribution: {
          "WH Putaway Delay": 0.60,
          "Warehouse Missed Qty": 0.25,
          "WH Capacity (Movement Setting Reduced)": 0.15
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "GRN backlog of 850 SKUs. Processing capacity constrained. Need additional receiving docks.",
        key_signals: ["GRN TAT: 72 hrs (target 24)", "Chronic Days: 19", "SKUs Affected: 850 (45%)"],
        actions: [
          { action_id: "WH-001-A1", text: "Add temp staff for Whitefield GRN", gmv_at_risk: 220000, owner: "Warehouse", status: "pending" },
          { action_id: "WH-001-A2", text: "Extend receiving hours to 10pm", gmv_at_risk: 130000, owner: "Warehouse", status: "pending" }
        ],
        key_metric: { label: "GRN TAT", value: 72, target: 24, unit: "hrs" },
        trend: [30, 40, 48, 55, 62, 68, 72],
        impact_scope: { count: 850, unit: "SKUs", percentage: 45 }
      },
      {
        alert_id: "WH-002",
        owner: "Warehouse",
        scope: "WAREHOUSE",
        entity: "Bommanahalli Hub",
        gmv_loss: 180000,
        rank: 2,
        priority: "P1",
        affected_sku_count: 320,
        affected_skus: [
          { sku_id: "SKU-SN-1L", sku_name: "Sundrop Lite Oil 1L", chronic_days: 14 },
          { sku_id: "SKU-WK-500", sku_name: "Weikfield Cornflour 500g", chronic_days: 13 }
        ],
        chronic_days_avg: 14,
        l1_reason_distribution: {
          "Warehouse Missed Qty": 0.70,
          "WH Capacity (Movement Setting Reduced)": 0.30
        },
        is_primary: true,
        shared_with: "Category Management",
        l3_narrative: "Warehouse at 95% capacity. Unable to receive new inventory efficiently.",
        key_signals: ["Capacity: 95% (target 85%)", "Chronic Days: 14", "SKUs Affected: 320 (28%)"],
        actions: [
          { action_id: "WH-002-A1", text: "Expedite outbound to pods from Bommanahalli", gmv_at_risk: 110000, owner: "Warehouse", status: "pending" },
          { action_id: "WH-002-A2", text: "Identify slow movers for removal", gmv_at_risk: 70000, owner: "Category Management", status: "pending" }
        ],
        key_metric: { label: "Capacity", value: 95, target: 85, unit: "%" },
        trend: [86, 88, 90, 91, 93, 94, 95],
        impact_scope: { count: 320, unit: "SKUs", percentage: 28 }
      },
      {
        alert_id: "WH-003",
        owner: "Warehouse",
        scope: "WAREHOUSE",
        entity: "Central WH",
        gmv_loss: 120000,
        rank: 3,
        priority: "P1",
        affected_sku_count: 35,
        affected_skus: [
          { sku_id: "SKU-AM-TZ1L", sku_name: "Amul Taaza Milk 1L", chronic_days: 12 },
          { sku_id: "SKU-AM-MT400", sku_name: "Amul Masti Dahi 400g", chronic_days: 11 },
          { sku_id: "SKU-AM-PN200", sku_name: "Amul Paneer 200g", chronic_days: 10 },
          { sku_id: "SKU-AM-CH200", sku_name: "Amul Cheese Slices 200g", chronic_days: 10 }
        ],
        chronic_days_avg: 12,
        l1_reason_distribution: {
          "Warehouse Outbound Fillrate Impact": 0.55,
          "Stock Transfer Delay Issue": 0.45
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Cold storage capacity limited. FEFO compliance causing early expiry write-offs.",
        key_signals: ["Outbound Fill: 75% (target 95%)", "Chronic Days: 12", "SKUs Affected: 35 (40%)"],
        actions: [
          { action_id: "WH-003-A1", text: "Expand cold storage at Whitefield", gmv_at_risk: 75000, owner: "Warehouse", status: "pending" },
          { action_id: "WH-003-A2", text: "Improve FEFO compliance processes", gmv_at_risk: 45000, owner: "Warehouse", status: "pending" }
        ],
        key_metric: { label: "Outbound Fill", value: 75, target: 95, unit: "%" },
        trend: [90, 88, 85, 82, 78, 76, 75],
        impact_scope: { count: 35, unit: "SKUs", percentage: 40 }
      },
      {
        alert_id: "WH-004",
        owner: "Warehouse",
        scope: "WAREHOUSE",
        entity: "Yelahanka Hub",
        gmv_loss: 85000,
        rank: 4,
        priority: "P2",
        affected_sku_count: 180,
        affected_skus: [
          { sku_id: "SKU-RC-1K", sku_name: "India Gate Basmati Rice 1kg", chronic_days: 10 },
          { sku_id: "SKU-TT-250", sku_name: "Tata Tea Gold 250g", chronic_days: 9 }
        ],
        chronic_days_avg: 10,
        l1_reason_distribution: {
          "WH Putaway Delay": 0.65,
          "Warehouse Missed Qty": 0.35
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Putaway delays due to location assignment issues. WMS location accuracy at 85%.",
        key_signals: ["Putaway TAT: 8 hrs (target 4)", "Chronic Days: 10", "SKUs Affected: 180 (18%)"],
        actions: [
          { action_id: "WH-004-A1", text: "WMS location audit at Yelahanka", gmv_at_risk: 55000, owner: "Warehouse", status: "pending" },
          { action_id: "WH-004-A2", text: "Staff training on putaway process", gmv_at_risk: 30000, owner: "Warehouse", status: "pending" }
        ],
        key_metric: { label: "Putaway TAT", value: 8, target: 4, unit: "hrs" },
        trend: [4, 5, 5.5, 6, 6.5, 7.5, 8],
        impact_scope: { count: 180, unit: "SKUs", percentage: 18 }
      },
      {
        alert_id: "WH-005",
        owner: "Warehouse",
        scope: "WAREHOUSE",
        entity: "Electronic City Hub",
        gmv_loss: 65000,
        rank: 5,
        priority: "P2",
        affected_sku_count: 42,
        affected_skus: [
          { sku_id: "SKU-LY-100", sku_name: "Lay's Magic Masala 100g", chronic_days: 15 },
          { sku_id: "SKU-HL-200", sku_name: "Haldiram's Bhujia 200g", chronic_days: 14 },
          { sku_id: "SKU-PG-80", sku_name: "Parle-G 80g", chronic_days: 13 }
        ],
        chronic_days_avg: 15,
        l1_reason_distribution: {
          "Warehouse Outbound Fillrate Impact": 0.60,
          "Warehouse Missed Qty": 0.40
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Stock position issues. Multiple SKUs showing system vs physical mismatch.",
        key_signals: ["Outbound Fill: 82% (target 95%)", "Chronic Days: 15", "SKUs Affected: 42 (22%)"],
        actions: [
          { action_id: "WH-005-A1", text: "Cycle count for snacks at Bommanahalli", gmv_at_risk: 40000, owner: "Warehouse", status: "pending" },
          { action_id: "WH-005-A2", text: "Investigate stock discrepancies", gmv_at_risk: 25000, owner: "Warehouse", status: "pending" }
        ],
        key_metric: { label: "Outbound Fill", value: 82, target: 95, unit: "%" },
        trend: [92, 90, 88, 86, 84, 83, 82],
        impact_scope: { count: 42, unit: "SKUs", percentage: 22 }
      }
    ]
  },

  // ==========================================================================
  // ERP Team Dashboard Data
  // ==========================================================================
  erpTeam: {
    persona: {
      name: "ERP Team",
      icon: "⚙️",
      level: "City",
      aggregateBy: ["city"],
      description: "Enablement, vendor codes, contract sync, config"
    },
    kpis: {
      enablementRate: {
        value: 94, target: 99, unit: "%", status: "warning", trend: -2,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [96, 95, 95, 95, 94, 94, 94] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [97, 97, 96, 96, 95, 95, 94] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [98, 98, 97, 97, 96, 95, 94] }
        }
      },
      missingVendorCodes: {
        value: 12, threshold: 5, status: "critical", trend: +4,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [9, 10, 10, 11, 11, 12, 12] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [6, 7, 8, 9, 10, 11, 12] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [3, 4, 5, 7, 8, 10, 12] }
        }
      },
      contractSync: {
        value: 88, target: 95, unit: "%", status: "warning", trend: -3,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [91, 90, 90, 89, 89, 88, 88] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [93, 92, 91, 90, 90, 89, 88] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [96, 95, 94, 92, 91, 89, 88] }
        }
      },
      configErrors: {
        value: 8, status: "warning", trend: +2,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [6, 6, 7, 7, 8, 8, 8] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [5, 5, 6, 6, 7, 7, 8] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [3, 4, 4, 5, 6, 7, 8] }
        }
      }
    },
    alerts: [
      {
        alert_id: "ERP-001",
        owner: "ERP Team",
        scope: "CITY",
        entity: "Bangalore",
        gmv_loss: 120000,
        rank: 1,
        priority: "P1",
        affected_sku_count: 45,
        affected_skus: [
          { sku_id: "SKU-LD-ML500", sku_name: "Local Dairy Milk 500ml", chronic_days: 18 },
          { sku_id: "SKU-FF-VG200", sku_name: "Fresh Farms Veggies 200g", chronic_days: 17 },
          { sku_id: "SKU-RB-BR400", sku_name: "Regional Bakery Bread 400g", chronic_days: 16 }
        ],
        chronic_days_avg: 18,
        l1_reason_distribution: {
          "Vendor Code Not Available": 0.80,
          "ERP Disabled": 0.20
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "45 SKUs blocked. 12 vendors awaiting SAP vendor code creation. POs cannot be raised without codes.",
        key_signals: ["Missing Codes: 12 vendors (target 0)", "Chronic Days: 18", "SKUs Affected: 45"],
        actions: [
          { action_id: "ERP-001-A1", text: "Fast-track vendor code creation for 12 vendors", gmv_at_risk: 75000, owner: "ERP Team", status: "pending" },
          { action_id: "ERP-001-A2", text: "Escalate to ERP admin for expedited processing", gmv_at_risk: 45000, owner: "ERP Team", status: "pending" }
        ],
        key_metric: { label: "Missing Codes", value: 12, target: 0, unit: "vendors" },
        trend: [5, 6, 7, 8, 9, 10, 12],
        impact_scope: { count: 12, unit: "vendors", percentage: 15 }
      },
      {
        alert_id: "ERP-002",
        owner: "ERP Team",
        scope: "CITY",
        entity: "Bangalore",
        gmv_loss: 85000,
        rank: 2,
        priority: "P1",
        affected_sku_count: 32,
        affected_skus: [
          { sku_id: "SKU-DB-CH100", sku_name: "Dabur Chyawanprash 100g", chronic_days: 14 },
          { sku_id: "SKU-MR-PC200", sku_name: "Marico Parachute 200ml", chronic_days: 13 },
          { sku_id: "SKU-GD-GH100", sku_name: "Godrej Hair Color 100ml", chronic_days: 12 }
        ],
        chronic_days_avg: 14,
        l1_reason_distribution: {
          "Vinculum Error": 0.60,
          "Contract Not Available": 0.40
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "32 SKUs affected. Contract terms for 8 vendors not synced to procurement system. Causing pricing and MOQ discrepancies.",
        key_signals: ["Sync Rate: 88% (target 95%)", "Chronic Days: 14", "SKUs Affected: 32"],
        actions: [
          { action_id: "ERP-002-A1", text: "Debug contract sync pipeline", gmv_at_risk: 55000, owner: "ERP Team", status: "pending" },
          { action_id: "ERP-002-A2", text: "Manual contract update for 8 vendors", gmv_at_risk: 30000, owner: "ERP Team", status: "pending" }
        ],
        key_metric: { label: "Sync Rate", value: 88, target: 95, unit: "%" },
        trend: [95, 94, 92, 91, 90, 89, 88],
        impact_scope: { count: 8, unit: "contracts", percentage: 12 }
      },
      {
        alert_id: "ERP-003",
        owner: "ERP Team",
        scope: "CITY",
        entity: "Bangalore",
        gmv_loss: 65000,
        rank: 3,
        priority: "P2",
        affected_sku_count: 45,
        affected_skus: [
          { sku_id: "SKU-HL-NW100", sku_name: "Haldiram Namkeen (New) 100g", chronic_days: 12 },
          { sku_id: "SKU-MT-RG200", sku_name: "MTR Masala (Regional) 200g", chronic_days: 11 },
          { sku_id: "SKU-CP-SS500", sku_name: "Cadbury (Seasonal) 500g", chronic_days: 10 }
        ],
        chronic_days_avg: 12,
        l1_reason_distribution: {
          "ERP Disabled": 0.70,
          "Temp Disable": 0.30
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "45 SKUs pending enablement in ERP system. Includes new launches, regional variants, and seasonal items. Bottleneck in master data team.",
        key_signals: ["Pending Enable: 45 SKUs (target 10)", "Chronic Days: 12", "SKUs Affected: 45"],
        actions: [
          { action_id: "ERP-003-A1", text: "Clear SKU enablement backlog (45 items)", gmv_at_risk: 40000, owner: "ERP Team", status: "pending" },
          { action_id: "ERP-003-A2", text: "Add temp resource to master data team", gmv_at_risk: 25000, owner: "ERP Team", status: "pending" }
        ],
        key_metric: { label: "Pending Enable", value: 45, target: 10, unit: "SKUs" },
        trend: [20, 25, 30, 35, 38, 42, 45],
        impact_scope: { count: 45, unit: "SKUs", percentage: 8 }
      },
      {
        alert_id: "ERP-004",
        owner: "ERP Team",
        scope: "CITY",
        entity: "Bangalore",
        gmv_loss: 45000,
        rank: 4,
        priority: "P2",
        affected_sku_count: 85,
        affected_skus: [
          { sku_id: "SKU-HM-PN250", sku_name: "Haldiram's Peanuts 250g", chronic_days: 16 },
          { sku_id: "SKU-LY-IN100", sku_name: "Lay's India's Magic Masala 100g", chronic_days: 15 },
          { sku_id: "SKU-BR-5050-200", sku_name: "Britannia 50-50 200g", chronic_days: 14 }
        ],
        chronic_days_avg: 16,
        l1_reason_distribution: {
          "ERP Disabled": 1.00
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "85 SKUs affected. 8 pods have incorrect tier configuration causing wrong assortment assignment.",
        key_signals: ["Config Errors: 8 pods (target 0)", "Chronic Days: 16", "SKUs Affected: 85"],
        actions: [
          { action_id: "ERP-004-A1", text: "Correct tier mapping for 8 pods", gmv_at_risk: 28000, owner: "ERP Team", status: "pending" },
          { action_id: "ERP-004-A2", text: "Audit all pod configurations", gmv_at_risk: 17000, owner: "ERP Team", status: "pending" }
        ],
        key_metric: { label: "Config Errors", value: 8, target: 0, unit: "errors" },
        trend: [3, 4, 5, 6, 6, 7, 8],
        impact_scope: { count: 8, unit: "pods", percentage: 10 }
      }
    ]
  },

  // ==========================================================================
  // Product Support Dashboard Data
  // ==========================================================================
  productSupport: {
    persona: {
      name: "Product Support",
      icon: "🔧",
      level: "SKU",
      aggregateBy: ["sku_id"],
      description: "OOS overrides, stale rules, holiday config, CR rules"
    },
    kpis: {
      oosOverrides: {
        value: 23, threshold: 10, unit: "active", status: "warning", trend: +5,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [19, 20, 21, 21, 22, 22, 23] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [15, 16, 18, 19, 20, 22, 23] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [10, 12, 14, 16, 18, 21, 23] }
        }
      },
      staleRules: {
        value: 15, threshold: 5, status: "critical", trend: +8,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [10, 11, 12, 13, 14, 14, 15] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [7, 8, 10, 11, 12, 14, 15] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [3, 5, 7, 9, 11, 13, 15] }
        }
      },
      holidayMisconfig: {
        value: 3, threshold: 0, status: "warning", trend: +1,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [2, 2, 3, 3, 3, 3, 3] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [1, 1, 2, 2, 2, 3, 3] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [0, 0, 1, 1, 2, 2, 3] }
        }
      },
      crRuleErrors: {
        value: 4, threshold: 2, status: "warning", trend: +2,
        trendHistory: {
          '7d': { labels: ['Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18'], data: [2, 3, 3, 3, 4, 4, 4] },
          '30d': { labels: ['Dec 19', 'Dec 24', 'Dec 29', 'Jan 3', 'Jan 8', 'Jan 13', 'Jan 18'], data: [1, 2, 2, 3, 3, 3, 4] },
          '180d': { labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'], data: [0, 1, 1, 2, 2, 3, 4] }
        }
      }
    },
    alerts: [
      {
        alert_id: "PS-001",
        owner: "Product Support",
        scope: "CONFIG",
        entity: "Stale Override Rules",
        gmv_loss: 85000,
        rank: 1,
        priority: "P1",
        affected_sku_count: 15,
        affected_skus: [
          { sku_id: "SKU-CC-500", sku_name: "Coca-Cola 500ml", chronic_days: 22 },
          { sku_id: "SKU-PG-100", sku_name: "Parle-G 100g", chronic_days: 20 },
          { sku_id: "SKU-AM-500", sku_name: "Amul Milk 500ml", chronic_days: 18 }
        ],
        chronic_days_avg: 22,
        l1_reason_distribution: {
          "POD Inactive": 1.00
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "15 override rules active beyond intended period. Affecting SKUs with promo, manual block, and test configs.",
        key_signals: ["Stale Rules: 15 (target 0)", "Chronic Days: 22", "SKUs Affected: 15"],
        actions: [
          { action_id: "PS-001-A1", text: "Audit and cleanup 15 stale rules", gmv_at_risk: 55000, owner: "Product Support", status: "pending" },
          { action_id: "PS-001-A2", text: "Set mandatory expiry on all new rules", gmv_at_risk: 30000, owner: "Product Support", status: "pending" }
        ],
        key_metric: { label: "Stale Rules", value: 15, target: 0, unit: "rules" },
        trend: [5, 7, 8, 10, 12, 14, 15],
        impact_scope: { count: 15, unit: "SKUs", percentage: 35 }
      },
      {
        alert_id: "PS-002",
        owner: "Product Support",
        scope: "CONFIG",
        entity: "Holiday Calendar Config",
        gmv_loss: 45000,
        rank: 2,
        priority: "P1",
        affected_sku_count: 120,
        affected_skus: [
          { sku_id: "SKU-DM-500", sku_name: "Dairy Milk 500g", chronic_days: 8 },
          { sku_id: "SKU-MG-200", sku_name: "Maggi 200g", chronic_days: 7 },
          { sku_id: "SKU-TB-100", sku_name: "Tata Tea 100g", chronic_days: 6 }
        ],
        chronic_days_avg: 8,
        l1_reason_distribution: {
          "POD Inactive": 0.70,
          "POD Closure": 0.30
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "Holiday calendar not updated for Jan. 120 SKUs affected during Republic Day, Makara Sankranti, Pongal periods.",
        key_signals: ["Holidays Missing: 3 (target 0)", "Chronic Days: 8", "SKUs Affected: 120"],
        actions: [
          { action_id: "PS-002-A1", text: "Update holiday calendar for Jan-Feb", gmv_at_risk: 30000, owner: "Product Support", status: "pending" },
          { action_id: "PS-002-A2", text: "Add regional holidays to system", gmv_at_risk: 15000, owner: "Product Support", status: "pending" }
        ],
        key_metric: { label: "Holidays Missing", value: 3, target: 0, unit: "days" },
        trend: [0, 0, 1, 1, 2, 2, 3],
        impact_scope: { count: 120, unit: "SKUs", percentage: 2 }
      },
      {
        alert_id: "PS-003",
        owner: "Product Support",
        scope: "CONFIG",
        entity: "OOS Override Accumulation",
        gmv_loss: 35000,
        rank: 3,
        priority: "P2",
        affected_sku_count: 23,
        affected_skus: [
          { sku_id: "SKU-LY-150", sku_name: "Lay's Classic 150g", chronic_days: 18 },
          { sku_id: "SKU-KK-50", sku_name: "KitKat 50g", chronic_days: 16 },
          { sku_id: "SKU-OR-120", sku_name: "Oreo 120g", chronic_days: 15 }
        ],
        chronic_days_avg: 18,
        l1_reason_distribution: {
          "POD Inactive": 0.80,
          "Temp Disable": 0.20
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "23 SKUs have active OOS overrides. Many are one-time fixes that were never removed after issue resolution.",
        key_signals: ["Active Overrides: 23 (target 10)", "Chronic Days: 18", "SKUs Affected: 23"],
        actions: [
          { action_id: "PS-003-A1", text: "Cleanup 13 stale OOS overrides", gmv_at_risk: 22000, owner: "Product Support", status: "pending" },
          { action_id: "PS-003-A2", text: "Add auto-expiry to override system", gmv_at_risk: 13000, owner: "Product Support", status: "pending" }
        ],
        key_metric: { label: "Active Overrides", value: 23, target: 10, unit: "SKUs" },
        trend: [12, 14, 16, 18, 20, 22, 23],
        impact_scope: { count: 23, unit: "SKUs", percentage: 0.4 }
      },
      {
        alert_id: "PS-004",
        owner: "Product Support",
        scope: "CONFIG",
        entity: "CR Rule Conflicts",
        gmv_loss: 25000,
        rank: 4,
        priority: "P2",
        affected_sku_count: 45,
        affected_skus: [
          { sku_id: "SKU-NS-500", sku_name: "Nestle Milk 500ml", chronic_days: 14 },
          { sku_id: "SKU-BR-400", sku_name: "Britannia Bread 400g", chronic_days: 13 },
          { sku_id: "SKU-HZ-200", sku_name: "Heinz Ketchup 200g", chronic_days: 12 }
        ],
        chronic_days_avg: 14,
        l1_reason_distribution: {
          "Movement_Blocking": 1.00
        },
        is_primary: true,
        shared_with: null,
        l3_narrative: "4 CR rules with conflicting MOQ/max qty settings. Affecting 45 SKUs with unpredictable replenishment behavior.",
        key_signals: ["Rule Conflicts: 4 (target 0)", "Chronic Days: 14", "SKUs Affected: 45"],
        actions: [
          { action_id: "PS-004-A1", text: "Resolve 4 CR rule conflicts", gmv_at_risk: 16000, owner: "Product Support", status: "pending" },
          { action_id: "PS-004-A2", text: "Define rule priority hierarchy", gmv_at_risk: 9000, owner: "Product Support", status: "pending" }
        ],
        key_metric: { label: "Rule Conflicts", value: 4, target: 0, unit: "rules" },
        trend: [1, 1, 2, 2, 3, 3, 4],
        impact_scope: { count: 45, unit: "SKUs", percentage: 0.75 }
      }
    ]
  }
};

// ==========================================================================
// Reason Codes Mapping (from IM Availability RCA Reasons Mapping.csv)
// ==========================================================================

/**
 * Maps reason codes to their bins, CSV owners, and display owners
 * Format: { code: { bin, csvOwner, displayOwner, description } }
 */
export const reasonCodes = {
  // OOS codes (warehouse out of stock)
  'oos_0': { bin: 'POD Inactive', csvOwner: 'Business', displayOwner: 'Product Support', description: 'POD is inactive' },
  'oos_2': { bin: 'ERP Disabled', csvOwner: 'Catalog', displayOwner: 'ERP Team', description: 'Item not in ERP' },
  'oos_3': { bin: 'Temp Disable', csvOwner: 'Catalog', displayOwner: 'ERP Team', description: 'Item temporarily disabled' },
  'oos_5': { bin: 'Fresh', csvOwner: 'NA', displayOwner: null, description: 'Fresh items' },
  'oos_6': { bin: 'Movement_Blocking', csvOwner: 'Planning', displayOwner: 'Planning', description: 'RR not generated' },
  'oos_7': { bin: 'Movement_Blocking', csvOwner: 'Planning', displayOwner: 'Planning', description: 'RR blocked (0.001)' },
  'oos_8': { bin: 'Long Term Supply issue', csvOwner: 'Cat M', displayOwner: 'Category Management', description: 'Vendor supply problem' },
  'oos_9': { bin: 'Fill Rate issue', csvOwner: 'Procurement', displayOwner: 'Procurement', description: 'Vendor fill rate <80%' },
  'oos_9a': { bin: 'Last PO Fill Rate issue', csvOwner: 'Procurement', displayOwner: 'Procurement', description: 'Last PO <50% filled' },
  'oos_9b': { bin: 'OTIF', csvOwner: 'Procurement', displayOwner: 'Procurement', description: 'Late delivery' },
  'oos_9c': { bin: 'Vendor Code Not Available', csvOwner: 'Catalog', displayOwner: 'ERP Team', description: 'Missing vendor code' },
  'oos_9d': { bin: 'Contract Not Available', csvOwner: 'Cat M', displayOwner: 'Category Management', description: 'Missing contract' },
  'oos_9e': { bin: 'OTB Block', csvOwner: 'Cat M', displayOwner: 'Category Management', description: 'Budget constraint' },
  'oos_9f': { bin: 'Vinculum Error', csvOwner: 'Catalog', displayOwner: 'ERP Team', description: 'System error' },
  'oos_9g': { bin: 'MOV/MOQ/Tonnage Constraint', csvOwner: 'Procurement', displayOwner: 'Procurement', description: 'Order constraint' },
  'oos_9h': { bin: 'Case Size Constraint', csvOwner: 'Cat M', displayOwner: 'Category Management', description: 'Min case not met' },
  'oos_10': { bin: 'Ordering / OTIF / Contract issue', csvOwner: 'Planning', displayOwner: 'Planning', description: 'Catch-all ordering' },

  // Instock codes (warehouse has stock, pod doesn't)
  'instock_0': { bin: 'POD Inactive', csvOwner: 'Business', displayOwner: 'Product Support', description: 'POD is inactive' },
  'instock_1': { bin: 'ERP Disabled', csvOwner: 'Catalog', displayOwner: 'ERP Team', description: 'Item not in ERP at POD' },
  'instock_2': { bin: 'POD Closure', csvOwner: 'Pod Ops', displayOwner: 'Pod Ops', description: 'Movement blocked for POD' },
  'instock_6': { bin: 'Movement_Blocking', csvOwner: 'Planning', displayOwner: 'Planning', description: 'RR not generated' },
  'instock_7': { bin: 'Movement_Blocking', csvOwner: 'Planning', displayOwner: 'Planning', description: 'RR blocked' },
  'instock_8': { bin: 'Pod Missed Qty', csvOwner: 'Pod Ops', displayOwner: 'Pod Ops', description: 'POD capacity full' },
  'instock_9': { bin: 'Warehouse Missed Qty', csvOwner: 'Warehouse', displayOwner: 'Warehouse', description: 'WH capacity exceeded' },
  'instock_10': { bin: 'WH Capacity (Movement Setting Reduced)', csvOwner: 'Warehouse', displayOwner: 'Warehouse', description: 'Movement reduced' },
  'instock_11': { bin: 'Pod_Space Issue_freezer', csvOwner: 'Pod Ops', displayOwner: 'Pod Ops', description: 'Cold storage full' },
  'instock_12': { bin: 'Warehouse Outbound Fillrate Impact', csvOwner: 'Warehouse', displayOwner: 'Warehouse', description: 'WH fill rate <80%' },
  'instock_12a': { bin: 'Stock Transfer Delay Issue', csvOwner: 'Warehouse', displayOwner: 'Warehouse', description: 'WH-to-POD delay' },
  'instock_13': { bin: 'Forecast Error', csvOwner: 'Planning', displayOwner: 'Planning', description: 'Sales >3x forecast' },
  'instock_14': { bin: 'Pod Inward Delay Impact', csvOwner: 'Pod Ops', displayOwner: 'Pod Ops', description: 'GRN delay at POD' },
  'instock_15': { bin: 'WH Putaway Delay', csvOwner: 'Warehouse', displayOwner: 'Warehouse', description: 'Stock in staging' },
  'instock_16': { bin: 'Movement Setting Design Issue', csvOwner: 'Planning', displayOwner: 'Planning', description: 'Conservative movement' },
  'instock_17': { bin: 'Unallocated Bin', csvOwner: 'NA', displayOwner: null, description: 'Unexplained' },
  'instock_18': { bin: 'Warehouse Outbound Fillrate Impact', csvOwner: 'Warehouse', displayOwner: 'Warehouse', description: 'QPL dropped qty' }
};

/**
 * Owner mapping: CSV ai_owner → Display name
 */
export const ownerMapping = {
  'Cat M': 'Category Management',
  'Procurement': 'Procurement',
  'Pod Ops': 'Pod Ops',
  'Planning': 'Planning',
  'Warehouse': 'Warehouse',
  'Catalog': 'ERP Team',
  'Business': 'Product Support',
  'NA': null  // Excluded from owner attribution
};

/**
 * Reverse mapping: Display name → CSV ai_owner
 */
export const reverseOwnerMapping = {
  'Category Management': 'Cat M',
  'Procurement': 'Procurement',
  'Pod Ops': 'Pod Ops',
  'Planning': 'Planning',
  'Warehouse': 'Warehouse',
  'ERP Team': 'Catalog',
  'Product Support': 'Business'
};

/**
 * Get reason code details by code
 */
export function getReasonCodeDetails(code) {
  return reasonCodes[code] || null;
}

/**
 * Get display owner from CSV owner
 */
export function getDisplayOwner(csvOwner) {
  return ownerMapping[csvOwner] || csvOwner;
}

// ==========================================================================
// Helper Functions
// ==========================================================================

/**
 * Format GMV value to human readable string (₹X.XL or ₹X.XK)
 */
export function formatGmv(value) {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value}`;
}

/**
 * Get status class based on status string
 */
export function getStatusClass(status) {
  const statusMap = {
    'critical': 'badge--critical',
    'warning': 'badge--warning',
    'good': 'badge--success',
    'neutral': 'badge--neutral'
  };
  return statusMap[status] || 'badge--neutral';
}

/**
 * Get priority class based on priority string
 */
export function getPriorityClass(priority) {
  const priorityMap = {
    'P0': 'alert-card--p0',
    'P1': 'alert-card--p1',
    'P2': 'alert-card--p2'
  };
  return priorityMap[priority] || 'alert-card--p2';
}

/**
 * Generate realistic trend history data for KPIs
 * @param {number} currentValue - Current KPI value
 * @param {string} status - 'critical', 'warning', or 'good'
 * @param {boolean} invertTrend - If true, higher was worse (e.g., for errors count)
 * @returns {Object} Trend history with 7d, 30d, 180d data
 */
export function generateTrendHistory(currentValue, status, invertTrend = false) {
  const today = new Date('2026-01-18');

  // Generate 7-day labels and data
  const labels7d = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    labels7d.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  // Generate 30-day labels (7 points)
  const labels30d = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 5);
    labels30d.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  // Generate 180-day labels (monthly)
  const labels180d = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

  // Generate data based on status
  let data7d, data30d, data180d;
  const variation = currentValue * 0.05; // 5% variation

  if (status === 'critical') {
    // Declining trend - was better before
    data7d = generateDecline(currentValue, 7, variation * 0.5);
    data30d = generateDecline(currentValue, 7, variation * 1.5);
    data180d = generateDecline(currentValue, 7, variation * 3);
  } else if (status === 'warning') {
    // Slight decline or flat
    data7d = generateSlightDecline(currentValue, 7, variation * 0.3);
    data30d = generateSlightDecline(currentValue, 7, variation);
    data180d = generateSlightDecline(currentValue, 7, variation * 2);
  } else {
    // Good - improving or stable
    data7d = generateImproving(currentValue, 7, variation * 0.3);
    data30d = generateImproving(currentValue, 7, variation);
    data180d = generateImproving(currentValue, 7, variation * 2);
  }

  // If invertTrend, flip the data direction
  if (invertTrend) {
    data7d = data7d.reverse();
    data30d = data30d.reverse();
    data180d = data180d.reverse();
  }

  return {
    '7d': { labels: labels7d, data: data7d },
    '30d': { labels: labels30d, data: data30d },
    '180d': { labels: labels180d, data: data180d }
  };
}

function generateDecline(endValue, points, totalDrop) {
  const result = [];
  const startValue = endValue + totalDrop;
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const value = startValue - (totalDrop * progress) + (Math.random() - 0.5) * (totalDrop * 0.1);
    result.push(Math.round(value * 10) / 10);
  }
  result[points - 1] = endValue; // Ensure last value is exact
  return result;
}

function generateSlightDecline(endValue, points, totalDrop) {
  const result = [];
  const startValue = endValue + totalDrop * 0.5;
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const value = startValue - (totalDrop * 0.5 * progress) + (Math.random() - 0.5) * (totalDrop * 0.2);
    result.push(Math.round(value * 10) / 10);
  }
  result[points - 1] = endValue;
  return result;
}

function generateImproving(endValue, points, totalGain) {
  const result = [];
  const startValue = endValue - totalGain;
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const value = startValue + (totalGain * progress) + (Math.random() - 0.5) * (totalGain * 0.1);
    result.push(Math.round(value * 10) / 10);
  }
  result[points - 1] = endValue;
  return result;
}

/**
 * Format trend value with arrow
 */
export function formatTrend(value, invertColors = false) {
  if (value === 0) {
    return { text: '→ 0', class: 'kpi-card__trend--neutral' };
  }

  const isPositive = value > 0;
  const arrow = isPositive ? '↑' : '↓';
  const text = `${arrow} ${Math.abs(value)}`;

  // For some metrics, up is bad (e.g., chronic SKUs)
  // For others, up is good (e.g., resolution rate)
  let trendClass;
  if (invertColors) {
    trendClass = isPositive ? 'kpi-card__trend--down' : 'kpi-card__trend--up';
  } else {
    trendClass = isPositive ? 'kpi-card__trend--up' : 'kpi-card__trend--down';
  }

  return { text, class: trendClass };
}

/**
 * Get persona data by key
 */
export function getPersonaData(key) {
  const personaMap = {
    'category': mockData.categoryManagement,
    'procurement': mockData.procurement,
    'pod-ops': mockData.podOps,
    'planning': mockData.planning,
    'warehouse': mockData.warehouse,
    'erp-team': mockData.erpTeam,
    'product-support': mockData.productSupport
  };
  return personaMap[key];
}

/**
 * Get all persona keys
 */
export function getPersonaKeys() {
  return ['category', 'procurement', 'pod-ops', 'planning', 'warehouse', 'erp-team', 'product-support'];
}

/**
 * Extract top actionables from alerts
 * Collects all actions from alerts, sorts by GMV, returns top N
 * @param {Array} alerts - Array of alert objects
 * @param {number} limit - Maximum number of actionables to return
 * @returns {Array} Sorted actionables array in actionable item format
 */
export function getTopActionablesFromAlerts(alerts, limit = 5) {
  const allActions = [];

  alerts.forEach(alert => {
    if (alert.actions && Array.isArray(alert.actions)) {
      alert.actions.forEach((action, idx) => {
        // Support both new schema and legacy formats
        if (typeof action === 'object') {
          allActions.push({
            id: action.action_id || action.id || `${alert.alert_id || alert.id}-A${idx}`,
            action: action.text,
            gmv: action.gmv_at_risk || action.gmv || 0,
            owner: action.owner || '',
            completed: action.status === 'completed' || action.completed || false,
            status: action.status || (action.completed ? 'completed' : 'pending'),
            alertId: alert.alert_id || alert.id,
            priority: alert.priority
          });
        } else {
          // Legacy string format - use alert GMV split evenly
          allActions.push({
            id: `${alert.alert_id || alert.id}-A${idx}`,
            action: action,
            gmv: Math.round((alert.gmv_loss || alert.gmv) / (alert.actions?.length || 1)),
            owner: '',
            completed: false,
            status: 'pending',
            alertId: alert.alert_id || alert.id,
            priority: alert.priority
          });
        }
      });
    }
  });

  // Sort by GMV descending, then return top N
  return allActions
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, limit);
}
