import { getAmountOut } from "../utils/poolMath.js";

const WETH = "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2";
const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const DAI  = "0x6b175474e89094c44da98b954eedeac495271d0f";

const GAS_COST_USD = 2;

// try multiple sizes
const TRADE_SIZES = [0.01, 0.05, 0.1, 0.25, 0.5];

const matches = (from, to, pool) =>
  (pool.token0 === from && pool.token1 === to) ||
  (pool.token1 === from && pool.token0 === to);

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
    for (let p1 of pools) {
      if (!matches(WETH, USDC, p1)) continue;

      const usdc = getOut(size, WETH, USDC, p1);
      if (!usdc) continue;

      for (let p2 of pools) {
        if (!matches(USDC, DAI, p2)) continue;

        const dai = getOut(usdc, USDC, DAI, p2);
        if (!dai) continue;

        for (let p3 of pools) {
          if (!matches(DAI, WETH, p3)) continue;

          const ethBack = getOut(dai, DAI, WETH, p3);
          if (!ethBack) continue;

          const profitETH = ethBack - size;
          const profitUSD = (profitETH * 2000) - GAS_COST_USD;

          if (
            profitUSD > 0.5 &&
            profitUSD < 1000 &&
            (!best || profitUSD > best.profitUSD)
          ) {
            best = {
              route: "WETH → USDC → DAI → WETH",
              tradeSize: size,
              profitETH,
              profitUSD,
              finalETH: ethBack
            };
          }
        }
      }
    }
  }

  return best;
};