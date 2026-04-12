import { CONFIG } from "./config.js";
import { getPrices } from "./exchanges/multiFeed.js";
import { findOpportunity } from "./utils/arbitrageEngine.js";
import { simulateExecution } from "./utils/executionSim.js";

const PAIRS = ["ETHUSDT", "BTCUSDT"];

let state = {
    balance: CONFIG.START_BALANCE,
    pnl: 0,
    trades: 0
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const loop = async () => {
    console.log("🚀 ARB1 v17 Multi-Exchange Engine Started");

    while (true) {
        try {
            for (const pair of PAIRS) {

                const prices = await getPrices(pair);

                if (!prices) {
                    console.log(`⏳ ${pair} no data`);
                    continue;
                }

                console.log(`📊 ${pair} | C: ${prices.coinbase} | B: ${prices.binance}`);

                const opp = findOpportunity(prices);

                console.log(`🔍 Spread: ${opp.spread.toFixed(4)}`);

                if (Math.abs(opp.spread) < CONFIG.MIN_SPREAD) {
                    continue;
                }

                const capital = state.balance * CONFIG.TRADE_SIZE_PCT;

                const exec = simulateExecution(capital, opp.spread);

                if (!exec.success) {
                    console.log("⚠️ Execution failed");
                    continue;
                }

                if (exec.profit <= 0) {
                    console.log(`❌ Loss: $${exec.profit.toFixed(2)}`);
                } else {
                    console.log(`📈 Profit: $${exec.profit.toFixed(2)}`);
                }

                state.balance += exec.profit;
                state.pnl += exec.profit;
                state.trades++;
            }

        } catch (e) {
            console.log("Error:", e.message);
        }

        await sleep(CONFIG.LOOP_DELAY);
    }
};

loop();