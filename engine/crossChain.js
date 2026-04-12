export const checkCrossChain = async ({
    ethPrice,
    arbPrice
}) => {

    const spread = (ethPrice - arbPrice) / arbPrice;

    return {
        spread,
        profitable: Math.abs(spread) > 0.01 // higher threshold
    };
};
