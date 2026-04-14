import "dotenv/config";
import { ethers } from "ethers";

import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { getAmountOut } from "./utils/poolMath.js";
import { createExecutor, executeTrade } from "./execution/executor.js";
import { startMempool } from "./mempool.js";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const TRADE_SIZE = 0.01;
const GAS_COST = 0.5;

let totalPNL = 0;
let trades = 0;

const executor = await createExecutor();

const isValid = (n) => typeof n === "number" && isFinite(n);

console.log("🚀 ARB1 v28 LATENCY ENGINE");

// ================= CORE SCAN =================
const scan = async () => {
  try {
    const [uniPools, sushiPools] = await Promise.all([
      getUniswapPools(provider),
      getSushiPools(provider)
    ]);

    const pools = [...uniPools, ...sushiPools].filter(
      p => isValid(p.reserveETH) && isValid(p.reserveUSDC)
    );

    let bestTrade = null;

    for (let i = 0; i < pools.length; i++) {
      for (let j = 0; j < pools.length; j++) {
        if (i === j) continue;

        const A = pools[i];
        const B = pools[j];

        const usdc = getAmountOut(
          TRADE_SIZE,
          A.reserveETH,
          A.reserveUSDC
        );

        const ethBack = getAmountOut(
          usdc,
          B.reserveUSDC,
          B.reserveETH
        );

        const profitETH = ethBack - TRADE_SIZE;
        const profitUSD = profitETH * 2000;

        if (
          isValid(profitUSD) &&
          profitUSD > 2 &&
          profitUSD < 1000
        ) {
          bestTrade = {
            path: `${A.dex} → ${B.dex}`,
            profitETH,
            profitUSD,
            finalETH: ethBack
          };
        }
      }
    }

    if (!bestTrade) return;

    console.log("🔥 TRADE (FAST)");
    console.log(bestTrade);

    await executeTrade({
      executor,
      amountIn: TRADE_SIZE,
      expectedProfit: bestTrade.profitUSD,
      minOut: bestTrade.finalETH * 0.995
    });

    totalPNL += bestTrade.profitUSD;
    trades++;

    console.log(`📈 PNL: $${totalPNL.toFixed(2)} | Trades: ${trades}`);

  } catch (err) {
    console.log("❌ SCAN ERROR:", err.message);
  }
};

// ================= FAST LOOP =================
setInterval(scan, 1200);

// ================= MEMPOOL EDGE =================
startMempool(provider, async () => {
  console.log("⚡ Mempool trigger");
  await scan();
});