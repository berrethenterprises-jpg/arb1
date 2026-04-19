import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

export const createExecutor = async (provider) => {
  console.log("⚡ Initializing Flashbots...");

  const authSigner = ethers.Wallet.createRandom();

  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY");
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const flashbots = await FlashbotsBundleProvider.create(
    provider,
    authSigner
  );

  console.log("✅ Executor ready (Flashbots simulation)");

  return {
    execute: async (opp) => {
      try {
        if (!opp || opp.profitUSD < 5) return;

        console.log("⚡ Simulating Flashbots bundle...");

        const tx = {
          to: wallet.address,
          value: 0,
          gasLimit: 300000,
          maxFeePerGas: ethers.utils.parseUnits("30", "gwei"),
          maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei"),
          chainId: 1,
          type: 2
        };

        const signed = await wallet.signTransaction(tx);

        const bundle = [{ signedTransaction: signed }];

        const block = await provider.getBlockNumber();

        const sim = await flashbots.simulate(bundle, block + 1);

        if ("error" in sim) {
          console.log("❌ Simulation failed");
          return;
        }

        const gasUsed = sim.results?.[0]?.gasUsed || 200000;
        const gasCost = gasUsed * 30e-9 * 3000;

        const net = opp.profitUSD - gasCost;
        if (net <= 0) return;

        console.log("🧪 FLASHBOTS SIM SUCCESS");
        console.log({
          gross: opp.profitUSD.toFixed(2),
          gas: gasCost.toFixed(2),
          net: net.toFixed(2)
        });

        return { success: true, profit: net };

      } catch (e) {
        console.log("❌ Executor error:", e.message);
      }
    }
  };
};