import { ethers } from "ethers";

const POOL_ABI = [
    "function slot0() external view returns (uint160 sqrtPriceX96, int24, uint16, uint16, uint16, uint8, bool)"
];

// WETH/USDC pool
const POOL = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8";

export const getUniswapPrice = async (provider) => {
    try {
        const pool = new ethers.Contract(POOL, POOL_ABI, provider);

        const slot0 = await pool.slot0();

        const sqrtPriceX96 = slot0[0];

        // 🔥 CORRECT FIX (BigNumber math)
        const numerator = sqrtPriceX96.mul(sqrtPriceX96);
        const denominator = ethers.BigNumber.from(2).pow(192);

        let price = numerator.div(denominator).toNumber();

        // 🔥 ADJUST FOR DECIMALS (USDC 6, WETH 18)
        price = price * (10 ** (18 - 6));

        if (!price || isNaN(price)) return null;

        return price;

    } catch (e) {
        console.log("❌ Uniswap error:", e.message);
        return null;
    }
};
