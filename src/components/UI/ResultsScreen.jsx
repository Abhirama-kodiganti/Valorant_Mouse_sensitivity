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
            <div className="w-full h-screen overflow-auto bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <div className="p-4 bg-slate-800/50 backdrop-blur-sm border-b border-cyan-500/30 flex justify-between items-center">
                    <button
                        onClick={() => setShowAnalytics(false)}
                        className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-all border border-cyan-500/30 hover:border-cyan-400/50"
                    >
                        ← Back to Results
                    </button>
                </div>
                <AnalyticsDashboard sessionData={metrics} />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 overflow-auto">
            <div className="w-full max-w-6xl space-y-8 animate-fadeIn">
                <div className="text-center mb-8">
                    <h2 className="text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                        Analysis Complete
                    </h2>
                    <p className="text-gray-400">Your performance breakdown</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm p-6 rounded-2xl border-2 border-cyan-500/30 shadow-xl transform hover:scale-105 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">🎯</span>
                            <p className="text-gray-300 font-semibold">Accuracy</p>
                        </div>
                        <p className="text-4xl font-bold text-cyan-400">
                            {((metrics.hits / metrics.shots) * 100).toFixed(1)}%
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm p-6 rounded-2xl border-2 border-blue-500/30 shadow-xl transform hover:scale-105 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">⚡</span>
                            <p className="text-gray-300 font-semibold">Avg Reaction</p>
                        </div>
                        <p className="text-4xl font-bold text-blue-400">
                            {Math.round(metrics.avgReactionTime)} ms
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm p-6 rounded-2xl border-2 border-purple-500/30 shadow-xl transform hover:scale-105 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">📊</span>
                            <p className="text-gray-300 font-semibold">Overshoot Rate</p>
                        </div>
                        <p className="text-4xl font-bold text-purple-400">
                            {(metrics.overshootRate * 100).toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Recommended Sensitivity Range */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-8 rounded-2xl w-full border-2 border-cyan-500/30 shadow-2xl">
                    <h3 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-2">
                        <span>🎚️</span>
                        Recommended Sensitivity Range
                    </h3>
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex-1 text-center p-4 bg-slate-900/30 rounded-xl border border-cyan-500/20">
                            <p className="text-gray-400 text-sm mb-2">Control</p>
                            <p className="text-3xl font-bold text-cyan-400">{rec.low}</p>
                        </div>
                        <div className="flex-1 text-center p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border-2 border-cyan-400/50">
                            <p className="text-gray-300 text-sm mb-2">Current</p>
                            <p className="text-2xl font-bold text-white">{metrics.config.sensitivity}</p>
                        </div>
                        <div className="flex-1 text-center p-4 bg-slate-900/30 rounded-xl border border-cyan-500/20">
                            <p className="text-gray-400 text-sm mb-2">Speed</p>
                            <p className="text-3xl font-bold text-blue-400">{rec.high}</p>
                        </div>
                    </div>
                </div>

                {/* AI Feedback */}
                {rec.feedback && rec.feedback.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 rounded-2xl w-full border border-cyan-500/30 shadow-xl">
                        <h3 className="text-xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
                            <span>🤖</span>
                            AI Analysis & Recommendations
                        </h3>
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
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 rounded-2xl w-full border border-cyan-500/30 shadow-xl">
                    <h3 className="text-xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
                        <span>🎮</span>
                        Apply to Game
                    </h3>
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
                    <div className="mt-4 p-3 bg-slate-900/30 rounded-xl border border-cyan-500/20">
                        <p className="text-gray-400 text-sm">{gameSettings.notes}</p>
                        <p className="text-white text-sm mt-1">
                            cm/360°: {gameSettings.cmPer360} cm
                        </p>
                    </div>
                </div>

                {/* Adaptive Training Suggestion */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 rounded-2xl w-full border border-cyan-500/30 shadow-xl">
                    <h3 className="text-xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
                        <span>📈</span>
                        Next Training Mode
                    </h3>
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
                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
                    >
                        Start {nextMode.mode}
                    </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => setShowAnalytics(true)}
                        className="px-6 py-4 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 text-white font-bold rounded-xl transition-all transform hover:scale-105 border border-cyan-500/30 hover:border-cyan-400/50 shadow-lg"
                    >
                        <span className="flex flex-col items-center gap-1">
                            <span className="text-xl">📊</span>
                            <span className="text-sm">Analytics</span>
                        </span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-6 py-4 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 text-white font-bold rounded-xl transition-all transform hover:scale-105 border border-cyan-500/30 hover:border-cyan-400/50 shadow-lg"
                    >
                        <span className="flex flex-col items-center gap-1">
                            <span className="text-xl">💾</span>
                            <span className="text-sm">Export</span>
                        </span>
                    </button>
                    <button
                        onClick={handleShare}
                        className="px-6 py-4 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 text-white font-bold rounded-xl transition-all transform hover:scale-105 border border-cyan-500/30 hover:border-cyan-400/50 shadow-lg"
                    >
                        <span className="flex flex-col items-center gap-1">
                            <span className="text-xl">🔗</span>
                            <span className="text-sm">Share</span>
                        </span>
                    </button>
                    <button
                        onClick={onRestart}
                        className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
                    >
                        <span className="flex flex-col items-center gap-1">
                            <span className="text-xl">🏠</span>
                            <span className="text-sm">Menu</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultsScreen;
