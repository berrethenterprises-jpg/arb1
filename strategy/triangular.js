const FEE = 0.003;
const GAS_COST = 5;
const MIN_PROFIT = 0.05;

const SIZES = [0.01, 0.03, 0.05, 0.1]; // 🔥 dynamic sizing

const swap = (amountIn, reserveIn, reserveOut) => {
  const amountInWithFee = amountIn * (1 - FEE);
  return (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
};

const getOut = (amount, pool, tokenIn) => {
  if (tokenIn === pool.token0) {
    return swap(amount, pool.reserve0, pool.reserve1);
  }
  if (tokenIn === pool.token1) {
    return swap(amount, pool.reserve1, pool.reserve0);
  }
  return null;
};

export const findTriangularArb = (pools) => {
  const WETH = "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2";

  for (let size of SIZES) {

    for (let a of pools) {
      for (let b of pools) {
        for (let c of pools) {

          let out1 = getOut(size, a, WETH);
          if (!out1) continue;

          const t1 = WETH === a.token0 ? a.token1 : a.token0;

          let out2 = getOut(out1, b, t1);
          if (!out2) continue;

          const t2 = t1 === b.token0 ? b.token1 : b.token0;

          let out3 = getOut(out2, c, t2);
          if (!out3) continue;

          const finalToken = t2 === c.token0 ? c.token1 : c.token0;
          if (finalToken !== WETH) continue;

          const profitETH = out3 - size;
          const profitUSD = profitETH * 3000 - GAS_COST;

          if (profitUSD > MIN_PROFIT && profitUSD < 20) {
            return {
              size,
              profitUSD,
              profitETH,
              route: `${a.dex} → ${b.dex} → ${c.dex}`
            };
          }
        }
      }
    }
  }

  return null;
};