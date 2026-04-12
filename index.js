import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import https from "https";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

let flashbots = null;

const CONFIG = {
    MIN_SPREAD: 0.003,
    TRADE_SIZE: 0.02,
    GAS_COST_USD: 15
};

console.log("🚀 ARB1 FINAL ENGINE STARTED");

// 🔥 FLASHBOTS
(async () => {
    try {
        flashbots = await FlashbotsBundleProvider.create(provider, wallet);
        console.log("✅ Flashbots ready");
    } catch {
        console.log("⚠️ Flashbots disabled");
    }
});


// 🔥 SAFE HTTP
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


// 🔥 MULTI-SOURCE PRICE ENGINE (FIXED)
const getPrices = async () => {

    const [coinbase, binance, coingecko] = await Promise.all([
        fetchJSON("https://api.exchange.coinbase.com/products/ETH-USD/ticker"),
        fetchJSON("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT"),
        fetchJSON("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
    ]);

    let cb = coinbase?.price;
    let bn = binance?.price;
    let cg = coingecko?.ethereum?.usd;

    // 🔥 FALLBACK LOGIC
    const coinbasePrice = parseFloat(cb || cg);
    const binancePrice = parseFloat(bn || cg);

    // DEBUG LOG
    console.log("🧪 RAW:", {
        cb,
        bn,
        cg
    });

    if (
        !coinbasePrice ||
        !binancePrice ||
        isNaN(coinbasePrice) ||
        isNaN(binancePrice)
    ) {
        return null;
    }

    return {
        coinbase: coinbasePrice,
        binance: binancePrice
    };
};


// 🔥 LOOP
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {

    while (true) {
        try {

            const prices = await getPrices();

            if (!prices) {
                console.log("⏳ Waiting for valid prices...");
                await sleep(1000);
                continue;
            }

            const spread =
                (prices.coinbase - prices.binance) / prices.binance;

            console.log(
                `📊 CB: ${prices.coinbase.toFixed(2)} | BN: ${prices.binance.toFixed(2)} | Spread: ${spread.toFixed(5)}`
            );

        } catch (e) {
            console.log("❌ ERROR:", e.message);
        }

        await sleep(1000);
    }
};

run();
