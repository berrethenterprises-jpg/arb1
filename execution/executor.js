import { ethers } from "ethers";
import FlashbotsBundleProvider from "@flashbots/ethers-provider-bundle";

const ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC = "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

const ABI = [
  "function exactInputSingle(tuple(address,address,uint24,address,uint256,uint256,uint256,uint160)) payable returns (uint256)"
];

export const createExecutor = async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const flashbots = await FlashbotsBundleProvider.create(
    provider,
    wallet,
    "https://relay.flashbots.net"
  );

  const router = new ethers.Contract(ROUTER, ABI, wallet);

  return { provider, wallet, flashbots, router };
};

export const executeTrade = async ({ executor, amountIn, expectedProfit }) => {
  try {
    // 🔒 SAFETY FILTERS
    if (expectedProfit < 2) {
      console.log("🚫 Profit too small");
      return;
    }

    if (amountIn > 0.05) {
      console.log("🚫 Trade too large");
      return;
    }

    const deadline = Math.floor(Date.now() / 1000) + 60;

    const tx = await executor.router.populateTransaction.exactInputSingle({
      tokenIn: WETH,
      tokenOut: USDC,
      fee: 3000,
      recipient: executor.wallet.address,
      deadline,
      amountIn: ethers.utils.parseEther(amountIn.toString()),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    });

    const signed = await executor.wallet.signTransaction(tx);
    const block = await executor.provider.getBlockNumber();

    await executor.flashbots.sendBundle(
      [{ signedTransaction: signed }],
      block + 1
    );

    console.log("📦 Flashbots bundle sent");

  } catch (err) {
    console.log("❌ EXECUTION ERROR:", err.message);
  }
};