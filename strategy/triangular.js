const FEE = 0.003;
const GAS = 5;

const swap = (x, rin, rout) => {
  const xin = x * (1 - FEE);
  return (xin * rout) / (rin + xin);
};

export const findTriangularArb = (pools) => {
  const WETH = "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const start = 0.05;

  // 🔥 build adjacency map
  const map = {};

  for (const p of pools) {
    if (!map[p.token0]) map[p.token0] = [];
    if (!map[p.token1]) map[p.token1] = [];

    map[p.token0].push(p);
    map[p.token1].push(p);
  }

  const firstHop = map[WETH] || [];

  for (const a of firstHop) {
    const t1 = a.token0 === WETH ? a.token1 : a.token0;
    const out1 = a.token0 === WETH
      ? swap(start, a.reserve0, a.reserve1)
      : swap(start, a.reserve1, a.reserve0);

    for (const b of map[t1] || []) {
      const t2 = b.token0 === t1 ? b.token1 : b.token0;
      const out2 = b.token0 === t1
        ? swap(out1, b.reserve0, b.reserve1)
        : swap(out1, b.reserve1, b.reserve0);

      for (const c of map[t2] || []) {
        const final = c.token0 === t2 ? c.token1 : c.token0;
        if (final !== WETH) continue;

        const out3 = c.token0 === t2
          ? swap(out2, c.reserve0, c.reserve1)
          : swap(out2, c.reserve1, c.reserve0);

        const profit = (out3 - start) * 3000 - GAS;

        if (profit > 0.05 && profit < 20) {
          return {
            profitUSD: profit,
            route: `${a.dex} → ${b.dex} → ${c.dex}`
          };
        }
      }
    }
  }

  return null;
};