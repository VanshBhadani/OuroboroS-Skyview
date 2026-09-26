/**
 * Multimodal Disaster Intelligence Fusion Engine (Milestone 2)
 *
 * Deterministic evidence-fusion pipeline:
 * SATELLITE + WEATHER + SENSOR + INCIDENT + MOBILITY
 *   -> MULTIMODAL DISASTER INTELLIGENCE
 *   -> RISK + CONFIDENCE + UNCERTAINTY + MOBILITY IMPACT
 *   -> HUMAN REVIEW QUEUE
 *
 * NOTE: Decision-support prototype. Predictions are probabilistic and require human
 * verification. This system does not make life-critical decisions autonomously.
 */

export const DEFAULT_MODALITY_WEIGHTS = Object.freeze({
  satellite: 0.30,
  weather: 0.20,
  sensor: 0.20,
  incident: 0.15,
  mobility: 0.15,
});

export const RISK_THRESHOLDS = Object.freeze({
  CRITICAL: 0.85,
  HIGH: 0.70,
  MODERATE: 0.40,
  LOW: 0.00,
});

function clamp(value, min = 0, max = 1) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

/**
 * Normalizes satellite evidence to [0, 1].
 */
export function normalizeSatellite(satellite) {
  if (satellite == null) return null;
  if (typeof satellite === 'number') return clamp(satellite);

  const floodProb = clamp(satellite.floodProbability ?? satellite.score ?? 0);
  const changeDetected = Boolean(satellite.changeDetected);
  const changeMag = clamp(satellite.changeMagnitude ?? 0);

  if (changeDetected && changeMag > 0) {
    return clamp(floodProb * 0.85 + changeMag * 0.15);
  }
  return floodProb;
}

/**
 * Normalizes weather evidence to [0, 1].
 * Baseline: 150mm 24h rainfall = 1.0.
 */
export function normalizeWeather(weather) {
  if (weather == null) return null;
  if (typeof weather === 'number') return clamp(weather / 150);

  const rainfallMm = Number(weather.rainfallMm24h ?? weather.rainfall ?? 0);
  const rainScore = clamp(rainfallMm / 150);

  if (weather.precipitationIntensity !== undefined && weather.precipitationIntensity !== null) {
    const intensity = clamp(weather.precipitationIntensity);
    return clamp(rainScore * 0.70 + intensity * 0.30);
  }
  return rainScore;
}

/**
 * Normalizes sensor telemetry to [0, 1].
 * Baseline: 10m river stage = 1.0.
 */
export function normalizeSensor(sensor) {
  if (sensor == null) return null;
  if (typeof sensor === 'number') return clamp(sensor / 10);

  const riverLevelM = Number(sensor.riverLevelM ?? sensor.riverLevel ?? 0);
  let stageScore = clamp(riverLevelM / 10);

  if (sensor.thresholdExceeded && stageScore < 0.70) {
    stageScore = Math.max(stageScore, 0.70);
  }
  return stageScore;
}

/**
 * Normalizes incident report data to [0, 1].
 * Accounts for report count (5 reports = 1.0) and severity weight.
 */
export function normalizeIncident(incident) {
  if (incident == null) return null;
  if (typeof incident === 'number') return clamp(incident);

  const severityWeights = {
    critical: 1.0,
    high: 0.75,
    medium: 0.50,
    low: 0.25,
  };

  const sevStr = String(incident.severity || '').toLowerCase();
  const sevScore = severityWeights[sevStr] ?? 0;
  const count = Number(incident.reportCount ?? 0);
  const countScore = clamp(count / 5);

  if (sevScore > 0) {
    return clamp(sevScore * 0.60 + countScore * 0.40);
  }
  return countScore;
}

/**
 * Normalizes mobility telemetry to [0, 1].
 * Mobility impact: traffic (40%) + transit (25%) + route disruption (35%).
 */
export function normalizeMobility(mobility) {
  if (mobility == null) return null;
  if (typeof mobility === 'number') return clamp(mobility);

  const traffic = clamp(mobility.trafficCongestion ?? mobility.trafficImpact ?? 0);
  const transit = clamp(mobility.transitDisruption ?? mobility.transitImpact ?? 0);
  const route = clamp(mobility.routeDisruption ?? mobility.routeImpact ?? 0);

  return clamp(traffic * 0.40 + transit * 0.25 + route * 0.35);
}

/**
 * Derives operational mobility impact metrics around an affected zone.
 * Formula: trafficCongestion * 0.40 + transitDisruption * 0.25 + routeDisruption * 0.35
 */
export function deriveMobilityImpact(mobility) {
  if (!mobility || typeof mobility !== 'object') {
    return {
      mobilityImpact: 0,
      trafficImpact: 0,
      transitImpact: 0,
      routeImpact: 0,
    };
  }

  const trafficImpact = clamp(mobility.trafficCongestion ?? mobility.trafficImpact ?? 0);
  const transitImpact = clamp(mobility.transitDisruption ?? mobility.transitImpact ?? 0);
  const routeImpact = clamp(mobility.routeDisruption ?? mobility.routeImpact ?? 0);
  const mobilityImpact = +(trafficImpact * 0.40 + transitImpact * 0.25 + routeImpact * 0.35).toFixed(2);

  return {
    mobilityImpact,
    trafficImpact,
    transitImpact,
    routeImpact,
  };
}

/**
 * Determines modality availability status.
 * Values: 'available' | 'degraded' | 'stale' | 'offline' | 'missing'
 */
export function resolveModalityStatus(data, modalityKey) {
  if (data == null) return 'missing';
  if (typeof data !== 'object') return 'available';

  if (data.status) {
    const s = String(data.status).toLowerCase();
    if (['offline', 'stale', 'degraded', 'available', 'missing', 'unavailable'].includes(s)) {
      return s === 'unavailable' ? 'missing' : s;
    }
  }

  if (modalityKey === 'sensor') {
    const sensorStat = String(data.sensorStatus || '').toLowerCase();
    if (sensorStat === 'offline') return 'offline';
    if (sensorStat === 'degraded') return 'degraded';
  }

  return 'available';
}

/**
 * Calculates evidence completeness across the 5 modalities.
 * 0 -> no evidence, 1 -> complete multimodal evidence.
 */
export function calculateEvidenceCompleteness(modalityStatuses) {
  const statusValues = {
    available: 1.0,
    degraded: 0.75,
    stale: 0.50,
    offline: 0.10,
    missing: 0.0,
  };

  const keys = ['satellite', 'weather', 'sensor', 'incident', 'mobility'];
  let totalScore = 0;

  for (const k of keys) {
    const st = modalityStatuses[k] || 'missing';
    totalScore += statusValues[st] ?? 0;
  }

  return +(totalScore / keys.length).toFixed(2);
}

/**
 * Computes deterministic cross-modal agreement score.
 * agreementScore = 1 - normalizedVariance(availableModalityScores)
 * Clamped to [0, 1].
 */
export function calculateCrossModalAgreement(modalityScores, modalityStatuses) {
  const availableScores = [];

  for (const [key, score] of Object.entries(modalityScores)) {
    const status = modalityStatuses[key];
    if (status !== 'missing' && status !== 'offline' && score !== null && Number.isFinite(score)) {
      availableScores.push(score);
    }
  }

  if (availableScores.length < 2) {
    // If only 1 or 0 modalities available, agreement cannot be computed
    return availableScores.length === 1 ? 0.70 : 0.0;
  }

  const mean = availableScores.reduce((sum, v) => sum + v, 0) / availableScores.length;
  const variance = availableScores.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / availableScores.length;
  // Maximum possible variance for numbers in [0, 1] is 0.25 (e.g. 0 and 1)
  const normalizedVariance = clamp(variance / 0.25);
  return +(1 - normalizedVariance).toFixed(2);
}

/**
 * Computes confidence and uncertainty deterministically.
 * confidence = weighted evidence availability + cross-modal agreement + sensor health + evidence freshness
 * uncertainty = 1 - confidence
 */
export function calculateConfidenceAndUncertainty({
  evidenceCompleteness,
  crossModalAgreement,
  sensorStatus = 'online',
  hasStaleEvidence = false,
  cloudCoverPenalty = 0.0,
}) {
  let sensorHealth = 1.0;
  const sStat = String(sensorStatus || '').toLowerCase();
  if (sStat === 'offline') {
    sensorHealth = 0.15;
  } else if (sStat === 'degraded') {
    sensorHealth = 0.55;
  }

  const freshness = hasStaleEvidence ? 0.50 : 1.0;

  const rawConfidence =
    0.35 * evidenceCompleteness +
    0.30 * crossModalAgreement +
    0.20 * sensorHealth +
    0.15 * freshness -
    Number(cloudCoverPenalty || 0);

  const confidence = +clamp(rawConfidence, 0.10, 0.99).toFixed(2);
  const uncertainty = +(1 - confidence).toFixed(2);

  return { confidence, uncertainty, sensorHealth };
}

/**
 * Classifies affected zone by overall fused risk.
 * CRITICAL >= 0.85, HIGH >= 0.70, MODERATE >= 0.40, LOW < 0.40, UNKNOWN if insufficient data.
 */
export function classifyZoneRisk(overallRisk, evidenceCompleteness) {
  if (evidenceCompleteness < 0.20 || !Number.isFinite(overallRisk)) {
    return 'UNKNOWN';
  }
  if (overallRisk >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (overallRisk >= RISK_THRESHOLDS.HIGH) return 'HIGH';
  if (overallRisk >= RISK_THRESHOLDS.MODERATE) return 'MODERATE';
  return 'LOW';
}

/**
 * Computes temporal change deltas and trend between two snapshot states.
 */
export function computeTemporalDeltas(current, previous) {
  if (!previous) {
    return {
      riverLevelDelta: 0,
      rainfallDelta: 0,
      floodProbabilityDelta: 0,
      trafficDelta: 0,
      trend: 'STABLE',
    };
  }

  const currRiver = Number(current.sensor?.riverLevelM ?? current.riverLevel ?? 0);
  const prevRiver = Number(previous.sensor?.riverLevelM ?? previous.riverLevel ?? 0);
  const riverLevelDelta = +(currRiver - prevRiver).toFixed(2);

  const currRain = Number(current.weather?.rainfallMm24h ?? current.rainfall ?? 0);
  const prevRain = Number(previous.weather?.rainfallMm24h ?? previous.rainfall ?? 0);
  const rainfallDelta = +(currRain - prevRain).toFixed(1);

  const currSat = Number(current.satellite?.floodProbability ?? current.satelliteFloodProbability ?? 0);
  const prevSat = Number(previous.satellite?.floodProbability ?? previous.satelliteFloodProbability ?? 0);
  const floodProbabilityDelta = +(currSat - prevSat).toFixed(2);

  const currTraffic = Number(current.mobility?.trafficCongestion ?? current.trafficCongestion ?? 0);
  const prevTraffic = Number(previous.mobility?.trafficCongestion ?? previous.trafficCongestion ?? 0);
  const trafficDelta = +(currTraffic - prevTraffic).toFixed(2);

  // Determine aggregate temporal trend
  const scoreDelta = floodProbabilityDelta * 0.40 + (riverLevelDelta / 5) * 0.35 + (rainfallDelta / 50) * 0.25;
  let trend = 'STABLE';
  if (scoreDelta > 0.05 || riverLevelDelta >= 0.4 || floodProbabilityDelta >= 0.08) {
    trend = 'RISING';
  } else if (scoreDelta < -0.05 || riverLevelDelta <= -0.4 || floodProbabilityDelta <= -0.08) {
    trend = 'FALLING';
  }

  return {
    riverLevelDelta,
    rainfallDelta,
    floodProbabilityDelta,
    trafficDelta,
    trend,
  };
}

/**
 * Calculates human review priority score and generates explainable review reasons.
 */
export function evaluateReviewPriority({
  overallRisk,
  confidence,
  uncertainty,
  evidenceCompleteness,
  sensorHealth,
  agreementScore,
  mobilityImpact,
  trend = 'STABLE',
  modalityScores = {},
  modalityStatuses = {},
  rawZone = {},
}) {
  const reasons = [];

  // Deterministic reason construction
  if (overallRisk >= 0.85) {
    reasons.push(`Critical multimodal disaster risk (${(overallRisk * 100).toFixed(0)}%)`);
  } else if (overallRisk >= 0.70) {
    reasons.push(`High multimodal disaster risk (${(overallRisk * 100).toFixed(0)}%)`);
  }

  if (modalityScores.satellite != null && modalityScores.satellite >= 0.75) {
    reasons.push(`Satellite imagery indicates extensive inundation (${(modalityScores.satellite * 100).toFixed(0)}% probability)`);
  }

  const riverLevel = rawZone.sensor?.riverLevelM ?? rawZone.riverLevel;
  if (riverLevel != null && riverLevel >= 7.5) {
    reasons.push(`River stage exceeds flood hazard threshold (${riverLevel} m)`);
  }

  if (modalityStatuses.sensor === 'offline') {
    reasons.push('Sensor telemetry offline — physical telemetry lost');
  } else if (modalityStatuses.sensor === 'degraded') {
    reasons.push('Sensor telemetry degraded — packet loss / battery advisory');
  }

  if (modalityStatuses.weather === 'stale') {
    reasons.push('Weather radar / precipitation gauge feed is stale');
  }

  if (trend === 'RISING') {
    reasons.push('Rising flood stage & precipitation trend detected');
  }

  if (agreementScore < 0.65) {
    reasons.push(`Cross-modal disagreement (${(agreementScore * 100).toFixed(0)}% agreement)`);
  }

  if (mobilityImpact >= 0.65) {
    reasons.push(`Severe arterial corridor & transit disruption (${(mobilityImpact * 100).toFixed(0)}%)`);
  }

  if (uncertainty >= 0.35) {
    reasons.push(`Elevated analytical uncertainty (±${(uncertainty * 100).toFixed(0)}%) requiring human verification`);
  }

  // Review Priority scoring model:
  // Combines risk + uncertainty + evidence gap + sensor issue + mobility impact + trend
  const riskContrib = overallRisk * 0.35;
  const uncertaintyContrib = uncertainty * 0.25;
  const gapContrib = (1 - evidenceCompleteness) * 0.15;
  const sensorIssueContrib = (1 - sensorHealth) * 0.10;
  const disagreementContrib = (1 - agreementScore) * 0.05;
  const mobilityContrib = mobilityImpact * 0.10;
  const trendBoost = trend === 'RISING' ? 0.08 : (trend === 'FALLING' ? -0.04 : 0);

  const priorityScore = clamp(
    riskContrib +
    uncertaintyContrib +
    gapContrib +
    sensorIssueContrib +
    disagreementContrib +
    mobilityContrib +
    trendBoost
  );

  let priority = 'LOW';
  let humanReviewRequired = false;

  if (priorityScore >= 0.55 || overallRisk >= 0.70 || confidence < 0.65 || modalityStatuses.sensor === 'offline') {
    priority = 'HIGH';
    humanReviewRequired = true;
  } else if (priorityScore >= 0.35 || overallRisk >= 0.40) {
    priority = 'MEDIUM';
    if (uncertainty >= 0.30 || modalityStatuses.sensor === 'degraded') {
      humanReviewRequired = true;
    }
  }

  return {
    priority,
    priorityScore: +priorityScore.toFixed(3),
    humanReviewRequired,
    reasons,
  };
}

/**
 * Main multimodal fusion engine.
 * Computes deterministic risk, confidence, uncertainty, cross-modal agreement,
 * completeness, mobility impact, and review queue priority.
 */
export function fuseMultimodalZone(zoneInput, options = {}) {
  const previousSnapshot = options.previousSnapshot || null;

  // Extract raw modalities
  const rawSatellite = zoneInput.satellite ?? (
    zoneInput.satelliteFloodProbability !== undefined
      ? {
          floodProbability: zoneInput.satelliteFloodProbability,
          changeDetected: zoneInput.satelliteFloodProbability > 0.5,
          changeMagnitude: zoneInput.satelliteFloodProbability,
          source: 'Simulated Satellite Feeds',
          status: 'available',
        }
      : null
  );

  const rawWeather = zoneInput.weather ?? (
    zoneInput.rainfall !== undefined
      ? {
          rainfallMm24h: zoneInput.rainfall,
          rainfallTrend: 'rising',
          precipitationIntensity: clamp(zoneInput.rainfall / 150),
          source: 'Simulated Weather AWS',
          status: 'available',
        }
      : null
  );

  const rawSensor = zoneInput.sensor ?? (
    zoneInput.riverLevel !== undefined
      ? {
          riverLevelM: zoneInput.riverLevel,
          riverLevelTrend: 'rising',
          sensorStatus: zoneInput.sensorStatus === 'DEGRADED' ? 'degraded' : (zoneInput.sensorStatus === 'OFFLINE' ? 'offline' : 'online'),
          thresholdExceeded: zoneInput.riverLevel > 7.0,
          source: 'Simulated River Sensor',
          status: zoneInput.sensorStatus === 'OFFLINE' ? 'offline' : (zoneInput.sensorStatus === 'DEGRADED' ? 'degraded' : 'available'),
        }
      : null
  );

  const rawIncident = zoneInput.incident ?? {
    reportCount: Math.round(clamp(zoneInput.satelliteFloodProbability ?? 0.5) * 4),
    severity: (zoneInput.satelliteFloodProbability ?? 0) > 0.8 ? 'critical' : ((zoneInput.satelliteFloodProbability ?? 0) > 0.6 ? 'high' : 'medium'),
    keywords: ['water level monitoring', 'simulated incident dispatch'],
    source: 'Simulated Incident Reports',
    status: 'available',
  };

  const rawMobility = zoneInput.mobility ?? {
    trafficCongestion: clamp((zoneInput.rainfall ?? 50) / 150 * 0.9),
    transitDisruption: clamp((zoneInput.riverLevel ?? 4) / 10 * 0.8),
    bikeshareAvailability: clamp(1 - (zoneInput.rainfall ?? 50) / 150),
    routeDisruption: clamp((zoneInput.riverLevel ?? 4) / 10 * 0.85),
    source: 'Simulated Corridor Mobility',
    status: 'available',
  };

  // Determine individual modality statuses
  const modalityStatuses = {
    satellite: resolveModalityStatus(rawSatellite, 'satellite'),
    weather: resolveModalityStatus(rawWeather, 'weather'),
    sensor: resolveModalityStatus(rawSensor, 'sensor'),
    incident: resolveModalityStatus(rawIncident, 'incident'),
    mobility: resolveModalityStatus(rawMobility, 'mobility'),
  };

  // Normalize scores
  const satelliteScore = normalizeSatellite(rawSatellite);
  const weatherScore = normalizeWeather(rawWeather);
  const sensorScore = normalizeSensor(rawSensor);
  const incidentScore = normalizeIncident(rawIncident);
  const mobilityScore = normalizeMobility(rawMobility);

  const modalityScores = {
    satellite: satelliteScore,
    weather: weatherScore,
    sensor: sensorScore,
    incident: incidentScore,
    mobility: mobilityScore,
  };

  // Weighted fusion with dynamic reweighting for missing modalities
  const baseWeights = { ...DEFAULT_MODALITY_WEIGHTS };
  let totalAvailableWeight = 0;
  let weightedRiskSum = 0;

  for (const [key, score] of Object.entries(modalityScores)) {
    const status = modalityStatuses[key];
    const weight = baseWeights[key];
    if (status !== 'missing' && score !== null && Number.isFinite(score)) {
      totalAvailableWeight += weight;
      weightedRiskSum += score * weight;
    }
  }

  const overallRisk = totalAvailableWeight > 0
    ? +(weightedRiskSum / totalAvailableWeight).toFixed(3)
    : 0;

  // Normalized active weights
  const activeWeights = {};
  for (const [key, weight] of Object.entries(baseWeights)) {
    activeWeights[key] = totalAvailableWeight > 0 && modalityStatuses[key] !== 'missing'
      ? +(weight / totalAvailableWeight).toFixed(3)
      : 0;
  }

  // Evidence Completeness
  const evidenceCompleteness = calculateEvidenceCompleteness(modalityStatuses);

  // Cross-Modal Agreement
  const crossModalAgreement = calculateCrossModalAgreement(modalityScores, modalityStatuses);

  // Sensor Health & Confidence & Uncertainty
  const sensorStatus = rawSensor?.sensorStatus || zoneInput.sensorStatus || 'online';
  const hasStaleEvidence = Object.values(modalityStatuses).includes('stale');
  const cloudCoverPenalty = Number(zoneInput.cloudCoverPenalty ?? 0);

  const { confidence, uncertainty, sensorHealth } = calculateConfidenceAndUncertainty({
    evidenceCompleteness,
    crossModalAgreement,
    sensorStatus,
    hasStaleEvidence,
    cloudCoverPenalty,
  });

  // Mobility Impact Breakdown
  const mobilityImpactData = deriveMobilityImpact(rawMobility);

  // Risk Classification
  const riskClassification = classifyZoneRisk(overallRisk, evidenceCompleteness);

  // Temporal Changes & Trends
  const deltas = computeTemporalDeltas(
    { sensor: rawSensor, weather: rawWeather, satellite: rawSatellite, mobility: rawMobility },
    previousSnapshot
  );

  // Review Prioritization & Explainability
  const reviewEval = evaluateReviewPriority({
    overallRisk,
    confidence,
    uncertainty,
    evidenceCompleteness,
    sensorHealth,
    agreementScore: crossModalAgreement,
    mobilityImpact: mobilityImpactData.mobilityImpact,
    trend: deltas.trend,
    modalityScores,
    modalityStatuses,
    rawZone: zoneInput,
  });

  return {
    overallRisk,
    riskClassification,
    fusedRisk: overallRisk, // Backward compatibility alias
    confidence,
    uncertainty,
    priority: reviewEval.priority,
    reviewPriority: reviewEval.priority,
    reviewPriorityScore: reviewEval.priorityScore,
    humanReviewRequired: reviewEval.humanReviewRequired,
    reviewReasons: reviewEval.reasons,
    evidenceCompleteness,
    modalityStatus: modalityStatuses,
    crossModalAgreement,
    modalityScores,
    modalityWeights: activeWeights,
    mobilityImpact: mobilityImpactData.mobilityImpact,
    mobilityImpactData,
    trend: deltas.trend,
    deltas,
    provenance: 'SIMULATED',
    // Normalized component scores for backward compatibility
    imageScore: satelliteScore ?? 0,
    weatherScore: weatherScore ?? 0,
    sensorScore: sensorScore ?? 0,
    incidentScore: incidentScore ?? 0,
    mobilityScore: mobilityScore ?? 0,
  };
}
