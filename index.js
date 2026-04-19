import { getProvider } from "./config/network.js";
import { getUniswapPools } from "./dex/uniswap.js";
import { getSushiPools } from "./dex/sushiswap.js";

import { findTriangularArb } from "./strategy/triangular.js";
import { detectLargeSwap, simulateImpact } from "./strategy/mempool.js";
import { createExecutor } from "./execution/executor.js";

const provider = getProvider();

const run = async () => {
  const executor = await createExecutor(provider);

  let pools = [];

  setInterval(async () => {
    console.log("🔄 Refreshing pools...");

    const uni = await getUniswapPools(provider);
    const sushi = await getSushiPools(provider);

    pools = [...uni, ...sushi];

    console.log(`📊 Pools: ${pools.length}`);
  }, 8000);

  provider.on("pending", async (hash) => {
    try {
      const tx = await provider.getTransaction(hash);
      if (!tx) return;

      if (detectLargeSwap(tx)) {
        console.log("⚡ Large swap detected");

        const impacted = simulateImpact(pools);
        if (!impacted) return;

        const opp = findTriangularArb(impacted);

        if (opp) {
          console.log("🔥 EVENT ARB", opp);
          await executor.execute(opp);
        }
      }
    } catch {}
  });

  setInterval(async () => {
    const opp = findTriangularArb(pools);

    if (opp) {
      console.log("🔥 BASE ARB", opp);
      await executor.execute(opp);
    } else {
      console.log("⏳ No opportunity");
    }
  }, 4000);
};

run();