export const calculateProfit = ({
    spread,
    tradeSize,
    gasCost
}) => {

    const feeRate = 0.002;

    const gross = tradeSize * spread;

    const fees = tradeSize * feeRate;

    const net = gross - fees - gasCost;

    return net;
};

export const isProfitable = (profit) => {
    return profit > 0;
};