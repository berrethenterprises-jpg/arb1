import { CONFIG } from "./config.js";
import { getPrices } from "./exchanges/multiFeed.js";
import { findOpportunity } from "./utils/arbitrageEngine.js";

let state = {
    balance: CONFIG.START_BALANCE,
    pnl: 0,
    trades: 0
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const loop = async () => {
    console.log("🚀 Multi-Exchange Arb Engine Started");

    while (true) {
        try {
            const prices = await getPrices();

            if (!prices.coinbase || !prices.binance) {
                console.log("⏳ Waiting for prices...");
                await sleep(500);
                continue;
            }

            console.log(`📊 Coinbase: ${prices.coinbase} | Binance: ${prices.binance}`);

            const opp = findOpportunity(prices);

            if (!opp) {
                await sleep(200);
                continue;
            }

            console.log(`🔍 Spread: ${opp.spread.toFixed(4)} | Buy: ${opp.buy} | Sell: ${opp.sell}`);

            // 🔥 FILTER
            if (Math.abs(opp.spread) < 0.001) {
                console.log("❌ No edge");
                await sleep(200);
                continue;
            }

            // 🔥 FLASH LOAN SIMULATION (LEVERAGE)
            const leverage = 5; // simulate flash loan
            const capital = state.balance * leverage;

            // 🔥 COSTS
            const feeRate = 0.001;
            const slippage = 0.001;

            const gross = capital * Math.abs(opp.spread);

            const fees = capital * feeRate * 2;
            const slip = capital * slippage;

            let profit = gross - fees - slip;

            // 🔥 EXECUTION FAILURE
            if (Math.random() < 0.1) {
                console.log("⚠️ Execution failed");
                await sleep(200);
                continue;
            }

            // 🔥 LOSS PROTECTION
            if (profit <= 0) {
                console.log("❌ Unprofitable after costs");
                await sleep(200);
                continue;
            }

            // 🔥 RISK LIMIT
            const tradeSize = Math.min(state.balance * 0.2, capital);

            profit *= (tradeSize / capital);

            state.balance += profit;
            state.pnl += profit;
            state.trades++;

            console.log(`📈 ARB TRADE | +$${profit.toFixed(2)} | Balance: $${state.balance.toFixed(2)}`);

        } catch (e) {
            console.log("Error:", e.message);
        }

        await sleep(200);
    }
};

loop();