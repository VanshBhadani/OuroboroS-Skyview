import { loadEvaluationDataset } from './datasetLoader.js';
import { SatelliteBaseline, WeatherHydrologyBaseline } from './baselines.js';
import { MultimodalFusionModel } from './multimodalAdapter.js';

export const DATASET_LIMITATIONS = Object.freeze([
  'Geographic Specificity: Data reflects a steep Himalayan V-shaped mountain river gorge (Trishuli/Bhote Koshi); physical inundation dynamics differ in wide flat alluvial floodplains.',
  'Temporal Baseline Gap: Satellite pre-event reference (WorldView-2, Oct 2021) captures historical geomorphology and the July 2025 flood rather than an immediate pre-storm baseline.',
  'Optical Occlusion: High-relief mountain terrain introduces steep shadows and localized cloud edge variance in optical satellite sensors.',
  'Ground Observer Density: Witness anchors cluster along the highway and settlements (Syabrubesi, Dhunche, Timure); unpopulated upper headwaters lack direct eyewitness coverage.',
  'Prototype Operational Limitation: This evaluation establishes comparative multimodal performance on public disaster data and does not establish certified real-world life-safety or emergency agency performance.',
]);

/**
 * Runs complete held-out evaluation across single-modality baselines and multimodal fusion.
 * Pure ES module function usable in both browser and Node.
 * @param {object} [options]
 * @param {object} [options.customDataset]
 * @returns {object} Full evaluation results
 */
export function runEvaluation({ customDataset } = {}) {
  const dataset = loadEvaluationDataset(customDataset);
  const devSamples = [...dataset.train, ...dataset.validation];
  const testSamples = dataset.test;

  // 1. Train and evaluate Satellite-Only Baseline
  const satBaseline = new SatelliteBaseline().fit(devSamples);
  const satResults = satBaseline.evaluate(testSamples);

  // 2. Train and evaluate Weather/Hydrology-Only Baseline
  const hydroBaseline = new WeatherHydrologyBaseline().fit(devSamples);
  const hydroResults = hydroBaseline.evaluate(testSamples);

  // 3. Train and evaluate Multimodal Fusion Model
  const multiModel = new MultimodalFusionModel().fit(devSamples);
  const multiResults = multiModel.evaluate(testSamples);

  // Human Review Cases identification
  const humanReviewCases = multiResults.evaluations
    .filter((e) => e.humanReviewRequired || e.uncertainty >= 0.35 || e.crossModalAgreement < 0.65)
    .map((e) => ({
      sampleId: e.sampleId,
      groundTruth: e.groundTruth,
      predictedRisk: e.score,
      prediction: e.prediction,
      confidence: e.confidence,
      uncertainty: e.uncertainty,
      crossModalAgreement: e.crossModalAgreement,
      reasons: e.reviewReasons,
      location: e.location,
    }));

  const report = {
    dataset: dataset.metadata.datasetName,
    datasetTitle: dataset.metadata.title,
    license: dataset.metadata.license,
    timestamp: new Date().toISOString(),
    split: {
      train: dataset.train.length,
      validation: dataset.validation.length,
      heldOutTest: testSamples.length,
      seed: dataset.metadata.seed,
    },
    modalities: dataset.metadata.modalities,
    models: {
      satellite_only: {
        name: 'Satellite-Only Baseline (WorldView-2/3)',
        threshold: satResults.threshold,
        metrics: satResults.metrics,
      },
      weather_hydrology_only: {
        name: 'Weather/Hydrology-Only Baseline (DHM & Stage)',
        threshold: hydroResults.threshold,
        metrics: hydroResults.metrics,
      },
      multimodal_fusion: {
        name: 'DisasterLens Multimodal Fusion Model',
        threshold: multiResults.threshold,
        metrics: multiResults.metrics,
      },
    },
    comparison: {
      f1_satellite: satResults.metrics.f1,
      f1_weather: hydroResults.metrics.f1,
      f1_multimodal: multiResults.metrics.f1,
      accuracy_satellite: satResults.metrics.accuracy,
      accuracy_weather: hydroResults.metrics.accuracy,
      accuracy_multimodal: multiResults.metrics.accuracy,
      multimodalOutperformsSingleBaselines:
        multiResults.metrics.f1 >= satResults.metrics.f1 &&
        multiResults.metrics.f1 >= hydroResults.metrics.f1,
    },
    humanReviewCases: {
      count: humanReviewCases.length,
      cases: humanReviewCases,
    },
    datasetLimitations: DATASET_LIMITATIONS,
    heldOutEvaluations: multiResults.evaluations.map((e) => ({
      sampleId: e.sampleId,
      groundTruth: e.groundTruth === 1 ? 'FLOOD' : 'NON_FLOOD',
      prediction: e.prediction === 1 ? 'FLOOD' : 'NON_FLOOD',
      riskScore: e.score,
      confidence: e.confidence,
      uncertainty: e.uncertainty,
      riskCategory: e.riskCategory,
      provenance: {
        satellite: e.modalities.satellite.source,
        weatherHydrology: e.modalities.weatherHydrology.source,
        groundWitness: e.modalities.groundWitness.source,
      },
    })),
  };

  return report;
}
