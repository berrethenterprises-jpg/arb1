const FEE = 0.003;

// ===== CONFIG =====
const MIN_LIQUIDITY_USD = 50000; // ignore small pools
const BASE_TRADE_USD = 1000;     // realistic trade size
const ETH_PRICE = 3000;
const GAS_COST_USD = 5;

// ===== SWAP FUNCTION =====
const swap = (amountIn, reserveIn, reserveOut) => {
  const amountInWithFee = amountIn * (1 - FEE);
  return (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
};

// ===== LIQUIDITY ESTIMATE =====
const getLiquidityUSD = (pool) => {
  const avg = (pool.reserve0 + pool.reserve1) / 2;
  return avg * 1; // rough (tokens ~ USD pairs)
};

// ===== MAIN ENGINE =====
export const findTriangularArb = (pools) => {
  if (!pools || pools.length < 3) return null;

  // 🔥 FILTER LOW LIQUIDITY
  const filtered = pools.filter(p => getLiquidityUSD(p) > MIN_LIQUIDITY_USD);

  if (filtered.length < 3) return null;

  let best = null;

  for (let i = 0; i < filtered.length; i++) {
    for (let j = 0; j < filtered.length; j++) {
      for (let k = 0; k < filtered.length; k++) {
        if (i === j || j === k || i === k) continue;

        const p1 = filtered[i];
        const p2 = filtered[j];
        const p3 = filtered[k];

        // 🔥 SIMPLE TOKEN MATCHING
        if (
          p1.token1 !== p2.token0 ||
          p2.token1 !== p3.token0 ||
          p3.token1 !== p1.token0
        ) continue;

        // ===== TRADE SIZE =====
        const start = BASE_TRADE_USD / ETH_PRICE;

        // ===== SIMULATE ROUTE =====
        const out1 = swap(start, p1.reserve0, p1.reserve1);
        if (out1 <= 0) continue;

        const out2 = swap(out1, p2.reserve0, p2.reserve1);
        if (out2 <= 0) continue;

        const out3 = swap(out2, p3.reserve0, p3.reserve1);
        if (out3 <= 0) continue;

        const profitETH = out3 - start;
        const profitUSD = profitETH * ETH_PRICE;

        // ===== AFTER GAS =====
        const net = profitUSD - GAS_COST_USD;

        if (net <= 0) continue;

        if (!best || net > best.profitUSD) {
          best = {
            route: `${p1.dex} → ${p2.dex} → ${p3.dex}`,
            profitETH,
            profitUSD: net,
            sizeETH: start
          };
        }
      }
    }
  }

  return best;
};