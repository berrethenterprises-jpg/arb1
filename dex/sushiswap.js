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
  "0x055475920a8c93CfFb64d039A8205F7AcC7722d3",
  "0xCEfF51756c56CeFFCA006cD410B03FFC46dd3a58"
];

const DECIMALS = {
  "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2": 18,
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 6
};

export const getSushiPools = async (provider) => {
  const out = [];

  for (const addr of PAIRS) {
    try {
      const c = new ethers.Contract(addr, ABI, provider);

      const [r0, r1] = await c.getReserves();
      const t0 = (await c.token0()).toLowerCase();
      const t1 = (await c.token1()).toLowerCase();

      const d0 = DECIMALS[t0] || 18;
      const d1 = DECIMALS[t1] || 18;

      out.push({
        dex: "SUSHI",
        token0: t0,
        token1: t1,
        reserve0: Number(ethers.utils.formatUnits(r0, d0)),
        reserve1: Number(ethers.utils.formatUnits(r1, d1))
      });

    } catch (e) {
      console.log("SUSHI pool failed:", addr);
    }
  }

  return out;
};