import { runMultiPoolEngine } from "./engine/multiPoolEngine.js";
import { POOLS } from "./config/pools.js";
import { executeArb } from "./execution/arbExecutor.js";
import { isProfitable } from "./utils/profitEngine.js";

const CONFIG = {
    MIN_SPREAD: 0.0012,
    TRADE_SIZE: 1000,
    GAS_ESTIMATE: 15, // USD estimate
};

console.log("🚀 ARB1 v18 ENGINE STARTED");

runMultiPoolEngine({
    config: POOLS,

    onOpportunity: async (opp) => {
        try {
            const { pair, spread, cex, dex } = opp;

            console.log(`🔥 ${pair} Opportunity`);
            console.log(`CEX: ${cex} | DEX: ${dex}`);
            console.log(`Spread: ${spread.toFixed(5)}`);

            // 🔥 HARD FILTER (ROXY FIX)
            if (Math.abs(spread) < CONFIG.MIN_SPREAD) {
                return;
            }

            const tradeSize = CONFIG.TRADE_SIZE;

            // 🔥 PROFIT CHECK (CRITICAL)
            const profitable = isProfitable({
                spread: Math.abs(spread),
                gasCost: CONFIG.GAS_ESTIMATE,
                tradeSize
            });

            if (!profitable) {
                console.log("❌ Not profitable after gas/fees");
                return;
            }

            // 🔥 DIRECTION LOGIC
            const direction =
                spread > 0
                    ? "BUY_DEX_SELL_CEX"
                    : "BUY_CEX_SELL_DEX";

            console.log(`⚡ Direction: ${direction}`);

            // 🔥 EXECUTION
            await executeArb({
                tokenIn: "WETH",
                tokenOut: "USDC",
                fee: 3000,
                amountIn: tradeSize,
                expectedOut: tradeSize * (1 + Math.abs(spread))
            });

        } catch (e) {
            console.log("❌ Execution error:", e.message);
        }
    }
});