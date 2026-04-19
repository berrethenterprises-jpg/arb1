import { ethers } from "ethers";

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

const PAIRS = [
  "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0",
  "0x06da0fd433C1A5d7a4faa01111c044910A184553",
  "0x055475920a8c93CfFb64d039A8205F7AcC7722d3",
  "0xCEfF51756c56CeFFCA006cD410B03FFC46dd3a58"
];

export const getSushiPools = async (provider) => {
  const calls = PAIRS.map(async (addr) => {
    try {
      const c = new ethers.Contract(addr, ABI, provider);

      const [reserves, t0, t1] = await Promise.all([
        c.getReserves(),
        c.token0(),
        c.token1()
      ]);

      return {
        dex: "SUSHI",
        token0: t0.toLowerCase(),
        token1: t1.toLowerCase(),
        reserve0: Number(ethers.utils.formatEther(reserves[0])),
        reserve1: Number(ethers.utils.formatEther(reserves[1]))
      };

    } catch {
      return null;
    }
  });

  return (await Promise.all(calls)).filter(Boolean);
};