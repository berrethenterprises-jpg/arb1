import { ethers } from "ethers";

const UNISWAP_POOL_ABI = [
    "function slot0() external view returns (uint160 sqrtPriceX96, int24, uint16, uint16, uint16, uint8, bool)"
];

// WETH/USDC pool (Uniswap v3)
const POOL_ADDRESS = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8";

export const getUniswapPrice = async (provider) => {
    try {
        const pool = new ethers.Contract(
            POOL_ADDRESS,
            UNISWAP_POOL_ABI,
            provider
        );

        const slot0 = await pool.slot0();

        const sqrtPriceX96 = slot0[0];

        const price =
            (Number(sqrtPriceX96) ** 2) /
            (2 ** 192);

        return price;

    } catch (e) {
        return null;
    }
};
