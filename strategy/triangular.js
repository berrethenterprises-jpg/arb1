const FEE = 0.003;

const MIN_LIQUIDITY = 20000;
const TRADE_SIZE_USD = 2000;
const ETH_PRICE = 3000;
const GAS_COST = 3;

// 🔥 HARD REALITY LIMITS
const MAX_PROFIT_MULTIPLIER = 1.05; // max 5% gain per cycle

const swap = (amountIn, rin, rout) => {
  if (rin <= 0 || rout <= 0) return 0;

  const ain = amountIn * (1 - FEE);
  return (ain * rout) / (rin + ain);
};

const liquidityUSD = (p) => {
  return (p.reserve0 + p.reserve1) / 2;
};

const getSwap = (pool, fromToken) => {
  if (pool.token0 === fromToken) {
    return {
      outToken: pool.token1,
      rin: pool.reserve0,
      rout: pool.reserve1
    };
  }

  if (pool.token1 === fromToken) {
    return {
      outToken: pool.token0,
      rin: pool.reserve1,
      rout: pool.reserve0
    };
  }

  return null;
};

export const findTriangularArb = (pools) => {
  if (!pools || pools.length < 3) return null;

  const valid = pools.filter(p => liquidityUSD(p) > MIN_LIQUIDITY);
  if (valid.length < 3) return null;

  let best = null;

  for (let i = 0; i < valid.length; i++) {
    const p1 = valid[i];

    for (let j = 0; j < valid.length; j++) {
      if (j === i) continue;

      const p2 = valid[j];

      for (let k = 0; k < valid.length; k++) {
        if (k === i || k === j) continue;

        const p3 = valid[k];

        // 🔥 try both directions
        const tokens = [p1.token0, p1.token1];

        for (const startToken of tokens) {
          const s1 = getSwap(p1, startToken);
          if (!s1) continue;

          const s2 = getSwap(p2, s1.outToken);
          if (!s2) continue;

          const s3 = getSwap(p3, s2.outToken);
          if (!s3) continue;

          if (s3.outToken !== startToken) continue;

          const startETH = TRADE_SIZE_USD / ETH_PRICE;

          const o1 = swap(startETH, s1.rin, s1.rout);
          if (o1 <= 0) continue;

          const o2 = swap(o1, s2.rin, s2.rout);
          if (o2 <= 0) continue;

          const o3 = swap(o2, s3.rin, s3.rout);
          if (o3 <= 0) continue;

          // 🔥 sanity check
          const ratio = o3 / startETH;

          if (ratio > MAX_PROFIT_MULTIPLIER) continue; // kill fake arb

          const profitETH = o3 - startETH;
          const profitUSD = profitETH * ETH_PRICE;

          const net = profitUSD - GAS_COST;
          if (net <= 0) continue;

          if (!best || net > best.profitUSD) {
            best = {
              route: `${p1.dex} → ${p2.dex} → ${p3.dex}`,
              profitETH,
              profitUSD: net,
              sizeETH: startETH
            };
          }
        }
      }
    }
  }

  return best;
};