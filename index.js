import { ethers } from "ethers";
import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { findTriangularArb } from "./strategy/triangular.js";
import { createExecutor } from "./execution/executor.js";
import { loadCache, saveCache } from "./dex/poolCache.js";

try { await import("dotenv/config"); } catch {}

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const executor = await createExecutor(provider);

// ===== CACHE =====
let cache = loadCache();
let lastFetch = 0;

// ===== STATS =====
let pnl = 0;
let trades = 0;

// ===== FETCH =====
const fetchPools = async () => {
  const now = Date.now();

  if (now - lastFetch > 30000) {
    try {
      const [uni, sushi] = await Promise.all([
        getUniswapPools(provider),
        getSushiPools(provider)
      ]);

      cache = [...uni, ...sushi];

      saveCache(cache);

      lastFetch = now;

      console.log(`📊 Pools refreshed: ${cache.length}`);
    } catch (e) {
      console.log("⚠️ Using cached pools");
    }
  } else {
    console.log(`📊 Pools (cached): ${cache.length}`);
  }

  return cache;
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

console.log("🚀 ARB1 v34 HYBRID ENGINE");