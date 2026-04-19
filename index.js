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
  const [uni, sushi] = await Promise.all([
    getUniswapPools(provider),
    getSushiPools(provider)
  ]);

  const pools = [...uni, ...sushi];
  console.log(`📊 Pools: ${pools.length}`);
  return pools;
};

// ===== MEMPOOL HANDLER =====
const handleTx = async (txHash) => {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to) return;

    // 🔥 FILTER: ignore tiny noise txs
    if (tx.value && tx.value.lt(ethers.utils.parseEther("0.1"))) return;

    console.log("⚡ Mempool tx");

    const pools = await fetchPools();
    if (!pools.length) return;

    const adjusted = simulateMempoolImpact(pools);

    const opp = findTriangularArb(adjusted);
    if (!opp) return;

    console.log("🔥 ARB FOUND");
    console.log(opp);

    const res = await executor.execute(opp);

    if (res?.success) {
      pnl += res.profit;
      trades++;
      console.log(`📈 PNL: $${pnl.toFixed(2)} | Trades: ${trades}`);
    }

  } catch {}
};

provider.on("pending", handleTx);

console.log("🚀 ARB1 v36 SAFE EXECUTION ENGINE");