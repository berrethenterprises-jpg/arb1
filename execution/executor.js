import { ethers } from "ethers";
import pkg from "@flashbots/ethers-provider-bundle";

const { FlashbotsBundleProvider } = pkg;

export const createExecutor = async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  let flashbots = null;

  try {
    flashbots = await FlashbotsBundleProvider.create(
      provider,
      wallet,
      "https://relay.flashbots.net",
      "mainnet"
    );
    console.log("✅ Flashbots ready");
  } catch {
    console.log("⚠️ Flashbots disabled");
  }

  return { provider, wallet, flashbots };
};

export const executeTrade = async ({ executor, amountIn }) => {
  try {
    // placeholder execution (safe mode)
    console.log("⚡ Simulated execution:", amountIn);

  } catch (err) {
    console.log("❌ EXECUTION ERROR:", err.message);
  }
};