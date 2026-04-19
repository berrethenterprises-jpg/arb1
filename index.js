import { ethers } from "ethers";
import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { decodeAndSimulate } from "./strategy/mempool.js";
import { findTriangularArb } from "./strategy/triangular.js";
import { createExecutor } from "./execution/executor.js";

try { await import("dotenv/config"); } catch {}

// ===== PROVIDER (AUTO WS OR HTTP FALLBACK) =====
const RPC = process.env.RPC_URL || "";

let provider;

if (RPC.startsWith("wss://")) {
  provider = new ethers.providers.WebSocketProvider(RPC);
  console.log("🔌 Using WebSocket provider (mempool enabled)");
} else {
  provider = new ethers.providers.JsonRpcProvider(RPC);
  console.log("⚠️ Using HTTP provider (no real mempool)");
}

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

    console.log("🔥 REAL MEMPOOL ARB");
    console.log(opp);

    const res = await executor.execute(opp);

    if (res?.success) {
      pnl += res.profit;
      trades++;
      console.log(`📈 PNL: $${pnl.toFixed(2)} | Trades: ${trades}`);
    }

  } catch {}
};

// ===== MEMPOOL SUBSCRIPTION (ONLY IF WS) =====
if (RPC.startsWith("wss://")) {
  provider.on("pending", handleTx);
}

// ===== FALLBACK LOOP (ALWAYS ACTIVE) =====
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

    const res = await executor.execute(opp);

    if (res?.success) {
      pnl += res.profit;
      trades++;
      console.log(`📈 PNL: $${pnl.toFixed(2)} | Trades: ${trades}`);
    }

  } catch (e) {
    console.log("❌ Fallback error:", e.message);
  }
}, 5000);

console.log("🚀 ARB1 v37 HYBRID ENGINE ACTIVE");