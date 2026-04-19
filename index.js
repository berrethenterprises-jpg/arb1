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

// ===== FETCH POOLS (THROTTLED) =====
const fetchPools = async () => {
  const now = Date.now();

  // 🔥 only refresh every 10 seconds
  if (now - lastFetch < 10000 && poolCache.length) {
    return poolCache;
  }

  try {
    console.log("🔄 Refreshing pools...");

    const [uni, sushi] = await Promise.all([
      getUniswapPools(provider),
      getSushiPools(provider)
    ]);

    poolCache = [...uni, ...sushi];
    lastFetch = now;

    console.log(`📊 Pools refreshed: ${poolCache.length}`);

    return poolCache;

  } catch (e) {
    console.log("❌ Pool fetch error:", e.message);
    return poolCache; // fallback to old cache
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

// ===== MEMPOOL =====
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

console.log("🚀 ARB1 v37.1 STABLE MEMPOOL ENGINE");