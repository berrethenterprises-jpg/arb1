import { getBinancePrice } from "../exchanges/binanceExec.js";
import { getUniswapPrice } from "../exchanges/uniswapV3.js";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const runMultiPoolEngine = async ({
    config,
    onOpportunity
}) => {

    console.log("🚀 Multi-Pool Engine Started");

    while (true) {
        try {

            for (const pair of Object.keys(config)) {

                const pools = config[pair];

                // 🔥 PARALLEL POOL SCAN
                const poolTasks = pools.map(async (pool) => {

                    const [cex, dex] = await Promise.all([
                        getBinancePrice(pair),
                        getUniswapPrice(pool)
                    ]);

                    if (!cex || !dex) return null;

                    const spread = (cex - dex) / dex;

                    return {
                        pair,
                        pool,
                        cex,
                        dex,
                        spread
                    };
                });

                const results = (await Promise.all(poolTasks)).filter(Boolean);

                // 🔥 FIND BEST POOL (CRITICAL EDGE)
                let best = null;

                for (const r of results) {
                    if (!best || Math.abs(r.spread) > Math.abs(best.spread)) {
                        best = r;
                    }
                }

                // 🔥 EXECUTE ONLY IF STRONG EDGE
                if (best && Math.abs(best.spread) > 0.0012) {
                    await onOpportunity(best);
                }
            }

        } catch (e) {
            console.log("❌ MultiPool error:", e.message);
        }

        await sleep(15);
    }
};
