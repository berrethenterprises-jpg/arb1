import { ethers } from "ethers";
import https from "https";
import { getUniswapPrice } from "./dex/uniswap.js";

// 🔥 PROVIDER (SAFE)
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

let rpcReady = false;

// 🔥 RPC INIT WITH RETRY
const initRPC = async () => {
    while (!rpcReady) {
        try {
            const block = await provider.getBlockNumber();
            console.log("✅ RPC connected | Block:", block);
            rpcReady = true;
        } catch (e) {
            console.log("❌ RPC FAILED — retrying in 3s...");
            await new Promise(r => setTimeout(r, 3000));
        }
    }
};

await initRPC();

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


// 🔥 CEX PRICE
const getCEXPrice = async () => {
    const data = await fetchJSON(
        "https://api.exchange.coinbase.com/products/ETH-USD/ticker"
    );

    const price = parseFloat(data?.price);

    return (!price || isNaN(price)) ? null : price;
};


// 🔥 CONFIG
const CONFIG = {
    MIN_SPREAD: 0.005,
    TRADE_SIZE: 1000,
    GAS_COST: 15
};


// 🔥 LOOP
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {

    while (true) {
        try {

            if (!rpcReady) {
                console.log("⏳ Waiting for RPC...");
                await sleep(1000);
                continue;
            }

            const [dexPrice, cexPrice] = await Promise.all([
                getUniswapPrice(provider),
                getCEXPrice()
            ]);

            console.log("🧪 RAW:", { dexPrice, cexPrice });

            if (!dexPrice || !cexPrice) {
                console.log("⏳ Waiting for price data...");
                await sleep(1000);
                continue;
            }

            const spread = (dexPrice - cexPrice) / cexPrice;

            console.log(
                `📊 DEX: ${dexPrice.toFixed(2)} | CEX: ${cexPrice.toFixed(2)} | Spread: ${spread.toFixed(5)}`
            );

            if (isNaN(spread) || Math.abs(spread) < CONFIG.MIN_SPREAD) {
                await sleep(1000);
                continue;
            }

            const gross = CONFIG.TRADE_SIZE * Math.abs(spread);
            const fees = CONFIG.TRADE_SIZE * 0.003;
            const profit = gross - fees - CONFIG.GAS_COST;

            if (isNaN(profit) || profit <= 0) {
                console.log("❌ Not profitable after fees");
                await sleep(1000);
                continue;
            }

            console.log("🔥 ARB OPPORTUNITY FOUND");
            console.log(`💰 Profit: $${profit.toFixed(2)}`);

        } catch (e) {
            console.log("❌ LOOP ERROR:", e.message);
        }

        await sleep(1000);
    }
};

run();
