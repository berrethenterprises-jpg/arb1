export const shouldTrade = ({ spread, liquidity, score }) => {
    if (spread < 0.001) return false;
    if (liquidity < 0.3) return false;
    if (score < 1.2) return false;

    return true;
};