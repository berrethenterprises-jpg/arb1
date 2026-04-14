import { ethers } from "ethers";

const PAIRS = [
  // ===== ETH BASE =====
  "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc", // ETH/USDC
  "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852", // ETH/USDT
  "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11", // ETH/DAI

  // ===== STABLE CORE =====
  "0xAE461cA67B15dc8d2dA7c1dD4A90c3c6C5E7eF9A", // USDC/DAI
  "0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f", // USDT/DAI
  "0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852", // USDT/ETH
  "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc", // USDC/ETH

  // ===== BTC =====
  "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940", // WBTC/ETH
  "0x004375Dff511095CC5A197A54140a24eFEF3A416", // WBTC/USDC

  // ===== FRAX =====
  "0x21b8065d10f73ee2e260e5b47d3344d3ced7596e", // FRAX/ETH
  "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2", // FRAX/USDC
  "0x97e7d56A0408570bA1a7852De36350f7713906ec", // FRAX/DAI

  // ===== LUSD =====
  "0xC2aDdA861F89bBB333c90c492cB837741916A225", // LUSD/ETH
  "0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA", // LUSD/USDC

  // ===== EXTRA STABLE ROUTES =====
  "0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168", // DAI/USDT
  "0x55d5c232d921b9eAA6b37b5845E439aCD04b4DBa", // USDC/USDT

  // ===== ALT ROUTES =====
  "0xE42318EA3b998e8355a3Da364EB9D48eC725Eb45", // ETH/USDP
  "0xC5Be99A02C6857f9Eac67BbCE58DF5572498F40c", // ETH/BAT
  "0xBb2b8038a1640196FbE3e38816F3e67Cba72D940", // WBTC/ETH (dup safe)
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