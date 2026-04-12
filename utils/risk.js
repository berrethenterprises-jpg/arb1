export const shouldTrade = ({ spread, liquidity, score }) => {
    // relaxed thresholds for paper trading
    if (spread < 0.0005) return false;   // was 0.001
    if (liquidity < 0.2) return false;   // was 0.3
    if (score < 0.7) return false;       // was 1.2+

    return true;
};