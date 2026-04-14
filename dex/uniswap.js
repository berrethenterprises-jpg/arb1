import { ethers } from "ethers";

const PAIRS = [
  // ETH pairs
  "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc", // ETH/USDC
  "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852", // ETH/USDT
  "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11", // ETH/DAI

  // Stable pairs
  "0xAE461cA67B15dc8d2dA7c1dD4A90c3c6C5E7eF9A", // USDC/DAI
  "0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f"  // USDT/DAI
];

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

export const getUniswapPools = async (provider) => {
  const results = [];

  for (const address of PAIRS) {
    try {
      const c = new ethers.Contract(address, ABI, provider);

      const [r0, r1] = await c.getReserves();
      const token0 = (await c.token0()).toLowerCase();
      const token1 = (await c.token1()).toLowerCase();

      results.push({
        dex: "UNI",
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