import { ethers } from "ethers";

const POOL_ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24, uint16, uint16, uint16, uint8, bool)"
];

// ETH/USDC pool
const POOL = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8";

export const getUniswapPrice = async (provider) => {
  try {
    const pool = new ethers.Contract(POOL, POOL_ABI, provider);

    const slot0 = await pool.slot0();
    const sqrtPriceX96 = slot0.sqrtPriceX96;

    const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;

    let price = sqrtPrice * sqrtPrice;

    // invert (USDC/WETH → ETH price)
    price = 1 / price;

    // decimals
    price = price * (10 ** (18 - 6));

    // sanity check
    if (!price || isNaN(price) || price < 100 || price > 10000) {
      return null;
    }

    return price;

  } catch (e) {
    console.log("❌ Uniswap error:", e.message);
    return null;
  }
};