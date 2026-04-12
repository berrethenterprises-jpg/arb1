import { CONFIG } from "./config.js";
import { startFeed, getLivePrice } from "./exchanges/cexFeed.js";
import { getDEXQuote } from "./exchanges/dex.js";
import { executeAtomic } from "./utils/execution.js";
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
    startFeed();

    while (true) {
        try {
            const cex = getLivePrice();
            if (!cex || cex.latency > 200) {
                await sleep(100);
                continue;
            }

            const dex = await getDEXQuote();

            updatePrice(cex.price);

            const spread = (cex.price - dex.price) / dex.price;
            const liquidity = dex.liquidity;
            const volatility = Math.abs(spread);

            const alpha = getAlpha(volatility, state.lossStreak);

            let score =
                spread * 2 +
                liquidity +
                alpha;

            score *= (1 - cex.latency / 100);

            if (!shouldTrade({
                spread,
                liquidity,
                latency: cex.latency,
                score
            })) {
                await sleep(CONFIG.LOOP_DELAY);
                continue;
            }

            const size = Math.min(
                Math.sqrt(state.balance) * CONFIG.BASE_SIZE_FACTOR,
                liquidity * 1000
            );

            if (CONFIG.PAPER_TRADING) {
                const profit = size * score * 0.001;

                state.balance += profit;
                state.pnl += profit;
                state.trades++;

                recordResult(profit);

                console.log(
                    `📈 TRADE | Profit: $${profit.toFixed(2)} | Balance: $${state.balance.toFixed(2)}`
                );
            } else {
                await executeAtomic(
                    () => Promise.resolve(true),
                    () => Promise.resolve(true)
                );
            }

        } catch (e) {
            console.log("Error:", e.message);
        }

        await sleep(CONFIG.LOOP_DELAY);
    }
};

loop();