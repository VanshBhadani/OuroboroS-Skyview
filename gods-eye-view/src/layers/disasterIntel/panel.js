/**
 * Vanilla JS UI Component for Multimodal Disaster Intelligence (Milestone 2)
 * Features:
 *  - Disaster Overview Summary Dashboard (Phase 15)
 *  - Timeline Replay & Snapshot Stepper (Phase 11 & 12)
 *  - Review Queue with Multi-Criteria Prioritization (Phase 8)
 *  - Multimodal Contribution Bar Meter View (Phase 10)
 *  - Upgraded Multimodal Evidence Card with Deterministic Explainability (Phase 9)
 *  - Mobility Impact Breakdown (Phase 6)
 *  - Provenance & Uncertainty Disclosure (Phase 3, 4, 5, 14)
 *  - Decision Support Action Controls
 */

export function createDisasterIntelPanel({ onSelectZone, onFlyToZone, onSnapshotChange }) {
  let root = null;
  let currentZones = [];
  let selectedZone = null;
  let activeFilter = 'ALL'; // ALL | REVIEW | CRITICAL | HIGH | MEDIUM | LOW
  let activeSnapshotId = 'T4';
  const acknowledgedReviews = new Set();

  function ensureMounted() {
    if (root && document.body.contains(root)) return;

    root = document.createElement('div');
    root.id = 'disaster-intel-panel';
    root.className = 'disaster-intel-panel';
    root.style.display = 'none';

    root.innerHTML = `
      <div class="disaster-panel-glow"></div>
      <div class="disaster-panel-inner">
        <!-- Header -->
        <div class="disaster-panel-header">
          <div class="disaster-header-title">
            <span class="disaster-badge-icon">🛡️</span>
            <div class="disaster-title-group">
              <span class="disaster-title-text">DISASTER INTELLIGENCE</span>
              <span class="disaster-subtitle-text">Multimodal Decision Support</span>
            </div>
          </div>
          <button type="button" class="disaster-panel-close-btn" title="Close Panel" aria-label="Close">✕</button>
        </div>

        <!-- Mandatory Decision Support Disclaimer -->
        <div class="disaster-disclaimer">
          ⚠️ <strong>Decision-support prototype.</strong> Predictions are probabilistic and require human verification. This system does not make life-critical decisions autonomously. All telemetry values are <strong>SIMULATED</strong>.
        </div>

        <!-- Dashboard Summary Overview (Phase 15) -->
        <div class="disaster-overview-card" id="disaster-overview-card">
          <div class="overview-header">
            <span class="overview-title">DISASTER OVERVIEW</span>
            <span class="provenance-tag">SIMULATED SCENARIO</span>
          </div>
          <div class="overview-stats-row">
            <div class="overview-stat">
              <span class="stat-number" id="overview-total-zones">6</span>
              <span class="stat-label">AFFECTED ZONES</span>
            </div>
            <div class="overview-stat highlight-review">
              <span class="stat-number" id="overview-review-count">3</span>
              <span class="stat-label">HUMAN REVIEW</span>
            </div>
            <div class="overview-breakdown">
              <div class="breakdown-pill critical"><span class="bp-count" id="bp-critical">1</span> CRIT</div>
              <div class="breakdown-pill high"><span class="bp-count" id="bp-high">2</span> HIGH</div>
              <div class="breakdown-pill medium"><span class="bp-count" id="bp-medium">2</span> MOD</div>
              <div class="breakdown-pill low"><span class="bp-count" id="bp-low">1</span> LOW</div>
            </div>
          </div>
          <div class="highest-risk-callout" id="highest-risk-callout">
            <div class="hr-top">
              <span class="hr-label">HIGHEST RISK SECTOR</span>
              <span class="hr-trend" id="hr-trend">↗ RISING</span>
            </div>
            <div class="hr-name" id="hr-name">ZONE-NP-01 · Debris-Dammed Lake Outburst Reach</div>
            <div class="hr-metrics">
              <span>Risk: <strong id="hr-risk">94%</strong></span>
              <span>Conf: <strong id="hr-conf">84%</strong></span>
              <span>Uncertainty: <strong id="hr-uncert">±16%</strong></span>
              <span>Mobility: <strong id="hr-mobility">HIGH</strong></span>
            </div>
          </div>
        </div>

        <!-- Timeline Replay Stepper (Phase 11 & 12) -->
        <div class="disaster-timeline-section">
          <div class="timeline-header">
            <span class="disaster-section-label">FLOOD TIMELINE REPLAY</span>
            <span class="timeline-current-label" id="timeline-current-label">T4 · PEAK DISRUPTION</span>
          </div>
          <div class="timeline-stepper" id="timeline-stepper">
            <button type="button" class="timeline-step-btn" data-snapshot="T0" title="T0 · 02:00 UTC · Baseline">T0<small>Base</small></button>
            <button type="button" class="timeline-step-btn" data-snapshot="T1" title="T1 · 03:30 UTC · Rain Spike">T1<small>Rain</small></button>
            <button type="button" class="timeline-step-btn" data-snapshot="T2" title="T2 · 04:15 UTC · Lake Breach">T2<small>Breach</small></button>
            <button type="button" class="timeline-step-btn" data-snapshot="T3" title="T3 · 05:00 UTC · Surge Flood">T3<small>Surge</small></button>
            <button type="button" class="timeline-step-btn active" data-snapshot="T4" title="T4 · 06:00 UTC · Peak Impact">T4<small>Peak</small></button>
          </div>
        </div>

        <!-- Review Queue Tabs & Controls (Phase 8) -->
        <div class="disaster-queue-controls">
          <div class="queue-header-row">
            <span class="disaster-section-label">HUMAN REVIEW QUEUE</span>
            <span class="queue-sort-label">PRIORITIZED BY RISK & UNCERTAINTY</span>
          </div>
          <div class="disaster-filter-tabs">
            <button type="button" class="disaster-tab active" data-filter="ALL">ALL (<span id="count-all">0</span>)</button>
            <button type="button" class="disaster-tab" data-filter="REVIEW">REVIEW (<span id="count-review">0</span>)</button>
            <button type="button" class="disaster-tab" data-filter="CRITICAL">CRIT (<span id="count-critical">0</span>)</button>
            <button type="button" class="disaster-tab" data-filter="HIGH">HIGH (<span id="count-high">0</span>)</button>
            <button type="button" class="disaster-tab" data-filter="MEDIUM">MED (<span id="count-medium">0</span>)</button>
            <button type="button" class="disaster-tab" data-filter="LOW">LOW (<span id="count-low">0</span>)</button>
          </div>
        </div>

        <!-- Zone List (Queue) -->
        <div class="disaster-zone-list" id="disaster-zone-list"></div>

        <!-- Selected Zone Inspection / Multimodal Evidence Card (Phase 9 & 10) -->
        <div class="disaster-inspection-card" id="disaster-inspection-card" style="display: none;">
          <div class="disaster-card-header">
            <div>
              <div class="disaster-card-tag" id="card-zone-id">ZONE-NP-01</div>
              <h4 class="disaster-card-name" id="card-zone-name">Zone Name</h4>
              <div class="disaster-card-sector" id="card-zone-sector">Sector Description</div>
            </div>
            <div class="header-pills">
              <span class="disaster-priority-pill" id="card-priority-pill">CRITICAL</span>
              <span class="trend-badge" id="card-trend-badge">↗ RISING</span>
            </div>
          </div>

          <!-- Section 1: Disaster Assessment -->
          <div class="evidence-sub-title">1. DISASTER ASSESSMENT</div>
          <div class="disaster-metrics-grid">
            <div class="metric-cell">
              <span class="metric-label">FUSED RISK</span>
              <strong class="metric-value highlight" id="card-fused-risk">0.0%</strong>
            </div>
            <div class="metric-cell">
              <span class="metric-label">CONFIDENCE</span>
              <strong class="metric-value" id="card-confidence">0%</strong>
            </div>
            <div class="metric-cell">
              <span class="metric-label">UNCERTAINTY</span>
              <strong class="metric-value warning-text" id="card-uncertainty">±0%</strong>
            </div>
            <div class="metric-cell">
              <span class="metric-label">MODAL AGREEMENT</span>
              <strong class="metric-value" id="card-agreement">0%</strong>
            </div>
            <div class="metric-cell">
              <span class="metric-label">COMPLETENESS</span>
              <strong class="metric-value" id="card-completeness">0%</strong>
            </div>
            <div class="metric-cell">
              <span class="metric-label">MOBILITY IMPACT</span>
              <strong class="metric-value" id="card-mobility-impact">0%</strong>
            </div>
          </div>

          <!-- Temporal Deltas Row (Phase 12) -->
          <div class="temporal-delta-row" id="card-delta-row">
            <span class="delta-label">TEMPORAL CHANGE:</span>
            <span class="delta-item" id="delta-river">River: 0.0m</span>
            <span class="delta-item" id="delta-rain">Rain: 0mm</span>
            <span class="delta-item" id="delta-sat">Sat Prob: 0%</span>
            <span class="delta-item" id="delta-traffic">Traffic: 0%</span>
          </div>

          <!-- Section 2: Multimodal Contribution View (Phase 10) -->
          <div class="evidence-sub-title">2. MULTIMODAL CONTRIBUTION</div>
          <div class="contribution-meters-box">
            <div class="meter-row">
              <span class="meter-label">SATELLITE <small>(30%)</small></span>
              <div class="meter-bar-container"><div class="meter-fill satellite" id="bar-satellite" style="width: 0%"></div></div>
              <span class="meter-val" id="val-satellite">0%</span>
            </div>
            <div class="meter-row">
              <span class="meter-label">WEATHER <small>(20%)</small></span>
              <div class="meter-bar-container"><div class="meter-fill weather" id="bar-weather" style="width: 0%"></div></div>
              <span class="meter-val" id="val-weather">0%</span>
            </div>
            <div class="meter-row">
              <span class="meter-label">SENSOR <small>(20%)</small></span>
              <div class="meter-bar-container"><div class="meter-fill sensor" id="bar-sensor" style="width: 0%"></div></div>
              <span class="meter-val" id="val-sensor">0%</span>
            </div>
            <div class="meter-row">
              <span class="meter-label">INCIDENT <small>(15%)</small></span>
              <div class="meter-bar-container"><div class="meter-fill incident" id="bar-incident" style="width: 0%"></div></div>
              <span class="meter-val" id="val-incident">0%</span>
            </div>
            <div class="meter-row">
              <span class="meter-label">MOBILITY <small>(15%)</small></span>
              <div class="meter-bar-container"><div class="meter-fill mobility" id="bar-mobility" style="width: 0%"></div></div>
              <span class="meter-val" id="val-mobility">0%</span>
            </div>
          </div>

          <!-- Section 3: Multimodal Evidence Details (Phase 9) -->
          <div class="evidence-sub-title">3. DETAILED MULTIMODAL EVIDENCE</div>
          <div class="multimodal-details-grid">
            <!-- Satellite Block -->
            <div class="modal-detail-block">
              <div class="mdb-header">
                <span>🛰️ SATELLITE</span>
                <span class="source-badge" id="card-sat-status">AVAILABLE</span>
              </div>
              <div class="mdb-body">
                <div>Flood Probability: <strong id="det-sat-prob">0%</strong></div>
                <div>Change Detected: <strong id="det-sat-change">NO</strong></div>
                <div>Change Magnitude: <strong id="det-sat-mag">0%</strong></div>
                <div class="mdb-source">Source: <span id="det-sat-source">Sentinel-2</span></div>
              </div>
            </div>

            <!-- Weather Block -->
            <div class="modal-detail-block">
              <div class="mdb-header">
                <span>🌧️ WEATHER</span>
                <span class="source-badge" id="card-weather-status">AVAILABLE</span>
              </div>
              <div class="mdb-body">
                <div>24h Rainfall: <strong id="det-weather-rain">0 mm</strong></div>
                <div>Precipitation Trend: <strong id="det-weather-trend">STABLE</strong></div>
                <div>Intensity: <strong id="det-weather-intensity">0%</strong></div>
                <div class="mdb-source">Source: <span id="det-weather-source">AWS Gauge</span></div>
              </div>
            </div>

            <!-- Sensor Block -->
            <div class="modal-detail-block">
              <div class="mdb-header">
                <span>🌊 SENSOR</span>
                <span class="source-badge" id="card-sensor-status">ONLINE</span>
              </div>
              <div class="mdb-body">
                <div>River Stage: <strong id="det-sensor-level">0.0 m</strong></div>
                <div>Stage Trend: <strong id="det-sensor-trend">STABLE</strong></div>
                <div>Threshold Exceeded: <strong id="det-sensor-thresh">NO</strong></div>
                <div class="mdb-source">Source: <span id="det-sensor-source">Hydrology Gauge</span></div>
              </div>
            </div>

            <!-- Incident Block -->
            <div class="modal-detail-block">
              <div class="mdb-header">
                <span>📋 INCIDENT REPORTS</span>
                <span class="source-badge" id="card-incident-status">AVAILABLE</span>
              </div>
              <div class="mdb-body">
                <div>Active Reports: <strong id="det-inc-count">0</strong></div>
                <div>Severity Level: <strong id="det-inc-sev">LOW</strong></div>
                <div class="inc-keywords" id="det-inc-keywords"></div>
                <div class="mdb-source">Source: <span id="det-inc-source">Emergency Logs</span></div>
              </div>
            </div>

            <!-- Mobility Block (Phase 6) -->
            <div class="modal-detail-block full-width">
              <div class="mdb-header">
                <span>🚦 OPERATIONAL MOBILITY IMPACT</span>
                <span class="source-badge" id="card-mobility-status">AVAILABLE</span>
              </div>
              <div class="mdb-body mobility-columns">
                <div>Traffic Congestion: <strong id="det-mob-traffic">0%</strong></div>
                <div>Transit Disruption: <strong id="det-mob-transit">0%</strong></div>
                <div>Route Disruption: <strong id="det-mob-route">0%</strong></div>
                <div>Bikeshare Avail: <strong id="det-mob-bike">0%</strong></div>
              </div>
            </div>
          </div>

          <!-- Section 4: Why this zone is prioritized (Phase 8) -->
          <div class="evidence-sub-title">4. WHY THIS ZONE IS PRIORITIZED</div>
          <div class="priority-reasons-box" id="priority-reasons-box">
            <ul class="priority-reasons-list" id="card-reasons-list"></ul>
          </div>

          <!-- Section 5: Uncertainty & Data Provenance (Phase 14) -->
          <div class="evidence-sub-title">5. UNCERTAINTY & PROVENANCE</div>
          <div class="provenance-box">
            <div class="provenance-row">
              <span>DATA STATUS:</span>
              <strong class="prov-badge">SIMULATED TELEMETRY</strong>
            </div>
            <div class="uncertainty-explanation" id="card-uncertainty-exp">
              Analytical uncertainty evaluated from sensor health, cross-modal agreement, and telemetry completeness.
            </div>
          </div>

          <!-- Legacy Evidence Snippet List -->
          <div class="disaster-evidence-section">
            <span class="disaster-evidence-title">CONTEXTUAL FIELD EVIDENCE:</span>
            <ul class="disaster-evidence-list" id="card-evidence-list"></ul>
          </div>

          <!-- Actions -->
          <div class="disaster-card-actions">
            <button type="button" class="disaster-action-btn review-toggle" id="btn-toggle-review">⚠️ FLAG FOR REVIEW</button>
            <button type="button" class="disaster-action-btn primary" id="btn-fly-zone">🎯 FLY TO ZONE</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    // Event Listeners
    root.querySelector('.disaster-panel-close-btn').addEventListener('click', () => {
      setVisible(false);
    });

    const tabs = root.querySelectorAll('.disaster-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.dataset.filter;
        renderQueueList();
      });
    });

    // Timeline stepper buttons
    const stepBtns = root.querySelectorAll('.timeline-step-btn');
    stepBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        stepBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeSnapshotId = btn.dataset.snapshot;
        if (typeof onSnapshotChange === 'function') {
          onSnapshotChange(activeSnapshotId);
        }
      });
    });

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

    // Wire up left TOOLS panel shortcuts if present in DOM
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

  function setVisible(show) {
    ensureMounted();
    root.style.display = show ? 'block' : 'none';
  }

  function updateOverviewSummary(zones) {
    ensureMounted();
    const countTotal = zones.length;
    const countCritical = zones.filter((z) => (z.riskClassification || z.priority) === 'CRITICAL').length;
    const countHigh = zones.filter((z) => (z.riskClassification || z.priority) === 'HIGH').length;
    const countMedium = zones.filter((z) => (z.riskClassification || z.priority) === 'MODERATE' || z.priority === 'MEDIUM').length;
    const countLow = zones.filter((z) => (z.riskClassification || z.priority) === 'LOW').length;
    const countReview = zones.filter((z) => z.humanReviewRequired && !acknowledgedReviews.has(z.zoneId)).length;

    root.querySelector('#overview-total-zones').textContent = countTotal;
    root.querySelector('#overview-review-count').textContent = countReview;
    root.querySelector('#bp-critical').textContent = countCritical;
    root.querySelector('#bp-high').textContent = countHigh;
    root.querySelector('#bp-medium').textContent = countMedium;
    root.querySelector('#bp-low').textContent = countLow;

    // Highest risk callout
    const sortedByRisk = [...zones].sort((a, b) => (b.overallRisk ?? b.fusedRisk ?? 0) - (a.overallRisk ?? a.fusedRisk ?? 0));
    const highest = sortedByRisk[0];
    if (highest) {
      root.querySelector('#hr-name').textContent = `${highest.zoneId} · ${highest.name}`;
      root.querySelector('#hr-risk').textContent = `${(((highest.overallRisk ?? highest.fusedRisk) || 0) * 100).toFixed(0)}%`;
      root.querySelector('#hr-conf').textContent = `${(((highest.confidence) || 0) * 100).toFixed(0)}%`;
      root.querySelector('#hr-uncert').textContent = `±${(((highest.uncertainty) || 0) * 100).toFixed(0)}%`;
      const mobImp = highest.mobilityImpact ?? highest.mobilityImpactData?.mobilityImpact ?? 0;
      root.querySelector('#hr-mobility').textContent = mobImp >= 0.70 ? 'HIGH' : (mobImp >= 0.40 ? 'MODERATE' : 'LOW');
      root.querySelector('#hr-trend').textContent = highest.trend === 'RISING' ? '↗ RISING' : (highest.trend === 'FALLING' ? '↘ FALLING' : '→ STABLE');
    }
  }

  function updateZones(zones, snapshotId = null) {
    ensureMounted();
    currentZones = zones || [];
    if (snapshotId) {
      activeSnapshotId = snapshotId;
      const stepBtns = root.querySelectorAll('.timeline-step-btn');
      stepBtns.forEach((b) => {
        b.classList.toggle('active', b.dataset.snapshot === snapshotId);
      });
      const currentSnapLabels = {
        T0: 'T0 · BASELINE PRE-EVENT',
        T1: 'T1 · RAINFALL INTENSIFICATION',
        T2: 'T2 · GLACIAL DAM BREACH',
        T3: 'T3 · FLOODWAVE PROPAGATION',
        T4: 'T4 · PEAK CORRIDOR DISRUPTION',
      };
      root.querySelector('#timeline-current-label').textContent = currentSnapLabels[snapshotId] || `${snapshotId} · ACTIVE SNAPSHOT`;
    }

    // Update Counts
    const critCount = currentZones.filter((z) => (z.riskClassification || z.priority) === 'CRITICAL').length;
    const highCount = currentZones.filter((z) => (z.riskClassification || z.priority) === 'HIGH').length;
    const medCount = currentZones.filter((z) => (z.riskClassification || z.priority) === 'MODERATE' || z.priority === 'MEDIUM').length;
    const lowCount = currentZones.filter((z) => (z.riskClassification || z.priority) === 'LOW').length;
    const reviewCount = currentZones.filter((z) => z.humanReviewRequired && !acknowledgedReviews.has(z.zoneId)).length;

    root.querySelector('#count-all').textContent = currentZones.length;
    root.querySelector('#count-review').textContent = reviewCount;
    root.querySelector('#count-critical').textContent = critCount;
    root.querySelector('#count-high').textContent = highCount;
    root.querySelector('#count-medium').textContent = medCount;
    root.querySelector('#count-low').textContent = lowCount;

    updateOverviewSummary(currentZones);
    renderQueueList();

    // Re-select currently selected zone or first zone
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

    // Sort by review priority score descending
    filtered.sort((a, b) => (b.reviewPriorityScore ?? b.fusedRisk ?? 0) - (a.reviewPriorityScore ?? a.fusedRisk ?? 0));

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="disaster-empty-state">No zones in this queue category.</div>';
      return;
    }

    filtered.forEach((zone) => {
      const item = document.createElement('div');
      const classification = (zone.riskClassification || zone.priority || 'LOW').toLowerCase();
      const isSelected = selectedZone?.zoneId === zone.zoneId;
      const isAck = acknowledgedReviews.has(zone.zoneId);

      item.className = `disaster-zone-item ${isSelected ? 'selected' : ''} priority-${classification}`;

      const trendIcon = zone.trend === 'RISING' ? '↗ RISING' : (zone.trend === 'FALLING' ? '↘ FALLING' : '→ STABLE');
      const mobilityImpactVal = Math.round((zone.mobilityImpact ?? zone.mobilityImpactData?.mobilityImpact ?? 0) * 100);

      item.innerHTML = `
        <div class="zone-item-top">
          <strong class="zone-item-name" title="${zone.name}">${zone.name}</strong>
          <span class="zone-item-badge ${classification}">${zone.riskClassification || zone.priority}</span>
        </div>
        <div class="zone-item-sub">
          <span>Risk: <strong>${Math.round((zone.overallRisk ?? zone.fusedRisk ?? 0) * 100)}%</strong></span>
          <span>Conf: <strong>${Math.round((zone.confidence ?? 0) * 100)}%</strong></span>
          <span>Mobility: <strong>${mobilityImpactVal}%</strong></span>
          <span class="item-trend ${zone.trend?.toLowerCase() || 'stable'}">${trendIcon}</span>
          ${zone.humanReviewRequired ? (isAck ? '<span class="review-tag ack">ACK</span>' : '<span class="review-tag">REVIEW</span>') : ''}
        </div>
      `;

      item.addEventListener('click', () => {
        selectZone(zone);
        if (typeof onSelectZone === 'function') {
          onSelectZone(zone);
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
      btn.textContent = selectedZone.humanReviewRequired ? '⚠️ FLAG FOR REVIEW' : '🔍 MARK FOR AUDIT';
      btn.classList.remove('acknowledged');
    }
  }

  function selectZone(zone) {
    if (!zone) return;
    selectedZone = zone;
    ensureMounted();

    // Update list selection highlight
    const items = root.querySelectorAll('.disaster-zone-item');
    items.forEach((item) => item.classList.remove('selected'));
    renderQueueList();

    // Populate Inspection Card
    const cardEl = root.querySelector('#disaster-inspection-card');
    cardEl.style.display = 'block';

    root.querySelector('#card-zone-id').textContent = zone.zoneId;
    root.querySelector('#card-zone-name').textContent = zone.name;
    root.querySelector('#card-zone-sector').textContent = zone.sector || 'Geographic Sector';

    const classification = zone.riskClassification || zone.priority || 'LOW';
    const pillEl = root.querySelector('#card-priority-pill');
    pillEl.textContent = classification;
    pillEl.className = `disaster-priority-pill priority-${classification.toLowerCase()}`;

    const trendBadge = root.querySelector('#card-trend-badge');
    trendBadge.textContent = zone.trend === 'RISING' ? '↗ RISING' : (zone.trend === 'FALLING' ? '↘ FALLING' : '→ STABLE');
    trendBadge.className = `trend-badge trend-${zone.trend?.toLowerCase() || 'stable'}`;

    // Section 1: Assessment Metrics
    root.querySelector('#card-fused-risk').textContent = `${(((zone.overallRisk ?? zone.fusedRisk) || 0) * 100).toFixed(1)}%`;
    root.querySelector('#card-confidence').textContent = `${Math.round(((zone.confidence) || 0) * 100)}%`;
    root.querySelector('#card-uncertainty').textContent = `±${Math.round(((zone.uncertainty) || 0) * 100)}%`;
    root.querySelector('#card-agreement').textContent = `${Math.round(((zone.crossModalAgreement) || 0) * 100)}%`;
    root.querySelector('#card-completeness').textContent = `${Math.round(((zone.evidenceCompleteness) || 0) * 100)}%`;
    root.querySelector('#card-mobility-impact').textContent = `${Math.round(((zone.mobilityImpact ?? zone.mobilityImpactData?.mobilityImpact) || 0) * 100)}%`;

    // Temporal Deltas
    const deltas = zone.deltas || {};
    root.querySelector('#delta-river').textContent = `River: ${deltas.riverLevelDelta > 0 ? '+' : ''}${deltas.riverLevelDelta ?? 0}m`;
    root.querySelector('#delta-rain').textContent = `Rain: ${deltas.rainfallDelta > 0 ? '+' : ''}${deltas.rainfallDelta ?? 0}mm`;
    root.querySelector('#delta-sat').textContent = `Sat: ${deltas.floodProbabilityDelta > 0 ? '+' : ''}${Math.round((deltas.floodProbabilityDelta ?? 0) * 100)}%`;
    root.querySelector('#delta-traffic').textContent = `Traffic: ${deltas.trafficDelta > 0 ? '+' : ''}${Math.round((deltas.trafficDelta ?? 0) * 100)}%`;

    // Section 2: Multimodal Contribution Bar Meters (Phase 10)
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

    // Section 3: Detailed Multimodal Evidence
    // Satellite
    const satObj = zone.satellite || {};
    root.querySelector('#det-sat-prob').textContent = `${Math.round(((satObj.floodProbability ?? zone.satelliteFloodProbability) || 0) * 100)}%`;
    root.querySelector('#det-sat-change').textContent = satObj.changeDetected ? 'YES' : 'NO';
    root.querySelector('#det-sat-mag').textContent = `${Math.round((satObj.changeMagnitude || 0) * 100)}%`;
    root.querySelector('#det-sat-source').textContent = satObj.source || 'Satellite Sensor';
    const satStatEl = root.querySelector('#card-sat-status');
    satStatEl.textContent = String(zone.modalityStatus?.satellite || 'AVAILABLE').toUpperCase();
    satStatEl.className = `source-badge ${zone.modalityStatus?.satellite === 'stale' ? 'stale' : 'available'}`;

    // Weather
    const weatherObj = zone.weather || {};
    root.querySelector('#det-weather-rain').textContent = `${weatherObj.rainfallMm24h ?? zone.rainfall ?? 0} mm`;
    root.querySelector('#det-weather-trend').textContent = String(weatherObj.rainfallTrend || 'STABLE').toUpperCase();
    root.querySelector('#det-weather-intensity').textContent = `${Math.round(((weatherObj.precipitationIntensity) || 0) * 100)}%`;
    root.querySelector('#det-weather-source').textContent = weatherObj.source || 'AWS Station';
    const weatherStatEl = root.querySelector('#card-weather-status');
    weatherStatEl.textContent = String(zone.modalityStatus?.weather || 'AVAILABLE').toUpperCase();
    weatherStatEl.className = `source-badge ${zone.modalityStatus?.weather === 'stale' ? 'stale' : 'available'}`;

    // Sensor
    const sensorObj = zone.sensor || {};
    root.querySelector('#det-sensor-level').textContent = `${sensorObj.riverLevelM ?? zone.riverLevel ?? 0} m`;
    root.querySelector('#det-sensor-trend').textContent = String(sensorObj.riverLevelTrend || 'STABLE').toUpperCase();
    root.querySelector('#det-sensor-thresh').textContent = (sensorObj.thresholdExceeded || (sensorObj.riverLevelM ?? zone.riverLevel ?? 0) >= 7.0) ? 'YES ⚠️' : 'NO';
    root.querySelector('#det-sensor-source').textContent = sensorObj.source || 'Hydro Telemetry Gauge';
    const sensorStat = zone.modalityStatus?.sensor || (zone.sensorStatus === 'OFFLINE' ? 'offline' : (zone.sensorStatus === 'DEGRADED' ? 'degraded' : 'available'));
    const sensorStatEl = root.querySelector('#card-sensor-status');
    sensorStatEl.textContent = String(sensorStat).toUpperCase();
    sensorStatEl.className = `source-badge ${sensorStat === 'offline' ? 'offline' : (sensorStat === 'degraded' ? 'degraded' : 'available')}`;

    // Incident
    const incidentObj = zone.incident || {};
    root.querySelector('#det-inc-count').textContent = incidentObj.reportCount ?? 0;
    root.querySelector('#det-inc-sev').textContent = String(incidentObj.severity || 'LOW').toUpperCase();
    root.querySelector('#det-inc-source').textContent = incidentObj.source || 'Simulated Incident Feeds';
    const kwContainer = root.querySelector('#det-inc-keywords');
    kwContainer.innerHTML = '';
    (incidentObj.keywords || []).forEach((kw) => {
      const kwSpan = document.createElement('span');
      kwSpan.className = 'keyword-chip';
      kwSpan.textContent = kw;
      kwContainer.appendChild(kwSpan);
    });

    // Mobility
    const mobObj = zone.mobility || {};
    root.querySelector('#det-mob-traffic').textContent = `${Math.round(((mobObj.trafficCongestion ?? zone.mobilityImpactData?.trafficImpact) || 0) * 100)}%`;
    root.querySelector('#det-mob-transit').textContent = `${Math.round(((mobObj.transitDisruption ?? zone.mobilityImpactData?.transitImpact) || 0) * 100)}%`;
    root.querySelector('#det-mob-route').textContent = `${Math.round(((mobObj.routeDisruption ?? zone.mobilityImpactData?.routeImpact) || 0) * 100)}%`;
    root.querySelector('#det-mob-bike').textContent = `${Math.round((mobObj.bikeshareAvailability || 0) * 100)}%`;

    // Section 4: Why Prioritized (Deterministic Explainability)
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

    // Section 5: Uncertainty Explanation
    const uncertExpEl = root.querySelector('#card-uncertainty-exp');
    const uVal = Math.round((zone.uncertainty || 0) * 100);
    const agrVal = Math.round((zone.crossModalAgreement || 0) * 100);
    const compVal = Math.round((zone.evidenceCompleteness || 0) * 100);

    if (sensorStat === 'offline') {
      uncertExpEl.textContent = `High uncertainty (±${uVal}%): Hydro telemetry is offline. Cross-modal corroboration relies on satellite and simulated reports. Physical sensor inspection recommended.`;
    } else if (sensorStat === 'degraded') {
      uncertExpEl.textContent = `Elevated uncertainty (±${uVal}%): Sensor telemetry is degraded (intermittent packet loss). Agreement is ${agrVal}%. Human queue verification advised.`;
    } else if (uVal <= 20) {
      uncertExpEl.textContent = `Low uncertainty (±${uVal}%): Strong cross-modal agreement (${agrVal}%) across all 5 active modalities (${compVal}% complete). High confidence assessment.`;
    } else {
      uncertExpEl.textContent = `Moderate analytical uncertainty (±${uVal}%). Completeness is ${compVal}%. Decision support guidance provided under probabilistic bounds.`;
    }

    // Legacy Evidence list
    const evidenceListEl = root.querySelector('#card-evidence-list');
    evidenceListEl.innerHTML = '';
    (zone.evidence || []).forEach((ev) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${ev.type}:</strong> ${ev.source}`;
      evidenceListEl.appendChild(li);
    });

    updateReviewButtonState();
  }

  function destroy() {
    if (root && root.parentElement) {
      root.remove();
      root = null;
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
