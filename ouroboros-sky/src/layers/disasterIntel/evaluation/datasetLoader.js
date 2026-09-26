import {
  EVALUATION_METADATA,
  EVALUATION_TRAIN,
  EVALUATION_VALIDATION,
  EVALUATION_TEST,
  EVALUATION_ALL_SAMPLES,
} from './dataset.js';

/**
 * Validates that a modality record conforms to public provenance requirements.
 * @param {object} modality
 * @param {string} modalityName
 * @param {string} sampleId
 */
export function validateModalityProvenance(modality, modalityName, sampleId) {
  if (!modality || typeof modality !== 'object') {
    throw new Error(`Sample ${sampleId} missing modality object: ${modalityName}`);
  }
  if (!modality.source || typeof modality.source !== 'string') {
    throw new Error(`Sample ${sampleId} missing 'source' in ${modalityName}`);
  }
  if (!modality.sourceType || typeof modality.sourceType !== 'string') {
    throw new Error(`Sample ${sampleId} missing 'sourceType' in ${modalityName}`);
  }
  if (modality.synthetic !== false) {
    throw new Error(`Sample ${sampleId} in ${modalityName} must have synthetic: false`);
  }
  if (!modality.provenance || typeof modality.provenance !== 'string') {
    throw new Error(`Sample ${sampleId} missing 'provenance' in ${modalityName}`);
  }
}

/**
 * Validates a complete public data sample.
 * @param {object} sample
 */
export function validateSample(sample) {
  if (!sample.sampleId) throw new Error('Sample missing sampleId');
  if (sample.label !== 0 && sample.label !== 1) {
    throw new Error(`Sample ${sample.sampleId} has invalid binary label: ${sample.label}`);
  }
  if (!sample.location || typeof sample.location.lat !== 'number' || typeof sample.location.lon !== 'number') {
    throw new Error(`Sample ${sample.sampleId} has invalid location`);
  }
  if (!sample.modalities) {
    throw new Error(`Sample ${sample.sampleId} missing modalities`);
  }
  validateModalityProvenance(sample.modalities.satellite, 'satellite', sample.sampleId);
  validateModalityProvenance(sample.modalities.weatherHydrology, 'weatherHydrology', sample.sampleId);
  validateModalityProvenance(sample.modalities.groundWitness, 'groundWitness', sample.sampleId);
  return true;
}

/**
 * Load the evaluation dataset.
 * Pure ES module function compatible with both browser runtime and Node.
 * @param {object} [customDataset] - Optional override dataset for testing
 * @returns {{ metadata: object, train: Array, validation: Array, test: Array, all: Array }}
 */
export function loadEvaluationDataset(customDataset) {
  const metadata = customDataset?.metadata || EVALUATION_METADATA;
  const train = customDataset?.train || EVALUATION_TRAIN;
  const validation = customDataset?.validation || EVALUATION_VALIDATION;
  const test = customDataset?.test || EVALUATION_TEST;
  const all = customDataset?.all || EVALUATION_ALL_SAMPLES;

  // Validate all samples
  for (const s of [...train, ...validation, ...test]) {
    validateSample(s);
  }

  // Ensure zero leakage between sets
  const trainIds = new Set(train.map((s) => s.sampleId));
  const valIds = new Set(validation.map((s) => s.sampleId));
  const testIds = new Set(test.map((s) => s.sampleId));

  for (const id of valIds) {
    if (trainIds.has(id)) {
      throw new Error(`Data leakage detected: sample ${id} in both train and validation`);
    }
  }
  for (const id of testIds) {
    if (trainIds.has(id)) {
      throw new Error(`Data leakage detected: sample ${id} in both train and test`);
    }
    if (valIds.has(id)) {
      throw new Error(`Data leakage detected: sample ${id} in both validation and test`);
    }
  }

  return {
    metadata,
    train,
    validation,
    test,
    all,
  };
}
