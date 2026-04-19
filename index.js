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

// ===== POOL CACHE =====
let poolCache = [];
let lastFetch = 0;
let fetching = false;

const fetchPools = async () => {
  const now = Date.now();

  // small cooldown
  if (now - lastFetch < 5000) {
    return poolCache;
  }

  if (fetching) return poolCache;

  try {
    fetching = true;

    console.log("🔄 Refreshing pools (BATCH MODE)...");

    const [uni, sushi] = await Promise.all([
      getUniswapPools(provider),
      getSushiPools(provider)
    ]);

    const newPools = [...uni, ...sushi];

    // 🔥 ACCUMULATE (NO OVERWRITE)
    let added = 0;

    for (const p of newPools) {
      const exists = poolCache.find(
        x =>
          x.token0 === p.token0 &&
          x.token1 === p.token1 &&
          x.dex === p.dex
      );

      if (!exists) {
        poolCache.push(p);
        added++;
      }
    }

    // 🔥 LIMIT CACHE SIZE
    if (poolCache.length > 120) {
      poolCache = poolCache.slice(-120);
    }

    lastFetch = Date.now();

    console.log(`📊 Pools cached: ${poolCache.length} (+${added})`);

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

// ===== MEMPOOL SUB =====
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
    if (!opp) return;

    console.log("🔥 FALLBACK ARB");
    console.log(opp);

    const res = await executor.execute(opp);

    if (res?.success) {
      pnl += res.profit;
      trades++;
      console.log(`📈 PNL: $${pnl.toFixed(2)} | Trades: ${trades}`);
    }

  } catch {}
}, 5000);

console.log("🚀 ARB1 v41.6 ACCUMULATING ENGINE");