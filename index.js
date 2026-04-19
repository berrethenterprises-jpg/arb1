import { ethers } from "ethers";
import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { simulateMempoolImpact } from "./strategy/mempool.js";
import { findTriangularArb } from "./strategy/triangular.js";
import { createExecutor } from "./execution/executor.js";

try { await import("dotenv/config"); } catch {}

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const executor = await createExecutor(provider);

let pnl = 0;
let trades = 0;

// ===== FETCH POOLS =====
const fetchPools = async () => {
  try {
    const [uni, sushi] = await Promise.all([
      getUniswapPools(provider),
      getSushiPools(provider)
    ]);

    const pools = [...uni, ...sushi];

    console.log(`📊 Pools: ${pools.length}`);

    return pools;

  } catch (e) {
    console.log("❌ Pool fetch error:", e.message);
    return [];
  }
};

// ===== MAIN LOOP (POLLING) =====
const run = async () => {
  try {
    console.log("🔄 Tick...");

    const pools = await fetchPools();
    if (!pools.length) return;

    // simulate mempool-like impact
    const adjusted = simulateMempoolImpact(pools);

    const opp = findTriangularArb(adjusted);
    if (!opp) {
      console.log("⏳ No opportunity");
      return;
    }

    console.log("🔥 ARB FOUND");
    console.log(opp);

    const res = await executor.execute(opp);

    if (res?.success) {
      pnl += res.profit;
      trades++;
      console.log(`📈 PNL: $${pnl.toFixed(2)} | Trades: ${trades}`);
    }

  } catch (e) {
    console.log("❌ Engine error:", e.message);
  }
};

// ===== LOOP EVERY 3 SECONDS =====
setInterval(run, 3000);

console.log("🚀 ARB1 v36 POLLING ENGINE ACTIVE");