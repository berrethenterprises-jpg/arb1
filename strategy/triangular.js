import { getAmountOut } from "../utils/poolMath.js";

const GAS_COST_USD = 2;
const TRADE_SIZES = [0.01, 0.05, 0.1, 0.25];

const TOKENS = [
  "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
  "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
  "0xdac17f958d2ee523a2206206994597c13d831ec7"  // USDT
];

// match pool direction
const getOut = (amount, from, to, pool) => {
  if (pool.token0 === from && pool.token1 === to) {
    return getAmountOut(amount, pool.reserve0, pool.reserve1);
  }
  if (pool.token1 === from && pool.token0 === to) {
    return getAmountOut(amount, pool.reserve1, pool.reserve0);
  }
  return null;
};

export const findTriangularArb = (pools) => {
  let best = null;

  for (let size of TRADE_SIZES) {

    for (let start of TOKENS) {
      for (let mid1 of TOKENS) {
        for (let mid2 of TOKENS) {

          if (start === mid1 || mid1 === mid2 || start === mid2) continue;

          for (let p1 of pools) {
            const out1 = getOut(size, start, mid1, p1);
            if (!out1) continue;

            for (let p2 of pools) {
              const out2 = getOut(out1, mid1, mid2, p2);
              if (!out2) continue;

              for (let p3 of pools) {
                const out3 = getOut(out2, mid2, start, p3);
                if (!out3) continue;

                const profitETH = out3 - size;
                const profitUSD = (profitETH * 2000) - GAS_COST_USD;

                if (
                  profitUSD > 0.3 &&
                  profitUSD < 1000 &&
                  (!best || profitUSD > best.profitUSD)
                ) {
                  best = {
                    route: `${start} → ${mid1} → ${mid2} → ${start}`,
                    tradeSize: size,
                    profitETH,
                    profitUSD,
                    finalETH: out3
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  return best;
};