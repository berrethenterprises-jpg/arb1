let lastPrice = null;

export const getDEXQuote = async (cexPrice) => {
    // initialize near real price
    if (!lastPrice) {
        lastPrice = cexPrice;
    }

    // realistic small deviation (±0.3%)
    const deviation = (Math.random() - 0.5) * 0.006;

    lastPrice = cexPrice * (1 + deviation);

    return {
        price: lastPrice,
        liquidity: 0.3 + Math.random() * 0.7 // 0.3 → 1.0
    };
};