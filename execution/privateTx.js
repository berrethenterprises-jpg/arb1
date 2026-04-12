import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export const sendPrivateTx = async (wallet, tx) => {
    // ⚠️ For production: use Flashbots / MEV-Share
    return await wallet.sendTransaction({
        ...tx,
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        maxFeePerGas: ethers.parseUnits("30", "gwei")
    });
};
