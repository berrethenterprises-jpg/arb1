import { ethers } from "ethers";
import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { decodeAndSimulate } from "./strategy/mempool.js";
import { findTriangularArb } from "./strategy/triangular.js";
import { createExecutor } from "./execution/executor.js";

try { await import("dotenv/config"); } catch {}

const RPC = process.env.RPC_URL;

const provider = RPC.startsWith("wss://")
  ? new ethers.providers.WebSocketProvider(RPC)
  : new ethers.providers.JsonRpcProvider(RPC);

console.log(
  RPC.startsWith("wss://")
    ? "🔌 Using WebSocket provider"
    : "⚠️ Using HTTP provider"
);

const executor = await createExecutor(provider);

let pnl = 0;
let trades = 0;

// ===== POOL CACHE (LOCKED) =====
let poolCache = [];
let lastFetch = 0;
let fetching = false;

const fetchPools = async () => {
  const now = Date.now();

  // ✅ return cached pools if fresh
  if (now - lastFetch < 10000 && poolCache.length) {
    return poolCache;
  }

  // 🔥 prevent parallel fetches
  if (fetching) {
    return poolCache;
  }

  try {
    fetching = true;

    console.log("🔄 Refreshing pools (LOCKED)...");

    const [uni, sushi] = await Promise.all([
      getUniswapPools(provider),
      getSushiPools(provider)
    ]);

    poolCache = [...uni, ...sushi];
    lastFetch = Date.now();

    console.log(`📊 Pools refreshed: ${poolCache.length}`);

    return poolCache;

  } catch (e) {
    console.log("❌ Pool fetch error:", e.message);
    return poolCache;
  } finally {
    fetching = false;
  }
};

// ===== MEMPOOL HANDLER =====
const handleTx = async (txHash) => {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) return;

    const pools = await fetchPools();
    if (!pools.length) return;

    const adjusted = decodeAndSimulate(tx, pools);
    if (!adjusted) return;

    const opp = findTriangularArb(adjusted);
    if (!opp) return;

    console.log("🔥 MEMPOOL ARB");
    console.log(opp);

    const res = await executor.execute(opp);

    if (res?.success) {
      pnl += res.profit;
      trades++;
      console.log(`📈 PNL: $${pnl.toFixed(2)} | Trades: ${trades}`);
    }

  } catch {}
};

// ===== MEMPOOL SUBSCRIPTION =====
if (RPC.startsWith("wss://")) {
  provider.on("pending", handleTx);
}

// ===== FALLBACK LOOP =====
setInterval(async () => {
  try {
    console.log("🔄 Fallback tick...");

    const pools = await fetchPools();
    if (!pools.length) return;

    const opp = findTriangularArb(pools);

    if (!opp) {
      console.log("⏳ No fallback opportunity");
      return;
    }

    console.log("🔥 FALLBACK ARB");
    console.log(opp);

  } catch {}
}, 5000);

console.log("🚀 ARB1 v37.2 LOCKED ENGINE");