// 🔥 Simulate price movement BEFORE tx lands

const FEE = 0.003;

// simple swap simulation
const simulateSwap = (amountIn, rin, rout) => {
  const amountInWithFee = amountIn * (1 - FEE);
  return (amountInWithFee * rout) / (rin + amountInWithFee);
};

export const simulateMempoolImpact = (pools, tx) => {
  // 🔥 Fake size estimate (we improve later)
  const estimatedSize = 10; // small default

  return pools.map(p => {
    // clone pool
    let newPool = { ...p };

    // randomly simulate direction (simplified)
    const out = simulateSwap(
      estimatedSize,
      newPool.reserve0,
      newPool.reserve1
    );

    newPool.reserve0 += estimatedSize;
    newPool.reserve1 -= out;

    return newPool;
  });
};