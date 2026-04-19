import { ethers } from "ethers";

export const getProvider = () => {
  if (!process.env.ARB_WSS) {
    throw new Error("Missing ARB_WSS");
  }

  console.log("🔌 Using Arbitrum WebSocket");

  return new ethers.providers.WebSocketProvider(
    process.env.ARB_WSS,
    {
      name: "arbitrum",
      chainId: 42161
    }
  );
};