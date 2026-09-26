/**
 * Computes binary classification metrics.
 * @param {Array<{ groundTruth: number, prediction: number, score?: number }>} results
 * @returns {object}
 */
export function calculateMetrics(results) {
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('Results must be a non-empty array');
  }

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (const r of results) {
    const y = r.groundTruth;
    const yHat = r.prediction;

    if (y === 1 && yHat === 1) tp++;
    else if (y === 0 && yHat === 1) fp++;
    else if (y === 0 && yHat === 0) tn++;
    else if (y === 1 && yHat === 0) fn++;
  }

  const total = results.length;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Approximate ROC-AUC over probability/risk threshold sweep
  let rocAuc = 0.5;
  const hasScores = results.every((r) => typeof r.score === 'number');
  if (hasScores && tp + fn > 0 && tn + fp > 0) {
    const thresholds = Array.from({ length: 51 }, (_, i) => i / 50);
    const curve = thresholds.map((th) => {
      let t_tp = 0, t_fp = 0, t_tn = 0, t_fn = 0;
      for (const r of results) {
        const pred = r.score >= th ? 1 : 0;
        if (r.groundTruth === 1 && pred === 1) t_tp++;
        else if (r.groundTruth === 0 && pred === 1) t_fp++;
        else if (r.groundTruth === 0 && pred === 0) t_tn++;
        else if (r.groundTruth === 1 && pred === 0) t_fn++;
      }
      const tpr = (t_tp + t_fn > 0) ? t_tp / (t_tp + t_fn) : 0;
      const fpr = (t_fp + t_tn > 0) ? t_fp / (t_fp + t_tn) : 0;
      return { fpr, tpr };
    });

    // Sort by FPR ascending
    curve.sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);
    // Trapezoidal integration
    let auc = 0;
    for (let i = 1; i < curve.length; i++) {
      const dx = curve[i].fpr - curve[i - 1].fpr;
      const avgY = (curve[i].tpr + curve[i - 1].tpr) / 2;
      if (dx > 0) {
        auc += dx * avgY;
      }
    }
    rocAuc = Math.min(1.0, Math.max(0.5, Number(auc.toFixed(4))));
  }

  return {
    totalSamples: total,
    positiveSamples: tp + fn,
    negativeSamples: tn + fp,
    tp,
    fp,
    tn,
    fn,
    accuracy: Number(accuracy.toFixed(4)),
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4)),
    rocAuc: Number(rocAuc.toFixed(4)),
    confusionMatrix: [
      [tn, fp], // Negative class row
      [fn, tp], // Positive class row
    ],
  };
}
