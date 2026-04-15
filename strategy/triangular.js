const FEE = 0.003;
const GAS_COST_USD = 5;
const MIN_PROFIT_USD = 0.1;

// ✅ Only strong tokens
const WHITELIST = [
  "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
  "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
  "0x6b175474e89094c44da98b954eedeac495271d0f"  // DAI
];

const valid = (t) => WHITELIST.includes(t);

// AMM formula
const swap = (amountIn, reserveIn, reserveOut) => {
  const amountInWithFee = amountIn * (1 - FEE);
  return (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
};

export const findTriangularArb = (pools) => {
  const startETH = 0.01;

  for (let i = 0; i < pools.length; i++) {
    for (let j = 0; j < pools.length; j++) {
      for (let k = 0; k < pools.length; k++) {

        const a = pools[i];
        const b = pools[j];
        const c = pools[k];

        // token filtering
        if (!valid(a.token0) || !valid(a.token1)) continue;
        if (!valid(b.token0) || !valid(b.token1)) continue;
        if (!valid(c.token0) || !valid(c.token1)) continue;

        try {
          let x = swap(startETH, a.reserve0, a.reserve1);
          let y = swap(x, b.reserve0, b.reserve1);
          let z = swap(y, c.reserve0, c.reserve1);

          const profitETH = z - startETH;
          const profitUSD = profitETH * 3000 - GAS_COST_USD;

          if (profitUSD > MIN_PROFIT_USD) {
            return {
              route: `${a.dex}→${b.dex}→${c.dex}`,
              profitETH,
              profitUSD,
              size: startETH
            };
          }

        } catch {}
      }
    }
  }

  return null;
};