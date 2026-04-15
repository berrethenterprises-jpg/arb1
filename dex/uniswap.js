import { ethers } from "ethers";

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

const PAIRS = [
  "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
  "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11",
  "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852",
  "0xAE461cA67B15dc8d2dA7c1dD4A90c3c6C5E7eF9A",
  "0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f",
  "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940",
  "0x004375Dff511095CC5A197A54140a24eFEF3A416",
  "0xd3d2E2692501A5c9Ca623199D38826e513033a17",
  "0xF5c80c305803280B587F9F6F9BD5c5E53C1F5F8e",
  "0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8",
  "0x21b8065d10f73ee2e260e5b47d3344d3ced7596e",
  "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
  "0xC2aDdA861F89bBB333c90c492cB837741916A225",
  "0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168",
  "0x55d5c232d921b9eAA6b37b5845E439aCD04b4DBa",
  "0xE42318EA3b998e8355a3Da364EB9D48eC725Eb45",
  "0xC5Be99A02C6857f9Eac67BbCE58DF5572498F40c"
];

const DECIMALS = {
  "0xc02aa39b223fe8d0a0e5c4f27ead9083c756cc2": 18,
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 6,
  "0xdac17f958d2ee523a2206206994597c13d831ec7": 6,
  "0x6b175474e89094c44da98b954eedeac495271d0f": 18
};

export const getUniswapPools = async (provider) => {
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
        dex: "UNI",
        token0: t0,
        token1: t1,
        reserve0: Number(ethers.utils.formatUnits(r0, d0)),
        reserve1: Number(ethers.utils.formatUnits(r1, d1))
      });

    } catch {}
  }

  return out;
};