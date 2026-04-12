export const isProfitable = ({
    spread,
    gasCost,
    tradeSize
}) => {

    const fee = 0.002; // 0.2%

    const gross = tradeSize * spread;

    const net = gross - (tradeSize * fee) - gasCost;

    return net > 0;
};
