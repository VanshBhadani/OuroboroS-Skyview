/**
 * DISASTERLENS — Multimodal Disaster Intelligence Panel
 * Spatial Glassmorphism UI for Decision Support
 * 
 * Complies with:
 *  - Frosted glass & translucent spatial layout
 *  - Low visual noise & large whitespace
 *  - Clear information hierarchy (Risk -> Zones -> Timeline -> Review -> Modalities)
 *  - Modality Cards & Horizontal Meters
 *  - Human Review Queue (triage, explainability)
 *  - Floating Bottom Timeline Pill
 */

import { EVALUATION_RESULTS } from './evaluation/results.js';

export function createDisasterIntelPanel({ onSelectZone, onFlyToZone, onSnapshotChange }) {
  let root = null;
  let bottomTimeline = null;
  let currentZones = [];
  let selectedZone = null;
  let activeFilter = 'ALL'; // ALL | REVIEW | CRITICAL | HIGH | MEDIUM | LOW
  let activeSnapshotId = 'T4';
  const acknowledgedReviews = new Set();

  const SNAPSHOT_LABELS = {
    T0: { code: 'T0', title: 'BASE', time: '02:00 UTC', full: 'T0 · BASELINE PRE-EVENT' },
    T1: { code: 'T1', title: 'RAIN', time: '03:30 UTC', full: 'T1 · INTENSE PRECIPITATION' },
    T2: { code: 'T2', title: 'BREACH', time: '04:15 UTC', full: 'T2 · GLACIAL DAM BREACH' },
    T3: { code: 'T3', title: 'SURGE', time: '05:00 UTC', full: 'T3 · FLOODWAVE SURGE' },
    T4: { code: 'T4', title: 'PEAK', time: '06:00 UTC', full: 'T4 · PEAK IMPACT CORRIDOR' },
  };

  function ensureMounted() {
    if (root && document.body.contains(root)) return;

    // 1. Right Floating Intelligence Panel
    root = document.createElement('aside');
    root.id = 'disaster-intel-panel';
    root.className = 'disaster-intel-panel dl-glass-panel';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Disaster Intelligence Overview');
    root.style.display = 'none';

    root.innerHTML = `
      <div class="dl-panel-header">
        <div class="dl-header-titles">
          <div class="dl-section-kicker">DISASTER OVERVIEW</div>
          <h2 class="dl-panel-main-title">Multimodal Assessment</h2>
        </div>
        <div class="dl-header-controls">
          <span class="dl-live-badge">● LIVE TELEMETRY</span>
          <button type="button" class="disaster-panel-close-btn dl-icon-btn" title="Close Panel" aria-label="Close panel">✕</button>
        </div>
      </div>

      <!-- Human Decision Support Advisory -->
      <div class="dl-advisory-banner">
        <span class="dl-advisory-icon">⚠️</span>
        <div class="dl-advisory-text">
          <strong>Decision-support prototype.</strong> Probabilistic fusion models require human confirmation before action. Not for autonomous life-critical deployment.
        </div>
      </div>

      <!-- Top Metric Cards Summary -->
      <div class="dl-metrics-summary" id="disaster-overview-card">
        <div class="dl-metric-card-hero">
          <div class="dl-hero-number" id="overview-total-zones">06</div>
          <div class="dl-hero-copy">
            <span class="dl-hero-title">AFFECTED ZONES</span>
            <span class="dl-hero-sub">Bhote Koshi River Reach</span>
          </div>
        </div>

        <div class="dl-summary-pills-grid">
          <div class="dl-stat-pill critical">
            <span class="dl-stat-num" id="bp-critical">01</span>
            <span class="dl-stat-label">CRITICAL</span>
          </div>
          <div class="dl-stat-pill review highlight">
            <span class="dl-stat-num" id="overview-review-count">03</span>
            <span class="dl-stat-label">REVIEW</span>
          </div>
          <div class="dl-stat-pill high">
            <span class="dl-stat-num" id="bp-high">02</span>
            <span class="dl-stat-label">HIGH</span>
          </div>
          <div class="dl-stat-pill moderate">
            <span class="dl-stat-num" id="bp-medium">02</span>
            <span class="dl-stat-label">MODERATE</span>
          </div>
        </div>

        <!-- Hidden span for low count to preserve JS bindings -->
        <span id="bp-low" style="display: none;">0</span>

        <!-- Highest Priority Zone Callout Card -->
        <div class="dl-highest-priority-card" id="highest-risk-callout">
          <div class="dl-hp-header">
            <span class="dl-hp-badge">HIGHEST PRIORITY</span>
            <span class="dl-hp-trend" id="hr-trend">↗ RISING</span>
          </div>
          <div class="dl-hp-name" id="hr-name">Debris-Dammed Lake Outburst Reach</div>
          <div class="dl-hp-metrics-grid">
            <div class="dl-hp-metric">
              <span class="dl-hp-label">RISK</span>
              <strong class="dl-hp-val critical" id="hr-risk">95%</strong>
            </div>
            <div class="dl-hp-metric">
              <span class="dl-hp-label">CONFIDENCE</span>
              <strong class="dl-hp-val" id="hr-conf">84%</strong>
            </div>
            <div class="dl-hp-metric">
              <span class="dl-hp-label">UNCERTAINTY</span>
              <strong class="dl-hp-val" id="hr-uncert">±16%</strong>
            </div>
            <div class="dl-hp-metric">
              <span class="dl-hp-label">MOBILITY</span>
              <strong class="dl-hp-val" id="hr-mobility">HIGH</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Compact Model Evaluation Card (Phase 13 & 14) -->
      <div class="dl-model-eval-card" id="dl-model-eval-card">
        <div class="dl-eval-header">
          <div class="dl-eval-badge-wrap">
            <span class="dl-eval-badge">HELD-OUT EVALUATION</span>
            <span class="dl-eval-n">N = 20 TEST SAMPLES</span>
          </div>
          <span class="dl-eval-dataset">Bhote Koshi Public Dataset (Vantor & DHM)</span>
        </div>

        <div class="dl-eval-scores-grid">
          <div class="dl-eval-score-item">
            <span class="dl-eval-label">SATELLITE ONLY</span>
            <div class="dl-eval-val-row">
              <strong class="dl-eval-f1" id="eval-sat-f1">71.4%</strong>
              <span class="dl-eval-metric-type">F1</span>
            </div>
            <span class="dl-eval-sub">Acc: <span id="eval-sat-acc">60.0%</span></span>
          </div>

          <div class="dl-eval-score-item">
            <span class="dl-eval-label">WEATHER ONLY</span>
            <div class="dl-eval-val-row">
              <strong class="dl-eval-f1" id="eval-hydro-f1">100.0%</strong>
              <span class="dl-eval-metric-type">F1</span>
            </div>
            <span class="dl-eval-sub">Acc: <span id="eval-hydro-acc">100.0%</span></span>
          </div>

          <div class="dl-eval-score-item highlight">
            <span class="dl-eval-label">MULTIMODAL FUSION</span>
            <div class="dl-eval-val-row">
              <strong class="dl-eval-f1 highlight" id="eval-multi-f1">100.0%</strong>
              <span class="dl-eval-metric-type">F1</span>
            </div>
            <span class="dl-eval-sub">Acc: <span id="eval-multi-acc">100.0%</span> · Calibrated</span>
          </div>
        </div>

        <div class="dl-eval-notice">
          Evaluation uses a strictly held-out test set (seed 42).
        </div>

        <details class="dl-eval-limitations-disclosure">
          <summary class="dl-eval-disclosure-btn">Dataset Limitations & Bias (5)</summary>
          <ul class="dl-limitations-list">
            <li><strong>Geographic Scope:</strong> Himalayan steep V-shaped gorge; physical dynamics differ in flat alluvial plains.</li>
            <li><strong>Temporal Gap:</strong> WorldView-2 baseline is from Oct 2021 (historical) rather than immediate pre-storm.</li>
            <li><strong>Optical Occlusion:</strong> High-altitude terrain introduces mountain shadows and cloud edge variance.</li>
            <li><strong>Observer Density:</strong> Witness anchors cluster near settlements; uninhabited headwaters lack eyewitnesses.</li>
            <li><em>Notice: This evaluation does not establish real-world emergency performance.</em></li>
          </ul>
        </details>
      </div>

      <!-- Human Review Queue Tabs & List -->
      <section class="dl-queue-section">
        <div class="dl-queue-header">
          <div>
            <h3 class="dl-queue-title">HUMAN REVIEW</h3>
            <p class="dl-queue-sub">Zones requiring attention</p>
          </div>
        </div>

        <div class="dl-filter-pills" role="tablist">
          <button type="button" class="dl-filter-pill active" data-filter="ALL">ALL (<span id="count-all">0</span>)</button>
          <button type="button" class="dl-filter-pill" data-filter="REVIEW">REVIEW (<span id="count-review">0</span>)</button>
          <button type="button" class="dl-filter-pill" data-filter="CRITICAL">CRIT (<span id="count-critical">0</span>)</button>
          <button type="button" class="dl-filter-pill" data-filter="HIGH">HIGH (<span id="count-high">0</span>)</button>
          <button type="button" class="dl-filter-pill" data-filter="MEDIUM">MOD (<span id="count-medium">0</span>)</button>
          <button type="button" class="dl-filter-pill" data-filter="LOW">LOW (<span id="count-low">0</span>)</button>
        </div>

        <!-- Zone List Cards -->
        <div class="dl-zone-cards-list" id="disaster-zone-list"></div>
      </section>

      <!-- Selected Zone Multimodal Evidence Inspection Card -->
      <section class="dl-evidence-inspection" id="disaster-inspection-card" style="display: none;">
        <div class="dl-inspection-header">
          <div class="dl-insp-meta">
            <span class="dl-zone-tag" id="card-zone-id">ZONE-NP-01</span>
            <h3 class="dl-insp-name" id="card-zone-name">Zone Name</h3>
            <span class="dl-insp-sector" id="card-zone-sector">Sector Description</span>
          </div>
          <div class="dl-insp-badges">
            <span class="dl-status-pill critical" id="card-priority-pill">CRITICAL</span>
            <span class="dl-trend-badge" id="card-trend-badge">↗ RISING</span>
          </div>
        </div>

        <!-- Metric Grid -->
        <div class="dl-evidence-metrics-grid">
          <div class="dl-ev-metric-box">
            <span class="dl-ev-label">FUSED RISK</span>
            <strong class="dl-ev-val highlight" id="card-fused-risk">0.0%</strong>
          </div>
          <div class="dl-ev-metric-box">
            <span class="dl-ev-label">CONFIDENCE</span>
            <strong class="dl-ev-val" id="card-confidence">0%</strong>
          </div>
          <div class="dl-ev-metric-box">
            <span class="dl-ev-label">UNCERTAINTY</span>
            <strong class="dl-ev-val warning" id="card-uncertainty">±0%</strong>
          </div>
          <div class="dl-ev-metric-box">
            <span class="dl-ev-label">MODAL AGREEMENT</span>
            <strong class="dl-ev-val" id="card-agreement">0%</strong>
          </div>
          <div class="dl-ev-metric-box">
            <span class="dl-ev-label">COMPLETENESS</span>
            <strong class="dl-ev-val" id="card-completeness">0%</strong>
          </div>
          <div class="dl-ev-metric-box">
            <span class="dl-ev-label">MOBILITY IMPACT</span>
            <strong class="dl-ev-val" id="card-mobility-impact">0%</strong>
          </div>
        </div>

        <!-- Uncertainty Explanatory Box -->
        <div class="dl-uncertainty-card">
          <div class="dl-uncert-header">
            <span class="dl-uncert-title">UNCERTAINTY PROFILE</span>
            <span class="dl-provenance-badge">SIMULATED SCENARIO</span>
          </div>
          <div class="dl-confidence-meter-wrap">
            <div class="dl-conf-meter-labels">
              <span>Confidence</span>
              <span>Uncertainty</span>
            </div>
            <div class="dl-conf-bar">
              <div class="dl-conf-fill" id="conf-meter-fill" style="width: 80%"></div>
            </div>
          </div>
          <p class="dl-uncert-desc" id="card-uncertainty-exp">
            Analytical uncertainty evaluated from sensor health, cross-modal agreement, and telemetry completeness.
          </p>
        </div>

        <!-- Modality Contribution Meters -->
        <div class="dl-contribution-card">
          <div class="dl-card-subtitle">MODALITY CONTRIBUTION</div>
          <div class="dl-meters-stack">
            <div class="dl-meter-item">
              <div class="dl-meter-info">
                <span class="dl-m-name">Satellite</span>
                <span class="dl-m-score" id="val-satellite">81%</span>
              </div>
              <div class="dl-meter-track">
                <div class="dl-meter-bar satellite" id="bar-satellite" style="width: 81%"></div>
              </div>
            </div>
            <div class="dl-meter-item">
              <div class="dl-meter-info">
                <span class="dl-m-name">Weather</span>
                <span class="dl-m-score" id="val-weather">83%</span>
              </div>
              <div class="dl-meter-track">
                <div class="dl-meter-bar weather" id="bar-weather" style="width: 83%"></div>
              </div>
            </div>
            <div class="dl-meter-item">
              <div class="dl-meter-info">
                <span class="dl-m-name">Sensor</span>
                <span class="dl-m-score" id="val-sensor">76%</span>
              </div>
              <div class="dl-meter-track">
                <div class="dl-meter-bar sensor" id="bar-sensor" style="width: 76%"></div>
              </div>
            </div>
            <div class="dl-meter-item">
              <div class="dl-meter-info">
                <span class="dl-m-name">Incident</span>
                <span class="dl-m-score" id="val-incident">70%</span>
              </div>
              <div class="dl-meter-track">
                <div class="dl-meter-bar incident" id="bar-incident" style="width: 70%"></div>
              </div>
            </div>
            <div class="dl-meter-item">
              <div class="dl-meter-info">
                <span class="dl-m-name">Mobility</span>
                <span class="dl-m-score" id="val-mobility">68%</span>
              </div>
              <div class="dl-meter-track">
                <div class="dl-meter-bar mobility" id="bar-mobility" style="width: 68%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5 Clean Modality Cards Grid -->
        <div class="dl-modal-evidence-card">
          <div class="dl-card-subtitle">MULTIMODAL EVIDENCE</div>
          <div class="dl-modality-cards-grid">
            <!-- Satellite -->
            <div class="dl-modality-box">
              <div class="dl-mb-header">
                <span class="dl-mb-icon">🛰️</span>
                <span class="dl-mb-type">SATELLITE</span>
                <span class="dl-mb-status" id="card-sat-status">AVAILABLE</span>
              </div>
              <div class="dl-mb-metric" id="det-sat-prob">81%</div>
              <div class="dl-mb-sub">Flood probability</div>
              <div class="dl-mb-source">Source: <span id="det-sat-source">Sentinel-2</span> · Change: <span id="det-sat-mag">42%</span></div>
              <span id="det-sat-change" style="display: none;"></span>
            </div>

            <!-- Weather -->
            <div class="dl-modality-box">
              <div class="dl-mb-header">
                <span class="dl-mb-icon">🌧️</span>
                <span class="dl-mb-type">WEATHER</span>
                <span class="dl-mb-status" id="card-weather-status">AVAILABLE</span>
              </div>
              <div class="dl-mb-metric" id="det-weather-rain">124 mm</div>
              <div class="dl-mb-sub">24h rainfall</div>
              <div class="dl-mb-source">Source: <span id="det-weather-source">AWS Gauge</span> · Trend: <span id="det-weather-trend">RISING</span></div>
              <span id="det-weather-intensity" style="display: none;"></span>
            </div>

            <!-- Sensor -->
            <div class="dl-modality-box">
              <div class="dl-mb-header">
                <span class="dl-mb-icon">🌊</span>
                <span class="dl-mb-type">SENSOR</span>
                <span class="dl-mb-status" id="card-sensor-status">ONLINE</span>
              </div>
              <div class="dl-mb-metric" id="det-sensor-level">8.4 m</div>
              <div class="dl-mb-sub">River stage level</div>
              <div class="dl-mb-source">Source: <span id="det-sensor-source">Hydro Gauge</span> · Breach: <span id="det-sensor-thresh">YES</span></div>
              <span id="det-sensor-trend" style="display: none;"></span>
            </div>

            <!-- Incident -->
            <div class="dl-modality-box">
              <div class="dl-mb-header">
                <span class="dl-mb-icon">📋</span>
                <span class="dl-mb-type">INCIDENTS</span>
                <span class="dl-mb-status" id="card-incident-status">AVAILABLE</span>
              </div>
              <div class="dl-mb-metric" id="det-inc-count">04</div>
              <div class="dl-mb-sub">Verified field reports</div>
              <div class="dl-mb-source">Severity: <span id="det-inc-sev">HIGH</span> · Logs: <span id="det-inc-source">Disaster Feeds</span></div>
              <div class="dl-inc-chips" id="det-inc-keywords"></div>
            </div>

            <!-- Mobility Impact -->
            <div class="dl-modality-box full-width">
              <div class="dl-mb-header">
                <span class="dl-mb-icon">🚦</span>
                <span class="dl-mb-type">MOBILITY IMPACT</span>
                <span class="dl-mb-status" id="card-mobility-status">AVAILABLE</span>
              </div>
              <div class="dl-mobility-breakdown-row">
                <div class="dl-mob-item">
                  <span class="dl-mob-label">Traffic</span>
                  <strong class="dl-mob-val" id="det-mob-traffic">82%</strong>
                </div>
                <div class="dl-mob-item">
                  <span class="dl-mob-label">Transit</span>
                  <strong class="dl-mob-val" id="det-mob-transit">55%</strong>
                </div>
                <div class="dl-mob-item">
                  <span class="dl-mob-label">Route Disruption</span>
                  <strong class="dl-mob-val" id="det-mob-route">74%</strong>
                </div>
                <div class="dl-mob-item">
                  <span class="dl-mob-label">Bikeshare</span>
                  <strong class="dl-mob-val" id="det-mob-bike">20%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Temporal Deltas Row -->
        <div class="dl-temporal-deltas-card" id="card-delta-row">
          <span class="dl-delta-title">TEMPORAL SHIFT:</span>
          <div class="dl-deltas-tags">
            <span class="dl-delta-pill" id="delta-river">River: +0.0m</span>
            <span class="dl-delta-pill" id="delta-rain">Rain: +0mm</span>
            <span class="dl-delta-pill" id="delta-sat">Sat: +0%</span>
            <span class="dl-delta-pill" id="delta-traffic">Traffic: +0%</span>
          </div>
        </div>

        <!-- Explainability: Why Prioritized -->
        <div class="dl-reasons-card" id="priority-reasons-box">
          <div class="dl-card-subtitle">WHY THIS ZONE IS PRIORITIZED</div>
          <ul class="dl-reasons-list" id="card-reasons-list"></ul>
        </div>

        <!-- Field Evidence List -->
        <div class="dl-field-evidence-card">
          <div class="dl-card-subtitle">TELEMETRY & WITNESS LOGS</div>
          <ul class="dl-evidence-list" id="card-evidence-list"></ul>
        </div>

        <!-- Data Provenance & Traceability Section (Phase 8 & 9) -->
        <div class="dl-provenance-section" id="card-provenance-section">
          <div class="dl-card-subtitle">EVIDENCE PROVENANCE & LINKING</div>
          <div class="dl-provenance-summary-box">
            <div class="dl-prov-row">
              <span class="dl-prov-label">EVIDENCE STATUS</span>
              <span class="dl-prov-badge public" id="prov-evidence-status">PUBLIC OPEN DATA</span>
            </div>
            <div class="dl-prov-row">
              <span class="dl-prov-label">PRIMARY DATASET</span>
              <span class="dl-prov-value" id="prov-dataset-name">Vantor Open Data & GeoPera Reconstruction</span>
            </div>
            <div class="dl-prov-row">
              <span class="dl-prov-label">PRIMARY LICENSE</span>
              <span class="dl-prov-value" id="prov-license">CC BY-NC 4.0 / ODbL 1.0</span>
            </div>
          </div>

          <details class="dl-prov-details-disclosure">
            <summary class="dl-prov-disclosure-btn">View Provenance Details & Traceability</summary>
            <div class="dl-prov-details-content">
              <div class="dl-prov-detail-item">
                <strong>Satellite Modality:</strong>
                <p>Vantor WorldView-2 (<a href="https://vantor-opendata.s3.amazonaws.com/events/Nepal-Flooding-Aug-2026/10300100C86CED00.tif" target="_blank" rel="noopener">10300100C86CED00</a>, 2021) & WorldView-3 (<a href="https://vantor-opendata.s3.amazonaws.com/events/Nepal-Flooding-Aug-2026/B040001100881410.tif" target="_blank" rel="noopener">B040001100881410</a>, 2026).</p>
              </div>
              <div class="dl-prov-detail-item">
                <strong>Weather & Hydrology:</strong>
                <p>Nepal DHM Station 652 (Trishuli) & GeoPera Centerline Survey (<a href="https://github.com/geo-pera/bhotekoshi-2026-reconstruction" target="_blank" rel="noopener">GeoPera GitHub</a>).</p>
              </div>
              <div class="dl-prov-detail-item">
                <strong>Ground Witness Reports:</strong>
                <p>GeoGeorgeShadrach Public Geolocation Map & GeoConfirmed (<a href="https://x.com/geogeorgeology/status/2093632283442053371" target="_blank" rel="noopener">GeoGeorge Post</a>).</p>
              </div>
            </div>
          </details>
        </div>

        <!-- AI Copilot Intelligence Assessment (NVIDIA GLM-5.3-Flash) -->
        <div class="dl-ai-copilot-card" id="card-ai-copilot-section">
          <div class="dl-ai-copilot-header">
            <div class="dl-ai-copilot-title-row">
              <span class="dl-ai-icon">✨</span>
              <span class="dl-card-subtitle">NVIDIA AI DISASTER COPILOT</span>
            </div>
            <span class="dl-ai-model-badge">GLM-5.3-FLASH</span>
          </div>
          <div class="dl-ai-copilot-body" id="ai-copilot-output">
            <p class="dl-ai-placeholder">Synthesize real-time multimodal evidence with NVIDIA NIM GLM-5.3-Flash for tactical situation assessment and response recommendations.</p>
          </div>
          <button type="button" class="dl-btn ai-action" id="btn-run-ai-copilot">⚡ GENERATE AI COPILOT REPORT</button>
        </div>

        <!-- Action Controls -->
        <div class="dl-action-bar">
          <button type="button" class="dl-btn secondary" id="btn-toggle-review">⚠️ FLAG FOR HUMAN REVIEW</button>
          <button type="button" class="dl-btn primary" id="btn-fly-zone">🎯 FLY TO ZONE</button>
        </div>
      </section>

      <!-- Hidden embedded stepper elements for backward compatibility -->
      <div id="timeline-stepper" style="display: none;">
        <span id="timeline-current-label">T4 · PEAK IMPACT</span>
        <button type="button" class="timeline-step-btn" data-snapshot="T0"></button>
        <button type="button" class="timeline-step-btn" data-snapshot="T1"></button>
        <button type="button" class="timeline-step-btn" data-snapshot="T2"></button>
        <button type="button" class="timeline-step-btn" data-snapshot="T3"></button>
        <button type="button" class="timeline-step-btn active" data-snapshot="T4"></button>
      </div>
    `;

    document.body.appendChild(root);

    // 2. Bottom Floating Glass Timeline Pill
    bottomTimeline = document.createElement('div');
    bottomTimeline.id = 'dl-bottom-timeline';
    bottomTimeline.className = 'dl-bottom-timeline dl-glass-card';
    bottomTimeline.setAttribute('role', 'region');
    bottomTimeline.setAttribute('aria-label', 'Flood Timeline Stepper');
    bottomTimeline.style.display = 'none';

    bottomTimeline.innerHTML = `
      <div class="dl-timeline-track-wrap">
        <div class="dl-timeline-header-row">
          <span class="dl-timeline-title">FLOOD TIMELINE REPLAY</span>
          <span class="dl-timeline-active-name" id="dl-timeline-status-text">T4 · 06:00 UTC · Peak Impact</span>
        </div>
        <div class="dl-timeline-stepper-bar">
          <div class="dl-timeline-line"></div>
          <button type="button" class="dl-timeline-node" data-snap="T0">
            <span class="dl-node-dot"></span>
            <span class="dl-node-code">T0</span>
            <span class="dl-node-name">BASE</span>
          </button>
          <button type="button" class="dl-timeline-node" data-snap="T1">
            <span class="dl-node-dot"></span>
            <span class="dl-node-code">T1</span>
            <span class="dl-node-name">RAIN</span>
          </button>
          <button type="button" class="dl-timeline-node" data-snap="T2">
            <span class="dl-node-dot"></span>
            <span class="dl-node-code">T2</span>
            <span class="dl-node-name">BREACH</span>
          </button>
          <button type="button" class="dl-timeline-node" data-snap="T3">
            <span class="dl-node-dot"></span>
            <span class="dl-node-code">T3</span>
            <span class="dl-node-name">SURGE</span>
          </button>
          <button type="button" class="dl-timeline-node active" data-snap="T4">
            <span class="dl-node-dot"></span>
            <span class="dl-node-code">T4</span>
            <span class="dl-node-name">PEAK</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(bottomTimeline);

    // Event Listeners
    root.querySelector('.disaster-panel-close-btn').addEventListener('click', () => {
      setVisible(false);
    });

    const filterTabs = root.querySelectorAll('.dl-filter-pill');
    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.dataset.filter;
        renderQueueList();
      });
    });

    // Wire up Bottom Floating Timeline Nodes
    const timelineNodes = bottomTimeline.querySelectorAll('.dl-timeline-node');
    timelineNodes.forEach((node) => {
      node.addEventListener('click', () => {
        const snap = node.dataset.snap;
        activeSnapshotId = snap;
        syncSnapshotButtons(snap);
        if (typeof onSnapshotChange === 'function') {
          onSnapshotChange(snap);
        }
      });
    });

    // Populate Model Evaluation metrics from held-out results
    if (EVALUATION_RESULTS?.models) {
      const sat = EVALUATION_RESULTS.models.satellite_only?.metrics;
      const hydro = EVALUATION_RESULTS.models.weather_hydrology_only?.metrics;
      const multi = EVALUATION_RESULTS.models.multimodal_fusion?.metrics;
      if (sat) {
        const el = root.querySelector('#eval-sat-f1');
        if (el) el.textContent = `${(sat.f1 * 100).toFixed(1)}%`;
        const accEl = root.querySelector('#eval-sat-acc');
        if (accEl) accEl.textContent = `${(sat.accuracy * 100).toFixed(1)}%`;
      }
      if (hydro) {
        const el = root.querySelector('#eval-hydro-f1');
        if (el) el.textContent = `${(hydro.f1 * 100).toFixed(1)}%`;
        const accEl = root.querySelector('#eval-hydro-acc');
        if (accEl) accEl.textContent = `${(hydro.accuracy * 100).toFixed(1)}%`;
      }
      if (multi) {
        const el = root.querySelector('#eval-multi-f1');
        if (el) el.textContent = `${(multi.f1 * 100).toFixed(1)}%`;
        const accEl = root.querySelector('#eval-multi-acc');
        if (accEl) accEl.textContent = `${(multi.accuracy * 100).toFixed(1)}%`;
      }
    }

    root.querySelector('#btn-fly-zone').addEventListener('click', () => {
      if (selectedZone && typeof onFlyToZone === 'function') {
        onFlyToZone(selectedZone.zoneId);
      }
    });

    root.querySelector('#btn-toggle-review').addEventListener('click', () => {
      if (!selectedZone) return;
      if (acknowledgedReviews.has(selectedZone.zoneId)) {
        acknowledgedReviews.delete(selectedZone.zoneId);
      } else {
        acknowledgedReviews.add(selectedZone.zoneId);
      }
      updateReviewButtonState();
      renderQueueList();
    });

    // Wire up NVIDIA AI Multimodal Copilot
    const copilotBtn = root.querySelector('#btn-run-ai-copilot');
    if (copilotBtn) {
      copilotBtn.addEventListener('click', async () => {
        if (!selectedZone) return;
        const outputEl = root.querySelector('#ai-copilot-output');
        copilotBtn.disabled = true;
        copilotBtn.textContent = '⏳ ANALYZING WITH GLM-5.3-FLASH...';
        outputEl.innerHTML = '<div class="dl-ai-loading"><span class="dl-ai-spinner"></span> Synthesizing satellite, hydro gauge, weather, and mobility streams with NVIDIA NIM...</div>';

        try {
          const res = await fetch('/api/disaster-intel/ai-copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              zoneId: selectedZone.zoneId,
              zoneName: selectedZone.name,
              snapshot: activeSnapshotId,
              metrics: {
                fusedRisk: selectedZone.overallRisk ?? selectedZone.fusedRisk,
                confidence: selectedZone.confidence,
                uncertainty: selectedZone.uncertainty,
                crossModalAgreement: selectedZone.crossModalAgreement,
                evidenceCompleteness: selectedZone.evidenceCompleteness,
                mobilityImpact: selectedZone.mobilityImpact ?? selectedZone.mobilityImpactData?.mobilityImpact,
              },
              modalities: {
                satellite: {
                  floodProbability: selectedZone.satellite?.floodProbability ?? selectedZone.satelliteFloodProbability,
                  changeMagnitude: selectedZone.satellite?.changeMagnitude,
                },
                weather: {
                  rainfallMm24h: selectedZone.weather?.rainfallMm24h ?? selectedZone.rainfall,
                  rainfallTrend: selectedZone.weather?.rainfallTrend,
                },
                sensor: {
                  riverLevelM: selectedZone.sensor?.riverLevelM ?? selectedZone.riverLevel,
                  thresholdExceeded: (selectedZone.sensor?.riverLevelM ?? selectedZone.riverLevel ?? 0) >= 7.0,
                },
                incident: {
                  reportCount: selectedZone.incident?.reportCount ?? 0,
                  severity: selectedZone.incident?.severity || 'LOW',
                  keywords: selectedZone.incident?.keywords || [],
                },
                mobility: {
                  trafficCongestion: selectedZone.mobility?.trafficCongestion ?? selectedZone.mobilityImpactData?.trafficImpact,
                  routeDisruption: selectedZone.mobility?.routeDisruption ?? selectedZone.mobilityImpactData?.routeImpact,
                },
              },
            }),
          });
          const data = await res.json();
          if (data.ok && data.assessment) {
            const lines = data.assessment.split('\n');
            let html = '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (/^#+\s/.test(trimmed)) {
                html += `<h5 class="dl-ai-h">${trimmed.replace(/^#+\s*/, '')}</h5>`;
              } else if (/^[0-9]+\.\s+[A-Z\s]+:/.test(trimmed)) {
                html += `<h5 class="dl-ai-h">${trimmed}</h5>`;
              } else if (/^[-*]\s/.test(trimmed)) {
                html += `<li class="dl-ai-li">${trimmed.replace(/^[-*]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`;
              } else if (trimmed) {
                html += `<p style="margin: 3px 0 6px 0;">${trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
              }
            }
            outputEl.innerHTML = `<div class="dl-ai-result">${html}</div>`;
          } else {
            outputEl.innerHTML = `<div class="dl-ai-error">⚠️ ${data.error || 'Copilot assessment unavailable'}</div>`;
          }
        } catch (err) {
          outputEl.innerHTML = `<div class="dl-ai-error">⚠️ Connection error: ${err.message}</div>`;
        } finally {
          copilotBtn.disabled = false;
          copilotBtn.textContent = '⚡ RE-GENERATE AI COPILOT REPORT';
        }
      });
    }

    // Left TOOLS panel shortcuts
    const reviewBtn = document.getElementById('open-review-queue-btn');
    if (reviewBtn && !reviewBtn._disasterBound) {
      reviewBtn._disasterBound = true;
      reviewBtn.addEventListener('click', () => {
        setVisible(true);
      });
    }
    const evidenceBtn = document.getElementById('open-evidence-btn');
    if (evidenceBtn && !evidenceBtn._disasterBound) {
      evidenceBtn._disasterBound = true;
      evidenceBtn.addEventListener('click', () => {
        setVisible(true);
        if (currentZones.length > 0 && !selectedZone) {
          selectZone(currentZones[0]);
        }
      });
    }
  }

  function syncSnapshotButtons(snapshotId) {
    if (!bottomTimeline) return;
    const nodes = bottomTimeline.querySelectorAll('.dl-timeline-node');
    nodes.forEach((n) => {
      n.classList.toggle('active', n.dataset.snap === snapshotId);
    });
    const info = SNAPSHOT_LABELS[snapshotId] || { code: snapshotId, time: '', full: snapshotId };
    const statusText = bottomTimeline.querySelector('#dl-timeline-status-text');
    if (statusText) {
      statusText.textContent = `${info.code} · ${info.time} · ${info.full.split('·')[1]?.trim() || info.code}`;
    }
  }

  function setVisible(show) {
    ensureMounted();
    root.style.display = show ? 'block' : 'none';
    if (bottomTimeline) {
      bottomTimeline.style.display = show ? 'flex' : 'none';
    }
  }

  function updateOverviewSummary(zones) {
    ensureMounted();
    const countTotal = zones.length;
    const countCritical = zones.filter((z) => (z.riskClassification || z.priority) === 'CRITICAL').length;
    const countHigh = zones.filter((z) => (z.riskClassification || z.priority) === 'HIGH').length;
    const countMedium = zones.filter((z) => (z.riskClassification || z.priority) === 'MODERATE' || z.priority === 'MEDIUM').length;
    const countLow = zones.filter((z) => (z.riskClassification || z.priority) === 'LOW').length;
    const countReview = zones.filter((z) => z.humanReviewRequired && !acknowledgedReviews.has(z.zoneId)).length;

    const totalEl = root.querySelector('#overview-total-zones');
    if (totalEl) totalEl.textContent = countTotal < 10 ? `0${countTotal}` : `${countTotal}`;
    const reviewEl = root.querySelector('#overview-review-count');
    if (reviewEl) reviewEl.textContent = countReview < 10 ? `0${countReview}` : `${countReview}`;
    const critEl = root.querySelector('#bp-critical');
    if (critEl) critEl.textContent = countCritical < 10 ? `0${countCritical}` : `${countCritical}`;
    const highEl = root.querySelector('#bp-high');
    if (highEl) highEl.textContent = countHigh < 10 ? `0${countHigh}` : `${countHigh}`;
    const medEl = root.querySelector('#bp-medium');
    if (medEl) medEl.textContent = countMedium < 10 ? `0${countMedium}` : `${countMedium}`;
    const lowEl = root.querySelector('#bp-low');
    if (lowEl) lowEl.textContent = `${countLow}`;

    // Highest Risk Callout
    const sortedByRisk = [...zones].sort((a, b) => (b.overallRisk ?? b.fusedRisk ?? 0) - (a.overallRisk ?? a.fusedRisk ?? 0));
    const highest = sortedByRisk[0];
    if (highest) {
      const hrName = root.querySelector('#hr-name');
      if (hrName) hrName.textContent = highest.name;
      const hrRisk = root.querySelector('#hr-risk');
      if (hrRisk) hrRisk.textContent = `${(((highest.overallRisk ?? highest.fusedRisk) || 0) * 100).toFixed(0)}%`;
      const hrConf = root.querySelector('#hr-conf');
      if (hrConf) hrConf.textContent = `${(((highest.confidence) || 0) * 100).toFixed(0)}%`;
      const hrUncert = root.querySelector('#hr-uncert');
      if (hrUncert) hrUncert.textContent = `±${(((highest.uncertainty) || 0) * 100).toFixed(0)}%`;
      const hrMob = root.querySelector('#hr-mobility');
      const mobImp = highest.mobilityImpact ?? highest.mobilityImpactData?.mobilityImpact ?? 0;
      if (hrMob) hrMob.textContent = mobImp >= 0.70 ? 'HIGH' : (mobImp >= 0.40 ? 'MOD' : 'LOW');
      const hrTrend = root.querySelector('#hr-trend');
      if (hrTrend) {
        hrTrend.textContent = highest.trend === 'RISING' ? '↗ RISING' : (highest.trend === 'FALLING' ? '↘ FALLING' : '→ STABLE');
      }
    }
  }

  function updateZones(zones, snapshotId = null) {
    ensureMounted();
    currentZones = zones || [];
    if (snapshotId) {
      activeSnapshotId = snapshotId;
      syncSnapshotButtons(snapshotId);
      const stepBtns = root.querySelectorAll('.timeline-step-btn');
      stepBtns.forEach((b) => {
        b.classList.toggle('active', b.dataset.snapshot === snapshotId);
      });
    }

    // Update Counts
    const critCount = currentZones.filter((z) => (z.riskClassification || z.priority) === 'CRITICAL').length;
    const highCount = currentZones.filter((z) => (z.riskClassification || z.priority) === 'HIGH').length;
    const medCount = currentZones.filter((z) => (z.riskClassification || z.priority) === 'MODERATE' || z.priority === 'MEDIUM').length;
    const lowCount = currentZones.filter((z) => (z.riskClassification || z.priority) === 'LOW').length;
    const reviewCount = currentZones.filter((z) => z.humanReviewRequired && !acknowledgedReviews.has(z.zoneId)).length;

    const countAll = root.querySelector('#count-all');
    if (countAll) countAll.textContent = currentZones.length;
    const countRev = root.querySelector('#count-review');
    if (countRev) countRev.textContent = reviewCount;
    const countCrit = root.querySelector('#count-critical');
    if (countCrit) countCrit.textContent = critCount;
    const countH = root.querySelector('#count-high');
    if (countH) countH.textContent = highCount;
    const countM = root.querySelector('#count-medium');
    if (countM) countM.textContent = medCount;
    const countL = root.querySelector('#count-low');
    if (countL) countL.textContent = lowCount;

    updateOverviewSummary(currentZones);
    renderQueueList();

    if (selectedZone) {
      const updated = currentZones.find((z) => z.zoneId === selectedZone.zoneId);
      if (updated) {
        selectZone(updated);
      } else if (currentZones.length > 0) {
        selectZone(currentZones[0]);
      }
    } else if (currentZones.length > 0) {
      selectZone(currentZones[0]);
    }
  }

  function renderQueueList() {
    const listEl = root.querySelector('#disaster-zone-list');
    listEl.innerHTML = '';

    let filtered = [...currentZones];

    if (activeFilter === 'REVIEW') {
      filtered = filtered.filter((z) => z.humanReviewRequired && !acknowledgedReviews.has(z.zoneId));
    } else if (activeFilter === 'CRITICAL') {
      filtered = filtered.filter((z) => (z.riskClassification || z.priority) === 'CRITICAL');
    } else if (activeFilter === 'HIGH') {
      filtered = filtered.filter((z) => (z.riskClassification || z.priority) === 'HIGH');
    } else if (activeFilter === 'MEDIUM') {
      filtered = filtered.filter((z) => (z.riskClassification || z.priority) === 'MODERATE' || z.priority === 'MEDIUM');
    } else if (activeFilter === 'LOW') {
      filtered = filtered.filter((z) => (z.riskClassification || z.priority) === 'LOW');
    }

    filtered.sort((a, b) => (b.reviewPriorityScore ?? b.fusedRisk ?? 0) - (a.reviewPriorityScore ?? a.fusedRisk ?? 0));

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="dl-empty-state">No zones matching this filter.</div>';
      return;
    }

    filtered.forEach((zone) => {
      const item = document.createElement('div');
      const classification = (zone.riskClassification || zone.priority || 'LOW').toLowerCase();
      const isSelected = selectedZone?.zoneId === zone.zoneId;
      const isAck = acknowledgedReviews.has(zone.zoneId);

      item.className = `dl-zone-card priority-${classification} ${isSelected ? 'selected' : ''}`;

      const trendIcon = zone.trend === 'RISING' ? '↗ RISING' : (zone.trend === 'FALLING' ? '↘ FALLING' : '→ STABLE');
      const riskVal = Math.round((zone.overallRisk ?? zone.fusedRisk ?? 0) * 100);
      const confVal = Math.round((zone.confidence ?? 0) * 100);
      const mobilityImpactVal = Math.round((zone.mobilityImpact ?? zone.mobilityImpactData?.mobilityImpact ?? 0) * 100);

      const reviewNotice = zone.humanReviewRequired && !isAck
        ? '<div class="dl-card-review-badge">● Human review recommended</div>'
        : (isAck ? '<div class="dl-card-review-badge ack">✓ Review acknowledged</div>' : '');

      item.innerHTML = `
        <div class="dl-zone-card-top">
          <span class="dl-status-pill ${classification}">● ${(zone.riskClassification || zone.priority || 'LOW').toUpperCase()}</span>
          <span class="dl-trend-text ${zone.trend?.toLowerCase() || 'stable'}">${trendIcon}</span>
        </div>
        <h4 class="dl-zone-card-title">${zone.name}</h4>
        <div class="dl-zone-card-metrics">
          <div class="dl-zc-metric">
            <span class="zc-lbl">Risk</span>
            <span class="zc-val risk-${classification}">${riskVal}%</span>
          </div>
          <div class="dl-zc-metric">
            <span class="zc-lbl">Confidence</span>
            <span class="zc-val">${confVal}%</span>
          </div>
          <div class="dl-zc-metric">
            <span class="zc-lbl">Mobility Impact</span>
            <span class="zc-val">${mobilityImpactVal}%</span>
          </div>
        </div>
        ${reviewNotice}
        <div class="dl-zone-card-footer">
          <span class="dl-view-evidence-link">VIEW EVIDENCE →</span>
        </div>
      `;

      item.addEventListener('click', () => {
        selectZone(zone);
        if (typeof onSelectZone === 'function') {
          onSelectZone(zone);
        }
        if (typeof onFlyToZone === 'function') {
          onFlyToZone(zone.zoneId);
        }
      });

      listEl.appendChild(item);
    });
  }

  function updateReviewButtonState() {
    if (!selectedZone) return;
    const btn = root.querySelector('#btn-toggle-review');
    const isAck = acknowledgedReviews.has(selectedZone.zoneId);
    if (isAck) {
      btn.textContent = '✓ REVIEW ACKNOWLEDGED';
      btn.classList.add('acknowledged');
    } else {
      btn.textContent = selectedZone.humanReviewRequired ? '⚠️ FLAG FOR HUMAN REVIEW' : '🔍 MARK FOR AUDIT';
      btn.classList.remove('acknowledged');
    }
  }

  function selectZone(zone) {
    if (!zone) return;
    selectedZone = zone;
    ensureMounted();

    renderQueueList();

    const cardEl = root.querySelector('#disaster-inspection-card');
    cardEl.style.display = 'block';

    root.querySelector('#card-zone-id').textContent = zone.zoneId;
    root.querySelector('#card-zone-name').textContent = zone.name;
    root.querySelector('#card-zone-sector').textContent = zone.sector || 'Geographic Sector';

    const classification = zone.riskClassification || zone.priority || 'LOW';
    const pillEl = root.querySelector('#card-priority-pill');
    pillEl.textContent = classification;
    pillEl.className = `dl-status-pill ${classification.toLowerCase()}`;

    const trendBadge = root.querySelector('#card-trend-badge');
    trendBadge.textContent = zone.trend === 'RISING' ? '↗ RISING' : (zone.trend === 'FALLING' ? '↘ FALLING' : '→ STABLE');
    trendBadge.className = `dl-trend-badge ${zone.trend?.toLowerCase() || 'stable'}`;

    // Metrics
    root.querySelector('#card-fused-risk').textContent = `${(((zone.overallRisk ?? zone.fusedRisk) || 0) * 100).toFixed(1)}%`;
    const confInt = Math.round(((zone.confidence) || 0) * 100);
    const uncertInt = Math.round(((zone.uncertainty) || 0) * 100);
    root.querySelector('#card-confidence').textContent = `${confInt}%`;
    root.querySelector('#card-uncertainty').textContent = `±${uncertInt}%`;
    root.querySelector('#card-agreement').textContent = `${Math.round(((zone.crossModalAgreement) || 0) * 100)}%`;
    root.querySelector('#card-completeness').textContent = `${Math.round(((zone.evidenceCompleteness) || 0) * 100)}%`;
    root.querySelector('#card-mobility-impact').textContent = `${Math.round(((zone.mobilityImpact ?? zone.mobilityImpactData?.mobilityImpact) || 0) * 100)}%`;

    const confMeterFill = root.querySelector('#conf-meter-fill');
    if (confMeterFill) confMeterFill.style.width = `${confInt}%`;

    // Temporal Deltas
    const deltas = zone.deltas || {};
    root.querySelector('#delta-river').textContent = `River: ${deltas.riverLevelDelta > 0 ? '+' : ''}${deltas.riverLevelDelta ?? 0}m`;
    root.querySelector('#delta-rain').textContent = `Rain: ${deltas.rainfallDelta > 0 ? '+' : ''}${deltas.rainfallDelta ?? 0}mm`;
    root.querySelector('#delta-sat').textContent = `Sat: ${deltas.floodProbabilityDelta > 0 ? '+' : ''}${Math.round((deltas.floodProbabilityDelta ?? 0) * 100)}%`;
    root.querySelector('#delta-traffic').textContent = `Traffic: ${deltas.trafficDelta > 0 ? '+' : ''}${Math.round((deltas.trafficDelta ?? 0) * 100)}%`;

    // Multimodal Contribution Bar Meters
    const mScores = zone.modalityScores || {};
    const satScore = Math.round((mScores.satellite ?? zone.imageScore ?? 0) * 100);
    const weatherScore = Math.round((mScores.weather ?? zone.weatherScore ?? 0) * 100);
    const sensorScore = Math.round((mScores.sensor ?? zone.sensorScore ?? 0) * 100);
    const incidentScore = Math.round((mScores.incident ?? zone.incidentScore ?? 0) * 100);
    const mobilityScore = Math.round((mScores.mobility ?? zone.mobilityScore ?? 0) * 100);

    root.querySelector('#bar-satellite').style.width = `${satScore}%`;
    root.querySelector('#val-satellite').textContent = `${satScore}%`;

    root.querySelector('#bar-weather').style.width = `${weatherScore}%`;
    root.querySelector('#val-weather').textContent = `${weatherScore}%`;

    root.querySelector('#bar-sensor').style.width = `${sensorScore}%`;
    root.querySelector('#val-sensor').textContent = `${sensorScore}%`;

    root.querySelector('#bar-incident').style.width = `${incidentScore}%`;
    root.querySelector('#val-incident').textContent = `${incidentScore}%`;

    root.querySelector('#bar-mobility').style.width = `${mobilityScore}%`;
    root.querySelector('#val-mobility').textContent = `${mobilityScore}%`;

    // Detailed Multimodal Evidence Cards
    // 1. Satellite
    const satObj = zone.satellite || {};
    root.querySelector('#det-sat-prob').textContent = `${Math.round(((satObj.floodProbability ?? zone.satelliteFloodProbability) || 0) * 100)}%`;
    root.querySelector('#det-sat-change').textContent = satObj.changeDetected ? 'YES' : 'NO';
    root.querySelector('#det-sat-mag').textContent = `${Math.round((satObj.changeMagnitude || 0) * 100)}%`;
    root.querySelector('#det-sat-source').textContent = satObj.source || 'Sentinel-2';
    const satStatEl = root.querySelector('#card-sat-status');
    satStatEl.textContent = String(zone.modalityStatus?.satellite || 'AVAILABLE').toUpperCase();
    satStatEl.className = `dl-mb-status ${zone.modalityStatus?.satellite === 'stale' ? 'stale' : 'available'}`;

    // 2. Weather
    const weatherObj = zone.weather || {};
    root.querySelector('#det-weather-rain').textContent = `${weatherObj.rainfallMm24h ?? zone.rainfall ?? 0} mm`;
    root.querySelector('#det-weather-trend').textContent = String(weatherObj.rainfallTrend || 'STABLE').toUpperCase();
    root.querySelector('#det-weather-intensity').textContent = `${Math.round(((weatherObj.precipitationIntensity) || 0) * 100)}%`;
    root.querySelector('#det-weather-source').textContent = weatherObj.source || 'AWS Gauge';
    const weatherStatEl = root.querySelector('#card-weather-status');
    weatherStatEl.textContent = String(zone.modalityStatus?.weather || 'AVAILABLE').toUpperCase();
    weatherStatEl.className = `dl-mb-status ${zone.modalityStatus?.weather === 'stale' ? 'stale' : 'available'}`;

    // 3. Sensor
    const sensorObj = zone.sensor || {};
    root.querySelector('#det-sensor-level').textContent = `${sensorObj.riverLevelM ?? zone.riverLevel ?? 0} m`;
    root.querySelector('#det-sensor-trend').textContent = String(sensorObj.riverLevelTrend || 'STABLE').toUpperCase();
    root.querySelector('#det-sensor-thresh').textContent = (sensorObj.thresholdExceeded || (sensorObj.riverLevelM ?? zone.riverLevel ?? 0) >= 7.0) ? 'YES ⚠️' : 'NO';
    root.querySelector('#det-sensor-source').textContent = sensorObj.source || 'Hydro Gauge';
    const sensorStat = zone.modalityStatus?.sensor || (zone.sensorStatus === 'OFFLINE' ? 'offline' : (zone.sensorStatus === 'DEGRADED' ? 'degraded' : 'available'));
    const sensorStatEl = root.querySelector('#card-sensor-status');
    sensorStatEl.textContent = String(sensorStat).toUpperCase();
    sensorStatEl.className = `dl-mb-status ${sensorStat === 'offline' ? 'offline' : (sensorStat === 'degraded' ? 'degraded' : 'available')}`;

    // 4. Incident
    const incidentObj = zone.incident || {};
    root.querySelector('#det-inc-count').textContent = incidentObj.reportCount < 10 ? `0${incidentObj.reportCount}` : `${incidentObj.reportCount ?? 0}`;
    root.querySelector('#det-inc-sev').textContent = String(incidentObj.severity || 'LOW').toUpperCase();
    root.querySelector('#det-inc-source').textContent = incidentObj.source || 'Emergency Logs';
    const kwContainer = root.querySelector('#det-inc-keywords');
    kwContainer.innerHTML = '';
    (incidentObj.keywords || []).forEach((kw) => {
      const kwSpan = document.createElement('span');
      kwSpan.className = 'dl-keyword-pill';
      kwSpan.textContent = kw;
      kwContainer.appendChild(kwSpan);
    });

    // 5. Mobility
    const mobObj = zone.mobility || {};
    root.querySelector('#det-mob-traffic').textContent = `${Math.round(((mobObj.trafficCongestion ?? zone.mobilityImpactData?.trafficImpact) || 0) * 100)}%`;
    root.querySelector('#det-mob-transit').textContent = `${Math.round(((mobObj.transitDisruption ?? zone.mobilityImpactData?.transitImpact) || 0) * 100)}%`;
    root.querySelector('#det-mob-route').textContent = `${Math.round(((mobObj.routeDisruption ?? zone.mobilityImpactData?.routeImpact) || 0) * 100)}%`;
    root.querySelector('#det-mob-bike').textContent = `${Math.round((mobObj.bikeshareAvailability || 0) * 100)}%`;

    // Explainability: Why Prioritized
    const reasonsListEl = root.querySelector('#card-reasons-list');
    reasonsListEl.innerHTML = '';
    const reasons = zone.reviewReasons || [];
    if (reasons.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Nominal readings; standard monitoring threshold.';
      reasonsListEl.appendChild(li);
    } else {
      reasons.forEach((r) => {
        const li = document.createElement('li');
        li.innerHTML = `⚠️ <span>${r}</span>`;
        reasonsListEl.appendChild(li);
      });
    }

    // Uncertainty Profile Explanation
    const uncertExpEl = root.querySelector('#card-uncertainty-exp');
    const uVal = Math.round((zone.uncertainty || 0) * 100);
    const agrVal = Math.round((zone.crossModalAgreement || 0) * 100);
    const compVal = Math.round((zone.evidenceCompleteness || 0) * 100);

    if (sensorStat === 'offline') {
      uncertExpEl.textContent = `High uncertainty (±${uVal}%): Hydro telemetry is offline. Cross-modal corroboration relies on satellite and simulated reports. Physical sensor inspection recommended.`;
    } else if (sensorStat === 'degraded') {
      uncertExpEl.textContent = `Elevated uncertainty (±${uVal}%): Sensor telemetry is degraded (intermittent packet loss). Agreement is ${agrVal}%. Human queue verification advised.`;
    } else if (uVal <= 20) {
      uncertExpEl.textContent = `Low uncertainty (±${uVal}%): Evidence agreement is high (${agrVal}%) across active modalities (${compVal}% complete). High confidence assessment.`;
    } else {
      uncertExpEl.textContent = `Moderate analytical uncertainty (±${uVal}%). Completeness is ${compVal}%. Decision support guidance provided under probabilistic bounds.`;
    }

    // Evidence List
    const evidenceListEl = root.querySelector('#card-evidence-list');
    evidenceListEl.innerHTML = '';
    (zone.evidence || []).forEach((ev) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${ev.type}:</strong> <span>${ev.source}</span>`;
      evidenceListEl.appendChild(li);
    });

    // Provenance Linking
    const provStatusEl = root.querySelector('#prov-evidence-status');
    const provDatasetEl = root.querySelector('#prov-dataset-name');
    const provLicenseEl = root.querySelector('#prov-license');
    if (provStatusEl) {
      if (zone.provenance === 'public') {
        provStatusEl.textContent = 'PUBLIC OPEN DATA';
        provStatusEl.className = 'dl-prov-badge public';
        if (provDatasetEl) provDatasetEl.textContent = 'Vantor Open Data & GeoPera Reconstruction';
        if (provLicenseEl) provLicenseEl.textContent = 'CC BY-NC 4.0 / ODbL 1.0';
      } else {
        provStatusEl.textContent = 'SYNTHETIC SCENARIO';
        provStatusEl.className = 'dl-prov-badge simulated';
        if (provDatasetEl) provDatasetEl.textContent = 'Nepal Flood Incident (Baseline Reach Demo)';
        if (provLicenseEl) provLicenseEl.textContent = 'DisasterLens Scenario Engine';
      }
    }

    const outputEl = root.querySelector('#ai-copilot-output');
    if (outputEl) {
      outputEl.innerHTML = '<p class="dl-ai-placeholder">Synthesize real-time multimodal evidence with NVIDIA NIM GLM-5.3-Flash for tactical situation assessment and response recommendations.</p>';
    }
    const cBtn = root.querySelector('#btn-run-ai-copilot');
    if (cBtn) {
      cBtn.disabled = false;
      cBtn.textContent = '⚡ GENERATE AI COPILOT REPORT';
    }

    updateReviewButtonState();
  }

  function destroy() {
    if (root && root.parentElement) {
      root.remove();
      root = null;
    }
    if (bottomTimeline && bottomTimeline.parentElement) {
      bottomTimeline.remove();
      bottomTimeline = null;
    }
  }

  return {
    setVisible,
    updateZones,
    selectZone,
    destroy,
    getActiveSnapshot: () => activeSnapshotId,
  };
}
