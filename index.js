import { CONFIG } from "./config.js";
import { startFeed, getLivePrice } from "./exchanges/cexFeed.js";
import { getDEXQuote } from "./exchanges/dex.js";
import { getAlpha, updatePrice, recordResult } from "./utils/alphaEngine.js";
import { shouldTrade } from "./utils/risk.js";

let state = {
    balance: CONFIG.START_BALANCE,
    pnl: 0,
    trades: 0,
    lossStreak: 0
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const loop = async () => {
    console.log("🧠 Bot loop starting...");

    await startFeed();

    console.log("✅ Feed initialized, entering trading loop...");

    while (true) {
        try {
            const cex = getLivePrice();

            if (!cex) {
                console.log("⏳ Waiting for price...");
                await sleep(200);
                continue;
            }

            console.log(`📊 Price: ${cex.price.toFixed(2)} | Latency: ${cex.latency}ms`);

            const dex = await getDEXQuote(cex.price);

            updatePrice(cex.price);

            const spread = (cex.price - dex.price) / dex.price;
            const liquidity = dex.liquidity;
            const volatility = Math.abs(spread);

            const alpha = getAlpha(volatility, state.lossStreak);

            let score =
                spread * 4 +
                liquidity * 1.2 +
                alpha;

            console.log(
                `🔍 Spread: ${spread.toFixed(4)} | Liquidity: ${liquidity.toFixed(2)} | Score: ${score.toFixed(2)}`
            );

            if (!shouldTrade({ spread, liquidity, score })) {
                console.log("❌ Skipped trade (filters)");
                await sleep(CONFIG.LOOP_DELAY);
                continue;
            }

            // 🔥 PARTIAL FILLS
            let size = Math.min(
                Math.sqrt(state.balance) * CONFIG.BASE_SIZE_FACTOR,
                liquidity * 1500
            );

            const fillPercent = 0.7 + Math.random() * 0.3;
            size *= fillPercent;

            // 🔥 EXECUTION FAILURE
            if (Math.random() < 0.1) {
                console.log("⚠️ Trade failed (execution)");
                await sleep(CONFIG.LOOP_DELAY);
                continue;
            }

            // 🔥 REALISTIC PROFIT CALC
            const feeRate = 0.001;     // 0.1% per side
            const slippage = 0.0008;   // 0.08%

            const grossProfit = size * score * 0.0025;

            const fees = size * feeRate * 2;
            const slip = size * slippage;

            let profit = grossProfit - fees - slip;

            // 🔥 LOSS SIMULATION
            if (Math.random() < 0.15) {
                const loss = Math.abs(profit) * (0.5 + Math.random());
                state.balance -= loss;
                state.pnl -= loss;
                state.lossStreak++;

                console.log(`❌ LOSS TRADE | -$${loss.toFixed(2)} | Balance: $${state.balance.toFixed(2)}`);
                await sleep(CONFIG.LOOP_DELAY);
                continue;
            }

            state.balance += profit;
            state.pnl += profit;
            state.trades++;

            recordResult(profit);

            console.log(
                `📈 TRADE EXECUTED | Profit: $${profit.toFixed(2)} | Balance: $${state.balance.toFixed(2)} | Trades: ${state.trades}`
            );

        } catch (e) {
            console.log("❌ Error:", e.message);
        }

        await sleep(CONFIG.LOOP_DELAY);
    }
};

loop();