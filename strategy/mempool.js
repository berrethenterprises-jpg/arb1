import { ethers } from "ethers";

const MIN_SWAP = ethers.utils.parseEther("5"); // only large swaps

export const decodeAndSimulate = (tx, pools) => {
  try {
    if (!tx.to || !tx.data) return null;

    // 🔥 Simple large ETH transfer detection
    if (tx.value && tx.value.gt(MIN_SWAP)) {
      console.log("⚡ Large swap detected:", ethers.utils.formatEther(tx.value), "ETH");

      // 🔥 Apply fake impact to pools (simulate slippage)
      const impacted = pools.map(p => {
        return {
          ...p,
          reserve0: p.reserve0 * 0.97,
          reserve1: p.reserve1 * 1.03
        };
      });

      return impacted;
    }

    return null;

  } catch {
    return null;
  }
};