import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

export const createExecutor = async (provider) => {
  console.log("⚡ Initializing Flashbots...");

  // 🔐 Flashbots auth signer (does NOT hold funds)
  const authSigner = ethers.Wallet.createRandom();

  // 🔐 Your wallet (used only for signing simulation tx)
  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ Missing PRIVATE_KEY in .env");
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // 🔥 Flashbots provider
  const flashbots = await FlashbotsBundleProvider.create(
    provider,
    authSigner
  );

  console.log("✅ Executor ready (Flashbots simulation)");

  const MIN_PROFIT = 5; // USD threshold

  return {
    execute: async (opp) => {
      try {
        if (!opp || !opp.profitUSD) return;

        if (opp.profitUSD < MIN_PROFIT) {
          console.log("⏳ Skipping (profit too small)");
          return;
        }

        console.log("⚡ Simulating Flashbots bundle...");

        // ===== BUILD SIMULATED TX =====
        const tx = {
          to: wallet.address, // placeholder
          value: 0,
          gasLimit: 300000,
          maxFeePerGas: ethers.utils.parseUnits("30", "gwei"),
          maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei"),
          chainId: 1,
          type: 2
        };

        const signedTx = await wallet.signTransaction(tx);

        const bundle = [
          {
            signedTransaction: signedTx
          }
        ];

        const blockNumber = await provider.getBlockNumber();

        // ===== FLASHBOTS SIMULATION =====
        const simulation = await flashbots.simulate(
          bundle,
          blockNumber + 1
        );

        if ("error" in simulation) {
          console.log("❌ Flashbots simulation failed");
          return;
        }

        // ===== GAS CALCULATION =====
        const gasUsed = simulation.results?.[0]?.gasUsed || 200000;

        const gasPriceGwei = 30;
        const ethPriceUSD = 3000;

        const gasCostETH = gasUsed * (gasPriceGwei * 1e-9);
        const gasCostUSD = gasCostETH * ethPriceUSD;

        const netProfit = opp.profitUSD - gasCostUSD;

        if (netProfit <= 0) {
          console.log("❌ Not profitable after gas");
          return;
        }

        // ===== SUCCESS =====
        console.log("🧪 FLASHBOTS SIM SUCCESS");
        console.log({
          gross: opp.profitUSD.toFixed(2),
          gas: gasCostUSD.toFixed(2),
          net: netProfit.toFixed(2)
        });

        return {
          success: true,
          profit: netProfit
        };

      } catch (e) {
        console.log("❌ Executor error:", e.message);
      }
    }
  };
};