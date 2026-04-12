export const shouldTrade = ({ spread, liquidity, score }) => {
    if (spread <= 0) return false;       // 🔥 prevent bad trades
    if (spread < 0.0005) return false;
    if (liquidity < 0.2) return false;
    if (score < 0.7) return false;

    return true;
};