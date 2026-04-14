import "dotenv/config";
import { ethers } from "ethers";

import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { getAmountOut } from "./utils/poolMath.js";
import { createExecutor, executeTrade } from "./execution/executor.js";
import { startMempool } from "./mempool.js";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const TRADE_SIZE = 0.01;

let totalPNL = 0;
let trades = 0;

let isScanning = false;

const executor = await createExecutor();

const isValid = (n) => typeof n === "number" && isFinite(n);

console.log("🚀 ARB1 v28.3 STABLE ENGINE");

// ================= SCAN ENGINE =================
const scan = async () => {
  if (isScanning) return;
  isScanning = true;

  try {
    const [uniPools, sushiPools] = await Promise.all([
      getUniswapPools(provider),
      getSushiPools(provider)
    ]);

    const pools = [...uniPools, ...sushiPools].filter(
      p => isValid(p.reserveETH) && isValid(p.reserveUSDC)
    );

    console.log(`📊 Pools: ${pools.length}`);

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
            profitUSD,
            finalETH: ethBack
          };
        }
      }
    }

    if (!bestTrade) {
      console.log("⏳ No profitable paths");
      isScanning = false;
      return;
    }

    console.log("🔥 BEST TRADE", bestTrade);

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

  isScanning = false;
};

// ================= LOOP =================
setInterval(scan, 2500);

// ================= MEMPOOL =================
startMempool(provider, async () => {
  console.log("⚡ Mempool trigger");
  await scan();
});