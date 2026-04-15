import { ethers } from "ethers";

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

const PAIRS = [
  "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0",
  "0x06da0fd433C1A5d7a4faa01111c044910A184553",
  "0xC3D03e4f041Fd4cA8F06F5E6F0Bf4C6D1E5C5A0D",
  "0x055475920a8c93CfFb64d039A8205F7AcC7722d3"
];

export const getSushiPools = async (provider) => {
  const out = [];

  for (const addr of PAIRS) {
    try {
      const c = new ethers.Contract(addr, ABI, provider);

      const [r0, r1] = await c.getReserves();
      const t0 = (await c.token0()).toLowerCase();
      const t1 = (await c.token1()).toLowerCase();

      out.push({
        dex: "SUSHI",
        token0: t0,
        token1: t1,
        reserve0: Number(ethers.utils.formatEther(r0)),
        reserve1: Number(ethers.utils.formatEther(r1))
      });

    } catch {}
  }

  return out;
};