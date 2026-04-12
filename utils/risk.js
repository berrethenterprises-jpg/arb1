export const shouldTrade = ({ spread, liquidity, latency, score }) => {
    if (spread < 0.003) return false;
    if (liquidity < 0.5) return false;
    if (latency > 80) return false;
    if (score < 1.8) return false;

    return true;
};