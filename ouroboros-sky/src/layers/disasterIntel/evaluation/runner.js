import { runEvaluation } from './evaluator.js';
import { EVALUATION_RESULTS } from './results.js';

/**
 * Runner helper providing synchronous access to evaluation results.
 * Pure ES module without Node builtins.
 */
export function getEvaluationReport() {
  return EVALUATION_RESULTS || runEvaluation();
}

export { runEvaluation };
