import { ethers } from "ethers";

const PAIR = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)"
];

export const getUniswapPrice = async (provider) => {
  try {
    const c = new ethers.Contract(PAIR, ABI, provider);
    const [r0, r1] = await c.getReserves();

    const usdc = parseFloat(ethers.utils.formatUnits(r0, 6));
    const eth = parseFloat(ethers.utils.formatUnits(r1, 18));

    return eth ? usdc / eth : null;
  } catch {
    return null;
  }
};