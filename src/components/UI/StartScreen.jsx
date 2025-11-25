import React from 'react';
import { loadSessions } from '../../utils/storage';

const StartScreen = ({ onStart, onViewAnalytics, onViewHistory }) => {
    const sessions = loadSessions();
    const hasHistory = sessions.length > 0;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 flex flex-col items-center space-y-8 animate-fadeIn">
                {/* Logo/Title */}
                <div className="text-center space-y-4">
                    <h1 className="text-7xl md:text-8xl font-bold tracking-tighter">
                        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                            AIM
                        </span>
                        <span className="text-white">LABS</span>
                        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                            LITE
                        </span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-4xl animate-float">
                        <span>🎯</span>
                        <span>⚡</span>
                        <span>🎮</span>
                    </div>
                </div>

                <p className="text-gray-300 text-xl md:text-2xl max-w-2xl text-center font-light">
                    Analyze your aim mechanics and find your perfect sensitivity
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 w-full max-w-md mt-8">
                    <button
                        onClick={onStart}
                        className="group relative px-8 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-xl rounded-2xl transition-all transform hover:scale-105 shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <span className="text-2xl">🚀</span>
                            START CALIBRATION
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    
                    {hasHistory && (
                        <>
                            <button
                                onClick={onViewAnalytics}
                                className="group px-8 py-4 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 border border-cyan-500/30 hover:border-cyan-400/50 shadow-lg"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>📊</span>
                                    VIEW ANALYTICS
                                </span>
                            </button>
                            <button
                                onClick={onViewHistory}
                                className="group px-8 py-4 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700/50 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 border border-cyan-500/30 hover:border-cyan-400/50 shadow-lg"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span>📜</span>
                                    SESSION HISTORY
                                </span>
                            </button>
                        </>
                    )}
                </div>

                {/* Stats Preview */}
                {hasHistory && (
                    <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-md">
                        <div className="bg-slate-800/30 backdrop-blur-sm p-4 rounded-xl border border-cyan-500/20 text-center">
                            <p className="text-2xl font-bold text-cyan-400">{sessions.length}</p>
                            <p className="text-xs text-gray-400 mt-1">Sessions</p>
                        </div>
                        <div className="bg-slate-800/30 backdrop-blur-sm p-4 rounded-xl border border-cyan-500/20 text-center">
                            <p className="text-2xl font-bold text-blue-400">
                                {sessions.length > 0 
                                    ? Math.round(sessions.reduce((acc, s) => acc + (s.hits / s.shots * 100 || 0), 0) / sessions.length)
                                    : 0}%
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Avg Accuracy</p>
                        </div>
                        <div className="bg-slate-800/30 backdrop-blur-sm p-4 rounded-xl border border-cyan-500/20 text-center">
                            <p className="text-2xl font-bold text-purple-400">
                                {sessions.length > 0
                                    ? Math.round(sessions.reduce((acc, s) => acc + (s.avgReactionTime || 0), 0) / sessions.length)
                                    : 0}ms
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Avg RT</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StartScreen;
