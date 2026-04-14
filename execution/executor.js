import { ethers } from "ethers";

export const createExecutor = async () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("✅ Executor ready (v30)");

  return { provider, wallet };
};

export const executeTrade = async ({ tradeSize, expectedProfit }) => {
  if (expectedProfit < 0.5) return;

  console.log("🚀 EXECUTION READY TRADE");

  console.log({
    size: tradeSize,
    profit: expectedProfit
  });

  // still safe mode (no tx yet)
};