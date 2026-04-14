import { ethers } from "ethers";
import pkg from "@flashbots/ethers-provider-bundle";

const { FlashbotsBundleProvider } = pkg;

// ================= CONSTANTS =================
const ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 Router
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC = "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// Uniswap V3 exactInputSingle ABI
const ABI = [
  "function exactInputSingle(tuple(address,address,uint24,address,uint256,uint256,uint256,uint160)) payable returns (uint256)"
];

// ================= CREATE EXECUTOR =================
export const createExecutor = async () => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // 🔥 Flashbots init (FIXED)
    const flashbots = await FlashbotsBundleProvider.create(
      provider,
      wallet,
      "https://relay.flashbots.net",
      "mainnet"
    );

    const router = new ethers.Contract(ROUTER, ABI, wallet);

    console.log("✅ Flashbots initialized");

    return { provider, wallet, flashbots, router };

  } catch (err) {
    console.log("❌ Executor init failed:", err.message);
    throw err;
  }
};

// ================= EXECUTE TRADE =================
export const executeTrade = async ({
  executor,
  amountIn,
  expectedProfit,
  minOut
}) => {
  try {
    // ================= SAFETY FILTERS =================
    if (!executor) {
      console.log("🚫 Executor not ready");
      return;
    }

    if (!amountIn || amountIn <= 0) {
      console.log("🚫 Invalid trade size");
      return;
    }

    if (expectedProfit < 2) {
      console.log("🚫 Profit too small");
      return;
    }

    if (amountIn > 0.05) {
      console.log("🚫 Trade too large");
      return;
    }

    if (!minOut || minOut <= 0) {
      console.log("🚫 Invalid minOut");
      return;
    }

    // ================= TX BUILD =================
    const deadline = Math.floor(Date.now() / 1000) + 60;

    const tx = await executor.router.populateTransaction.exactInputSingle({
      tokenIn: WETH,
      tokenOut: USDC,
      fee: 3000,
      recipient: executor.wallet.address,
      deadline,
      amountIn: ethers.utils.parseEther(amountIn.toString()),

      // 🔥 CRITICAL FIX: REAL SLIPPAGE PROTECTION
      amountOutMinimum: ethers.utils.parseUnits(
        minOut.toFixed(2),
        6
      ),

      sqrtPriceLimitX96: 0
    });

    // ================= SIGN =================
    const signedTx = await executor.wallet.signTransaction(tx);

    const blockNumber = await executor.provider.getBlockNumber();

    // ================= SEND BUNDLE =================
    const bundle = [
      {
        signedTransaction: signedTx
      }
    ];

    const response = await executor.flashbots.sendBundle(
      bundle,
      blockNumber + 1
    );

    console.log("📦 Flashbots bundle submitted");

    // Optional: wait for inclusion result
    const resolution = await response.wait();

    if (resolution === 0) {
      console.log("✅ Bundle included");
    } else {
      console.log("⚠️ Bundle not included");
    }

  } catch (err) {
    console.log("❌ EXECUTION ERROR:", err.message);
  }
};