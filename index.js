import "dotenv/config";
import { ethers } from "ethers";

import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { findTriangularArb } from "./strategy/triangular.js";
import { createExecutor, executeTrade } from "./execution/executor.js";
import { startMempool } from "./mempool.js";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const TRADE_SIZE = 0.01;

let isScanning = false;
let totalPNL = 0;
let trades = 0;

const executor = await createExecutor();

console.log("🚀 ARB1 v29.1 MULTI-ASSET ENGINE");

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

    const best = findTriangularArb(pools, TRADE_SIZE);

    if (!best) {
      console.log("⏳ No triangular arb");
      isScanning = false;
      return;
    }

    console.log("🔥 TRIANGULAR ARB FOUND");
    console.log(best);

    await executeTrade({
      executor,
      amountIn: TRADE_SIZE,
      expectedProfit: best.profitUSD,
      minOut: best.finalETH * 0.995
    });

    totalPNL += best.profitUSD;
    trades++;

    console.log(`📈 PNL: $${totalPNL.toFixed(2)} | Trades: ${trades}`);

  } catch (err) {
    console.log("❌ ERROR:", err.message);
  }

  isScanning = false;
};

setInterval(scan, 2500);

startMempool(provider, async () => {
  console.log("⚡ Mempool trigger");
  await scan();
});