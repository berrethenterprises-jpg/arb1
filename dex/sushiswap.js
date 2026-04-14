import { ethers } from "ethers";

const PAIRS = [
  // ETH/USDC
  "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0",

  // ETH/DAI
  "0x06da0fd433C1A5d7a4faa01111c044910A184553"
];

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)"
];

export const getSushiPools = async (provider) => {
  const results = [];

  for (const address of PAIRS) {
    try {
      const c = new ethers.Contract(address, ABI, provider);
      const [r0, r1] = await c.getReserves();

      results.push({
        dex: "SUSHI",
        address,
        reserve0: parseFloat(ethers.utils.formatUnits(r0, 18)),
        reserve1: parseFloat(ethers.utils.formatUnits(r1, 18))
      });

    } catch {}
  }

  return results;
};