import { getAmountOut } from "../utils/poolMath.js";

export const findTriangularArb = (pools, tradeSize) => {
  let best = null;

  for (let a of pools) {
    for (let b of pools) {
      for (let c of pools) {
        if (a === b || b === c || a === c) continue;

        // Use reserve0/reserve1 generically
        const out1 = getAmountOut(tradeSize, a.reserve0, a.reserve1);
        const out2 = getAmountOut(out1, b.reserve0, b.reserve1);
        const out3 = getAmountOut(out2, c.reserve0, c.reserve1);

        const profitETH = out3 - tradeSize;
        const profitUSD = profitETH * 2000;

        if (
          profitUSD > 2 &&
          profitUSD < 1000 &&
          (!best || profitUSD > best.profitUSD)
        ) {
          best = {
            route: `${a.dex} → ${b.dex} → ${c.dex}`,
            profitETH,
            profitUSD,
            finalETH: out3
          };
        }
      }
    }
  }

  return best;
};