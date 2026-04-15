import { ethers } from "ethers";
import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { findTriangularArb } from "./strategy/triangular.js";
import { createExecutor } from "./execution/executor.js";

try { await import("dotenv/config"); } catch {}

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const executor = await createExecutor(provider);

// ===== STATS =====
let pnl = 0;
let trades = 0;

// ===== FETCH (NO CACHE) =====
const fetchPools = async () => {
  console.log("⚡ Fetching fresh pools...");

  try {
    const [uni, sushi] = await Promise.all([
      getUniswapPools(provider),
      getSushiPools(provider)
    ]);

    const pools = [...uni, ...sushi];

    console.log(`📊 Pools: ${pools.length}`);

    return pools;

  } catch (e) {
    console.log("❌ Pool fetch failed:", e.message);
    return [];
  }
};

// ===== ENGINE =====
const run = async () => {
  try {
    const pools = await fetchPools();
    if (!pools.length) return;

    const opp = findTriangularArb(pools);
    if (!opp) return;

    console.log("🔥 REAL ARB FOUND");
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

provider.on("pending", run);

console.log("🚀 ARB1 v34.6 NO-CACHE ENGINE");