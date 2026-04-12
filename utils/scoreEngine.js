export const scoreOpportunity = ({
    spread,
    volatility,
    liquidity,
    gasCost
}) => {

    let score = 0;

    // 🔥 spread strength
    score += spread * 100;

    // 🔥 volatility boost (more movement = more edge)
    score += volatility * 50;

    // 🔥 liquidity confidence
    score += liquidity * 20;

    // 🔥 penalize high gas
    score -= gasCost * 2;

    return score;
};
