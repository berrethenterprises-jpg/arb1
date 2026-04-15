import { ethers } from "ethers";
import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";
import { findTriangularArb } from "./strategy/triangular.js";
import { createExecutor } from "./execution/executor.js";

try { await import("dotenv/config"); } catch {}

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const executor = await createExecutor(provider);

let cache = [];
let lastFetch = 0;
const CACHE_TTL = 4000;

let pnl = 0;
let trades = 0;

const fetchPools = async () => {
  if (Date.now() - lastFetch < CACHE_TTL) return cache;

  const [uni, sushi] = await Promise.all([
    getUniswapPools(provider),
    getSushiPools(provider)
  ]);

  cache = [...uni, ...sushi];
  lastFetch = Date.now();

  console.log(`📊 Pools: ${cache.length}`);
  return cache;
};

const run = async () => {
  try {
    const pools = await fetchPools();
    if (!pools.length) return;

    const opp = findTriangularArb(pools);
    if (!opp) return;

    console.log("🔥 REAL ARB", opp);

    const res = await executor.execute(opp);

    if (res?.success) {
      pnl += res.profit;
      trades++;
      console.log(`📈 PNL: $${pnl.toFixed(2)} | Trades: ${trades}`);
    }

  } catch (e) {
    console.log("❌", e.message);
  }
};

provider.on("pending", run);

console.log("🚀 ARB1 v32.5 GRAPH ENGINE");