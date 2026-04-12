let lastPrice = 3000;

export const getDEXQuote = async () => {
    const movement = (Math.random() - 0.5) * 10;
    lastPrice += movement;

    return {
        price: lastPrice,
        liquidity: Math.random()
    };
};