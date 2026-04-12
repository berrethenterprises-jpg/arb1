import { ethers } from "ethers";
import https from "https";
import { getUniswapPrice } from "./dex/uniswap.js";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

console.log("🚀 ARB1 v22 DEX ENGINE STARTED");


// 🔥 HTTP FETCH
const fetchJSON = (url) => {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = "";

            res.on("data", chunk => data += chunk);

            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve(null);
                }
            });
        }).on("error", () => resolve(null));
    });
};


// 🔥 CEX PRICE (REFERENCE)
const getCEXPrice = async () => {
    const data = await fetchJSON(
        "https://api.exchange.coinbase.com/products/ETH-USD/ticker"
    );

    return data ? parseFloat(data.price) : null;
};


// 🔥 LOOP
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {

    while (true) {
        try {

            const [dexPrice, cexPrice] = await Promise.all([
                getUniswapPrice(provider),
                getCEXPrice()
            ]);

            if (!dexPrice || !cexPrice) {
                console.log("⏳ Waiting for price data...");
                await sleep(1000);
                continue;
            }

            const spread =
                (dexPrice - cexPrice) / cexPrice;

            console.log(
                `📊 DEX: ${dexPrice.toFixed(2)} | CEX: ${cexPrice.toFixed(2)} | Spread: ${spread.toFixed(5)}`
            );

            // 🔥 PROFIT CHECK
            if (Math.abs(spread) > 0.005) {

                const tradeSize = 1000;

                const gross = tradeSize * Math.abs(spread);
                const fees = tradeSize * 0.003;
                const gas = 15;

                const profit = gross - fees - gas;

                if (profit > 0) {
                    console.log(`🔥 ARB OPPORTUNITY: $${profit.toFixed(2)}`);
                }
            }

        } catch (e) {
            console.log("❌ ERROR:", e.message);
        }

        await sleep(1000);
    }
};

run();
