const FEE = 0.003;

const simulateSwap = (amountIn, rin, rout) => {
  const amountInWithFee = amountIn * (1 - FEE);
  return (amountInWithFee * rout) / (rin + amountInWithFee);
};

export const simulateMempoolImpact = (pools) => {
  const estimatedSize = 5;

  return pools.map(p => {
    const np = { ...p };

    const out = simulateSwap(
      estimatedSize,
      np.reserve0,
      np.reserve1
    );

    np.reserve0 += estimatedSize;
    np.reserve1 -= out;

    return np;
  });
};