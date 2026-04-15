const FEE = 0.003;
const GAS_COST = 5;
const MIN_PROFIT = 0.1;

const swap = (x, rin, rout) => {
  const xin = x * (1 - FEE);
  return (xin * rout) / (rin + xin);
};

export const findTriangularArb = (pools) => {
  const start = 0.01;

  for (let a of pools) {
    for (let b of pools) {
      for (let c of pools) {
        try {
          let x = swap(start, a.reserve0, a.reserve1);
          let y = swap(x, b.reserve0, b.reserve1);
          let z = swap(y, c.reserve0, c.reserve1);

          let profit = (z - start) * 3000 - GAS_COST;

          if (profit > MIN_PROFIT) {
            return { profitUSD: profit };
          }

        } catch {}
      }
    }
  }

  return null;
};