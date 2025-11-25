import React, { useState, useEffect } from 'react';
import { loadProfile, importSettings } from '../../utils/storage';

const ConfigScreen = ({ onStartGame }) => {
    const [config, setConfig] = useState({
        dpi: 800,
        sensitivity: 0.35,
        mousepadWidth: 45, // cm
        mousepadHeight: 40, // cm
        game: 'valorant',
        mode: 'static',
        enableCalibration: true,
    });
    const [showMousepadGuide, setShowMousepadGuide] = useState(false);

    // Load saved profile on mount
    useEffect(() => {
        const saved = loadProfile();
        if (saved) {
            setConfig(prev => ({ ...prev, ...saved }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : 
                   (name === 'dpi' || name === 'sensitivity' || name === 'mousepadWidth' || name === 'mousepadHeight') 
                   ? parseFloat(value) : value,
        }));
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const success = importSettings(event.target.result);
                if (success) {
                    const saved = loadProfile();
                    if (saved) {
                        setConfig(prev => ({ ...prev, ...saved }));
                    }
                    alert('Settings imported successfully!');
                } else {
                    alert('Failed to import settings. Invalid file format.');
                }
            } catch (error) {
                alert('Error importing settings: ' + error.message);
            }
        };
        reader.readAsText(file);
    };

    const calculateCmPer360 = () => {
        let yaw = 0.022;
        if (config.game === 'valorant') yaw = 0.07;
        if (config.game === 'cs2' || config.game === 'apex') yaw = 0.022;
        if (config.game === 'fortnite') yaw = 0.5555;
        if (config.game === 'overwatch') yaw = 0.0066;
        const cm = (360 / (config.dpi * config.sensitivity * yaw)) * 2.54;
        return cm.toFixed(2);
    };

    // Mousepad Visual Guide Component
    const MousepadGuide = () => {
        const scale = 2; // Pixels per cm
        const padWidth = config.mousepadWidth * scale;
        const padHeight = config.mousepadHeight * scale;
        const maxWidth = 400;
        const maxHeight = 300;
        const displayScale = Math.min(maxWidth / padWidth, maxHeight / padHeight, 1);
        
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-2 border-cyan-500/50 shadow-2xl p-8 max-w-2xl w-full animate-slideUp">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-cyan-300">Mousepad Measurement Guide</h3>
                        <button
                            onClick={() => setShowMousepadGuide(false)}
                            className="text-gray-400 hover:text-white text-2xl transition-colors"
                        >
                            ×
                        </button>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-cyan-500/30">
                            <div className="flex items-center justify-center mb-4">
                                <div 
                                    className="bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-cyan-400/50 rounded-lg shadow-lg relative overflow-hidden"
                                    style={{
                                        width: `${padWidth * displayScale}px`,
                                        height: `${padHeight * displayScale}px`,
                                        maxWidth: '100%'
                                    }}
                                >
                                    {/* Grid pattern */}
                                    <div className="absolute inset-0 opacity-20" style={{
                                        backgroundImage: `
                                            linear-gradient(cyan 1px, transparent 1px),
                                            linear-gradient(90deg, cyan 1px, transparent 1px)
                                        `,
                                        backgroundSize: `${10 * scale * displayScale}px ${10 * scale * displayScale}px`
                                    }} />
                                    
                                    {/* Width dimension */}
                                    <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
                                        <div className="flex items-center gap-2">
                                            <div className="h-0.5 w-4 bg-cyan-400" />
                                            <span className="text-cyan-300 font-bold text-sm">
                                                {config.mousepadWidth}cm
                                            </span>
                                            <div className="h-0.5 flex-1 bg-cyan-400" />
                                            <span className="text-cyan-300 font-bold text-sm">
                                                Width
                                            </span>
                                            <div className="h-0.5 flex-1 bg-cyan-400" />
                                            <div className="h-0.5 w-4 bg-cyan-400" />
                                        </div>
                                    </div>
                                    
                                    {/* Height dimension */}
                                    <div className="absolute -left-12 top-0 bottom-0 flex flex-col items-center justify-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-0.5 h-4 bg-cyan-400" />
                                            <span className="text-cyan-300 font-bold text-sm writing-vertical">
                                                {config.mousepadHeight}cm
                                            </span>
                                            <div className="w-0.5 flex-1 bg-cyan-400" />
                                            <span className="text-cyan-300 font-bold text-sm writing-vertical">
                                                Height
                                            </span>
                                            <div className="w-0.5 flex-1 bg-cyan-400" />
                                            <div className="w-0.5 h-4 bg-cyan-400" />
                                        </div>
                                    </div>
                                    
                                    {/* Animated mouse */}
                                    <div 
                                        className="absolute w-8 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg border-2 border-cyan-400 shadow-lg animate-mouseMove"
                                        style={{
                                            top: '20%',
                                            left: '20%',
                                            transition: 'all 3s ease-in-out'
                                        }}
                                    />
                                    
                                    {/* Measurement lines */}
                                    <div className="absolute inset-0">
                                        {/* Width line */}
                                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-400/50" />
                                        {/* Height line */}
                                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-cyan-400/50" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-3 text-gray-300 text-sm">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">📏</span>
                                    <div>
                                        <p className="font-semibold text-cyan-300">How to measure:</p>
                                        <p>Use a ruler or measuring tape to measure the width and height of your mousepad in centimeters.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">💡</span>
                                    <div>
                                        <p className="font-semibold text-cyan-300">Why it matters:</p>
                                        <p>This helps us calculate optimal sensitivity ranges based on your available space.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 overflow-auto">
            <div className="w-full max-w-3xl space-y-6 animate-fadeIn">
                <div className="text-center mb-8">
                    <h2 className="text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                        Configuration
                    </h2>
                    <p className="text-gray-400">Set up your training parameters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-gray-300 flex items-center gap-2">
                            <span>🎮</span>
                            Game Preset
                        </label>
                        <select 
                            name="game" 
                            value={config.game} 
                            onChange={handleChange}
                            className="w-full bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                        >
                            <option value="valorant">Valorant</option>
                            <option value="cs2">CS2</option>
                            <option value="apex">Apex Legends</option>
                            <option value="fortnite">Fortnite</option>
                            <option value="overwatch">Overwatch</option>
                        </select>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-gray-300 flex items-center gap-2">
                            <span>🎯</span>
                            Training Mode
                        </label>
                        <select 
                            name="mode" 
                            value={config.mode} 
                            onChange={handleChange}
                            className="w-full bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                        >
                            <option value="static">Static (baseline)</option>
                            <option value="dynamicFlick">Dynamic Flick</option>
                            <option value="microAdjust">Micro‑Adjust</option>
                            <option value="tracking">Tracking</option>
                            <option value="stressTest">Stress Test</option>
                            <option value="staircase">Sensitivity Staircase</option>
                        </select>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-gray-300 flex items-center gap-2">
                            <span>⚙️</span>
                            DPI
                        </label>
                        <input 
                            type="number" 
                            name="dpi" 
                            value={config.dpi} 
                            onChange={handleChange}
                            className="w-full bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-gray-300 flex items-center gap-2">
                            <span>🎚️</span>
                            In-Game Sensitivity
                        </label>
                        <input 
                            type="number" 
                            name="sensitivity" 
                            step="0.001" 
                            value={config.sensitivity} 
                            onChange={handleChange}
                            className="w-full bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-gray-300 flex items-center gap-2">
                            <span>📐</span>
                            Mousepad Width (cm)
                            <button
                                onClick={() => setShowMousepadGuide(true)}
                                className="ml-auto text-cyan-400 hover:text-cyan-300 text-sm underline"
                            >
                                How to measure?
                            </button>
                        </label>
                        <input 
                            type="number" 
                            name="mousepadWidth" 
                            value={config.mousepadWidth} 
                            onChange={handleChange}
                            className="w-full bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-gray-300 flex items-center gap-2">
                            <span>📏</span>
                            Mousepad Height (cm)
                        </label>
                        <input 
                            type="number" 
                            name="mousepadHeight" 
                            value={config.mousepadHeight} 
                            onChange={handleChange}
                            className="w-full bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                        />
                    </div>
                </div>

                <div className="w-full">
                    <label className="flex items-center space-x-3 text-gray-300 cursor-pointer p-4 bg-slate-800/30 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
                        <input
                            type="checkbox"
                            name="enableCalibration"
                            checked={config.enableCalibration}
                            onChange={handleChange}
                            className="w-5 h-5 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-400"
                        />
                        <span>Enable calibration before test</span>
                    </label>
                </div>

                <div className="bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 p-6 rounded-2xl border-2 border-cyan-500/30 text-center backdrop-blur-sm">
                    <p className="text-gray-300 mb-2">Current 360° Distance</p>
                    <p className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        {calculateCmPer360()} cm/360°
                    </p>
                </div>

                <div className="flex gap-4">
                    <label className="flex-1 px-6 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-white font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-600 cursor-pointer text-center backdrop-blur-sm">
                        📥 Import Settings
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>
                    <button 
                        onClick={() => onStartGame(config)}
                        className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-xl rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
                    >
                        🚀 START TEST
                    </button>
                </div>
            </div>

            {showMousepadGuide && <MousepadGuide />}
        </div>
    );
};

export default ConfigScreen;
