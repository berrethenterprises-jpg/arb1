export const predictMove = (recentSpreads) => {

    if (recentSpreads.length < 5) return 0;

    let momentum = 0;

    for (let i = 1; i < recentSpreads.length; i++) {
        momentum += (recentSpreads[i] - recentSpreads[i - 1]);
    }

    const avg = momentum / recentSpreads.length;

    // 🔥 ROXY FIX: reduce noise
    if (Math.abs(avg) < 0.0002) return 0;

    return avg;
};
