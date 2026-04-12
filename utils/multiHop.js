export const simulateMultiHop = ({
    amount,
    path,
    prices
}) => {

    let current = amount;

    for (let i = 0; i < path.length - 1; i++) {

        const pair = `${path[i]}_${path[i + 1]}`;
        const price = prices[pair];

        if (!price) return null;

        current *= price;
    }

    return current;
};
