const FEE = 0.003;
const GAS_COST = 5;
const MIN_PROFIT = 0.1;

const swap = (amountIn, reserveIn, reserveOut) => {
  const amountInWithFee = amountIn * (1 - FEE);
  return (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
};

// get output depending on direction
const getAmountOut = (amount, pool, tokenIn) => {
  if (tokenIn === pool.token0) {
    return swap(amount, pool.reserve0, pool.reserve1);
  } else if (tokenIn === pool.token1) {
    return swap(amount, pool.reserve1, pool.reserve0);
  }
  return null;
};

export const findTriangularArb = (pools) => {
  const startAmount = 0.01;
  const startToken = "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2"; // WETH

  for (let a of pools) {
    for (let b of pools) {
      for (let c of pools) {

        // STEP 1
        let out1 = getAmountOut(startAmount, a, startToken);
        if (!out1) continue;

        const token1 =
          startToken === a.token0 ? a.token1 : a.token0;

        // STEP 2
        let out2 = getAmountOut(out1, b, token1);
        if (!out2) continue;

        const token2 =
          token1 === b.token0 ? b.token1 : b.token0;

        // STEP 3
        let out3 = getAmountOut(out2, c, token2);
        if (!out3) continue;

        const finalToken =
          token2 === c.token0 ? c.token1 : c.token0;

        // must return to start token
        if (finalToken !== startToken) continue;

        const profitETH = out3 - startAmount;
        const profitUSD = profitETH * 3000 - GAS_COST;

        if (profitUSD > MIN_PROFIT && profitUSD < 50) {
          return {
            route: `${a.dex} → ${b.dex} → ${c.dex}`,
            profitETH,
            profitUSD
          };
        }
      }
    }
  }

  return null;
};