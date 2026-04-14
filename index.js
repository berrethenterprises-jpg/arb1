import { ethers } from "ethers";
import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { findTriangularArb } from "./strategy/triangular.js";
import { createExecutor } from "./execution/executor.js";

// ✅ SAFE dotenv load (no crash if missing)
try {
  await import("dotenv/config");
} catch {
  console.log("⚠️ dotenv not found, skipping...");
}

// ===== ENV =====
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ===== PROVIDER =====
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

// ===== WALLET =====
const wallet = PRIVATE_KEY
  ? new ethers.Wallet(PRIVATE_KEY, provider)
  : null;

// ===== EXECUTOR =====
const executor = await createExecutor(provider, wallet);

// ===== STATE =====
let lastRun = 0;
const COOLDOWN_MS = 1500;

let totalPNL = 0;
let totalTrades = 0;

// ===== MAIN LOOP =====
const runEngine = async () => {
  const now = Date.now();

  // throttle loop
  if (now - lastRun < COOLDOWN_MS) return;
  lastRun = now;

  try {
    // ===== FETCH POOLS =====
    const [uniPools, sushiPools] = await Promise.all([
      getUniswapPools(provider),
      getSushiPools(provider)
    ]);

    const pools = [...uniPools, ...sushiPools];

    console.log(`📊 Pools: ${pools.length}`);

    if (!pools.length) {
      console.log("⏳ No pools available");
      return;
    }

    // ===== FIND ARB =====
    const opportunity = findTriangularArb(pools);

    if (!opportunity) {
      console.log("⏳ No triangular arb");
      return;
    }

    console.log("🔥 TRIANGULAR ARB FOUND");
    console.log(opportunity);

    // ===== EXECUTE =====
    const result = await executor.execute(opportunity);

    if (result?.success) {
      totalPNL += result.profit;
      totalTrades++;

      console.log("⚡ EXECUTED TRADE");
      console.log(result);

      console.log(
        `📈 PNL: $${totalPNL.toFixed(2)} | Trades: ${totalTrades}`
      );
    } else {
      console.log("❌ Execution skipped/failed");
    }

  } catch (err) {
    console.log("❌ Engine error:", err.message);
  }
};

// ===== MEMPOOL LISTENER (SINGLE + SAFE) =====
let mempoolAttached = false;

const startMempool = () => {
  if (mempoolAttached) return;

  try {
    provider.on("pending", async () => {
      console.log("⚡ Mempool trigger");
      runEngine();
    });

    mempoolAttached = true;
    console.log("✅ Mempool monitoring active (single listener)");

  } catch (err) {
    console.log("⚠️ Mempool not supported, using interval fallback");

    // fallback loop
    setInterval(runEngine, 2000);
  }
};

// ===== START =====
console.log("🚀 ARB1 v31 EXECUTION ENGINE");

startMempool();