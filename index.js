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

            // ✅ FIXED: pass cex price into DEX
            const dex = await getDEXQuote(cex.price);

            updatePrice(cex.price);

            const spread = (cex.price - dex.price) / dex.price;
            const liquidity = dex.liquidity;
            const volatility = Math.abs(spread);

            const alpha = getAlpha(volatility, state.lossStreak);

            let score =
                spread * 2 +
                liquidity +
                alpha;

            console.log(
                `🔍 Spread: ${spread.toFixed(4)} | Liquidity: ${liquidity.toFixed(2)} | Score: ${score.toFixed(2)}`
            );

            if (!shouldTrade({ spread, liquidity, score })) {
                console.log("❌ Skipped trade (filters)");
                await sleep(CONFIG.LOOP_DELAY);
                continue;
            }

            const size = Math.min(
                Math.sqrt(state.balance) * CONFIG.BASE_SIZE_FACTOR,
                liquidity * 1000
            );

            const profit = size * score * 0.001;

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