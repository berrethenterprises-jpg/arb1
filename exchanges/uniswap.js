import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const UNISWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

export const getUniswapPrice = async () => {
    // simplified placeholder
    // real version uses pool state (sqrtPriceX96)
    return null;
};