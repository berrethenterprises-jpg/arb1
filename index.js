import { runMultiPoolEngine } from "./engine/multiPoolEngine.js";
import { POOLS } from "./config/pools.js";
import { executeArb } from "./execution/arbExecutor.js";
import { scoreOpportunity } from "./utils/scoreEngine.js";
import { calculateProfit, isProfitable } from "./utils/profitEngine.js";

const CONFIG = {
    MIN_SCORE: 1.5,
    MAX_TRADE_PCT: 0.3,
    BASE_GAS: 15,
    COOLDOWN_MS: 200
};

let state = {
    balance: 1000,
    lastTrade: 0,
    trades: 0,
    pnl: 0
};

console.log("🚀 ARB1 v19 PROFIT ENGINE STARTED");

runMultiPoolEngine({
    config: POOLS,

    onOpportunity: async (opp) => {
        try {
            const now = Date.now();

            // 🔥 TRADE THROTTLING (ROXY FIX)
            if (now - state.lastTrade < CONFIG.COOLDOWN_MS) return;

            const { spread } = opp;

            const volatility = Math.abs(spread);
            const liquidity = 0.7; // placeholder until live liquidity fetch

            const score = scoreOpportunity({
                spread: Math.abs(spread),
                volatility,
                liquidity,
                gasCost: CONFIG.BASE_GAS
            });

            console.log(`📊 Score: ${score.toFixed(2)} | Spread: ${spread.toFixed(5)}`);

            if (score < CONFIG.MIN_SCORE) {
                return;
            }

            // 🔥 DYNAMIC POSITION SIZING
            const confidence = Math.min(score / 5, 1);

            const tradeSize =
                state.balance *
                CONFIG.MAX_TRADE_PCT *
                confidence;

            // 🔥 PROFIT CALC
            const profit = calculateProfit({
                spread: Math.abs(spread),
                tradeSize,
                gasCost: CONFIG.BASE_GAS
            });

            if (!isProfitable(profit)) {
                console.log("❌ Not profitable after costs");
                return;
            }

            // 🔥 EXECUTION
            await executeArb({
                tokenIn: "WETH",
                tokenOut: "USDC",
                fee: 3000,
                amountIn: tradeSize,
                expectedOut: tradeSize * (1 + Math.abs(spread))
            });

            state.balance += profit;
            state.pnl += profit;
            state.trades++;
            state.lastTrade = now;

            console.log(
                `📈 TRADE | +$${profit.toFixed(2)} | Balance: $${state.balance.toFixed(2)}`
            );

        } catch (e) {
            console.log("❌ Error:", e.message);
        }
    }
});