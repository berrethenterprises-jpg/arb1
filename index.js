import { ethers } from "ethers";
import https from "https";
import { getUniswapPrice } from "./dex/uniswap.js";

// 🔥 CONFIG
const CONFIG = {
    MIN_SPREAD: 0.001,      // 0.1% (realistic for testing)
    TRADE_SIZE: 1000,
    GAS_COST: 10,
    LOOP_DELAY: 1000
};

// 🔥 PROVIDER
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

let rpcReady = false;

const initRPC = async () => {
    while (!rpcReady) {
        try {
            const block = await provider.getBlockNumber();
            console.log("✅ RPC connected | Block:", block);
            rpcReady = true;
        } catch {
            console.log("❌ RPC failed — retrying...");
            await sleep(3000);
        }
    }
};

await initRPC();

console.log("🚀 ARB1 v23 MULTI-PAIR ENGINE STARTED");

// 🔥 FETCH UTIL
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

// 🔥 CEX PRICES
const getCEXPrices = async () => {
    try {
        const [eth, btc] = await Promise.all([
            fetchJSON("https://api.exchange.coinbase.com/products/ETH-USD/ticker"),
            fetchJSON("https://api.exchange.coinbase.com/products/BTC-USD/ticker")
        ]);

        return {
            ETH: parseFloat(eth?.price) || null,
            BTC: parseFloat(btc?.price) || null
        };
    } catch {
        return { ETH: null, BTC: null };
    }
};

// 🔥 PROFIT CALC
const calculateProfit = (spread) => {
    const gross = CONFIG.TRADE_SIZE * Math.abs(spread);
    const dexFee = CONFIG.TRADE_SIZE * 0.003;

    return gross - dexFee - CONFIG.GAS_COST;
};

// 🔥 LOOP UTIL
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 🔥 MAIN ENGINE
const run = async () => {

    while (true) {
        try {

            if (!rpcReady) {
                console.log("⏳ Waiting for RPC...");
                await sleep(1000);
                continue;
            }

            const [dexPrice, cex] = await Promise.all([
                getUniswapPrice(provider),
                getCEXPrices()
            ]);

            console.log("🧪 RAW:", {
                dexPrice,
                cexETH: cex.ETH,
                cexBTC: cex.BTC
            });

            if (!dexPrice || !cex.ETH) {
                console.log("⏳ Waiting for valid prices...");
                await sleep(CONFIG.LOOP_DELAY);
                continue;
            }

            const spread = (dexPrice - cex.ETH) / cex.ETH;

            console.log(
                `📊 ETH → DEX: ${dexPrice.toFixed(2)} | CEX: ${cex.ETH.toFixed(2)} | Spread: ${spread.toFixed(5)}`
            );

            if (Math.abs(spread) < CONFIG.MIN_SPREAD) {
                await sleep(CONFIG.LOOP_DELAY);
                continue;
            }

            const profit = calculateProfit(spread);

            if (profit <= 0 || isNaN(profit)) {
                console.log("❌ Not profitable after fees");
                await sleep(CONFIG.LOOP_DELAY);
                continue;
            }

            console.log("🔥 ARB OPPORTUNITY");
            console.log(`💰 Profit: $${profit.toFixed(2)}`);

        } catch (e) {
            console.log("❌ LOOP ERROR:", e.message);
        }

        await sleep(CONFIG.LOOP_DELAY);
    }
};

run();