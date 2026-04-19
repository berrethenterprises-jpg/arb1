import { ethers } from "ethers";

// Uniswap V2 Router
const ROUTER = "0x7a250d5630b4cf539739df2c5dacab4c659f2488";

// swapExactETHForTokens
const SWAP_SIG = "0x7ff36ab5";

const FEE = 0.003;

const simulateSwap = (amountIn, rin, rout) => {
  const amountInWithFee = amountIn * (1 - FEE);
  return (amountInWithFee * rout) / (rin + amountInWithFee);
};

// 🔥 Decode + simulate ONLY real swaps
export const decodeAndSimulate = (tx, pools) => {
  try {
    if (!tx.to) return null;

    // 🔥 Only Uniswap router
    if (tx.to.toLowerCase() !== ROUTER) return null;

    // 🔥 Only swapExactETHForTokens (simplest)
    if (!tx.data.startsWith(SWAP_SIG)) return null;

    // 🔥 Estimate trade size from value (ETH input)
    const ethIn = Number(ethers.utils.formatEther(tx.value));

    if (ethIn < 1) return null; // ignore small trades

    console.log(`⚡ Large swap detected: ${ethIn.toFixed(2)} ETH`);

    // 🔥 Apply directional impact (WETH → token)
    return pools.map(p => {
      const np = { ...p };

      // only affect WETH pools
      if (
        p.token0 !== "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2" &&
        p.token1 !== "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2"
      ) return p;

      const reserveIn = np.reserve0;
      const reserveOut = np.reserve1;

      const out = simulateSwap(ethIn, reserveIn, reserveOut);

      np.reserve0 += ethIn;
      np.reserve1 -= out;

      return np;
    });

  } catch {
    return null;
  }
};