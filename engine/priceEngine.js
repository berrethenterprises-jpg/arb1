import { getBinancePrice } from "../exchanges/binanceExec.js";
import { getUniswapPrice } from "../exchanges/uniswapV3.js";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const runPriceEngine = async ({
    pairs,
    pools,
    onOpportunity
}) => {

    console.log("⚡ Price Engine Started (Low Latency Mode)");

    while (true) {
        try {

            // 🔥 PARALLEL FETCH (CRITICAL FIX)
            const tasks = pairs.map(async (pair, i) => {

                const pool = pools[i];

                const [cex, dex] = await Promise.all([
                    getBinancePrice(pair),
                    getUniswapPrice(pool)
                ]);

                // 🔥 HARD SKIP BAD DATA (ROXY FIX)
                if (!cex || !dex || cex === 0 || dex === 0) return null;

                const spread = (cex - dex) / dex;

                return {
                    pair,
                    pool,
                    cex,
                    dex,
                    spread
                };
            });

            const results = (await Promise.all(tasks)).filter(Boolean);

            // 🔥 ROUTING (BEST OPPORTUNITY)
            let best = null;

            for (const r of results) {
                if (!best || Math.abs(r.spread) > Math.abs(best.spread)) {
                    best = r;
                }
            }

            // 🔥 ONLY EXECUTE IF EDGE EXISTS
            if (best && Math.abs(best.spread) > 0.001) {
                await onOpportunity(best);
            }

        } catch (e) {
            console.log("❌ Engine error:", e.message);
        }

        // 🔥 ULTRA LOW LATENCY LOOP
        await sleep(10);
    }
};
