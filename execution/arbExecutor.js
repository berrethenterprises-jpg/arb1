import { ethers } from "ethers";
import { buildSwapTx } from "../dex/uniswapSwap.js";
import { sendBundle } from "./flashbots.js";

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);

export const executeArb = async ({
    tokenIn,
    tokenOut,
    fee,
    amountIn,
    expectedOut
}) => {

    const minOut = expectedOut * 0.995; // 🔥 slippage protection

    const swapTx = await buildSwapTx({
        tokenIn,
        tokenOut,
        fee,
        recipient: wallet.address,
        amountIn,
        minOut
    });

    const tx = {
        ...swapTx,
        gasLimit: 300000,
        maxFeePerGas: ethers.parseUnits("30", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
    };

    return await sendBundle(wallet, tx);
};