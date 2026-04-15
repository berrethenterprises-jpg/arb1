import { ethers } from "ethers";
import { POOL_LIST } from "./poolList.js";

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

export const getUniswapPools = async (provider) => {
  const calls = POOL_LIST.map(async (addr) => {
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