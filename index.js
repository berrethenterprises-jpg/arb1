import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

let flashbots = null;

const CONFIG = {
    MIN_SPREAD: 0.003,
    TRADE_SIZE: 0.02, // ETH
    GAS_COST_USD: 15
};

let state = {
    trades: 0,
    pnl: 0,
    executing: false
};

console.log("🚀 ARB1 LIVE ENGINE STARTED");

// 🔥 INIT FLASHBOTS
(async () => {
    try {
        flashbots = await FlashbotsBundleProvider.create(provider, wallet);
        console.log("✅ Flashbots ready");
    } catch {
        console.log("⚠️ Flashbots disabled");
    }
})();


// 🔥 REAL PRICE FETCH (COINBASE + BINANCE)
const getPrices = async () => {
    try {
        const [cb, bn] = await Promise.all([
            fetch("https://api.exchange.coinbase.com/products/ETH-USD/ticker").then(r => r.json()),
            fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT").then(r => r.json())
        ]);

        return {
            coinbase: parseFloat(cb.price),
            binance: parseFloat(bn.price)
        };

    } catch {
        return null;
    }
};


// 🔥 MAIN LOOP
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {

    while (true) {
        try {

            if (state.executing) {
                await sleep(50);
                continue;
            }

            const prices = await getPrices();

            if (!prices) {
                console.log("⏳ Waiting for prices...");
                await sleep(200);
                continue;
            }

            const spread =
                (prices.coinbase - prices.binance) / prices.binance;

            console.log(
                `📊 CB: ${prices.coinbase.toFixed(2)} | BN: ${prices.binance.toFixed(2)} | Spread: ${spread.toFixed(5)}`
            );

            if (Math.abs(spread) < CONFIG.MIN_SPREAD) {
                await sleep(50);
                continue;
            }

            const tradeValue = CONFIG.TRADE_SIZE * prices.binance;

            const gross = tradeValue * Math.abs(spread);
            const fees = tradeValue * 0.002;

            const profit = gross - fees - CONFIG.GAS_COST_USD;

            if (profit <= 0) {
                console.log("❌ Not profitable");
                await sleep(50);
                continue;
            }

            state.executing = true;

            console.log(`⚡ TRADE FOUND | Profit: $${profit.toFixed(2)}`);

            // 🔥 FLASHBOTS EXECUTION (SAFE)
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
                        console.log("✅ Trade executed (Flashbots)");
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

        await sleep(50);
    }
};

run();
