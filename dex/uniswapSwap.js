import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

const ABI = [
  "function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) payable returns (uint256)"
];

export const buildSwapTx = async ({
    tokenIn,
    tokenOut,
    fee,
    recipient,
    amountIn,
    minOut
}) => {

    const iface = new ethers.Interface(ABI);

    const params = {
        tokenIn,
        tokenOut,
        fee,
        recipient,
        deadline: Math.floor(Date.now() / 1000) + 60,
        amountIn,
        amountOutMinimum: minOut,
        sqrtPriceLimitX96: 0
    };

    const data = iface.encodeFunctionData("exactInputSingle", [params]);

    return {
        to: ROUTER,
        data,
        value: 0
    };
};
