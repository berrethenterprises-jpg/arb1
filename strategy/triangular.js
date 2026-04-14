import { getAmountOut } from "../utils/poolMath.js";

export const findTriangularArb = (pools, tradeSize) => {
  let best = null;

  for (let a of pools) {
    for (let b of pools) {
      for (let c of pools) {
        if (a === b || b === c || a === c) continue;

        // ETH → USDC
        const usdc = getAmountOut(
          tradeSize,
          a.reserveETH,
          a.reserveUSDC
        );

        // USDC → DAI (simulate via USDC/ETH pool again for now)
        const dai = getAmountOut(
          usdc,
          b.reserveUSDC,
          b.reserveETH
        );

        // DAI → ETH
        const ethBack = getAmountOut(
          dai,
          c.reserveUSDC,
          c.reserveETH
        );

        const profitETH = ethBack - tradeSize;
        const profitUSD = profitETH * 2000;

        if (profitUSD > 2 && profitUSD < 1000) {
          best = {
            route: `${a.dex} → ${b.dex} → ${c.dex}`,
            profitETH,
            profitUSD,
            finalETH: ethBack
          };
        }
      }
    }
  }

  return best;
};
