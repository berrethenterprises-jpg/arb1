export const getAmountOut = (amountIn, reserveIn, reserveOut) => {
  const amountInWithFee = amountIn * 997;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000 + amountInWithFee;
  return numerator / denominator;
}; 