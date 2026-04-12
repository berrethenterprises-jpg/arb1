import { runMultiPoolEngine } from "./engine/multiPoolEngine.js";
import { POOLS } from "./config/pools.js";
import { executeArb } from "./execution/arbExecutor.js";
import { scoreOpportunity } from "./utils/scoreEngine.js";
import { calculateProfit } from "./utils/profitEngine.js";

import { initFlashbots, sendBundle } from "./execution/flashbotsReal.js";
import { detectBackrun } from "./execution/mevBackrun.js";

import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

let flashbots;

const CONFIG = {
    MIN_SCORE: 1.8,
    BASE_GAS: 15,
    MAX_TRADE_PCT: 0.25
};

let state = {
    balance: 1000,
    executing: false,
    pnl: 0,
    trades: 0
};

console.log("🚀 ARB1 v21 (MEV PROTECTED)");

(async () => {
    flashbots = await initFlashbots(provider, wallet);
})();


// 🔥 MEMPOOL BACKRUN MONITOR
provider.on("pending", async (hash) => {
    try {
        const tx = await provider.getTransaction(hash);

        if (detectBackrun(tx)) {
            console.log("⚡ Backrun candidate detected");
        }

    } catch {}
});


runMultiPoolEngine({
    config: POOLS,

    onOpportunity: async (opp) => {

        if (state.executing) return;

        try {
            state.executing = true;

            const spread = Math.abs(opp.spread);

            const score = scoreOpportunity({
                spread,
                volatility: spread,
                liquidity: 0.7,
                gasCost: CONFIG.BASE_GAS
            });

            if (score < CONFIG.MIN_SCORE) {
                state.executing = false;
                return;
            }

            const tradeSize =
                state.balance *
                CONFIG.MAX_TRADE_PCT *
                Math.min(score / 5, 1);

            const profit = calculateProfit({
                spread,
                tradeSize,
                gasCost: CONFIG.BASE_GAS
            });

            if (profit <= 0) {
                state.executing = false;
                return;
            }

            const tx = await executeArb({
                tokenIn: "WETH",
                tokenOut: "USDC",
                fee: 3000,
                amountIn: tradeSize,
                expectedOut: tradeSize * (1 + spread)
            });

            // 🔥 FLASHBOTS EXECUTION
            await sendBundle({
                flashbots,
                tx,
                wallet
            });

            state.balance += profit;
            state.pnl += profit;
            state.trades++;

            console.log(
                `📈 MEV TRADE | +$${profit.toFixed(2)} | Balance: $${state.balance.toFixed(2)}`
            );

        } catch (e) {
            console.log("❌ Error:", e.message);
        }

        state.executing = false;
    }
});