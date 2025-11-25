// Calibration utilities for DPI verification, mouse smoothing, and input delay

/**
 * DPI Verification Tool
 * Measures physical mouse movement vs pixel travel
 */
export class DPIVerifier {
    constructor() {
        this.measurements = [];
        this.isMeasuring = false;
        this.startPosition = null;
        this.pixelDistance = 0;
    }

    startMeasurement() {
        this.isMeasuring = true;
        this.measurements = [];
        this.pixelDistance = 0;
        this.startPosition = null;
    }

    recordMovement(movementX, movementY) {
        if (!this.isMeasuring) return;
        
        const delta = Math.hypot(movementX, movementY);
        this.pixelDistance += delta;
        
        if (this.startPosition === null) {
            this.startPosition = { x: movementX, y: movementY };
        }
    }

    completeMeasurement(physicalCm) {
        if (!this.isMeasuring || this.pixelDistance === 0) return null;
        
        // Calculate estimated DPI
        // physicalCm to inches: physicalCm / 2.54
        // pixels per inch = pixelDistance / (physicalCm / 2.54)
        const estimatedDPI = (this.pixelDistance / (physicalCm / 2.54));
        
        this.measurements.push({
            physicalCm,
            pixelDistance: this.pixelDistance,
            estimatedDPI: Math.round(estimatedDPI)
        });
        
        this.isMeasuring = false;
        return estimatedDPI;
    }

    getAverageDPI() {
        if (this.measurements.length === 0) return null;
        const sum = this.measurements.reduce((a, b) => a + b.estimatedDPI, 0);
        return Math.round(sum / this.measurements.length);
    }
}

/**
 * Mouse Smoothing Detector
 * Measures variance in movement deltas to detect smoothing
 */
export class SmoothingDetector {
    constructor() {
        this.movementDeltas = [];
        this.maxSamples = 50;
    }

    recordMovement(deltaX, deltaY) {
        const delta = Math.hypot(deltaX, deltaY);
        this.movementDeltas.push(delta);
        
        if (this.movementDeltas.length > this.maxSamples) {
            this.movementDeltas.shift();
        }
    }

    getSmoothingScore() {
        if (this.movementDeltas.length < 10) return null;
        
        // Calculate coefficient of variation
        const mean = this.movementDeltas.reduce((a, b) => a + b, 0) / this.movementDeltas.length;
        const variance = this.movementDeltas.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.movementDeltas.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? stdDev / mean : 0;
        
        // Lower CV = more smoothing (more consistent deltas)
        // Higher CV = less smoothing (more variable deltas)
        const smoothingScore = Math.max(0, Math.min(100, (1 - cv) * 100));
        
        return {
            score: smoothingScore,
            hasSmoothing: smoothingScore > 70,
            coefficientOfVariation: cv
        };
    }

    reset() {
        this.movementDeltas = [];
    }
}

/**
 * Input Delay Baseline Measurement
 * Measures time between mouse movement and visual update
 */
export class InputDelayMeasurer {
    constructor() {
        this.measurements = [];
        this.lastMovementTime = null;
    }

    recordMovement() {
        const now = performance.now();
        if (this.lastMovementTime !== null) {
            const delay = now - this.lastMovementTime;
            this.measurements.push(delay);
            
            // Keep only recent measurements
            if (this.measurements.length > 100) {
                this.measurements.shift();
            }
        }
        this.lastMovementTime = now;
    }

    getBaselineDelay() {
        if (this.measurements.length === 0) return null;
        
        // Use median to avoid outliers
        const sorted = [...this.measurements].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        
        return {
            median: median,
            average: this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length,
            min: Math.min(...this.measurements),
            max: Math.max(...this.measurements)
        };
    }

    reset() {
        this.measurements = [];
        this.lastMovementTime = null;
    }
}

