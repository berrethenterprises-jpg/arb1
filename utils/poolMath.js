export const getAmountOut = (amountIn, reserveIn, reserveOut) => {
  const amountInWithFee = amountIn * 997;
  return (amountInWithFee * reserveOut) /
    (reserveIn * 1000 + amountInWithFee);
};