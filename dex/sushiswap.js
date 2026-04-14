import { ethers } from "ethers";

const PAIRS = [
  "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0", // ETH/USDC
  "0x06da0fd433C1A5d7a4faa01111c044910A184553", // ETH/DAI
  "0xC3D03e4f041Fd4cA8F06F5E6F0Bf4C6D1E5C5A0D"  // USDC/DAI
];

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

export const getSushiPools = async (provider) => {
  const results = [];

  for (const address of PAIRS) {
    try {
      const c = new ethers.Contract(address, ABI, provider);

      const [r0, r1] = await c.getReserves();
      const token0 = (await c.token0()).toLowerCase();
      const token1 = (await c.token1()).toLowerCase();

      results.push({
        dex: "SUSHI",
        address,
        token0,
        token1,
        reserve0: Number(ethers.utils.formatUnits(r0, 18)),
        reserve1: Number(ethers.utils.formatUnits(r1, 18))
      });

    } catch {}
  }

  return results;
};