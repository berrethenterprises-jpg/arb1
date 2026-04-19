import { ethers } from "ethers";
import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { decodeAndSimulate } from "./strategy/mempool.js";
import { findTriangularArb } from "./strategy/triangular.js";
import { createExecutor } from "./execution/executor.js";

try { await import("dotenv/config"); } catch {}

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const executor = await createExecutor(provider);

let pnl = 0;
let trades = 0;

// ===== FETCH =====
const fetchPools = async () => {
  const [uni, sushi] = await Promise.all([
    getUniswapPools(provider),
    getSushiPools(provider)
  ]);

  return [...uni, ...sushi];
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

provider.on("pending", handleTx);

console.log("🚀 ARB1 v37 MEMPOOL DECODER");