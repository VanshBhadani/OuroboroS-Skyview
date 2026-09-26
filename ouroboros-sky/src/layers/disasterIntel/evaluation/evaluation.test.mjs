import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  loadEvaluationDataset,
  validateSample,
  validateModalityProvenance,
} from './datasetLoader.js';
import { deterministicSplit, createRng } from './split.js';
import { calculateMetrics } from './metrics.js';
import { SatelliteBaseline, WeatherHydrologyBaseline } from './baselines.js';
import {
  MultimodalFusionModel,
  adaptPublicSampleToFusionInput,
} from './multimodalAdapter.js';
import { runEvaluation, DATASET_LIMITATIONS } from './evaluator.js';
import { EVALUATION_METADATA, EVALUATION_ALL_SAMPLES } from './dataset.js';

test('DisasterLens Milestone 3: Public Dataset & Provenance Validation', async (t) => {
  await t.test('1. dataset metadata validation conforms to public open data standards', () => {
    const dataset = loadEvaluationDataset();
    assert.ok(dataset.metadata);
    assert.equal(dataset.metadata.datasetName, 'bhote-koshi-2026-flood-eval');
    assert.equal(dataset.metadata.license, 'CC BY-NC 4.0');
    assert.equal(dataset.metadata.provenance, 'public');
    assert.equal(dataset.metadata.seed, 42);
    assert.equal(dataset.metadata.sampleCounts.total, 100);
    assert.equal(dataset.metadata.sampleCounts.train, 60);
    assert.equal(dataset.metadata.sampleCounts.validation, 20);
    assert.equal(dataset.metadata.sampleCounts.test, 20);
    assert.equal(dataset.metadata.modalities.length, 3);
  });

  await t.test('2. deterministic train/test split is strictly reproducible across runs', () => {
    const samples = EVALUATION_ALL_SAMPLES;
    const split1 = deterministicSplit(samples, { seed: 42 });
    const split2 = deterministicSplit(samples, { seed: 42 });

    assert.equal(split1.train.length, 60);
    assert.equal(split1.validation.length, 20);
    assert.equal(split1.test.length, 20);

    const ids1 = split1.test.map((s) => s.sampleId);
    const ids2 = split2.test.map((s) => s.sampleId);
    assert.deepEqual(ids1, ids2, 'Identical seed must produce 100% identical test split');
  });

  await t.test('3. no test leakage between train, validation, and held-out test sets', () => {
    const dataset = loadEvaluationDataset();
    const trainIds = new Set(dataset.train.map((s) => s.sampleId));
    const valIds = new Set(dataset.validation.map((s) => s.sampleId));
    const testIds = new Set(dataset.test.map((s) => s.sampleId));

    assert.equal(trainIds.size, 60);
    assert.equal(valIds.size, 20);
    assert.equal(testIds.size, 20);

    for (const id of testIds) {
      assert.equal(trainIds.has(id), false, `Test sample ${id} must not exist in train set`);
      assert.equal(valIds.has(id), false, `Test sample ${id} must not exist in validation set`);
    }

    for (const id of valIds) {
      assert.equal(trainIds.has(id), false, `Val sample ${id} must not exist in train set`);
    }
  });

  await t.test('4. modality loading extracts valid numeric features and geographic coordinates', () => {
    const dataset = loadEvaluationDataset();
    for (const s of dataset.all) {
      assert.ok(s.location.lat >= 28.13 && s.location.lat <= 28.30);
      assert.ok(s.location.lon >= 85.29 && s.location.lon <= 85.39);
      assert.ok(Number.isFinite(s.location.elevationM));

      const sat = s.modalities.satellite.features;
      assert.ok(sat.opticalChangeScore >= 0 && sat.opticalChangeScore <= 1.0);
      assert.ok(Array.isArray(sat.preRgb) && sat.preRgb.length === 3);
      assert.ok(Array.isArray(sat.postRgb) && sat.postRgb.length === 3);

      const hydro = s.modalities.weatherHydrology.features;
      assert.ok(hydro.rainfallMm24h >= 140);
      assert.ok(hydro.hydroRiskScore >= 0 && hydro.hydroRiskScore <= 1.0);
    }
  });

  await t.test('5. provenance tracking enforces public dataset metadata on every record', () => {
    const dataset = loadEvaluationDataset();
    for (const s of dataset.all) {
      // Must not be synthetic
      assert.equal(s.modalities.satellite.synthetic, false);
      assert.equal(s.modalities.weatherHydrology.synthetic, false);
      assert.equal(s.modalities.groundWitness.synthetic, false);

      // Must have valid license and source
      assert.ok(s.modalities.satellite.source.includes('Vantor WorldView'));
      assert.equal(s.modalities.satellite.license, 'CC BY-NC 4.0');
      assert.ok(s.modalities.weatherHydrology.source.includes('Nepal DHM'));
    }
  });

  await t.test('6. single-modality baseline evaluation (satellite-only and weather-only)', () => {
    const dataset = loadEvaluationDataset();
    const dev = [...dataset.train, ...dataset.validation];
    const testSamples = dataset.test;

    const satBaseline = new SatelliteBaseline().fit(dev);
    const satEval = satBaseline.evaluate(testSamples);
    assert.ok(satEval.metrics.f1 > 0);
    assert.ok(satEval.metrics.accuracy >= 0.5);

    const hydroBaseline = new WeatherHydrologyBaseline().fit(dev);
    const hydroEval = hydroBaseline.evaluate(testSamples);
    assert.ok(hydroEval.metrics.f1 > 0);
    assert.ok(hydroEval.metrics.accuracy >= 0.5);
  });

  await t.test('7. multimodal evaluation uses existing DisasterLens fusion architecture', () => {
    const dataset = loadEvaluationDataset();
    const dev = [...dataset.train, ...dataset.validation];
    const testSamples = dataset.test;

    const model = new MultimodalFusionModel().fit(dev);
    const result = model.evaluate(testSamples);

    assert.equal(result.model, 'multimodal_fusion');
    assert.equal(result.evaluations.length, 20);
    assert.ok(result.metrics.f1 >= 0.80);
    assert.ok(result.metrics.accuracy >= 0.80);

    for (const ev of result.evaluations) {
      assert.ok(Number.isFinite(ev.score));
      assert.ok(ev.confidence >= 0 && ev.confidence <= 1.0);
      assert.ok(ev.uncertainty >= 0 && ev.uncertainty <= 1.0);
      assert.ok(Math.abs(ev.confidence + ev.uncertainty - 1.0) < 0.05);
      assert.ok(['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'UNKNOWN'].includes(ev.riskCategory));
    }
  });

  await t.test('8. metric calculation computes accuracy, precision, recall, F1, and confusion matrix', () => {
    const mockResults = [
      { groundTruth: 1, prediction: 1, score: 0.9 },
      { groundTruth: 1, prediction: 1, score: 0.8 },
      { groundTruth: 1, prediction: 0, score: 0.3 },
      { groundTruth: 0, prediction: 0, score: 0.2 },
      { groundTruth: 0, prediction: 1, score: 0.7 },
    ];
    const m = calculateMetrics(mockResults);

    assert.equal(m.totalSamples, 5);
    assert.equal(m.tp, 2);
    assert.equal(m.fp, 1);
    assert.equal(m.tn, 1);
    assert.equal(m.fn, 1);
    assert.equal(m.accuracy, 0.6);
    assert.equal(m.precision, +(2 / 3).toFixed(4));
    assert.equal(m.recall, +(2 / 3).toFixed(4));
    assert.equal(m.f1, +(2 / 3).toFixed(4));
    assert.deepEqual(m.confusionMatrix, [
      [1, 1],
      [1, 2],
    ]);
  });

  await t.test('9. evaluation reproducibility: running evaluation produces identical results', () => {
    const report1 = runEvaluation();
    const report2 = runEvaluation();

    assert.equal(report1.models.satellite_only.metrics.f1, report2.models.satellite_only.metrics.f1);
    assert.equal(report1.models.weather_hydrology_only.metrics.f1, report2.models.weather_hydrology_only.metrics.f1);
    assert.equal(report1.models.multimodal_fusion.metrics.f1, report2.models.multimodal_fusion.metrics.f1);
  });

  await t.test('10. missing modality handling redistributes weights dynamically without throwing', () => {
    const mockSample = {
      sampleId: 'TEST-MISSING',
      label: 1,
      modalities: {
        satellite: null, // missing satellite
        weatherHydrology: {
          source: 'Nepal DHM',
          sourceType: 'weather_hydrology',
          provenance: 'public',
          synthetic: false,
          features: { rainfallMm24h: 180, heightAboveRiverbedM: 0, hydroRiskScore: 0.95 },
        },
        groundWitness: {
          source: 'None',
          sourceType: 'ground_witness',
          provenance: 'unobserved',
          synthetic: false,
          hasReport: false,
        },
      },
    };

    const adapted = adaptPublicSampleToFusionInput(mockSample);
    assert.equal(adapted.satellite, null);
    assert.ok(adapted.weather);

    const model = new MultimodalFusionModel();
    const score = model.score(mockSample);
    assert.ok(Number.isFinite(score));
    assert.ok(score > 0);
  });

  await t.test('11. result serialization writes valid JSON report and dataset limitations', () => {
    const report = runEvaluation();
    assert.ok(report.dataset);
    assert.ok(report.split);
    assert.ok(report.models);
    assert.ok(report.comparison);
    assert.ok(report.humanReviewCases);
    assert.ok(Array.isArray(report.datasetLimitations));
    assert.equal(report.datasetLimitations.length, 5);

    const outPath = path.join(process.cwd(), 'evaluation', 'results.json');
    assert.ok(fs.existsSync(outPath), 'evaluation/results.json must exist');
    const parsed = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    assert.equal(parsed.dataset, 'bhote-koshi-2026-flood-eval');
  });
});
