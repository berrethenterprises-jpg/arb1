import { ethers } from "ethers";

const LARGE_SWAP = ethers.utils.parseEther("5");

export const detectLargeSwap = (tx) => {
  try {
    if (!tx || !tx.value) return false;
    return tx.value.gte(LARGE_SWAP);
  } catch {
    return false;
  }
};

export const simulateImpact = (pools) => {
  if (!pools || pools.length < 2) return null;

  const i = Math.floor(Math.random() * pools.length);
  let j = Math.floor(Math.random() * pools.length);

  if (i === j) j = (j + 1) % pools.length;

  const impact = 0.01; // small realistic shift

  return pools.map((p, idx) => {
    if (idx === i) {
      return {
        ...p,
        reserve0: p.reserve0 * (1 - impact),
        reserve1: p.reserve1 * (1 + impact)
      };
    }

    if (idx === j) {
      return {
        ...p,
        reserve0: p.reserve0 * (1 + impact),
        reserve1: p.reserve1 * (1 - impact)
      };
    }

    return p;
  });
};