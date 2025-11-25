import React from 'react';
import { loadSessions } from '../../utils/storage';

const StartScreen = ({ onStart, onViewAnalytics, onViewHistory }) => {
    const sessions = loadSessions();
    const hasHistory = sessions.length > 0;

    return (
        <div className="flex flex-col items-center justify-center h-full space-y-8">
            <h1 className="text-6xl font-bold text-brand-accent tracking-tighter">
                AIM<span className="text-white">LABS</span> LITE
            </h1>
            <p className="text-gray-400 text-xl max-w-md text-center">
                Analyze your aim mechanics and find your perfect sensitivity.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-md">
                <button
                    onClick={onStart}
                    className="px-8 py-4 bg-brand-accent text-brand-dark font-bold text-xl rounded hover:bg-white transition-colors"
                >
                    START CALIBRATION
                </button>
                {hasHistory && (
                    <>
                        <button
                            onClick={onViewAnalytics}
                            className="px-8 py-4 bg-gray-700 text-white font-bold text-lg rounded hover:bg-gray-600 transition-colors"
                        >
                            VIEW ANALYTICS
                        </button>
                        <button
                            onClick={onViewHistory}
                            className="px-8 py-4 bg-gray-700 text-white font-bold text-lg rounded hover:bg-gray-600 transition-colors"
                        >
                            SESSION HISTORY
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default StartScreen;
