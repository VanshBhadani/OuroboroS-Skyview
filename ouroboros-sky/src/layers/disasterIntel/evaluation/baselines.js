import { calculateMetrics } from './metrics.js';

/**
 * Trains a simple threshold classifier on development data by grid search.
 * @param {Array} devSamples
 * @param {(sample: object) => number} scoreExtractor
 * @returns {number} optimalThreshold
 */
export function tuneThreshold(devSamples, scoreExtractor) {
  let bestF1 = -1;
  let bestTh = 0.5;

  for (let th = 0.1; th <= 0.9; th += 0.05) {
    const roundTh = Number(th.toFixed(2));
    const results = devSamples.map((s) => ({
      groundTruth: s.label,
      prediction: scoreExtractor(s) >= roundTh ? 1 : 0,
    }));
    const m = calculateMetrics(results);
    if (m.f1 > bestF1) {
      bestF1 = m.f1;
      bestTh = roundTh;
    }
  }

  return bestTh;
}

/**
 * Satellite-only baseline model.
 * Uses only Vantor WorldView-2/3 optical change features.
 */
export class SatelliteBaseline {
  constructor(threshold = 0.45) {
    this.name = 'satellite_only';
    this.modality = 'satellite';
    this.threshold = threshold;
  }

  score(sample) {
    return sample?.modalities?.satellite?.features?.opticalChangeScore ?? 0;
  }

  predict(sample) {
    return this.score(sample) >= this.threshold ? 1 : 0;
  }

  fit(devSamples) {
    this.threshold = tuneThreshold(devSamples, (s) => this.score(s));
    return this;
  }

  evaluate(testSamples) {
    const evaluations = testSamples.map((s) => ({
      sampleId: s.sampleId,
      groundTruth: s.label,
      score: this.score(s),
      prediction: this.predict(s),
      location: s.location,
      provenance: s.modalities.satellite,
    }));

    return {
      model: this.name,
      modality: this.modality,
      threshold: this.threshold,
      metrics: calculateMetrics(evaluations),
      evaluations,
    };
  }
}

/**
 * Weather/Hydrology-only baseline model.
 * Uses only Nepal DHM rainfall & topographic elevation channel proximity features.
 */
export class WeatherHydrologyBaseline {
  constructor(threshold = 0.5) {
    this.name = 'weather_only';
    this.modality = 'weather_hydrology';
    this.threshold = threshold;
  }

  score(sample) {
    return sample?.modalities?.weatherHydrology?.features?.hydroRiskScore ?? 0;
  }

  predict(sample) {
    return this.score(sample) >= this.threshold ? 1 : 0;
  }

  fit(devSamples) {
    this.threshold = tuneThreshold(devSamples, (s) => this.score(s));
    return this;
  }

  evaluate(testSamples) {
    const evaluations = testSamples.map((s) => ({
      sampleId: s.sampleId,
      groundTruth: s.label,
      score: this.score(s),
      prediction: this.predict(s),
      location: s.location,
      provenance: s.modalities.weatherHydrology,
    }));

    return {
      model: this.name,
      modality: this.modality,
      threshold: this.threshold,
      metrics: calculateMetrics(evaluations),
      evaluations,
    };
  }
}
