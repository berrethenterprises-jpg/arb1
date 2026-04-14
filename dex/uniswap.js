import { ethers } from "ethers";

const PAIRS = [
  // ETH/USDC
  "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",

  // ETH/USDT
  "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852",

  // ETH/DAI
  "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11"
];

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)"
];

export const getUniswapPools = async (provider) => {
  const results = [];

  for (const address of PAIRS) {
    try {
      const c = new ethers.Contract(address, ABI, provider);
      const [r0, r1] = await c.getReserves();

      results.push({
        dex: "UNI",
        address,
        reserve0: parseFloat(ethers.utils.formatUnits(r0, 18)),
        reserve1: parseFloat(ethers.utils.formatUnits(r1, 18))
      });

    } catch {}
  }

  return results;
};