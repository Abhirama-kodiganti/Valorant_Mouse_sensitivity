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

    return (
        <div className="flex flex-col items-center justify-center h-full space-y-6 w-full max-w-2xl mx-auto p-8 overflow-auto">
            <h2 className="text-3xl font-bold text-white">Configuration</h2>
            <div className="grid grid-cols-2 gap-6 w-full">
                <div className="space-y-2">
                    <label className="text-gray-400">Game Preset</label>
                    <select name="game" value={config.game} onChange={handleChange}
                        className="w-full bg-brand-surface p-3 rounded text-white border border-gray-700 focus:border-brand-accent outline-none">
                        <option value="valorant">Valorant</option>
                        <option value="cs2">CS2</option>
                        <option value="apex">Apex Legends</option>
                        <option value="fortnite">Fortnite</option>
                        <option value="overwatch">Overwatch</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-gray-400">Mode</label>
                    <select name="mode" value={config.mode} onChange={handleChange}
                        className="w-full bg-brand-surface p-3 rounded text-white border border-gray-700 focus:border-brand-accent outline-none">
                        <option value="static">Static (baseline)</option>
                        <option value="dynamicFlick">Dynamic Flick</option>
                        <option value="microAdjust">Micro‑Adjust</option>
                        <option value="tracking">Tracking</option>
                        <option value="stressTest">Stress Test</option>
                        <option value="staircase">Sensitivity Staircase</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-gray-400">DPI</label>
                    <input type="number" name="dpi" value={config.dpi} onChange={handleChange}
                        className="w-full bg-brand-surface p-3 rounded text-white border border-gray-700 focus:border-brand-accent outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-gray-400">In-Game Sensitivity</label>
                    <input type="number" name="sensitivity" step="0.001" value={config.sensitivity} onChange={handleChange}
                        className="w-full bg-brand-surface p-3 rounded text-white border border-gray-700 focus:border-brand-accent outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-gray-400">Mousepad Width (cm)</label>
                    <input type="number" name="mousepadWidth" value={config.mousepadWidth} onChange={handleChange}
                        className="w-full bg-brand-surface p-3 rounded text-white border border-gray-700 focus:border-brand-accent outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-gray-400">Mousepad Height (cm)</label>
                    <input type="number" name="mousepadHeight" value={config.mousepadHeight} onChange={handleChange}
                        className="w-full bg-brand-surface p-3 rounded text-white border border-gray-700 focus:border-brand-accent outline-none" />
                </div>
            </div>
            <div className="w-full">
                <label className="flex items-center space-x-2 text-gray-400 cursor-pointer">
                    <input
                        type="checkbox"
                        name="enableCalibration"
                        checked={config.enableCalibration}
                        onChange={handleChange}
                        className="w-4 h-4"
                    />
                    <span>Enable calibration before test</span>
                </label>
            </div>
            <div className="bg-brand-surface p-4 rounded w-full text-center border border-brand-accent/30">
                <p className="text-gray-400">Current 360° Distance</p>
                <p className="text-3xl font-bold text-brand-accent">{calculateCmPer360()} cm/360°</p>
            </div>
            <div className="w-full flex gap-4">
                <label className="flex-1 px-4 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors cursor-pointer text-center">
                    Import Settings
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                    />
                </label>
                <button onClick={() => onStartGame(config)}
                    className="flex-1 py-3 bg-brand-accent text-brand-dark font-bold text-xl rounded hover:bg-white transition-colors">
                    START TEST
                </button>
            </div>
        </div>
    );
};

export default ConfigScreen;
