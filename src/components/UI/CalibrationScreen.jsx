import React, { useState, useRef, useEffect } from 'react';
import { DPIVerifier, SmoothingDetector, InputDelayMeasurer } from '../../utils/calibration';

const CalibrationScreen = ({ onComplete, config }) => {
    const [step, setStep] = useState('dpi'); // dpi, smoothing, delay
    const [dpiVerifier] = useState(() => new DPIVerifier());
    const [smoothingDetector] = useState(() => new SmoothingDetector());
    const [delayMeasurer] = useState(() => new InputDelayMeasurer());
    const [dpiResult, setDpiResult] = useState(null);
    const [smoothingResult, setSmoothingResult] = useState(null);
    const [delayResult, setDelayResult] = useState(null);
    const [physicalCm, setPhysicalCm] = useState(10);
    const canvasRef = useRef(null);
    const [isMeasuring, setIsMeasuring] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (step === 'dpi' && isMeasuring) {
                dpiVerifier.recordMovement(e.movementX, e.movementY);
            } else if (step === 'smoothing' && isMeasuring) {
                smoothingDetector.recordMovement(e.movementX, e.movementY);
            }
        };
        
        if (isMeasuring && (step === 'dpi' || step === 'smoothing')) {
            document.addEventListener('mousemove', handleMouseMove);
            return () => document.removeEventListener('mousemove', handleMouseMove);
        }
    }, [step, isMeasuring, dpiVerifier, smoothingDetector]);

    const handleDPIMeasurement = () => {
        if (!isMeasuring) {
            dpiVerifier.startMeasurement();
            setIsMeasuring(true);
        } else {
            const estimatedDPI = dpiVerifier.completeMeasurement(physicalCm);
            setDpiResult(estimatedDPI);
            setIsMeasuring(false);
        }
    };

    const handleSmoothingMeasurement = () => {
        if (!isMeasuring) {
            smoothingDetector.reset();
            setIsMeasuring(true);
            setTimeout(() => {
                const result = smoothingDetector.getSmoothingScore();
                setSmoothingResult(result);
                setIsMeasuring(false);
            }, 5000); // Measure for 5 seconds
        }
    };

    const handleDelayMeasurement = () => {
        if (!isMeasuring) {
            delayMeasurer.reset();
            setIsMeasuring(true);
            const interval = setInterval(() => {
                delayMeasurer.recordMovement();
            }, 16); // ~60fps
            
            setTimeout(() => {
                clearInterval(interval);
                const result = delayMeasurer.getBaselineDelay();
                setDelayResult(result);
                setIsMeasuring(false);
            }, 3000);
        }
    };

    const handleNext = () => {
        if (step === 'dpi') {
            setStep('smoothing');
        } else if (step === 'smoothing') {
            setStep('delay');
        } else {
            onComplete({
                ...config,
                verifiedDPI: dpiResult,
                smoothingScore: smoothingResult,
                inputDelay: delayResult
            });
        }
    };

    const handleSkip = () => {
        onComplete(config);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full space-y-6 w-full max-w-2xl mx-auto p-8">
            <h2 className="text-3xl font-bold text-white">Calibration</h2>
            
            {step === 'dpi' && (
                <div className="w-full space-y-4">
                    <p className="text-gray-400">
                        Move your mouse exactly {physicalCm} cm physically, then click "Complete Measurement".
                    </p>
                    <div className="space-y-2">
                        <label className="text-gray-400">Physical Distance (cm)</label>
                        <input
                            type="number"
                            value={physicalCm}
                            onChange={(e) => setPhysicalCm(parseFloat(e.target.value))}
                            className="w-full bg-brand-surface p-3 rounded text-white border border-gray-700"
                            min="5"
                            max="50"
                            step="0.1"
                        />
                    </div>
                    <div className="bg-brand-surface p-4 rounded">
                        <p className="text-gray-400 text-sm">Current DPI Setting</p>
                        <p className="text-2xl font-bold text-brand-accent">{config.dpi || 800}</p>
                    </div>
                    <button
                        onClick={handleDPIMeasurement}
                        className={`w-full py-4 font-bold text-xl rounded transition-colors ${
                            isMeasuring
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-brand-accent text-brand-dark hover:bg-white'
                        }`}
                    >
                        {isMeasuring ? 'Click when done moving' : 'Start Measurement'}
                    </button>
                    {dpiResult && (
                        <div className="bg-brand-surface p-4 rounded border border-brand-accent">
                            <p className="text-gray-400">Estimated DPI</p>
                            <p className="text-3xl font-bold text-brand-accent">{Math.round(dpiResult)}</p>
                            {Math.abs(dpiResult - (config.dpi || 800)) > 100 && (
                                <p className="text-yellow-400 text-sm mt-2">
                                    Significant difference from your setting. Please verify your DPI.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {step === 'smoothing' && (
                <div className="w-full space-y-4">
                    <p className="text-gray-400">
                        Move your mouse smoothly for 5 seconds. We'll detect any mouse smoothing.
                    </p>
                    <button
                        onClick={handleSmoothingMeasurement}
                        disabled={isMeasuring}
                        className={`w-full py-4 font-bold text-xl rounded transition-colors ${
                            isMeasuring
                                ? 'bg-yellow-600 text-white'
                                : 'bg-brand-accent text-brand-dark hover:bg-white'
                        }`}
                    >
                        {isMeasuring ? 'Measuring... (5s)' : 'Start Measurement'}
                    </button>
                    {smoothingResult && (
                        <div className="bg-brand-surface p-4 rounded border border-gray-700">
                            <p className="text-gray-400">Smoothing Score</p>
                            <p className="text-3xl font-bold text-brand-accent">
                                {smoothingResult.score.toFixed(1)}
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                                {smoothingResult.hasSmoothing
                                    ? 'Mouse smoothing detected. This may affect accuracy measurements.'
                                    : 'No significant smoothing detected.'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {step === 'delay' && (
                <div className="w-full space-y-4">
                    <p className="text-gray-400">
                        Measuring input delay baseline. This helps calibrate reaction time measurements.
                    </p>
                    <button
                        onClick={handleDelayMeasurement}
                        disabled={isMeasuring}
                        className={`w-full py-4 font-bold text-xl rounded transition-colors ${
                            isMeasuring
                                ? 'bg-yellow-600 text-white'
                                : 'bg-brand-accent text-brand-dark hover:bg-white'
                        }`}
                    >
                        {isMeasuring ? 'Measuring...' : 'Start Measurement'}
                    </button>
                    {delayResult && (
                        <div className="bg-brand-surface p-4 rounded border border-gray-700">
                            <p className="text-gray-400">Input Delay Baseline</p>
                            <p className="text-2xl font-bold text-brand-accent">
                                {delayResult.median.toFixed(2)} ms
                            </p>
                            <p className="text-gray-400 text-sm mt-2">
                                Median: {delayResult.median.toFixed(2)}ms | 
                                Avg: {delayResult.average.toFixed(2)}ms
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-4 w-full">
                <button
                    onClick={handleSkip}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600"
                >
                    Skip Calibration
                </button>
                <button
                    onClick={handleNext}
                    className="flex-1 px-6 py-3 bg-brand-accent text-brand-dark font-bold rounded hover:bg-white"
                >
                    {step === 'delay' ? 'Complete' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default CalibrationScreen;

