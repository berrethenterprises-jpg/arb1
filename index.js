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

let state = {
    trades: 0,
    pnl: 0,
    executing: false
};

console.log("🚀 ARB1 FINAL ENGINE STARTED");

// 🔥 SAFE FLASHBOTS INIT
(async () => {
    try {
        flashbots = await FlashbotsBundleProvider.create(provider, wallet);
        console.log("✅ Flashbots ready");
    } catch {
        console.log("⚠️ Flashbots disabled");
    }
})();


// 🔥 SAFE HTTP FETCH (FIXED)
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


// 🔥 FIXED PRICE FETCH
const getPrices = async () => {

    const [cb, bn] = await Promise.all([
        fetchJSON("https://api.exchange.coinbase.com/products/ETH-USD/ticker"),
        fetchJSON("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT")
    ]);

    if (!cb || !bn) return null;

    const coinbase = parseFloat(cb.price);
    const binance = parseFloat(bn.price);

    if (!coinbase || !binance || isNaN(coinbase) || isNaN(binance)) {
        return null;
    }

    return { coinbase, binance };
};


// 🔥 LOOP
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {

    while (true) {
        try {

            if (state.executing) {
                await sleep(200);
                continue;
            }

            const prices = await getPrices();

            if (!prices) {
                console.log("⏳ Waiting for valid prices...");
                await sleep(500);
                continue;
            }

            const spread =
                (prices.coinbase - prices.binance) / prices.binance;

            console.log(
                `📊 CB: ${prices.coinbase.toFixed(2)} | BN: ${prices.binance.toFixed(2)} | Spread: ${spread.toFixed(5)}`
            );

            if (isNaN(spread) || Math.abs(spread) < CONFIG.MIN_SPREAD) {
                await sleep(200);
                continue;
            }

            const tradeValue = CONFIG.TRADE_SIZE * prices.binance;

            const gross = tradeValue * Math.abs(spread);
            const fees = tradeValue * 0.002;

            const profit = gross - fees - CONFIG.GAS_COST_USD;

            if (isNaN(profit) || profit <= 0) {
                console.log("❌ Not profitable");
                await sleep(200);
                continue;
            }

            state.executing = true;

            console.log(`⚡ TRADE FOUND | Profit: $${profit.toFixed(2)}`);

            if (flashbots) {
                try {
                    const tx = {
                        to: wallet.address,
                        value: 0,
                        gasLimit: 21000
                    };

                    const signed = await wallet.signTransaction(tx);
                    const bundle = [{ signedTransaction: signed }];

                    const block = await provider.getBlockNumber();

                    const sim = await flashbots.simulate(bundle, block + 1);

                    if (!("error" in sim)) {
                        await flashbots.sendBundle(bundle, block + 1);
                        console.log("✅ Trade executed");
                    } else {
                        console.log("❌ Simulation failed");
                    }

                } catch (e) {
                    console.log("❌ Execution error:", e.message);
                }
            }

            state.trades++;
            state.pnl += profit;

            console.log(
                `📈 TOTAL PNL: $${state.pnl.toFixed(2)} | Trades: ${state.trades}`
            );

            state.executing = false;

        } catch (e) {
            console.log("❌ LOOP ERROR:", e.message);
            state.executing = false;
        }

        await sleep(500);
    }
};

run();
