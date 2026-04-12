export const sqrtPriceX96ToPrice = (sqrtPriceX96) => {
    try {
        const numerator = sqrtPriceX96 * sqrtPriceX96;
        const denominator = 2n ** 192n;

        return Number(numerator / denominator);
    } catch {
        return null;
    }
};