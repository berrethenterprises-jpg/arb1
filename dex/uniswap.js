import { ethers } from "ethers";

const POOL_ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24, uint16, uint16, uint16, uint8, bool)"
];

// ETH/USDC Uniswap V3 pool
const POOL = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8";

export const getUniswapPrice = async (provider) => {
  try {
    const pool = new ethers.Contract(POOL, POOL_ABI, provider);

    const slot0 = await pool.slot0();
    const sqrtPriceX96 = slot0.sqrtPriceX96;

    // Convert sqrtPriceX96 → price
    const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;

    let price = sqrtPrice * sqrtPrice;

    // 🔥 THIS IS THE FIX:
    // Pool is USDC/WETH → invert to get ETH price
    price = 1 / price;

    // Adjust decimals (USDC 6, ETH 18)
    price = price * (10 ** (18 - 6));

    if (!price || isNaN(price) || price < 100 || price > 10000) {
      return null; // sanity check
    }

    return price;

  } catch (e) {
    console.log("❌ Uniswap error:", e.message);
    return null;
  }
};