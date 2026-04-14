import { ethers } from "ethers";
import pkg from "@flashbots/ethers-provider-bundle";

const { FlashbotsBundleProvider } = pkg;

// ⚠️ Using Uniswap V2 router (simpler + safer)
const UNISWAP_V2_ROUTER = "0x7a250d5630b4cf539739df2c5dacab4c659f2488";

const ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)"
];

// WETH → USDC path (example first leg)
const WETH = "0xC02aa39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC = "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

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
  } catch (err) {
    console.log("⚠️ Flashbots init failed:", err.message);
  }

  return { provider, wallet, flashbots };
};

// 🔥 BUILD TX (first-leg swap only for now)
const buildTx = async ({ wallet, tradeSize }) => {
  const router = new ethers.Contract(UNISWAP_V2_ROUTER, ROUTER_ABI, wallet);

  const path = [WETH, USDC];

  const tx = await router.populateTransaction.swapExactETHForTokens(
    0, // min out (we'll refine later)
    path,
    wallet.address,
    Math.floor(Date.now() / 1000) + 60,
    {
      value: ethers.utils.parseEther(tradeSize.toString())
    }
  );

  return tx;
};

export const executeTrade = async ({ executor, tradeSize, expectedProfit }) => {
  const { wallet, provider, flashbots } = executor;

  if (!flashbots) {
    console.log("⚠️ Flashbots unavailable");
    return;
  }

  if (expectedProfit < 0.5) return;

  try {
    console.log("🚀 BUILDING TX...");

    const tx = await buildTx({ wallet, tradeSize });

    const signedTx = await wallet.signTransaction({
      ...tx,
      gasLimit: 300000,
      maxFeePerGas: ethers.utils.parseUnits("30", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei"),
      nonce: await provider.getTransactionCount(wallet.address)
    });

    const blockNumber = await provider.getBlockNumber();

    const bundle = [
      {
        signedTransaction: signedTx
      }
    ];

    console.log("📦 Sending bundle...");

    const result = await flashbots.sendBundle(bundle, blockNumber + 1);

    const res = await result.wait();

    if (res === 0) {
      console.log("✅ Bundle INCLUDED");
    } else {
      console.log("❌ Bundle NOT included");
    }

  } catch (err) {
    console.log("❌ EXECUTION ERROR:", err.message);
  }
};