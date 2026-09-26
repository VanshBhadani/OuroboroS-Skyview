/**
 * Multimodal AI Disaster Intelligence Scenario & Fusion Engine
 * 
 * Hackathon Decision-Support System (Microsoft AI Challenge / DisasterLens)
 * Scenario: Bhote Koshi / Trishuli River Flood & Outburst Event (Nepal)
 * 
 * NOTE: Decision-support prototype. Predictions are probabilistic and require human
 * verification. This system does not make life-critical decisions autonomously.
 * All synthetic scenario telemetry values are SIMULATED.
 */

import { fuseMultimodalZone } from './multimodalFusion.js';

/**
 * Deterministic multimodal fusion function (Milestone 1 baseline preservation).
 * Preserved for strict backward compatibility with existing tests and catalog callers.
 */
export function fuseDisasterMetrics({
  satelliteFloodProbability = 0,
  rainfall = 0,
  riverLevel = 0,
  sensorConfidence = 0.90,
  cloudCoverPenalty = 0.0,
}) {
  const imageScore = Math.max(0, Math.min(1, Number(satelliteFloodProbability) || 0));
  const weatherScore = Math.max(0, Math.min(1, (Number(rainfall) || 0) / 150));
  const sensorScore = Math.max(0, Math.min(1, (Number(riverLevel) || 0) / 10));

  // Prototype multimodal fusion formula
  const fusedRisk = +(0.5 * imageScore + 0.25 * weatherScore + 0.25 * sensorScore).toFixed(3);

  // Confidence & Uncertainty calculation
  const rawConfidence = Math.max(0.1, Math.min(0.99, sensorConfidence - cloudCoverPenalty));
  const confidence = +rawConfidence.toFixed(2);
  const uncertainty = +(1 - confidence).toFixed(2);

  // Review Queue Classification:
  // HIGH:   fusedRisk >= 0.70 OR low confidence (< 0.65) requiring human verification
  // MEDIUM: moderate fused risk (0.40 - 0.69)
  // LOW:    low fused risk (< 0.40)
  let priority = 'LOW';
  let humanReviewRequired = false;

  if (fusedRisk >= 0.70 || confidence < 0.65) {
    priority = 'HIGH';
    if (confidence < 0.65) {
      humanReviewRequired = true;
    }
  } else if (fusedRisk >= 0.40) {
    priority = 'MEDIUM';
  }

  return {
    imageScore,
    weatherScore,
    sensorScore,
    fusedRisk,
    confidence,
    uncertainty,
    priority,
    humanReviewRequired,
  };
}

/**
 * Timeline Snapshots for Nepal Flood Event (Bhote Koshi / Trishuli Corridor)
 */
export const SYNTHETIC_TIMELINE_SNAPSHOTS = [
  {
    id: 'T0',
    time: '2026-08-26T02:00:00Z',
    label: 'T0 — BASELINE',
    title: 'Pre-Event Monsoon Baseline',
    description: 'Pre-event seasonal precipitation; river stages within normal channel margins.',
  },
  {
    id: 'T1',
    time: '2026-08-26T03:30:00Z',
    label: 'T1 — RAINFALL INCREASE',
    title: 'Monsoon Torrential Rain Spike',
    description: 'Langtang automatic weather stations record intense precipitation surge exceeding 100mm/24h.',
  },
  {
    id: 'T2',
    time: '2026-08-26T04:15:00Z',
    label: 'T2 — RIVER LEVEL RISING',
    title: 'Glacial Dam Breach & Outburst Wave',
    description: 'Debris moraine dam breach releases impounded glacial water; hydro gauges report rapid stage surge.',
  },
  {
    id: 'T3',
    time: '2026-08-26T05:00:00Z',
    label: 'T3 — FLOOD DETECTED',
    title: 'Floodwave Propagation Downstream',
    description: 'Satellite SAR and optical imagery detect bank overtopping, sediment plumes, and customs yard flooding.',
  },
  {
    id: 'T4',
    time: '2026-08-26T06:00:00Z',
    label: 'T4 — MOBILITY DISRUPTION',
    title: 'Corridor Inundation & Mobility Impact',
    description: 'Trishuli Highway corridor blocked, bridges scoured, and regional transport networks heavily disrupted.',
  },
];

/**
 * Synthetic Bhote Koshi / Nepal Disaster Zones (6 Geographic Sectors along the river reach)
 * Extended with full Multimodal Evidence (Satellite, Weather, Sensor, Incident, Mobility).
 */
export const SYNTHETIC_DISASTER_ZONES = [
  {
    zoneId: 'ZONE-NP-01',
    name: 'Debris-Dammed Lake Outburst Reach',
    sector: 'Upper Valley / Glacier Margin',
    latitude: 28.3346,
    longitude: 85.4861,
    altitude: 2750,
    timestamp: '2026-08-26T06:00:00Z',
    provenance: 'SIMULATED',

    // Backward compatible raw values
    satelliteFloodProbability: 0.94,
    rainfall: 138.5,
    riverLevel: 9.8,
    sensorStatus: 'ACTIVE',
    sensorConfidence: 0.92,
    cloudCoverPenalty: 0.0,

    // Multimodal Evidence Modality 1: SATELLITE
    satellite: {
      floodProbability: 0.94,
      changeDetected: true,
      changeMagnitude: 0.91,
      imageryDate: '2026-08-26T04:10:00Z',
      source: 'Vantor WorldView-3 / Sentinel-1 SAR',
      status: 'available',
      provenance: 'SIMULATED',
    },

    // Multimodal Evidence Modality 2: WEATHER
    weather: {
      rainfallMm24h: 138.5,
      rainfallTrend: 'rising',
      precipitationIntensity: 0.92,
      source: 'Langtang Valley AWS Station',
      status: 'available',
      provenance: 'SIMULATED',
    },

    // Multimodal Evidence Modality 3: SENSOR
    sensor: {
      riverLevelM: 9.8,
      riverLevelTrend: 'rising',
      sensorStatus: 'online',
      thresholdExceeded: true,
      source: 'Glacial Lake Depth Telemetry Gauge',
      status: 'available',
      provenance: 'SIMULATED',
    },

    // Multimodal Evidence Modality 4: INCIDENT REPORTS
    incident: {
      reportCount: 5,
      severity: 'critical',
      keywords: ['moraine breach', 'outburst surge', 'river overtopping', 'boulder slurry'],
      source: 'Simulated Emergency Dispatch Log',
      status: 'available',
      provenance: 'SIMULATED',
    },

    // Multimodal Evidence Modality 5: MOBILITY
    mobility: {
      trafficCongestion: 0.88,
      transitDisruption: 0.92,
      bikeshareAvailability: 0.02,
      routeDisruption: 0.90,
      source: 'Upper Valley Access Route Telemetry',
      status: 'available',
      provenance: 'SIMULATED',
    },

    polygon: [
      [85.475, 28.342],
      [85.498, 28.340],
      [85.495, 28.328],
      [85.472, 28.329],
      [85.475, 28.342],
    ],
    evidence: [
      { type: 'Satellite', source: 'Vantor WorldView-3 high-resolution post-event imagery indicates debris barrier breach and lake drainage (Simulated).' },
      { type: 'Weather', source: 'Langtang meteorological station recorded 138.5 mm/24h continuous monsoon rainfall (Simulated).' },
      { type: 'Sensor', source: 'Glacial lake pressure telemetry logged 9.8 m instantaneous depth surge at 04:12 UTC (Simulated).' },
      { type: 'Incidents', source: '5 emergency dispatch alerts: moraine breach and boulder slurry propagation (Simulated).' },
      { type: 'Mobility', source: 'Upper valley access corridor 90% disrupted, emergency convoys halted (Simulated).' },
      { type: 'Timestamp', source: '2026-08-26T06:00:00Z' },
    ],

    // Snapshot history for temporal deltas
    timeline: {
      T0: { floodProbability: 0.10, rainfall: 22.0, riverLevel: 2.2, traffic: 0.15 },
      T1: { floodProbability: 0.25, rainfall: 65.0, riverLevel: 3.5, traffic: 0.25 },
      T2: { floodProbability: 0.85, rainfall: 110.0, riverLevel: 7.8, traffic: 0.65 },
      T3: { floodProbability: 0.92, rainfall: 130.0, riverLevel: 9.2, traffic: 0.80 },
      T4: { floodProbability: 0.94, rainfall: 138.5, riverLevel: 9.8, traffic: 0.88 },
    },
  },
  {
    zoneId: 'ZONE-NP-02',
    name: 'Rasuwagadhi Border Post & Customs',
    sector: 'International Border Gate',
    latitude: 28.2808,
    longitude: 85.3780,
    altitude: 1818,
    timestamp: '2026-08-26T06:00:00Z',
    provenance: 'SIMULATED',

    satelliteFloodProbability: 0.88,
    rainfall: 112.0,
    riverLevel: 8.6,
    sensorStatus: 'DEGRADED',
    sensorConfidence: 0.58, // Low confidence -> flagged for human review!
    cloudCoverPenalty: 0.15,

    satellite: {
      floodProbability: 0.88,
      changeDetected: true,
      changeMagnitude: 0.84,
      imageryDate: '2026-08-26T04:40:00Z',
      source: 'Vantor WorldView-3 / Sentinel-1 SAR',
      status: 'available',
      provenance: 'SIMULATED',
    },
    weather: {
      rainfallMm24h: 112.0,
      rainfallTrend: 'rising',
      precipitationIntensity: 0.78,
      source: 'Border Post Automated Precipitation Sensor',
      status: 'available',
      provenance: 'SIMULATED',
    },
    sensor: {
      riverLevelM: 8.6,
      riverLevelTrend: 'rising',
      sensorStatus: 'degraded',
      thresholdExceeded: true,
      source: 'Hydro-acoustic Stage Sensor',
      status: 'degraded', // Low telemetry confidence
      provenance: 'SIMULATED',
    },
    incident: {
      reportCount: 4,
      severity: 'high',
      keywords: ['customs yard flooded', 'freight stuck', 'bank overtopping', 'power outage'],
      source: 'Simulated Incident Reports',
      status: 'available',
      provenance: 'SIMULATED',
    },
    mobility: {
      trafficCongestion: 0.94,
      transitDisruption: 0.88,
      bikeshareAvailability: 0.05,
      routeDisruption: 0.92,
      source: 'Border Corridor Freight Monitoring',
      status: 'available',
      provenance: 'SIMULATED',
    },

    polygon: [
      [85.368, 28.288],
      [85.388, 28.285],
      [85.385, 28.273],
      [85.365, 28.275],
      [85.368, 28.288],
    ],
    evidence: [
      { type: 'Satellite', source: 'Vantor WorldView-3 comparison imagery shows bank overtopping and sediment coverage across border tarmac (Simulated).' },
      { type: 'Weather', source: 'Border post automated precipitation sensor logged 112.0 mm accumulation before power loss (Simulated).' },
      { type: 'Sensor', source: 'Hydro-acoustic stage sensor in degraded battery mode reporting intermittent packet telemetry (Simulated).' },
      { type: 'Incidents', source: '4 customs dispatch reports: freight trucks trapped on flooded border apron (Simulated).' },
      { type: 'Mobility', source: 'Cross-border freight corridor 92% disrupted, customs clearance halted (Simulated).' },
      { type: 'Timestamp', source: '2026-08-26T06:00:00Z' },
    ],

    timeline: {
      T0: { floodProbability: 0.08, rainfall: 18.0, riverLevel: 2.0, traffic: 0.20 },
      T1: { floodProbability: 0.20, rainfall: 50.0, riverLevel: 3.2, traffic: 0.35 },
      T2: { floodProbability: 0.60, rainfall: 88.0, riverLevel: 5.8, traffic: 0.70 },
      T3: { floodProbability: 0.82, rainfall: 104.0, riverLevel: 7.9, traffic: 0.88 },
      T4: { floodProbability: 0.88, rainfall: 112.0, riverLevel: 8.6, traffic: 0.94 },
    },
  },
  {
    zoneId: 'ZONE-NP-03',
    name: 'Timure Settlement & Highway Corridor',
    sector: 'Middle Canyon Reach',
    latitude: 28.2519,
    longitude: 85.3666,
    altitude: 1689,
    timestamp: '2026-08-26T06:00:00Z',
    provenance: 'SIMULATED',

    satelliteFloodProbability: 0.79,
    rainfall: 96.0,
    riverLevel: 7.7,
    sensorStatus: 'ACTIVE',
    sensorConfidence: 0.88,
    cloudCoverPenalty: 0.05,

    satellite: {
      floodProbability: 0.79,
      changeDetected: true,
      changeMagnitude: 0.76,
      imageryDate: '2026-08-26T05:05:00Z',
      source: 'Copernicus Sentinel-1 SAR',
      status: 'available',
      provenance: 'SIMULATED',
    },
    weather: {
      rainfallMm24h: 96.0,
      rainfallTrend: 'rising',
      precipitationIntensity: 0.70,
      source: 'Timure Valley Rainfall Gauge',
      status: 'available',
      provenance: 'SIMULATED',
    },
    sensor: {
      riverLevelM: 7.7,
      riverLevelTrend: 'rising',
      sensorStatus: 'online',
      thresholdExceeded: true,
      source: 'Ultrasonic River Gauge at Highway Culvert',
      status: 'available',
      provenance: 'SIMULATED',
    },
    incident: {
      reportCount: 3,
      severity: 'high',
      keywords: ['highway blocked', 'settlement evacuation', 'mudflow debris', 'bridge approach scoured'],
      source: 'Simulated Incident Reports',
      status: 'available',
      provenance: 'SIMULATED',
    },
    mobility: {
      trafficCongestion: 0.84,
      transitDisruption: 0.78,
      bikeshareAvailability: 0.10,
      routeDisruption: 0.86,
      source: 'National Highway 04 Telemetry',
      status: 'available',
      provenance: 'SIMULATED',
    },

    polygon: [
      [85.356, 28.259],
      [85.378, 28.257],
      [85.375, 28.244],
      [85.353, 28.246],
      [85.356, 28.259],
    ],
    evidence: [
      { type: 'Satellite', source: 'Copernicus Sentinel-1 SAR coherence drop confirms extensive floodplain inundation and debris deposits (Simulated).' },
      { type: 'Weather', source: 'Timure valley rainfall gauge: 96.0 mm recorded in prior 12 hours (Simulated).' },
      { type: 'Sensor', source: 'Ultrasonic river gauge at highway culvert reporting 7.7 m (2.7 m above flood stage) (Simulated).' },
      { type: 'Incidents', source: '3 municipal emergency reports: evacuation ordered along lower residential terraces (Simulated).' },
      { type: 'Mobility', source: 'Highway 04 canyon corridor cut by debris flow; route disruption at 86% (Simulated).' },
      { type: 'Timestamp', source: '2026-08-26T06:00:00Z' },
    ],

    timeline: {
      T0: { floodProbability: 0.05, rainfall: 15.0, riverLevel: 1.8, traffic: 0.15 },
      T1: { floodProbability: 0.15, rainfall: 42.0, riverLevel: 2.8, traffic: 0.30 },
      T2: { floodProbability: 0.45, rainfall: 70.0, riverLevel: 4.8, traffic: 0.55 },
      T3: { floodProbability: 0.70, rainfall: 88.0, riverLevel: 6.9, traffic: 0.78 },
      T4: { floodProbability: 0.79, rainfall: 96.0, riverLevel: 7.7, traffic: 0.84 },
    },
  },
  {
    zoneId: 'ZONE-NP-04',
    name: 'Syabru Besi Confluence & Bridges',
    sector: 'Langtang Khola Confluence',
    latitude: 28.1603,
    longitude: 85.3326,
    altitude: 1417,
    timestamp: '2026-08-26T06:00:00Z',
    provenance: 'SIMULATED',

    satelliteFloodProbability: 0.58,
    rainfall: 84.0,
    riverLevel: 6.1,
    sensorStatus: 'ACTIVE',
    sensorConfidence: 0.86,
    cloudCoverPenalty: 0.05,

    satellite: {
      floodProbability: 0.58,
      changeDetected: true,
      changeMagnitude: 0.52,
      imageryDate: '2026-08-26T05:35:00Z',
      source: 'Sentinel-2 Multispectral',
      status: 'available',
      provenance: 'SIMULATED',
    },
    weather: {
      rainfallMm24h: 84.0,
      rainfallTrend: 'stable',
      precipitationIntensity: 0.58,
      source: 'Syabru Besi Automatic Weather Station',
      status: 'available',
      provenance: 'SIMULATED',
    },
    sensor: {
      riverLevelM: 6.1,
      riverLevelTrend: 'rising',
      sensorStatus: 'online',
      thresholdExceeded: false,
      source: 'Trishuli-Langtang Confluence Telemetry Gauge',
      status: 'available',
      provenance: 'SIMULATED',
    },
    incident: {
      reportCount: 2,
      severity: 'medium',
      keywords: ['suspension bridge advisory', 'turbulent sediment flow', 'pedestrian bridge closed'],
      source: 'Simulated Incident Reports',
      status: 'available',
      provenance: 'SIMULATED',
    },
    mobility: {
      trafficCongestion: 0.62,
      transitDisruption: 0.52,
      bikeshareAvailability: 0.28,
      routeDisruption: 0.58,
      source: 'Town Road Network Monitor',
      status: 'available',
      provenance: 'SIMULATED',
    },

    polygon: [
      [85.321, 28.168],
      [85.344, 28.165],
      [85.341, 28.152],
      [85.318, 28.155],
      [85.321, 28.168],
    ],
    evidence: [
      { type: 'Satellite', source: 'Partial cloud clearance: Sentinel-2 true-color shows heavy river sediment and bank scour (Simulated).' },
      { type: 'Weather', source: 'Syabru Besi automatic weather station logged 84.0 mm rainfall (Simulated).' },
      { type: 'Sensor', source: 'Trishuli-Langtang confluence telemetry gauge reading 6.1 m stage (Simulated).' },
      { type: 'Incidents', source: '2 local police advisories: suspension bridges closed to pedestrian traffic (Simulated).' },
      { type: 'Mobility', source: 'Town arterial roads restricted to emergency services only; 58% route disruption (Simulated).' },
      { type: 'Timestamp', source: '2026-08-26T06:00:00Z' },
    ],

    timeline: {
      T0: { floodProbability: 0.05, rainfall: 12.0, riverLevel: 1.6, traffic: 0.12 },
      T1: { floodProbability: 0.10, rainfall: 35.0, riverLevel: 2.2, traffic: 0.20 },
      T2: { floodProbability: 0.25, rainfall: 58.0, riverLevel: 3.6, traffic: 0.38 },
      T3: { floodProbability: 0.45, rainfall: 74.0, riverLevel: 5.1, traffic: 0.52 },
      T4: { floodProbability: 0.58, rainfall: 84.0, riverLevel: 6.1, traffic: 0.62 },
    },
  },
  {
    zoneId: 'ZONE-NP-05',
    name: 'Mailung Hydropower Intake & Bridge',
    sector: 'Upper Trishuli Reach',
    latitude: 28.0909,
    longitude: 85.2323,
    altitude: 950,
    timestamp: '2026-08-26T06:00:00Z',
    provenance: 'SIMULATED',

    satelliteFloodProbability: 0.44,
    rainfall: 68.0,
    riverLevel: 5.2,
    sensorStatus: 'OFFLINE',
    sensorConfidence: 0.50, // Low confidence -> flagged for human review!
    cloudCoverPenalty: 0.20,

    satellite: {
      floodProbability: 0.44,
      changeDetected: false,
      changeMagnitude: 0.35,
      imageryDate: '2026-08-26T05:55:00Z',
      source: 'Landsat 8/9 OLI',
      status: 'available',
      provenance: 'SIMULATED',
    },
    weather: {
      rainfallMm24h: 68.0,
      rainfallTrend: 'stable',
      precipitationIntensity: 0.46,
      source: 'Hydro Project Intake Weather Sensor',
      status: 'stale', // Stale weather data
      provenance: 'SIMULATED',
    },
    sensor: {
      riverLevelM: 5.2,
      riverLevelTrend: 'stable',
      sensorStatus: 'offline', // Offline sensor telemetry!
      thresholdExceeded: false,
      source: 'Hydro Project Intake Gauge',
      status: 'offline',
      provenance: 'SIMULATED',
    },
    incident: {
      reportCount: 1,
      severity: 'medium',
      keywords: ['intake sediment alert', 'power generation paused', 'debris dam risk'],
      source: 'Simulated Incident Reports',
      status: 'available',
      provenance: 'SIMULATED',
    },
    mobility: {
      trafficCongestion: 0.45,
      transitDisruption: 0.38,
      bikeshareAvailability: 0.40,
      routeDisruption: 0.44,
      source: 'Service Access Road Telemetry',
      status: 'available',
      provenance: 'SIMULATED',
    },

    polygon: [
      [85.221, 28.099],
      [85.244, 28.096],
      [85.241, 28.082],
      [85.218, 28.085],
      [85.221, 28.099],
    ],
    evidence: [
      { type: 'Satellite', source: 'Landsat 8/9 imagery indicates high sediment plume approaching hydroelectric intake diversion (Simulated).' },
      { type: 'Weather', source: 'Hydro project intake weather sensor: 68.0 mm rain before comms outage (Simulated).' },
      { type: 'Sensor', source: 'Telemetry lost at 05:22 UTC; last recorded stage was 5.2 m (station offline, debris impact suspected) (Simulated).' },
      { type: 'Incidents', source: '1 power plant report: generation turbines tripped due to silt concentration (Simulated).' },
      { type: 'Mobility', source: 'Plant access road restricted to maintenance heavy equipment; 44% route disruption (Simulated).' },
      { type: 'Timestamp', source: '2026-08-26T06:00:00Z' },
    ],

    timeline: {
      T0: { floodProbability: 0.05, rainfall: 10.0, riverLevel: 1.5, traffic: 0.10 },
      T1: { floodProbability: 0.10, rainfall: 28.0, riverLevel: 2.0, traffic: 0.18 },
      T2: { floodProbability: 0.18, rainfall: 45.0, riverLevel: 3.1, traffic: 0.28 },
      T3: { floodProbability: 0.32, rainfall: 58.0, riverLevel: 4.4, traffic: 0.38 },
      T4: { floodProbability: 0.44, rainfall: 68.0, riverLevel: 5.2, traffic: 0.45 },
    },
  },
  {
    zoneId: 'ZONE-NP-06',
    name: 'Betrawati Bazaar & Lower River Plains',
    sector: 'Lower Trishuli Valley',
    latitude: 28.0298,
    longitude: 85.2277,
    altitude: 680,
    timestamp: '2026-08-26T06:00:00Z',
    provenance: 'SIMULATED',

    satelliteFloodProbability: 0.22,
    rainfall: 46.0,
    riverLevel: 3.4,
    sensorStatus: 'ACTIVE',
    sensorConfidence: 0.93,
    cloudCoverPenalty: 0.0,

    satellite: {
      floodProbability: 0.22,
      changeDetected: false,
      changeMagnitude: 0.15,
      imageryDate: '2026-08-26T06:20:00Z',
      source: 'Sentinel-2 Multispectral',
      status: 'available',
      provenance: 'SIMULATED',
    },
    weather: {
      rainfallMm24h: 46.0,
      rainfallTrend: 'falling',
      precipitationIntensity: 0.30,
      source: 'Betrawati Municipal AWS',
      status: 'available',
      provenance: 'SIMULATED',
    },
    sensor: {
      riverLevelM: 3.4,
      riverLevelTrend: 'stable',
      sensorStatus: 'online',
      thresholdExceeded: false,
      source: 'DHM National Hydrology Station',
      status: 'available',
      provenance: 'SIMULATED',
    },
    incident: {
      reportCount: 0,
      severity: 'low',
      keywords: ['normal flow watch', 'flood walls clear', 'levees nominal'],
      source: 'Simulated Incident Reports',
      status: 'available',
      provenance: 'SIMULATED',
    },
    mobility: {
      trafficCongestion: 0.25,
      transitDisruption: 0.18,
      bikeshareAvailability: 0.72,
      routeDisruption: 0.20,
      source: 'Betrawati Bridge Tollway',
      status: 'available',
      provenance: 'SIMULATED',
    },

    polygon: [
      [85.216, 28.038],
      [85.239, 28.035],
      [85.236, 28.021],
      [85.213, 28.024],
      [85.216, 28.038],
    ],
    evidence: [
      { type: 'Satellite', source: 'Optical Sentinel-2 shows river flow contained within regular riverbed levees (Simulated).' },
      { type: 'Weather', source: 'Betrawati municipal rainfall station recorded 46.0 mm (Simulated).' },
      { type: 'Sensor', source: 'Department of Hydrology and Meteorology (DHM) gauging station operating nominally at 3.4 m (Simulated).' },
      { type: 'Incidents', source: '0 emergency incidents recorded; flood barrier levees inspected nominal (Simulated).' },
      { type: 'Mobility', source: 'Tollway and municipal bridges open with normal commercial vehicle flow (Simulated).' },
      { type: 'Timestamp', source: '2026-08-26T06:00:00Z' },
    ],

    timeline: {
      T0: { floodProbability: 0.02, rainfall: 8.0, riverLevel: 1.2, traffic: 0.10 },
      T1: { floodProbability: 0.05, rainfall: 18.0, riverLevel: 1.6, traffic: 0.14 },
      T2: { floodProbability: 0.09, rainfall: 28.0, riverLevel: 2.1, traffic: 0.18 },
      T3: { floodProbability: 0.16, rainfall: 38.0, riverLevel: 2.8, traffic: 0.22 },
      T4: { floodProbability: 0.22, rainfall: 46.0, riverLevel: 3.4, traffic: 0.25 },
    },
  },
];

/**
 * Returns timeline snapshots metadata.
 */
export function getTimelineSnapshots() {
  return SYNTHETIC_TIMELINE_SNAPSHOTS;
}

/**
 * Returns processed zones with computed multimodal fusion scores, confidence,
 * uncertainty, agreement, completeness, mobility impact, and review queue sorting.
 *
 * @param {string} [snapshotId='T4'] Optional timeline snapshot (T0 - T4)
 */
export function getProcessedDisasterZones(snapshotId = 'T4') {
  const snapshotIdx = SYNTHETIC_TIMELINE_SNAPSHOTS.findIndex((s) => s.id === snapshotId);
  const validSnapshotId = snapshotIdx >= 0 ? snapshotId : 'T4';
  const prevSnapshotId = snapshotIdx > 0 ? SYNTHETIC_TIMELINE_SNAPSHOTS[snapshotIdx - 1].id : null;

  return SYNTHETIC_DISASTER_ZONES.map((zone) => {
    // If a specific snapshot is requested and zone has historical telemetry, adapt values
    const currentHist = zone.timeline?.[validSnapshotId];
    const prevHist = prevSnapshotId ? zone.timeline?.[prevSnapshotId] : null;

    let zoneForFusion = { ...zone };

    if (currentHist) {
      zoneForFusion = {
        ...zoneForFusion,
        satelliteFloodProbability: currentHist.floodProbability,
        rainfall: currentHist.rainfall,
        riverLevel: currentHist.riverLevel,
        satellite: {
          ...zone.satellite,
          floodProbability: currentHist.floodProbability,
        },
        weather: {
          ...zone.weather,
          rainfallMm24h: currentHist.rainfall,
        },
        sensor: {
          ...zone.sensor,
          riverLevelM: currentHist.riverLevel,
        },
        mobility: {
          ...zone.mobility,
          trafficCongestion: currentHist.traffic,
        },
      };
    }

    const previousSnapshotData = prevHist ? {
      satellite: { floodProbability: prevHist.floodProbability },
      weather: { rainfallMm24h: prevHist.rainfall },
      sensor: { riverLevelM: prevHist.riverLevel },
      mobility: { trafficCongestion: prevHist.traffic },
    } : null;

    const fusion = fuseMultimodalZone(zoneForFusion, {
      previousSnapshot: previousSnapshotData,
    });

    return {
      ...zoneForFusion,
      ...fusion,
      activeSnapshot: validSnapshotId,
    };
  });
}

/**
 * Returns summary overview for dashboard (Phase 15).
 */
export function getDisasterOverviewSummary(snapshotId = 'T4') {
  const zones = getProcessedDisasterZones(snapshotId);

  const totalZones = zones.length;
  const critical = zones.filter((z) => z.riskClassification === 'CRITICAL').length;
  const high = zones.filter((z) => z.riskClassification === 'HIGH').length;
  const moderate = zones.filter((z) => z.riskClassification === 'MODERATE').length;
  const low = zones.filter((z) => z.riskClassification === 'LOW').length;
  const reviewRequired = zones.filter((z) => z.humanReviewRequired).length;

  // Find highest risk zone
  const highestRiskZone = [...zones].sort((a, b) => b.overallRisk - a.overallRisk)[0] || null;

  return {
    totalZones,
    critical,
    high,
    moderate,
    low,
    reviewRequired,
    highestRiskZone: highestRiskZone ? {
      zoneId: highestRiskZone.zoneId,
      name: highestRiskZone.name,
      overallRisk: highestRiskZone.overallRisk,
      confidence: highestRiskZone.confidence,
      uncertainty: highestRiskZone.uncertainty,
      riskClassification: highestRiskZone.riskClassification,
      mobilityImpact: highestRiskZone.mobilityImpact,
      trend: highestRiskZone.trend,
    } : null,
    provenance: 'SIMULATED',
    disclaimer: 'Decision-support prototype. Predictions are probabilistic and require human verification. This system does not make life-critical decisions autonomously.',
  };
}
