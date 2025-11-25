import React, { useState } from 'react';
import { generateRecommendation, getGameSensitivitySettings, convertSensitivity } from '../../utils/sensitivity';
import { selectNextMode } from '../../utils/sensitivity';
import { exportSettings } from '../../utils/storage';
import AnalyticsDashboard from './AnalyticsDashboard';

const ResultsScreen = ({ metrics, onRestart }) => {
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [selectedGame, setSelectedGame] = useState(metrics.config?.game || 'valorant');
    const rec = generateRecommendation(metrics);
    const nextMode = selectNextMode(metrics);

    const handleExport = () => {
        const data = exportSettings();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aim-trainer-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleShare = () => {
        const shareData = {
            accuracy: ((metrics.hits / metrics.shots) * 100).toFixed(1),
            reactionTime: Math.round(metrics.avgReactionTime),
            overshootRate: (metrics.overshootRate * 100).toFixed(1),
            recommendedSens: `${rec.low} - ${rec.high}`,
            date: new Date().toISOString()
        };
        
        const shareText = `Aim Trainer Results:\nAccuracy: ${shareData.accuracy}%\nReaction Time: ${shareData.reactionTime}ms\nOvershoot: ${shareData.overshootRate}%\nRecommended Sens: ${shareData.recommendedSens}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Aim Trainer Results',
                text: shareText
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText);
            alert('Results copied to clipboard!');
        }
    };

    const gameSettings = getGameSensitivitySettings(
        metrics.config.sensitivity,
        metrics.config.dpi || 800,
        selectedGame
    );

    const convertedSens = convertSensitivity(
        metrics.config.sensitivity,
        metrics.config.game || 'valorant',
        selectedGame,
        metrics.config.dpi || 800
    );

    if (showAnalytics) {
        return (
            <div className="w-full h-screen overflow-auto">
                <div className="p-4 bg-brand-dark border-b border-gray-700 flex justify-between items-center">
                    <button
                        onClick={() => setShowAnalytics(false)}
                        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                        ← Back to Results
                    </button>
                </div>
                <AnalyticsDashboard sessionData={metrics} />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full space-y-8 w-full max-w-6xl mx-auto p-8 overflow-auto">
            <h2 className="text-4xl font-bold text-white">Analysis Complete</h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-6 w-full">
                <div className="bg-brand-surface p-6 rounded border border-gray-700">
                    <p className="text-gray-400">Accuracy</p>
                    <p className="text-3xl font-bold text-brand-accent">
                        {((metrics.hits / metrics.shots) * 100).toFixed(1)}%
                    </p>
                </div>
                <div className="bg-brand-surface p-6 rounded border border-gray-700">
                    <p className="text-gray-400">Avg Reaction</p>
                    <p className="text-3xl font-bold text-brand-accent">
                        {Math.round(metrics.avgReactionTime)} ms
                    </p>
                </div>
                <div className="bg-brand-surface p-6 rounded border border-gray-700">
                    <p className="text-gray-400">Overshoot Rate</p>
                    <p className="text-3xl font-bold text-brand-accent">
                        {(metrics.overshootRate * 100).toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Recommended Sensitivity Range */}
            <div className="bg-brand-surface p-8 rounded w-full border border-brand-accent">
                <h3 className="text-2xl font-bold text-white mb-4">Recommended Sensitivity Range</h3>
                <div className="flex justify-between items-center">
                    <div className="text-center">
                        <p className="text-gray-400">Control</p>
                        <p className="text-2xl font-bold text-brand-accent">{rec.low}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400">Current</p>
                        <p className="text-xl font-bold text-white">{metrics.config.sensitivity}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400">Speed</p>
                        <p className="text-2xl font-bold text-brand-accent">{rec.high}</p>
                    </div>
                </div>
            </div>

            {/* AI Feedback */}
            {rec.feedback && rec.feedback.length > 0 && (
                <div className="bg-brand-surface p-6 rounded w-full border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">AI Analysis & Recommendations</h3>
                    <div className="space-y-3">
                        {rec.feedback.map((fb, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded border-l-4 ${
                                    fb.severity === 'positive'
                                        ? 'bg-green-900/20 border-green-500'
                                        : fb.severity === 'high'
                                        ? 'bg-red-900/20 border-red-500'
                                        : fb.severity === 'medium'
                                        ? 'bg-yellow-900/20 border-yellow-500'
                                        : 'bg-blue-900/20 border-blue-500'
                                }`}
                            >
                                <p className="text-white">{fb.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Game Sensitivity Conversions */}
            <div className="bg-brand-surface p-6 rounded w-full border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Apply to Game</h3>
                <div className="mb-4">
                    <label className="text-gray-400 text-sm mb-2 block">Select Game:</label>
                    <select
                        value={selectedGame}
                        onChange={(e) => setSelectedGame(e.target.value)}
                        className="w-full bg-brand-dark p-3 rounded text-white border border-gray-700 focus:border-brand-accent outline-none"
                    >
                        <option value="valorant">Valorant</option>
                        <option value="cs2">CS2</option>
                        <option value="apex">Apex Legends</option>
                        <option value="fortnite">Fortnite</option>
                        <option value="overwatch">Overwatch</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-brand-dark p-4 rounded">
                        <p className="text-gray-400 text-sm">Recommended Sensitivity</p>
                        <p className="text-2xl font-bold text-brand-accent">
                            {convertSensitivity(rec.low, metrics.config.game || 'valorant', selectedGame, metrics.config.dpi || 800).toFixed(4)}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">Low range</p>
                    </div>
                    <div className="bg-brand-dark p-4 rounded">
                        <p className="text-gray-400 text-sm">Recommended Sensitivity</p>
                        <p className="text-2xl font-bold text-brand-accent">
                            {convertSensitivity(rec.high, metrics.config.game || 'valorant', selectedGame, metrics.config.dpi || 800).toFixed(4)}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">High range</p>
                    </div>
                </div>
                <div className="mt-4 p-3 bg-brand-dark rounded">
                    <p className="text-gray-400 text-sm">{gameSettings.notes}</p>
                    <p className="text-white text-sm mt-1">
                        cm/360°: {gameSettings.cmPer360} cm
                    </p>
                </div>
            </div>

            {/* Adaptive Training Suggestion */}
            <div className="bg-brand-surface p-6 rounded w-full border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Next Training Mode</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white font-semibold capitalize">{nextMode.mode}</p>
                        <p className="text-gray-400 text-sm mt-1">{nextMode.reason}</p>
                    </div>
                    <button
                        onClick={() => {
                            const newConfig = { ...metrics.config, mode: nextMode.mode };
                            onRestart(newConfig);
                        }}
                        className="px-6 py-2 bg-brand-accent text-brand-dark font-bold rounded hover:bg-white transition-colors"
                    >
                        Start {nextMode.mode}
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 w-full">
                <button
                    onClick={() => setShowAnalytics(true)}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
                >
                    View Analytics
                </button>
                <button
                    onClick={handleExport}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
                >
                    Export Settings
                </button>
                <button
                    onClick={handleShare}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 transition-colors"
                >
                    Share Results
                </button>
                <button
                    onClick={onRestart}
                    className="flex-1 px-6 py-3 bg-brand-accent text-brand-dark font-bold rounded hover:bg-white transition-colors"
                >
                    Return to Menu
                </button>
            </div>
        </div>
    );
};

export default ResultsScreen;
