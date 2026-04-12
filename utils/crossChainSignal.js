export const getCrossChainSignal = ({
    mainnetPrice,
    altPrice
}) => {

    const spread = (mainnetPrice - altPrice) / altPrice;

    return {
        spread,
        strong: Math.abs(spread) > 0.01
    };
};
