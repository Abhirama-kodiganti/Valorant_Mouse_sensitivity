export const calculateCmPer360 = (dpi, sensitivity, game) => {
    let yaw = 0.022;
    if (game === 'valorant') yaw = 0.07;
    if (game === 'cs2' || game === 'apex') yaw = 0.022;
    if (game === 'fortnite') yaw = 0.5555; // Approximate
    if (game === 'overwatch') yaw = 0.0066; // Overwatch uses different scaling

    // cm/360 = (360 / (DPI * Sens * Yaw)) * 2.54
    const cm = (360 / (dpi * sensitivity * yaw)) * 2.54;
    return parseFloat(cm.toFixed(2));
};

/**
 * Convert sensitivity from one game to another
 */
export const convertSensitivity = (fromSens, fromGame, toGame, dpi = 800) => {
    const fromCm = calculateCmPer360(dpi, fromSens, fromGame);
    
    // Calculate target game's sensitivity to match the same cm/360
    let toYaw = 0.022;
    if (toGame === 'valorant') toYaw = 0.07;
    if (toGame === 'cs2' || toGame === 'apex') toYaw = 0.022;
    if (toGame === 'fortnite') toYaw = 0.5555;
    if (toGame === 'overwatch') toYaw = 0.0066;
    
    // Reverse the cm/360 formula: sens = 360 / (DPI * Yaw * (cm/360 / 2.54))
    const toSens = 360 / (dpi * toYaw * (fromCm / 2.54));
    
    return parseFloat(toSens.toFixed(4));
};

/**
 * Get game-specific sensitivity settings
 */
export const getGameSensitivitySettings = (baseSens, dpi, game) => {
    const cm360 = calculateCmPer360(dpi, baseSens, game);
    
    const conversions = {
        valorant: {
            sens: baseSens,
            cmPer360: cm360,
            notes: 'Valorant uses 0.07 yaw scale'
        },
        cs2: {
            sens: baseSens,
            cmPer360: cm360,
            notes: 'CS2 uses 0.022 yaw scale (same as Source)'
        },
        apex: {
            sens: baseSens,
            cmPer360: cm360,
            adsMultiplier: 1.0, // Default, user should adjust
            notes: 'Apex uses 0.022 yaw scale. Adjust ADS multiplier separately.'
        },
        fortnite: {
            sensX: baseSens,
            sensY: baseSens, // Default to same, user can adjust
            cmPer360: cm360,
            adsMultiplier: 0.65, // Common default
            notes: 'Fortnite uses 0.5555 yaw scale. X/Y can be different.'
        },
        overwatch: {
            sens: baseSens,
            cmPer360: cm360,
            notes: 'Overwatch uses 0.0066 yaw scale (linear scaling)'
        }
    };
    
    return conversions[game] || conversions.valorant;
};

/**
 * Generate comprehensive sensitivity recommendation with AI feedback
 */
export const generateRecommendation = (metrics) => {
    const { config, avgReactionTime, overshootRate, edgeHits, stabilityScore, distanceToTarget } = metrics;
    const currentSens = config.sensitivity;
    let adjustment = 0;
    const feedback = [];

    // Enhanced algorithm with more nuanced feedback
    if (overshootRate > 0.35) {
        adjustment -= 0.15; // Reduce by 15%
        feedback.push({
            type: 'overshoot',
            severity: 'high',
            message: `You overshoot ${(overshootRate * 100).toFixed(1)}% of shots. Sensitivity is too high for precise control.`
        });
    } else if (overshootRate > 0.20) {
        adjustment -= 0.08;
        feedback.push({
            type: 'overshoot',
            severity: 'medium',
            message: `Moderate overshoot rate (${(overshootRate * 100).toFixed(1)}%). Consider slightly reducing sensitivity.`
        });
    }

    // Check distance-based overshoot
    if (distanceToTarget && distanceToTarget.length > 0) {
        const farTargets = distanceToTarget.filter(d => d.distance > 400 && !d.hit);
        if (farTargets.length > distanceToTarget.length * 0.3) {
            feedback.push({
                type: 'distance',
                severity: 'high',
                message: 'You overshoot when targets are >400px away — sensitivity slightly high for flicks.'
            });
        }
    }

    if (edgeHits > 2) {
        adjustment += 0.20; // Increase by 20%
        feedback.push({
            type: 'edge',
            severity: 'medium',
            message: `You hit screen edges ${edgeHits} times. Sensitivity may be too low for your mousepad space.`
        });
    }

    // Reaction time analysis
    if (avgReactionTime > 400) {
        adjustment += 0.05;
        feedback.push({
            type: 'reaction',
            severity: 'low',
            message: `Average reaction time is ${Math.round(avgReactionTime)}ms. Slightly higher sensitivity may help.`
        });
    } else if (avgReactionTime < 200 && overshootRate < 0.15) {
        feedback.push({
            type: 'reaction',
            severity: 'positive',
            message: `Excellent reaction time (${Math.round(avgReactionTime)}ms) with good control!`
        });
    }

    // Stability analysis
    if (stabilityScore < 60) {
        feedback.push({
            type: 'stability',
            severity: 'medium',
            message: `Tracking smoothness could improve (stability: ${Math.round(stabilityScore)}). Consider decreasing sens by 5–10%.`
        });
    } else if (stabilityScore > 85) {
        feedback.push({
            type: 'stability',
            severity: 'positive',
            message: `Tracking smoothness excellent (stability: ${Math.round(stabilityScore)})!`
        });
    }

    // Micro-adjustment analysis
    if (distanceToTarget && distanceToTarget.length > 0) {
        const closeTargets = distanceToTarget.filter(d => d.distance < 100 && d.hit);
        const closeMisses = distanceToTarget.filter(d => d.distance < 100 && !d.hit);
        if (closeMisses.length > closeTargets.length * 0.4) {
            feedback.push({
                type: 'micro',
                severity: 'medium',
                message: 'Micro-adjustment accuracy low — consider decreasing sens by 5–10% for better precision.'
            });
        }
    }

    const low = (currentSens * (1 - Math.abs(adjustment) - 0.05)).toFixed(3);
    const high = (currentSens * (1 + Math.abs(adjustment) + 0.05)).toFixed(3);

    // Ensure we don't go negative
    return {
        low: Math.max(0.001, parseFloat(low)),
        high: parseFloat(high),
        adjustment: adjustment,
        feedback: feedback,
        currentSens: currentSens
    };
};

/**
 * Adaptive training mode selector based on weaknesses
 */
export const selectNextMode = (metrics) => {
    const { overshootRate, avgReactionTime, stabilityScore, distanceToTarget } = metrics;
    
    // Analyze weaknesses
    if (overshootRate > 0.30) {
        return {
            mode: 'microAdjust',
            reason: 'High overshoot rate indicates need for precision training'
        };
    }
    
    if (avgReactionTime > 250) {
        return {
            mode: 'dynamicFlick',
            reason: 'Slow reaction time suggests flick speed training'
        };
    }
    
    if (stabilityScore < 60) {
        return {
            mode: 'tracking',
            reason: 'Low stability score indicates tracking practice needed'
        };
    }
    
    // Check for distance-based issues
    if (distanceToTarget && distanceToTarget.length > 0) {
        const farMisses = distanceToTarget.filter(d => d.distance > 300 && !d.hit).length;
        if (farMisses > distanceToTarget.length * 0.4) {
            return {
                mode: 'dynamicFlick',
                reason: 'Difficulty with long-distance flicks'
            };
        }
    }
    
    // Default to advanced mixed training
    return {
        mode: 'stressTest',
        reason: 'Well-rounded performance, ready for advanced training'
    };
};
