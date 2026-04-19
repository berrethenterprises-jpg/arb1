const FEE = 0.003;

const CAPITAL_USD = 1000;
const ETH_PRICE = 3000;

// realistic gas range handled in executor

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

  const valid = pools.filter(p => liquidityUSD(p) > 20000);
  if (valid.length < 3) return null;

  let best = null;

  const startETH = CAPITAL_USD / ETH_PRICE;

  for (let i = 0; i < valid.length; i++) {
    const p1 = valid[i];

    for (let j = 0; j < valid.length; j++) {
      if (j === i) continue;

      const p2 = valid[j];

      for (let k = 0; k < valid.length; k++) {
        if (k === i || k === j) continue;

        const p3 = valid[k];

        const tokens = [p1.token0, p1.token1];

        for (const startToken of tokens) {
          const s1 = getSwap(p1, startToken);
          if (!s1) continue;

          const s2 = getSwap(p2, s1.outToken);
          if (!s2) continue;

          const s3 = getSwap(p3, s2.outToken);
          if (!s3) continue;

          if (s3.outToken !== startToken) continue;

          const o1 = swap(startETH, s1.rin, s1.rout);
          const o2 = swap(o1, s2.rin, s2.rout);
          const o3 = swap(o2, s3.rin, s3.rout);

          if (o3 <= 0) continue;

          const profitETH = o3 - startETH;
          if (profitETH <= 0) continue;

          if (!best || profitETH > best.profitETH) {
            best = {
              route: `${p1.dex} → ${p2.dex} → ${p3.dex}`,
              profitETH,
              sizeETH: startETH
            };
          }
        }
      }
    }
  }

  return best;
};