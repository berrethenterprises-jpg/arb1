import { ethers } from "ethers";
import https from "https";
import { getUniswapPrice } from "./dex/uniswap.js";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

console.log("🚀 ARB1 v22 DEX ENGINE STARTED");


// 🔥 SAFE HTTP FETCH
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


// 🔥 CEX PRICE (COINBASE)
const getCEXPrice = async () => {
    try {
        const data = await fetchJSON(
            "https://api.exchange.coinbase.com/products/ETH-USD/ticker"
        );

        const price = parseFloat(data?.price);

        if (!price || isNaN(price)) return null;

        return price;

    } catch {
        return null;
    }
};


// 🔥 CONFIG
const CONFIG = {
    MIN_SPREAD: 0.005, // 0.5% (realistic threshold)
    TRADE_SIZE: 1000,
    GAS_COST: 15
};


// 🔥 LOOP
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {

    while (true) {
        try {

            // 🔥 FETCH BOTH PRICES
            const [dexPrice, cexPrice] = await Promise.all([
                getUniswapPrice(provider),
                getCEXPrice()
            ]);

            // 🔥 DEBUG RAW OUTPUT
            console.log("🧪 RAW:", { dexPrice, cexPrice });

            // 🔥 VALIDATION
            if (!dexPrice || !cexPrice) {
                console.log("⏳ Waiting for price data...");
                await sleep(1000);
                continue;
            }

            // 🔥 CALCULATE SPREAD
            const spread = (dexPrice - cexPrice) / cexPrice;

            console.log(
                `📊 DEX: ${dexPrice.toFixed(2)} | CEX: ${cexPrice.toFixed(2)} | Spread: ${spread.toFixed(5)}`
            );

            // 🔥 SKIP SMALL OPPORTUNITIES
            if (isNaN(spread) || Math.abs(spread) < CONFIG.MIN_SPREAD) {
                await sleep(1000);
                continue;
            }

            // 🔥 PROFIT CALCULATION
            const gross = CONFIG.TRADE_SIZE * Math.abs(spread);
            const fees = CONFIG.TRADE_SIZE * 0.003;

            const profit = gross - fees - CONFIG.GAS_COST;

            if (isNaN(profit) || profit <= 0) {
                console.log("❌ Not profitable after fees");
                await sleep(1000);
                continue;
            }

            console.log(`🔥 ARB OPPORTUNITY FOUND`);
            console.log(`💰 Estimated Profit: $${profit.toFixed(2)}`);

        } catch (e) {
            console.log("❌ LOOP ERROR:", e.message);
        }

        // 🔥 RATE LIMIT PROTECTION
        await sleep(1000);
    }
};

run();
