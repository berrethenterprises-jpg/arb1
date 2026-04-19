import { ethers } from "ethers";

const MIN_SWAP = ethers.utils.parseEther("3");

export const decodeAndSimulate = (tx, pools) => {
  try {
    if (!tx || !tx.value) return null;
    if (tx.value.lt(MIN_SWAP)) return null;

    const ethValue = Number(ethers.utils.formatEther(tx.value));

    console.log(`⚡ Large swap detected: ${ethValue.toFixed(2)} ETH`);

    // 🔥 pick a random pool to simulate realistic impact
    const index = Math.floor(Math.random() * pools.length);
    const target = pools[index];

    const impactFactor = Math.min(0.15, ethValue / 500); // scaled impact

    const adjustedPools = pools.map((p, i) => {
      if (i !== index) return p;

      return {
        ...p,
        reserve0: p.reserve0 * (1 - impactFactor),
        reserve1: p.reserve1 * (1 + impactFactor)
      };
    });

    return adjustedPools;

  } catch {
    return null;
  }
};