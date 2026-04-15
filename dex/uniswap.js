import { ethers } from "ethers";

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

// 🔥 CONNECTED + LIQUID POOLS
const PAIRS = [
  "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc", // USDC/WETH
  "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11", // DAI/WETH
  "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852", // USDT/WETH
  "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940", // WBTC/WETH
  "0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f", // USDC/USDT
  "0xAE461cA67B15dc8d2dA7c1dD4A90c3c6C5E7eF9A", // USDC/DAI
  "0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168"
];

export const getUniswapPools = async (provider) => {
  const calls = PAIRS.map(async (addr) => {
    try {
      const c = new ethers.Contract(addr, ABI, provider);

      const [reserves, t0, t1] = await Promise.all([
        c.getReserves(),
        c.token0(),
        c.token1()
      ]);

      return {
        dex: "UNI",
        token0: t0.toLowerCase(),
        token1: t1.toLowerCase(),
        reserve0: Number(ethers.utils.formatEther(reserves[0])),
        reserve1: Number(ethers.utils.formatEther(reserves[1]))
      };

    } catch {
      return null;
    }
  });

  const result = (await Promise.all(calls)).filter(Boolean);

  console.log(`🦄 UNI pools: ${result.length}`);

  return result;
};