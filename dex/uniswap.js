import { ethers } from "ethers";

const PAIRS = [
  "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc", // ETH/USDC
  "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852", // ETH/USDT
  "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11", // ETH/DAI
  "0xAE461cA67B15dc8d2dA7c1dD4A90c3c6C5E7eF9A", // USDC/DAI
  "0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f"  // USDT/DAI
];

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

// 🔥 KNOWN DECIMALS MAP
const DECIMALS = {
  "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2": 18, // WETH
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 6,  // USDC
  "0xdac17f958d2ee523a2206206994597c13d831ec7": 6,  // USDT
  "0x6b175474e89094c44da98b954eedeac495271d0f": 18  // DAI
};

export const getUniswapPools = async (provider) => {
  const results = [];

  for (const address of PAIRS) {
    try {
      const c = new ethers.Contract(address, ABI, provider);

      const [r0, r1] = await c.getReserves();
      const token0 = (await c.token0()).toLowerCase();
      const token1 = (await c.token1()).toLowerCase();

      const d0 = DECIMALS[token0] || 18;
      const d1 = DECIMALS[token1] || 18;

      results.push({
        dex: "UNI",
        address,
        token0,
        token1,
        reserve0: Number(ethers.utils.formatUnits(r0, d0)),
        reserve1: Number(ethers.utils.formatUnits(r1, d1))
      });

    } catch {}
  }

  return results;
};