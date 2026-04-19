import { ethers } from "ethers";

const MIN_SWAP = ethers.utils.parseEther("3");

export const decodeAndSimulate = (tx, pools) => {
  try {
    if (!tx || !tx.value) return null;
    if (tx.value.lt(MIN_SWAP)) return null;

    const ethValue = Number(ethers.utils.formatEther(tx.value));

    console.log(`⚡ Large swap detected: ${ethValue.toFixed(2)} ETH`);

    if (pools.length < 2) return null;

    // 🔥 pick TWO pools (simulate cross-DEX divergence)
    const i = Math.floor(Math.random() * pools.length);
    let j = Math.floor(Math.random() * pools.length);

    if (i === j) j = (j + 1) % pools.length;

    const impact = Math.min(0.12, ethValue / 400);

    const adjusted = pools.map((p, idx) => {
      if (idx === i) {
        // pool gets worse price
        return {
          ...p,
          reserve0: p.reserve0 * (1 - impact),
          reserve1: p.reserve1 * (1 + impact)
        };
      }

      if (idx === j) {
        // opposite pool gets better price
        return {
          ...p,
          reserve0: p.reserve0 * (1 + impact),
          reserve1: p.reserve1 * (1 - impact)
        };
      }

      return p;
    });

    return adjusted;

  } catch {
    return null;
  }
};