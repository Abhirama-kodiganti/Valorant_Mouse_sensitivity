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
    const [pixelDistance, setPixelDistance] = useState(0);
    const [animationProgress, setAnimationProgress] = useState(0);

    // Animated visual guide for 10cm
    useEffect(() => {
        if (step === 'dpi' && !isMeasuring) {
            const interval = setInterval(() => {
                setAnimationProgress(prev => (prev + 0.02) % 1);
            }, 50);
            return () => clearInterval(interval);
        }
    }, [step, isMeasuring]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (step === 'dpi' && isMeasuring) {
                const delta = Math.hypot(e.movementX, e.movementY);
                dpiVerifier.recordMovement(e.movementX, e.movementY);
                setPixelDistance(prev => prev + delta);
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
            setPixelDistance(0);
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

    // Visual guide component for 10cm
    const VisualGuide = () => {
        const cmToPx = 37.8; // Approximate conversion (1cm ≈ 37.8px at 96 DPI)
        const guideWidth = physicalCm * cmToPx;
        
        return (
            <div className="relative w-full max-w-2xl mx-auto mb-8">
                <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-cyan-500/30 shadow-2xl">
                    <h3 className="text-2xl font-bold text-cyan-300 mb-6 text-center">
                        Visual Guide: {physicalCm}cm Measurement
                    </h3>
                    
                    {/* Animated ruler */}
                    <div className="relative h-32 bg-slate-900/50 rounded-lg border-2 border-cyan-500/50 overflow-hidden mb-6">
                        {/* Ruler markings */}
                        <div className="absolute inset-0 flex items-center">
                            {Array.from({ length: Math.ceil(guideWidth / 20) + 1 }).map((_, i) => {
                                const pos = (i * 20) % guideWidth;
                                const isMajor = i % 5 === 0;
                                return (
                                    <div
                                        key={i}
                                        className="absolute border-l border-cyan-400/50"
                                        style={{
                                            left: `${(pos / guideWidth) * 100}%`,
                                            height: isMajor ? '100%' : '50%',
                                            borderWidth: isMajor ? '2px' : '1px'
                                        }}
                                    />
                                );
                            })}
                        </div>
                        
                        {/* Measurement area highlight */}
                        <div
                            className="absolute top-0 h-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400 border-dashed"
                            style={{
                                width: `${Math.min(100, (guideWidth / 800) * 100)}%`,
                                left: '10%',
                                animation: isMeasuring ? 'pulse 2s ease-in-out infinite' : 'none'
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-cyan-300 font-bold text-lg">
                                    {physicalCm}cm
                                </span>
                            </div>
                        </div>
                        
                        {/* Animated indicator */}
                        {!isMeasuring && (
                            <div
                                className="absolute top-0 h-full w-1 bg-gradient-to-b from-cyan-400 to-blue-500 shadow-lg"
                                style={{
                                    left: `${10 + (animationProgress * 80)}%`,
                                    transition: 'left 0.05s linear'
                                }}
                            />
                        )}
                        
                        {/* Start and end markers */}
                        <div className="absolute top-0 left-[10%] h-full w-2 bg-green-500/80 flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-green-400 -mt-2" />
                            <span className="absolute -bottom-6 text-xs text-green-400 font-semibold">START</span>
                        </div>
                        <div 
                            className="absolute top-0 h-full w-2 bg-red-500/80 flex items-center justify-center"
                            style={{ left: `${10 + Math.min(80, (guideWidth / 800) * 80)}%` }}
                        >
                            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-red-400 -mt-2" />
                            <span className="absolute -bottom-6 text-xs text-red-400 font-semibold">END</span>
                        </div>
                    </div>
                    
                    {/* Instructions */}
                    <div className="space-y-3 text-gray-300">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">📏</span>
                            <div>
                                <p className="font-semibold text-cyan-300">Step 1: Place your mouse at the START marker</p>
                                <p className="text-sm">Use a physical ruler or measure {physicalCm}cm on your mousepad</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🖱️</span>
                            <div>
                                <p className="font-semibold text-cyan-300">Step 2: Move your mouse exactly {physicalCm}cm</p>
                                <p className="text-sm">Move from START to END marker in a straight line</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">✅</span>
                            <div>
                                <p className="font-semibold text-cyan-300">Step 3: Click "Complete Measurement"</p>
                                <p className="text-sm">We'll calculate your actual DPI</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Real-time feedback */}
                    {isMeasuring && (
                        <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-cyan-300 font-semibold">Measuring...</span>
                                <span className="text-cyan-400 font-mono">{Math.round(pixelDistance)}px</span>
                            </div>
                            <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                                    style={{ width: `${Math.min(100, (pixelDistance / (physicalCm * 37.8)) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 overflow-auto">
            <div className="w-full max-w-4xl">
                {/* Progress indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-cyan-300 font-semibold">
                            Step {step === 'dpi' ? 1 : step === 'smoothing' ? 2 : 3} of 3
                        </span>
                        <span className="text-gray-400 text-sm">
                            {step === 'dpi' ? 'DPI Verification' : step === 'smoothing' ? 'Smoothing Detection' : 'Input Delay'}
                        </span>
                    </div>
                    <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                            style={{ 
                                width: `${step === 'dpi' ? 33.33 : step === 'smoothing' ? 66.66 : 100}%` 
                            }}
                        />
                    </div>
                </div>

                <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent text-center">
                    Calibration
        </h2>
                <p className="text-gray-400 text-center mb-8">Let's calibrate your setup for accurate measurements</p>
                
                {step === 'dpi' && (
                    <div className="space-y-6">
                        <VisualGuide />
                        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-cyan-500/30 shadow-xl">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-gray-300 text-sm mb-2 block">Physical Distance (cm)</label>
                                    <input
                                        type="number"
                                        value={physicalCm}
                                        onChange={(e) => setPhysicalCm(parseFloat(e.target.value))}
                                        className="w-full bg-slate-900/50 p-3 rounded-lg text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                                        min="5"
                                        max="50"
                                        step="0.1"
                                    />
                                </div>
                                <div className="bg-slate-900/30 p-4 rounded-lg border border-cyan-500/20">
                                    <p className="text-gray-400 text-sm">Current DPI Setting</p>
                                    <p className="text-3xl font-bold text-cyan-400">{config?.dpi || 800}</p>
                                </div>
                                <button
                                    onClick={handleDPIMeasurement}
                                    className={`w-full py-4 font-bold text-xl rounded-xl transition-all transform hover:scale-105 ${
                                        isMeasuring
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/50'
                                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/50'
                                    }`}
                                >
                                    {isMeasuring ? '✓ Click when done moving' : '▶ Start Measurement'}
                                </button>
                                {dpiResult && (
                                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-xl border-2 border-green-500/50 animate-pulse">
                                        <p className="text-gray-300 text-sm mb-2">Estimated DPI</p>
                                        <p className="text-4xl font-bold text-green-400 mb-2">{Math.round(dpiResult)}</p>
                                        {Math.abs(dpiResult - (config?.dpi || 800)) > 100 && (
                                            <p className="text-yellow-400 text-sm flex items-center gap-2">
                                                <span>⚠️</span>
                                                Significant difference from your setting. Please verify your DPI.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 'smoothing' && (
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-cyan-500/30 shadow-xl">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4 animate-bounce">🖱️</div>
                            <h3 className="text-2xl font-bold text-cyan-300 mb-2">Mouse Smoothing Detection</h3>
                            <p className="text-gray-400">
                                Move your mouse smoothly for 5 seconds. We'll detect any mouse smoothing.
                            </p>
                        </div>
                        <button
                            onClick={handleSmoothingMeasurement}
                            disabled={isMeasuring}
                            className={`w-full py-4 font-bold text-xl rounded-xl transition-all transform hover:scale-105 ${
                                isMeasuring
                                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/50'
                            }`}
                        >
                            {isMeasuring ? '⏳ Measuring... (5s)' : '▶ Start Measurement'}
                        </button>
                        {smoothingResult && (
                            <div className="mt-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-xl border-2 border-purple-500/50">
                                <p className="text-gray-300 text-sm mb-2">Smoothing Score</p>
                                <p className="text-4xl font-bold text-purple-400 mb-2">
                                    {smoothingResult.score.toFixed(1)}
                                </p>
                                <p className="text-gray-400 text-sm">
                                    {smoothingResult.hasSmoothing
                                        ? '⚠️ Mouse smoothing detected. This may affect accuracy measurements.'
                                        : '✅ No significant smoothing detected.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {step === 'delay' && (
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-cyan-500/30 shadow-xl">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4 animate-pulse">⚡</div>
                            <h3 className="text-2xl font-bold text-cyan-300 mb-2">Input Delay Baseline</h3>
                            <p className="text-gray-400">
                                Measuring input delay baseline. This helps calibrate reaction time measurements.
                            </p>
                        </div>
                        <button
                            onClick={handleDelayMeasurement}
                            disabled={isMeasuring}
                            className={`w-full py-4 font-bold text-xl rounded-xl transition-all transform hover:scale-105 ${
                                isMeasuring
                                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/50'
                            }`}
                        >
                            {isMeasuring ? '⏳ Measuring...' : '▶ Start Measurement'}
                        </button>
                        {delayResult && (
                            <div className="mt-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-xl border-2 border-blue-500/50">
                                <p className="text-gray-300 text-sm mb-2">Input Delay Baseline</p>
                                <p className="text-4xl font-bold text-blue-400 mb-2">
                                    {delayResult.median.toFixed(2)} ms
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Median: {delayResult.median.toFixed(2)}ms | 
                                    Avg: {delayResult.average.toFixed(2)}ms
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-4 mt-8">
                    <button
                        onClick={handleSkip}
                        className="flex-1 px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-white font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-600"
                    >
                        Skip Calibration
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
                    >
                        {step === 'delay' ? '✓ Complete' : 'Next →'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalibrationScreen;
