import "dotenv/config";
import { ethers } from "ethers";

import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { findTriangularArb } from "./strategy/triangular.js";
import { createExecutor, executeTrade } from "./execution/executor.js";
import { startMempool } from "./mempool.js";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

let isScanning = false;
let totalPNL = 0;
let trades = 0;

const executor = await createExecutor();

console.log("🚀 ARB1 v31 EXECUTION ENGINE");

// ================= SCAN =================
const scan = async () => {
  if (isScanning) return;
  isScanning = true;

  try {
    const [uniPools, sushiPools] = await Promise.all([
      getUniswapPools(provider),
      getSushiPools(provider)
    ]);

    const pools = [...uniPools, ...sushiPools];

    console.log(`📊 Pools: ${pools.length}`);

    const best = findTriangularArb(pools);

    if (!best) {
      console.log("⏳ No triangular arb");
      isScanning = false;
      return;
    }

    console.log("🔥 REAL TRADE FOUND");
    console.log(best);

    await executeTrade({
      executor,
      tradeSize: best.tradeSize,
      expectedProfit: best.profitUSD
    });

    totalPNL += best.profitUSD;
    trades++;

    console.log(`📈 PNL: $${totalPNL.toFixed(2)} | Trades: ${trades}`);

  } catch (err) {
    console.log("❌ ERROR:", err.message);
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