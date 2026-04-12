let lastPrice = null;

export const getDEXQuote = async (cexPrice) => {
    if (!lastPrice) {
        lastPrice = cexPrice;
    }

    // 🔥 increased deviation → more opportunities
    const deviation = (Math.random() - 0.5) * 0.01;

    lastPrice = cexPrice * (1 + deviation);

    return {
        price: lastPrice,
        liquidity: 0.3 + Math.random() * 0.7
    };
};