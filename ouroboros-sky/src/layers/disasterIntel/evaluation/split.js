/**
 * Deterministic PRNG with fixed seed
 */
export function createRng(seed = 42) {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically splits an array into train, validation, and held-out test sets.
 * @param {Array} samples
 * @param {object} options
 * @param {number} [options.trainRatio=0.6]
 * @param {number} [options.valRatio=0.2]
 * @param {number} [options.testRatio=0.2]
 * @param {number} [options.seed=42]
 * @returns {{ train: Array, validation: Array, test: Array }}
 */
export function deterministicSplit(samples, { trainRatio = 0.6, valRatio = 0.2, testRatio = 0.2, seed = 42 } = {}) {
  if (Math.abs(trainRatio + valRatio + testRatio - 1.0) > 0.001) {
    throw new Error('Split ratios must sum to 1.0');
  }

  const rng = createRng(seed);

  // Group by class to ensure stratified balance
  const pos = samples.filter((s) => s.label === 1);
  const neg = samples.filter((s) => s.label === 0);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const shuffledPos = shuffle(pos);
  const shuffledNeg = shuffle(neg);

  const posTrainCount = Math.round(shuffledPos.length * trainRatio);
  const posValCount = Math.round(shuffledPos.length * valRatio);

  const negTrainCount = Math.round(shuffledNeg.length * trainRatio);
  const negValCount = Math.round(shuffledNeg.length * valRatio);

  const train = shuffle([
    ...shuffledPos.slice(0, posTrainCount),
    ...shuffledNeg.slice(0, negTrainCount),
  ]);
  const validation = shuffle([
    ...shuffledPos.slice(posTrainCount, posTrainCount + posValCount),
    ...shuffledNeg.slice(negTrainCount, negTrainCount + negValCount),
  ]);
  const test = shuffle([
    ...shuffledPos.slice(posTrainCount + posValCount),
    ...shuffledNeg.slice(negTrainCount + negValCount),
  ]);

  // Leakage verification
  const trainSet = new Set(train.map((s) => s.sampleId));
  const valSet = new Set(validation.map((s) => s.sampleId));
  const testSet = new Set(test.map((s) => s.sampleId));

  for (const id of testSet) {
    if (trainSet.has(id) || valSet.has(id)) {
      throw new Error(`Critical Leakage: test sample ${id} found in train/val sets`);
    }
  }

  return { train, validation, test };
}
