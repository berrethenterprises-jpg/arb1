import { ethers } from "ethers";

const POOL_ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24, uint16, uint16, uint16, uint8, bool)"
];

// 🔥 MULTI-POOL LIST (ETH pairs)
const POOLS = [
  {
    name: "ETH/USDC 0.05%",
    address: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"
  },
  {
    name: "ETH/USDC 0.3%",
    address: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"
  }
];

// 🔥 PRICE FROM POOL
const getPriceFromPool = async (provider, poolData) => {
  try {
    const pool = new ethers.Contract(poolData.address, POOL_ABI, provider);

    const slot0 = await pool.slot0();
    const sqrtPriceX96 = slot0.sqrtPriceX96;

    const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;
    let price = sqrtPrice * sqrtPrice;

    // invert (USDC/WETH → ETH)
    price = 1 / price;

    // decimals
    price = price * (10 ** (18 - 6));

    if (!price || isNaN(price)) return null;

    return {
      name: poolData.name,
      price
    };

  } catch {
    return null;
  }
};

// 🔥 MAIN MULTI-POOL FUNCTION
export const getUniswapPrice = async (provider) => {
  try {
    const results = await Promise.all(
      POOLS.map(p => getPriceFromPool(provider, p))
    );

    const valid = results.filter(p => p && p.price > 100 && p.price < 10000);

    if (valid.length === 0) return null;

    // 🔥 PICK BEST PRICE (MAX EDGE)
    const best = valid.reduce((a, b) => {
      return Math.abs(a.price) > Math.abs(b.price) ? a : b;
    });

    console.log("🏊 Pools:", valid.map(p => `${p.name}: ${p.price.toFixed(2)}`));

    return best.price;

  } catch (e) {
    console.log("❌ Multi-pool error:", e.message);
    return null;
  }
};