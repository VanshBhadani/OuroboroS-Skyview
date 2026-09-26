import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fuseDisasterMetrics,
  getProcessedDisasterZones,
  getTimelineSnapshots,
  getDisasterOverviewSummary,
  SYNTHETIC_DISASTER_ZONES,
  SYNTHETIC_TIMELINE_SNAPSHOTS,
} from './scenarioData.js';
import {
  DEFAULT_MODALITY_WEIGHTS,
  RISK_THRESHOLDS,
  normalizeSatellite,
  normalizeWeather,
  normalizeSensor,
  normalizeIncident,
  normalizeMobility,
  deriveMobilityImpact,
  resolveModalityStatus,
  calculateEvidenceCompleteness,
  calculateCrossModalAgreement,
  calculateConfidenceAndUncertainty,
  classifyZoneRisk,
  computeTemporalDeltas,
  evaluateReviewPriority,
  fuseMultimodalZone,
} from './multimodalFusion.js';
import { createDisasterIntelligenceLayer } from './index.js';
import { disasterAiProxy } from '../../../server/providers/disasterAI.js';

// =========================================================================
// BASELINE MILESTONE 1 TESTS (Must remain passing without modification)
// =========================================================================

test('multimodal fusion formula satisfies requirements', () => {
  // 1. Exact formula calculation test:
  // imageScore = 0.8
  // weatherScore = 75 / 150 = 0.5
  // sensorScore = 6.0 / 10 = 0.6
  // fusedRisk = 0.5 * 0.8 + 0.25 * 0.5 + 0.25 * 0.6 = 0.4 + 0.125 + 0.15 = 0.675
  const result = fuseDisasterMetrics({
    satelliteFloodProbability: 0.8,
    rainfall: 75,
    riverLevel: 6.0,
    sensorConfidence: 0.9,
    cloudCoverPenalty: 0.0,
  });

  assert.equal(result.imageScore, 0.8);
  assert.equal(result.weatherScore, 0.5);
  assert.equal(result.sensorScore, 0.6);
  assert.equal(result.fusedRisk, 0.675);
  assert.equal(result.confidence, 0.9);
  assert.equal(result.uncertainty, 0.1);
  assert.equal(result.priority, 'MEDIUM');
  assert.equal(result.humanReviewRequired, false);
});

test('low-confidence cases trigger human review queue', () => {
  // Low confidence (< 0.65) must flag human review even if risk is moderate
  const result = fuseDisasterMetrics({
    satelliteFloodProbability: 0.3,
    rainfall: 30,
    riverLevel: 2.0,
    sensorConfidence: 0.50, // low confidence
    cloudCoverPenalty: 0.10,
  });

  assert.ok(result.confidence < 0.65);
  assert.equal(result.priority, 'HIGH', 'Low confidence escalates to HIGH priority queue');
  assert.equal(result.humanReviewRequired, true, 'Flagged for human review');
});

test('high fused risk triggers HIGH priority queue', () => {
  const result = fuseDisasterMetrics({
    satelliteFloodProbability: 0.95,
    rainfall: 140,
    riverLevel: 9.5,
    sensorConfidence: 0.95,
  });

  assert.ok(result.fusedRisk >= 0.70);
  assert.equal(result.priority, 'HIGH');
  assert.equal(result.humanReviewRequired, false);
});

test('scenario defines at least 5 zones along Nepal flood reach', () => {
  const zones = getProcessedDisasterZones();
  assert.ok(zones.length >= 5, `Expected >= 5 zones, got ${zones.length}`);

  for (const zone of zones) {
    assert.ok(zone.zoneId, 'Zone must have zoneId');
    assert.ok(zone.name, 'Zone must have name');
    assert.ok(Number.isFinite(zone.latitude), 'Zone must have latitude');
    assert.ok(Number.isFinite(zone.longitude), 'Zone must have longitude');
    assert.ok(Array.isArray(zone.polygon), 'Zone must have polygon coordinates');
    assert.ok(zone.timestamp, 'Zone must have timestamp');
    assert.ok(Number.isFinite(zone.fusedRisk), 'Zone must have fusedRisk');
    assert.ok(Number.isFinite(zone.confidence), 'Zone must have confidence');
    assert.ok(Number.isFinite(zone.uncertainty), 'Zone must have uncertainty');
    assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(zone.priority), 'Valid priority');
    assert.ok(Array.isArray(zone.evidence) && zone.evidence.length >= 3, 'Zone must have evidence list');
  }
});

test('layer factory provides standard lifecycle methods', () => {
  const layer = createDisasterIntelligenceLayer();
  assert.equal(layer.id, 'disaster-intelligence');
  assert.equal(layer.name, 'Disaster Intelligence');
  assert.equal(typeof layer.init, 'function');
  assert.equal(typeof layer.enable, 'function');
  assert.equal(typeof layer.disable, 'function');
  assert.equal(typeof layer.destroy, 'function');
});

// =========================================================================
// MILESTONE 2: MULTIMODAL INTELLIGENCE SPECIFICATION TESTS (Phase 16)
// =========================================================================

test('Phase 16.1: modality normalization functions normalize inputs to [0, 1]', () => {
  // 1. Satellite
  assert.equal(normalizeSatellite(0.85), 0.85);
  assert.equal(normalizeSatellite({ floodProbability: 0.90 }), 0.90);
  assert.equal(normalizeSatellite({ floodProbability: 0.80, changeDetected: true, changeMagnitude: 0.70 }), +(0.80 * 0.85 + 0.70 * 0.15).toFixed(4));
  assert.equal(normalizeSatellite(null), null);

  // 2. Weather (baseline 150mm = 1.0)
  assert.equal(normalizeWeather(75), 0.5);
  assert.equal(normalizeWeather({ rainfallMm24h: 150 }), 1.0);
  assert.equal(normalizeWeather({ rainfallMm24h: 300 }), 1.0); // clamped
  assert.equal(normalizeWeather({ rainfallMm24h: 75, precipitationIntensity: 0.8 }), +(0.5 * 0.7 + 0.8 * 0.3).toFixed(4));
  assert.equal(normalizeWeather(null), null);

  // 3. Sensor (baseline 10m = 1.0)
  assert.equal(normalizeSensor(5.0), 0.5);
  assert.equal(normalizeSensor({ riverLevelM: 8.5 }), 0.85);
  assert.equal(normalizeSensor({ riverLevelM: 3.0, thresholdExceeded: true }), 0.70); // threshold boost
  assert.equal(normalizeSensor(null), null);

  // 4. Incident reports
  assert.equal(normalizeIncident({ reportCount: 5, severity: 'critical' }), 1.0);
  assert.equal(normalizeIncident({ reportCount: 0, severity: 'low' }), +(0.25 * 0.6).toFixed(4));
  assert.equal(normalizeIncident(null), null);

  // 5. Mobility (traffic 40% + transit 25% + route 35%)
  const mobScore = normalizeMobility({ trafficCongestion: 0.80, transitDisruption: 0.60, routeDisruption: 0.70 });
  assert.equal(+mobScore.toFixed(3), +(0.80 * 0.40 + 0.60 * 0.25 + 0.70 * 0.35).toFixed(3));
  assert.equal(normalizeMobility(null), null);
});

test('Phase 16.2: multimodal weighted fusion applies 30/20/20/15/15 weights and exposes explainability', () => {
  const zoneInput = {
    satellite: { floodProbability: 0.80, changeDetected: false },
    weather: { rainfallMm24h: 75, precipitationIntensity: 0.5 },
    sensor: { riverLevelM: 6.0, thresholdExceeded: false, sensorStatus: 'online' },
    incident: { reportCount: 3, severity: 'medium' },
    mobility: { trafficCongestion: 0.70, transitDisruption: 0.50, routeDisruption: 0.60 },
  };

  const result = fuseMultimodalZone(zoneInput);

  // Verify weights are exposed
  assert.equal(result.modalityWeights.satellite, 0.30);
  assert.equal(result.modalityWeights.weather, 0.20);
  assert.equal(result.modalityWeights.sensor, 0.20);
  assert.equal(result.modalityWeights.incident, 0.15);
  assert.equal(result.modalityWeights.mobility, 0.15);

  // Verify individual modality scores are exposed
  assert.ok(Number.isFinite(result.modalityScores.satellite));
  assert.ok(Number.isFinite(result.modalityScores.weather));
  assert.ok(Number.isFinite(result.modalityScores.sensor));
  assert.ok(Number.isFinite(result.modalityScores.incident));
  assert.ok(Number.isFinite(result.modalityScores.mobility));

  // Verify calculation: sum(score_i * weight_i)
  const expectedRisk = +(
    result.modalityScores.satellite * 0.30 +
    result.modalityScores.weather * 0.20 +
    result.modalityScores.sensor * 0.20 +
    result.modalityScores.incident * 0.15 +
    result.modalityScores.mobility * 0.15
  ).toFixed(3);

  assert.equal(result.overallRisk, expectedRisk);
  assert.equal(result.fusedRisk, expectedRisk);
});

test('Phase 16.3 & 16.4: confidence and uncertainty are separate from risk and sum to 1.0', () => {
  const result = calculateConfidenceAndUncertainty({
    evidenceCompleteness: 1.0,
    crossModalAgreement: 0.90,
    sensorStatus: 'online',
    hasStaleEvidence: false,
    cloudCoverPenalty: 0.05,
  });

  assert.ok(Number.isFinite(result.confidence));
  assert.ok(Number.isFinite(result.uncertainty));
  assert.ok(result.confidence >= 0.10 && result.confidence <= 0.99);
  assert.equal(+(result.confidence + result.uncertainty).toFixed(2), 1.00);
});

test('Phase 16.5: cross-modal agreement score reflects signal variance', () => {
  // High agreement: all scores identical or close
  const highScores = { satellite: 0.80, weather: 0.82, sensor: 0.81, incident: 0.79, mobility: 0.80 };
  const statuses = { satellite: 'available', weather: 'available', sensor: 'available', incident: 'available', mobility: 'available' };
  const highAgreement = calculateCrossModalAgreement(highScores, statuses);
  assert.ok(highAgreement >= 0.95, `Expected high agreement, got ${highAgreement}`);

  // Divergent signals: satellite high, but weather low and incident low
  const divergentScores = { satellite: 0.95, weather: 0.10, sensor: 0.90, incident: 0.05, mobility: 0.10 };
  const lowAgreement = calculateCrossModalAgreement(divergentScores, statuses);
  assert.ok(lowAgreement < highAgreement, 'Divergent signals must produce lower agreement score');
});

test('Phase 16.6: evidence completeness quantifies modality coverage', () => {
  // 5/5 available
  const full = { satellite: 'available', weather: 'available', sensor: 'available', incident: 'available', mobility: 'available' };
  assert.equal(calculateEvidenceCompleteness(full), 1.00);

  // 1 offline (0.1) and 1 missing (0.0) -> (1 + 1 + 0.1 + 1 + 0) / 5 = 3.1 / 5 = 0.62
  const partial = { satellite: 'available', weather: 'available', sensor: 'offline', incident: 'available', mobility: 'missing' };
  assert.equal(calculateEvidenceCompleteness(partial), 0.62);

  // All missing
  const empty = { satellite: 'missing', weather: 'missing', sensor: 'missing', incident: 'missing', mobility: 'missing' };
  assert.equal(calculateEvidenceCompleteness(empty), 0.00);
});

test('Phase 16.7: mobility impact is derived using 40% traffic + 25% transit + 35% route disruption', () => {
  const mobility = {
    trafficCongestion: 0.80,
    transitDisruption: 0.60,
    routeDisruption: 0.70,
  };

  const impact = deriveMobilityImpact(mobility);
  assert.equal(impact.trafficImpact, 0.80);
  assert.equal(impact.transitImpact, 0.60);
  assert.equal(impact.routeImpact, 0.70);
  assert.equal(impact.mobilityImpact, +(0.80 * 0.40 + 0.60 * 0.25 + 0.70 * 0.35).toFixed(2));
});

test('Phase 16.8: risk classification uses deterministic thresholds and flags UNKNOWN on insufficient data', () => {
  assert.equal(classifyZoneRisk(0.92, 1.0), 'CRITICAL');
  assert.equal(classifyZoneRisk(0.85, 1.0), 'CRITICAL');
  assert.equal(classifyZoneRisk(0.78, 1.0), 'HIGH');
  assert.equal(classifyZoneRisk(0.70, 1.0), 'HIGH');
  assert.equal(classifyZoneRisk(0.55, 1.0), 'MODERATE');
  assert.equal(classifyZoneRisk(0.40, 1.0), 'MODERATE');
  assert.equal(classifyZoneRisk(0.25, 1.0), 'LOW');

  // Low evidence completeness flags UNKNOWN
  assert.equal(classifyZoneRisk(0.90, 0.15), 'UNKNOWN');
});

test('Phase 16.9: review prioritization generates deterministic reasons and prioritizes high-risk/uncertain zones', () => {
  const zoneInput = {
    satellite: { floodProbability: 0.94, changeDetected: true },
    weather: { rainfallMm24h: 138.5, rainfallTrend: 'rising' },
    sensor: { riverLevelM: 9.8, thresholdExceeded: true, sensorStatus: 'online' },
    incident: { reportCount: 5, severity: 'critical' },
    mobility: { trafficCongestion: 0.88, transitDisruption: 0.92, routeDisruption: 0.90 },
  };

  const result = fuseMultimodalZone(zoneInput);
  assert.equal(result.priority, 'HIGH');
  assert.equal(result.humanReviewRequired, true);
  assert.ok(Array.isArray(result.reviewReasons));
  assert.ok(result.reviewReasons.length >= 2, 'Must have at least 2 explainable reasons');
  assert.ok(result.reviewReasons.some((r) => r.includes('risk') || r.includes('Satellite') || r.includes('River')));
});

test('Phase 16.10: temporal change detection identifies RISING, STABLE, and FALLING trends with deltas', () => {
  const current = {
    sensor: { riverLevelM: 8.5 },
    weather: { rainfallMm24h: 110.0 },
    satellite: { floodProbability: 0.85 },
    mobility: { trafficCongestion: 0.75 },
  };

  const previous = {
    sensor: { riverLevelM: 5.5 },
    weather: { rainfallMm24h: 70.0 },
    satellite: { floodProbability: 0.50 },
    mobility: { trafficCongestion: 0.45 },
  };

  const deltas = computeTemporalDeltas(current, previous);
  assert.equal(deltas.riverLevelDelta, 3.0);
  assert.equal(deltas.rainfallDelta, 40.0);
  assert.equal(deltas.floodProbabilityDelta, 0.35);
  assert.equal(deltas.trafficDelta, 0.30);
  assert.equal(deltas.trend, 'RISING');

  // Falling case
  const fallingDeltas = computeTemporalDeltas(previous, current);
  assert.equal(fallingDeltas.trend, 'FALLING');

  // Stable case
  const stableDeltas = computeTemporalDeltas(current, current);
  assert.equal(stableDeltas.trend, 'STABLE');
  assert.equal(stableDeltas.riverLevelDelta, 0);
});

test('Phase 16.11: missing modality handling dynamically redistributes weights without throwing', () => {
  const zoneWithMissingWeather = {
    satellite: { floodProbability: 0.80 },
    weather: null, // missing modality
    sensor: { riverLevelM: 7.0 },
    incident: { reportCount: 3, severity: 'medium' },
    mobility: { trafficCongestion: 0.50 },
  };

  const result = fuseMultimodalZone(zoneWithMissingWeather);
  assert.ok(Number.isFinite(result.overallRisk));
  assert.equal(result.modalityStatus.weather, 'missing');
  // Weather weight must be 0 in active weights
  assert.equal(result.modalityWeights.weather, 0);
  // Total active weights sum to ~1.0
  const activeWeightSum = Object.values(result.modalityWeights).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(activeWeightSum - 1.0) < 0.05);
});

test('Phase 16.12: offline sensor telemetry drops sensor health and triggers review with reason', () => {
  const zoneWithOfflineSensor = {
    satellite: { floodProbability: 0.60 },
    weather: { rainfallMm24h: 60 },
    sensor: { riverLevelM: 5.0, sensorStatus: 'offline' },
    incident: { reportCount: 1, severity: 'low' },
    mobility: { trafficCongestion: 0.40 },
  };

  const result = fuseMultimodalZone(zoneWithOfflineSensor);
  assert.equal(result.modalityStatus.sensor, 'offline');
  assert.equal(result.humanReviewRequired, true);
  assert.ok(result.reviewReasons.some((r) => r.toLowerCase().includes('offline')), 'Must mention offline sensor in reasons');
});

test('Phase 16.13: stale evidence handling adjusts freshness and records explainable review item', () => {
  const zoneWithStaleWeather = {
    satellite: { floodProbability: 0.50 },
    weather: { rainfallMm24h: 50, status: 'stale' },
    sensor: { riverLevelM: 4.0 },
    incident: { reportCount: 1, severity: 'low' },
    mobility: { trafficCongestion: 0.30 },
  };

  const result = fuseMultimodalZone(zoneWithStaleWeather);
  assert.equal(result.modalityStatus.weather, 'stale');
  assert.ok(result.reviewReasons.some((r) => r.toLowerCase().includes('stale')), 'Must mention stale weather in reasons');
});

test('Phase 16.14: deterministic output: running same scenario twice produces 100% identical results', () => {
  const run1 = getProcessedDisasterZones('T4');
  const run2 = getProcessedDisasterZones('T4');

  assert.equal(run1.length, run2.length);
  for (let i = 0; i < run1.length; i++) {
    const z1 = run1[i];
    const z2 = run2[i];
    assert.equal(z1.zoneId, z2.zoneId);
    assert.equal(z1.overallRisk, z2.overallRisk);
    assert.equal(z1.confidence, z2.confidence);
    assert.equal(z1.uncertainty, z2.uncertainty);
    assert.equal(z1.crossModalAgreement, z2.crossModalAgreement);
    assert.equal(z1.evidenceCompleteness, z2.evidenceCompleteness);
    assert.equal(z1.mobilityImpact, z2.mobilityImpact);
    assert.equal(z1.priority, z2.priority);
    assert.equal(z1.trend, z2.trend);
    assert.deepEqual(z1.modalityScores, z2.modalityScores);
    assert.deepEqual(z1.modalityWeights, z2.modalityWeights);
    assert.deepEqual(z1.reviewReasons, z2.reviewReasons);
  }
});

test('Phase 16.15: existing Disaster Intelligence compatibility and timeline progression', () => {
  // Test timeline snapshots
  const snapshots = getTimelineSnapshots();
  assert.equal(snapshots.length, 5);
  assert.deepEqual(snapshots.map((s) => s.id), ['T0', 'T1', 'T2', 'T3', 'T4']);

  // T0 has lower risk than T4
  const zonesT0 = getProcessedDisasterZones('T0');
  const zonesT4 = getProcessedDisasterZones('T4');

  const avgRiskT0 = zonesT0.reduce((s, z) => s + z.overallRisk, 0) / zonesT0.length;
  const avgRiskT4 = zonesT4.reduce((s, z) => s + z.overallRisk, 0) / zonesT4.length;
  assert.ok(avgRiskT4 > avgRiskT0, `T4 peak risk (${avgRiskT4}) must be higher than T0 baseline (${avgRiskT0})`);

  // Overview summary
  const summary = getDisasterOverviewSummary('T4');
  assert.equal(summary.totalZones, 6);
  assert.ok(summary.critical >= 1);
  assert.ok(summary.reviewRequired >= 1);
  assert.ok(summary.highestRiskZone);
  assert.equal(summary.highestRiskZone.zoneId, 'ZONE-NP-01');
  assert.equal(summary.provenance, 'SIMULATED');
});

// =========================================================================
// BACKEND API TESTS (Phase 13)
// =========================================================================

test('Phase 13: backend API middleware returns valid JSON for /status, /zones, /zones/:id, /timeline, /summary', async () => {
  const plugin = disasterAiProxy();
  let middleware = null;
  const dummyServer = {
    middlewares: {
      use(route, handler) {
        if (route === '/api/disaster-intel') {
          middleware = handler;
        }
      },
    },
  };
  plugin.configureServer(dummyServer);
  assert.equal(typeof middleware, 'function', 'Disaster AI middleware must be registered');

  // Helper to simulate request/response
  const callApi = async (urlPath) => {
    let statusCode = null;
    let headers = {};
    let responseBody = '';

    const req = {
      method: 'GET',
      url: urlPath,
    };
    const res = {
      writeHead(code, h) {
        statusCode = code;
        headers = h;
      },
      end(chunk) {
        responseBody += chunk;
      },
    };

    await middleware(req, res);
    return { statusCode, headers, body: JSON.parse(responseBody) };
  };

  // 1. GET /api/disaster-intel/status
  const statusRes = await callApi('/api/disaster-intel/status');
  assert.equal(statusRes.statusCode, 200);
  assert.equal(statusRes.body.status, 'nominal');
  assert.equal(statusRes.body.provenance, 'SIMULATED');

  // 2. GET /api/disaster-intel/zones
  const zonesRes = await callApi('/api/disaster-intel/zones');
  assert.equal(zonesRes.statusCode, 200);
  assert.ok(Array.isArray(zonesRes.body));
  assert.equal(zonesRes.body.length, 6);
  assert.ok(zonesRes.body[0].zoneId);

  // 3. GET /api/disaster-intel/zones/ZONE-NP-01
  const singleZoneRes = await callApi('/api/disaster-intel/zones/ZONE-NP-01');
  assert.equal(singleZoneRes.statusCode, 200);
  assert.equal(singleZoneRes.body.zoneId, 'ZONE-NP-01');
  assert.ok(singleZoneRes.body.overallRisk >= 0.85);

  // 4. GET /api/disaster-intel/zones/NONEXISTENT (404)
  const notFoundRes = await callApi('/api/disaster-intel/zones/UNKNOWN-99');
  assert.equal(notFoundRes.statusCode, 404);

  // 5. GET /api/disaster-intel/timeline
  const timelineRes = await callApi('/api/disaster-intel/timeline');
  assert.equal(timelineRes.statusCode, 200);
  assert.ok(Array.isArray(timelineRes.body.snapshots));
  assert.equal(timelineRes.body.snapshots.length, 5);

  // 6. GET /api/disaster-intel/summary
  const summaryRes = await callApi('/api/disaster-intel/summary');
  assert.equal(summaryRes.statusCode, 200);
  assert.equal(summaryRes.body.totalZones, 6);
  assert.ok(summaryRes.body.reviewRequired >= 1);
  assert.equal(summaryRes.body.highestRiskZone.zoneId, 'ZONE-NP-01');
});
