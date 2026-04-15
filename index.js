import { ethers } from "ethers";
import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { findTriangularArb } from "./strategy/triangular.js";
import { createExecutor } from "./execution/executor.js";

try { await import("dotenv/config"); } catch {}

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const wallet = process.env.PRIVATE_KEY
  ? new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  : null;

const executor = await createExecutor(provider, wallet);

// ===== CACHE =====
let cache = [];
let lastFetch = 0;
const CACHE_TTL = 5000;

// ===== STATS =====
let pnl = 0;
let trades = 0;

// ===== FETCH =====
const fetchPools = async () => {
  if (Date.now() - lastFetch < CACHE_TTL) return cache;

  const [uni, sushi] = await Promise.all([
    getUniswapPools(provider),
    getSushiPools(provider)
  ]);

  cache = [...uni, ...sushi];
  lastFetch = Date.now();

  console.log(`📊 Pools (cached): ${cache.length}`);
  return cache;
};

// ===== ENGINE =====
const run = async () => {
  try {
    const pools = await fetchPools();
    if (!pools.length) return;

    const opp = findTriangularArb(pools);
    if (!opp) return;

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

// ===== MEMPOOL =====
let attached = false;

const start = () => {
  if (attached) return;

  try {
    provider.on("pending", run);
    console.log("✅ Mempool active (cached)");
    attached = true;
  } catch {
    console.log("⚠️ Fallback loop");
    setInterval(run, 2000);
  }
};

console.log("🚀 ARB1 v32 ENGINE");
start();