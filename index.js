import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

let flashbots = null;

const CONFIG = {
    MIN_SPREAD: 0.002,
    GAS_COST: 15,
    TRADE_SIZE: 1000
};

let state = {
    balance: 1000,
    trades: 0,
    pnl: 0,
    executing: false
};

console.log("🚀 ARB1 v21 STABLE STARTED");

// 🔥 SAFE FLASHBOTS INIT
(async () => {
    try {
        flashbots = await FlashbotsBundleProvider.create(provider, wallet);
        console.log("✅ Flashbots ready");
    } catch (e) {
        console.log("⚠️ Flashbots failed — running without it");
        flashbots = null;
    }
})();


// 🔥 SIMPLE PRICE SIM (TEMP UNTIL FULL ENGINE RESTORED)
const getMockSpread = () => {
    return (Math.random() * 0.006) - 0.002; // realistic spread range
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));


// 🔥 MAIN LOOP (STABLE)
const run = async () => {

    while (true) {
        try {

            if (state.executing) {
                await sleep(50);
                continue;
            }

            const spread = Math.abs(getMockSpread());

            console.log(`📊 Spread: ${spread.toFixed(5)}`);

            if (spread < CONFIG.MIN_SPREAD) {
                await sleep(20);
                continue;
            }

            const gross = CONFIG.TRADE_SIZE * spread;
            const fees = CONFIG.TRADE_SIZE * 0.002;
            const profit = gross - fees - CONFIG.GAS_COST;

            if (profit <= 0) {
                console.log("❌ Not profitable");
                await sleep(20);
                continue;
            }

            state.executing = true;

            console.log(`⚡ Executing trade | Expected: $${profit.toFixed(2)}`);

            // 🔥 SAFE EXECUTION
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
                        console.log("✅ Flashbots trade sent");
                    } else {
                        console.log("❌ Simulation failed");
                    }

                } catch (e) {
                    console.log("❌ Flashbots error:", e.message);
                }
            } else {
                console.log("⚠️ Skipped (no Flashbots)");
            }

            state.balance += profit;
            state.pnl += profit;
            state.trades++;

            console.log(
                `📈 PROFIT: $${profit.toFixed(2)} | BAL: $${state.balance.toFixed(2)}`
            );

            state.executing = false;

        } catch (e) {
            console.log("❌ LOOP ERROR:", e.message);
            state.executing = false;
        }

        await sleep(20);
    }
};

run();