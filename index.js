import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import https from "https";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

let flashbots = null;

console.log("🚀 ARB1 STABLE PRICE ENGINE");

// 🔥 FLASHBOTS INIT
(async () => {
    try {
        flashbots = await FlashbotsBundleProvider.create(provider, wallet);
        console.log("✅ Flashbots ready");
    } catch {
        console.log("⚠️ Flashbots disabled");
    }
})();


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


// 🔥 MULTI-SOURCE (RELIABLE ONLY)
const getPrices = async () => {

    const [coinbase, kraken] = await Promise.all([
        fetchJSON("https://api.exchange.coinbase.com/products/ETH-USD/ticker"),
        fetchJSON("https://api.kraken.com/0/public/Ticker?pair=ETHUSD")
    ]);

    const cb = coinbase?.price;
    const kr = kraken?.result
        ? Object.values(kraken.result)[0]?.c?.[0]
        : null;

    console.log("🧪 RAW:", { cb, kr });

    const coinbasePrice = parseFloat(cb);
    const krakenPrice = parseFloat(kr);

    if (
        !coinbasePrice ||
        !krakenPrice ||
        isNaN(coinbasePrice) ||
        isNaN(krakenPrice)
    ) {
        return null;
    }

    return {
        coinbase: coinbasePrice,
        kraken: krakenPrice
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
                (prices.coinbase - prices.kraken) / prices.kraken;

            console.log(
                `📊 CB: ${prices.coinbase.toFixed(2)} | KR: ${prices.kraken.toFixed(2)} | Spread: ${spread.toFixed(5)}`
            );

        } catch (e) {
            console.log("❌ ERROR:", e.message);
        }

        await sleep(1000);
    }
};

run();
