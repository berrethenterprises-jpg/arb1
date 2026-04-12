import { ethers } from "ethers";
import https from "https";
import { getUniswapPrice } from "./dex/uniswap.js";

// 🔥 ROBUST PROVIDER (FIXES noNetwork)
const provider = new ethers.providers.JsonRpcProvider({
    url: process.env.RPC_URL,
    timeout: 10000
});

// 🔥 VERIFY RPC CONNECTION
const initProvider = async () => {
    try {
        const block = await provider.getBlockNumber();
        console.log("✅ RPC connected | Block:", block);
    } catch (e) {
        console.log("❌ RPC FAILED — CHECK YOUR RPC_URL");
    }
};

await initProvider();

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
    MIN_SPREAD: 0.005,   // 0.5%
    TRADE_SIZE: 1000,
    GAS_COST: 15
};


// 🔥 LOOP UTIL
const sleep = (ms) => new Promise(r => setTimeout(r, ms));


// 🔥 MAIN ENGINE
const run = async () => {

    while (true) {
        try {

            // 🔥 GET PRICES
            const [dexPrice, cexPrice] = await Promise.all([
                getUniswapPrice(provider),
                getCEXPrice()
            ]);

            // 🔥 DEBUG RAW DATA
            console.log("🧪 RAW:", { dexPrice, cexPrice });

            // 🔥 VALIDATION
            if (!dexPrice || !cexPrice) {
                console.log("⏳ Waiting for price data...");
                await sleep(1000);
                continue;
            }

            // 🔥 SPREAD
            const spread = (dexPrice - cexPrice) / cexPrice;

            console.log(
                `📊 DEX: ${dexPrice.toFixed(2)} | CEX: ${cexPrice.toFixed(2)} | Spread: ${spread.toFixed(5)}`
            );

            // 🔥 SKIP SMALL OR INVALID
            if (isNaN(spread) || Math.abs(spread) < CONFIG.MIN_SPREAD) {
                await sleep(1000);
                continue;
            }

            // 🔥 PROFIT CALC
            const gross = CONFIG.TRADE_SIZE * Math.abs(spread);
            const fees = CONFIG.TRADE_SIZE * 0.003;
            const profit = gross - fees - CONFIG.GAS_COST;

            if (isNaN(profit) || profit <= 0) {
                console.log("❌ Not profitable after fees");
                await sleep(1000);
                continue;
            }

            // 🔥 OPPORTUNITY FOUND
            console.log("🔥 ARB OPPORTUNITY FOUND");
            console.log(`💰 Estimated Profit: $${profit.toFixed(2)}`);

        } catch (e) {
            console.log("❌ LOOP ERROR:", e.message);
        }

        // 🔥 RATE LIMIT PROTECTION
        await sleep(1000);
    }
};


// 🔥 START ENGINE
run();
