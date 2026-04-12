import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

const RPC = process.env.RPC_URL;
const KEY = process.env.PRIVATE_KEY;

// 🔥 SAFETY CHECK (PREVENT CRASH)
if (!KEY || !KEY.startsWith("0x") || KEY.length < 66) {
    console.error("❌ INVALID PRIVATE KEY — FIX ENV VARIABLE");
    process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(KEY, provider);

let flashbots = null;

console.log("🚀 ARB1 STARTED");

// SAFE FLASHBOTS INIT
(async () => {
    try {
        flashbots = await FlashbotsBundleProvider.create(provider, wallet);
        console.log("✅ Flashbots ready");
    } catch {
        console.log("⚠️ Flashbots disabled");
    }
})();

setInterval(() => {
    console.log("🟢 Bot alive | Balance tracking...");
}, 3000);
