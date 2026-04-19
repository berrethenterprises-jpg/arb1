const FEE = 0.003;

// 🔧 TUNED CONFIG
const MIN_LIQUIDITY = 20000;
const TRADE_SIZE_USD = 2000;
const ETH_PRICE = 3000;
const GAS_COST = 3;

const swap = (amountIn, rin, rout) => {
  const ain = amountIn * (1 - FEE);
  return (ain * rout) / (rin + ain);
};

const liquidityUSD = (p) => {
  return (p.reserve0 + p.reserve1) / 2;
};

export const findTriangularArb = (pools) => {
  if (!pools || pools.length < 3) return null;

  const valid = pools.filter(p => liquidityUSD(p) > MIN_LIQUIDITY);
  if (valid.length < 3) return null;

  let best = null;

  for (let i = 0; i < valid.length; i++) {
    const a = valid[i];

    for (let j = 0; j < valid.length; j++) {
      const b = valid[j];
      if (i === j) continue;
      if (a.token1 !== b.token0) continue;

      for (let k = 0; k < valid.length; k++) {
        const c = valid[k];
        if (k === i || k === j) continue;

        if (b.token1 !== c.token0) continue;
        if (c.token1 !== a.token0) continue;

        const startETH = TRADE_SIZE_USD / ETH_PRICE;

        const o1 = swap(startETH, a.reserve0, a.reserve1);
        if (o1 <= 0) continue;

        const o2 = swap(o1, b.reserve0, b.reserve1);
        if (o2 <= 0) continue;

        const o3 = swap(o2, c.reserve0, c.reserve1);
        if (o3 <= 0) continue;

        const profitETH = o3 - startETH;
        const profitUSD = profitETH * ETH_PRICE;

        const net = profitUSD - GAS_COST;
        if (net <= 0) continue;

        if (!best || net > best.profitUSD) {
          best = {
            route: `${a.dex} → ${b.dex} → ${c.dex}`,
            profitETH,
            profitUSD: net,
            sizeETH: startETH
          };
        }
      }
    }
  }

  return best;
};