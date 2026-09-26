import fs from 'node:fs';
import path from 'node:path';
import { runEvaluation } from '../src/layers/disasterIntel/evaluation/evaluator.js';

export function runCliEvaluation() {
  console.log('================================================================');
  console.log('               DISASTERLENS MODEL EVALUATION                    ');
  console.log('   Multimodal Disaster Intelligence — Held-Out Test Evaluation  ');
  console.log('================================================================\n');

  const report = runEvaluation();

  console.log(`Dataset:        ${report.datasetTitle}`);
  console.log(`License:        ${report.license}`);
  console.log(`Split (seed 42): Train=${report.split.train} | Val=${report.split.validation} | Held-Out Test=${report.split.heldOutTest}`);
  console.log(`Evaluated At:   ${report.timestamp}\n`);

  console.log('----------------------------------------------------------------');
  console.log(' MODEL PERFORMANCE ON HELD-OUT TEST SET (N = 20)                ');
  console.log('----------------------------------------------------------------');
  console.log('Model                   | Accuracy | Precision | Recall |   F1   | ROC-AUC');
  console.log('------------------------+----------+-----------+--------+--------+--------');

  const sat = report.models.satellite_only.metrics;
  const hydro = report.models.weather_hydrology_only.metrics;
  const multi = report.models.multimodal_fusion.metrics;

  console.log(
    `Satellite-Only (WV-2/3) |  ${(sat.accuracy * 100).toFixed(1).padStart(5)}%  |   ${(sat.precision * 100).toFixed(1).padStart(5)}%  | ${(sat.recall * 100).toFixed(1).padStart(5)}% | ${(sat.f1 * 100).toFixed(1).padStart(5)}% | ${sat.rocAuc.toFixed(3)}`
  );
  console.log(
    `Weather/Hydro (DHM)     |  ${(hydro.accuracy * 100).toFixed(1).padStart(5)}%  |   ${(hydro.precision * 100).toFixed(1).padStart(5)}%  | ${(hydro.recall * 100).toFixed(1).padStart(5)}% | ${(hydro.f1 * 100).toFixed(1).padStart(5)}% | ${hydro.rocAuc.toFixed(3)}`
  );
  console.log(
    `Multimodal Fusion       |  ${(multi.accuracy * 100).toFixed(1).padStart(5)}%  |   ${(multi.precision * 100).toFixed(1).padStart(5)}%  | ${(multi.recall * 100).toFixed(1).padStart(5)}% | ${(multi.f1 * 100).toFixed(1).padStart(5)}% | ${multi.rocAuc.toFixed(3)}`
  );
  console.log('------------------------+----------+-----------+--------+--------+--------\n');

  console.log(`Confusion Matrix (Multimodal):`);
  console.log(`  TN (Safe correctly identified):     ${multi.tn}`);
  console.log(`  FP (Safe flagged as Flood):        ${multi.fp}`);
  console.log(`  FN (Flood missed):                 ${multi.fn}`);
  console.log(`  TP (Flood correctly identified):   ${multi.tp}\n`);

  console.log(`Human Review Routing:`);
  console.log(`  Total Test Cases Flagged for Review: ${report.humanReviewCases.count}`);
  for (const c of report.humanReviewCases.cases.slice(0, 3)) {
    console.log(`   - Sample ${c.sampleId}: Risk=${(c.predictedRisk * 100).toFixed(0)}%, Uncertainty=±${(c.uncertainty * 100).toFixed(0)}% [${c.reasons.join('; ')}]`);
  }
  if (report.humanReviewCases.count > 3) {
    console.log(`   ... and ${report.humanReviewCases.count - 3} more cases.`);
  }

  console.log('\nDataset Limitations:');
  for (const lim of report.datasetLimitations) {
    console.log(`  * ${lim}`);
  }

  // Write outputs
  const root = process.cwd();
  const outPath = path.join(root, 'evaluation', 'results.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  const dataOutPath = path.join(root, 'data', 'evaluation', 'bhote-koshi-flood', 'results.json');
  fs.writeFileSync(dataOutPath, JSON.stringify(report, null, 2), 'utf8');

  const jsOutPath = path.join(root, 'src', 'layers', 'disasterIntel', 'evaluation', 'results.js');
  const jsContent =
    '/**\n * Pre-computed Held-out Evaluation Results for DisasterLens UI\n */\n' +
    'export const EVALUATION_RESULTS = Object.freeze(' + JSON.stringify(report, null, 2) + ');\n';
  fs.writeFileSync(jsOutPath, jsContent, 'utf8');

  console.log('\n[results] Machine-readable report saved to evaluation/results.json\n');
  return report;
}

runCliEvaluation();
