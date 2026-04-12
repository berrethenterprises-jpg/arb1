export const simulateExecution = (capital, spread) => {
    const feeRate = 0.001;
    const slippage = 0.001;

    const gross = capital * Math.abs(spread);

    const fees = capital * feeRate * 2;
    const slip = capital * slippage;

    let profit = gross - fees - slip;

    // execution failure
    if (Math.random() < 0.1) return { success: false };

    // occasional loss
    if (Math.random() < 0.15) {
        profit *= -1;
    }

    return {
        success: true,
        profit
    };
};