import { runMultiPoolEngine } from "./engine/multiPoolEngine.js";
import { POOLS } from "./config/pools.js";
import { executeArb } from "./execution/arbExecutor.js";
import { scoreOpportunity } from "./utils/scoreEngine.js";
import { calculateProfit } from "./utils/profitEngine.js";

import { predictMove } from "./utils/predictiveEngine.js";
import { watchMempool } from "./utils/mempoolMonitor.js";
import { simulateMultiHop } from "./utils/multiHop.js";
import { getCrossChainSignal } from "./utils/crossChainSignal.js";

const CONFIG = {
    MIN_SCORE: 1.5,
    MAX_TRADE_PCT: 0.3,
    BASE_GAS: 15,
    COOLDOWN_MS: 150
};

let state = {
    balance: 1000,
    pnl: 0,
    trades: 0,
    spreads: [],
    lastTrade: 0
};

console.log("🚀 ARB1 v20 (PREDICTIVE + MEV AWARE)");


// 🔥 MEMPOOL SIGNAL (BOOST EDGE)
watchMempool((tx) => {
    console.log("⚡ Large mempool tx detected:", tx.hash);
});


runMultiPoolEngine({
    config: POOLS,

    onOpportunity: async (opp) => {
        try {
            const now = Date.now();

            if (now - state.lastTrade < CONFIG.COOLDOWN_MS) return;

            const spread = Math.abs(opp.spread);

            // 🔥 STORE HISTORY
            state.spreads.push(spread);
            if (state.spreads.length > 20) state.spreads.shift();

            const prediction = predictMove(state.spreads);

            // 🔥 MULTI-HOP TEST
            const multiHop = simulateMultiHop({
                amount: 1,
                path: ["ETH", "USDC", "DAI", "ETH"],
                prices: {
                    ETH_USDC: 1800,
                    USDC_DAI: 1,
                    DAI_ETH: 1 / 1805
                }
            });

            // 🔥 CROSS-CHAIN SIGNAL
            const cross = getCrossChainSignal({
                mainnetPrice: opp.cex,
                altPrice: opp.dex
            });

            const score = scoreOpportunity({
                spread,
                volatility: spread + prediction,
                liquidity: 0.7,
                gasCost: CONFIG.BASE_GAS
            });

            if (score < CONFIG.MIN_SCORE) return;

            const tradeSize =
                state.balance *
                CONFIG.MAX_TRADE_PCT *
                Math.min(score / 5, 1);

            const profit = calculateProfit({
                spread,
                tradeSize,
                gasCost: CONFIG.BASE_GAS
            });

            if (profit <= 0) return;

            await executeArb({
                tokenIn: "WETH",
                tokenOut: "USDC",
                fee: 3000,
                amountIn: tradeSize,
                expectedOut: tradeSize * (1 + spread)
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