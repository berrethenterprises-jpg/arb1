export const getAmountOut = (amountIn, reserveIn, reserveOut) => {
  if (!amountIn || !reserveIn || !reserveOut) return null;

  // Uniswap v2 formula with fee
  const amountInWithFee = amountIn * 997;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000 + amountInWithFee;

  return numerator / denominator;
};