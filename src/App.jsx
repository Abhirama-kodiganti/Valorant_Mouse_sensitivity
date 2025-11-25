import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import StartScreen from './components/UI/StartScreen';
import ConfigScreen from './components/UI/ConfigScreen';
import CalibrationScreen from './components/UI/CalibrationScreen';
import ResultsScreen from './components/UI/ResultsScreen';
import AnalyticsDashboard from './components/UI/AnalyticsDashboard';
import SessionHistory from './components/UI/SessionHistory';
import { loadProfile, saveProfile, saveSession } from './utils/storage';

function App() {
  const [gameState, setGameState] = useState('start'); // start, config, calibration, game, results, analytics, history
  const [config, setConfig] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // Load saved profile on initial mount
  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setConfig(saved);
    }
  }, []);

  const handleStart = () => setGameState('config');

  const handleConfigComplete = (newConfig) => {
    setConfig(newConfig);
    saveProfile(newConfig);
    // Optionally show calibration screen
    if (newConfig.enableCalibration !== false) {
      setGameState('calibration');
    } else {
      setGameState('game');
    }
  };

  const handleCalibrationComplete = (calibratedConfig) => {
    setConfig(calibratedConfig);
    saveProfile(calibratedConfig);
    setGameState('game');
  };

  const handleGameEnd = (results) => {
    setMetrics(results);
    // Save session result for history with all enhanced metrics
    saveSession({ ...results, date: new Date().toISOString() });
    document.exitPointerLock();
    setGameState('results');
  };

  const handleRestart = (newConfig = null) => {
    if (newConfig) {
      setConfig(newConfig);
      saveProfile(newConfig);
      setGameState('game');
    } else {
      setGameState('config');
    }
  };

  const handleViewAnalytics = () => {
    setGameState('analytics');
  };

  const handleViewHistory = () => {
    setGameState('history');
  };

  return (
    <div className="w-full h-screen bg-brand-dark text-white overflow-hidden font-sans">
      {gameState === 'start' && (
        <StartScreen 
          onStart={handleStart} 
          onViewAnalytics={handleViewAnalytics}
          onViewHistory={handleViewHistory}
        />
      )}
      {gameState === 'config' && <ConfigScreen onStartGame={handleConfigComplete} />}
      {gameState === 'calibration' && (
        <CalibrationScreen onComplete={handleCalibrationComplete} config={config} />
      )}
      {gameState === 'game' && <GameCanvas config={config} onGameEnd={handleGameEnd} />}
      {gameState === 'results' && (
        <ResultsScreen metrics={metrics} onRestart={handleRestart} />
      )}
      {gameState === 'analytics' && (
        <div className="w-full h-screen overflow-auto">
          <div className="p-4 bg-brand-dark border-b border-gray-700 flex justify-between items-center">
            <button
              onClick={() => setGameState('start')}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              ← Back to Menu
            </button>
          </div>
          <AnalyticsDashboard />
        </div>
      )}
      {gameState === 'history' && (
        <div className="w-full h-screen overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold">Session History</h2>
              <button
                onClick={() => setGameState('start')}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                ← Back to Menu
              </button>
            </div>
            <SessionHistory />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
