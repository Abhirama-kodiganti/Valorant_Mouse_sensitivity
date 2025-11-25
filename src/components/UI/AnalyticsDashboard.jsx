import React, { useEffect, useState, useRef } from 'react';
import { loadSessions } from '../../utils/storage';
import {
    LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Cell
} from 'recharts';

export default function AnalyticsDashboard({ sessionData = null }) {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const data = loadSessions();
        setSessions(data);
        if (sessionData) {
            setSelectedSession(sessionData);
        } else if (data.length > 0) {
            setSelectedSession(data[data.length - 1]);
        }
    }, [sessionData]);

    // Compute chart data from session history
    const computeHistoryData = () => {
        const labels = sessions.map((s, idx) => idx + 1);
        const accuracy = sessions.map(s => s.shots ? (s.hits / s.shots) * 100 : 0);
        const reaction = sessions.map(s => s.avgReactionTime || 0);
        const overshoot = sessions.map(s => (s.overshootRate || 0) * 100);
        
        return labels.map((label, idx) => ({
            session: label,
            accuracy: accuracy[idx],
            reactionTime: reaction[idx],
            overshoot: overshoot[idx]
        }));
    };

    // Reaction time distribution
    const computeReactionTimeDistribution = () => {
        if (!selectedSession || !selectedSession.reactionTimes) return [];
        
        const bins = [0, 100, 150, 200, 250, 300, 400, 500, 1000];
        const distribution = bins.slice(0, -1).map((min, idx) => {
            const max = bins[idx + 1];
            const count = selectedSession.reactionTimes.filter(rt => rt >= min && rt < max).length;
            return {
                range: `${min}-${max}ms`,
                count
            };
        });
        
        return distribution;
    };

    // Accuracy decay over time
    const computeAccuracyDecay = () => {
        if (!selectedSession || !selectedSession.accuracyOverTime) return [];
        
        return selectedSession.accuracyOverTime.map((acc, idx) => ({
            time: idx,
            accuracy: acc
        }));
    };

    // Distance to target scatter
    const computeDistanceScatter = () => {
        if (!selectedSession || !selectedSession.distanceToTarget) return [];
        
        return selectedSession.distanceToTarget.map((d, idx) => ({
            distance: d.distance,
            hit: d.hit ? 1 : 0,
            time: idx
        }));
    };

    // Render movement heatmap
    const renderHeatmap = () => {
        if (!selectedSession || !selectedSession.movementPath || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);
        
        // Normalize movement path to canvas size
        const path = selectedSession.movementPath;
        if (path.length === 0) return;
        
        // Find bounds
        const xs = path.map(p => p.x);
        const ys = path.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        // Create heatmap grid
        const gridSize = 20;
        const grid = {};
        
        path.forEach(point => {
            const gx = Math.floor((point.x - minX) / (maxX - minX) * (width / gridSize));
            const gy = Math.floor((point.y - minY) / (maxY - minY) * (height / gridSize));
            const key = `${gx},${gy}`;
            grid[key] = (grid[key] || 0) + 1;
        });
        
        // Find max count for normalization
        const maxCount = Math.max(...Object.values(grid));
        
        // Draw heatmap
        Object.entries(grid).forEach(([key, count]) => {
            const [gx, gy] = key.split(',').map(Number);
            const intensity = count / maxCount;
            const alpha = Math.min(1, intensity * 2);
            
            ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.fillRect(gx * gridSize, gy * gridSize, gridSize, gridSize);
        });
        
        // Draw targets if available
        if (selectedSession.config) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            // This would need target positions from session data
        }
    };

    useEffect(() => {
        if (selectedSession) {
            renderHeatmap();
        }
    }, [selectedSession]);

    const historyData = computeHistoryData();
    const reactionDist = computeReactionTimeDistribution();
    const accuracyDecay = computeAccuracyDecay();
    const distanceScatter = computeDistanceScatter();

    const COLORS = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'];

    return (
        <div className="p-6 bg-brand-dark text-white min-h-screen">
            <h2 className="text-3xl font-bold mb-6">Analytics Dashboard</h2>
            
            {/* Session Selector */}
            {sessions.length > 0 && (
                <div className="mb-6">
                    <label className="text-gray-400 text-sm mb-2 block">Select Session:</label>
                    <select
                        value={sessions.indexOf(selectedSession)}
                        onChange={(e) => setSelectedSession(sessions[parseInt(e.target.value)])}
                        className="bg-brand-surface text-white p-2 rounded border border-gray-700"
                    >
                        {sessions.map((s, idx) => (
                            <option key={idx} value={idx}>
                                {new Date(s.date).toLocaleString()} - {s.config?.mode || 'static'}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Movement Heatmap */}
                <div className="bg-brand-surface p-4 rounded border border-gray-700">
                    <h3 className="text-xl font-semibold mb-4">Movement Heatmap</h3>
                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={400}
                        className="w-full h-64 bg-brand-dark rounded"
                    />
                    <p className="text-gray-400 text-sm mt-2">
                        Shows mouse movement density during session
                    </p>
                </div>

                {/* Accuracy Over Time */}
                <div className="bg-brand-surface p-4 rounded border border-gray-700">
                    <h3 className="text-xl font-semibold mb-4">Accuracy Over Time</h3>
                    {accuracyDecay.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={accuracyDecay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="time" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151' }} />
                                <Line type="monotone" dataKey="accuracy" stroke="#38bdf8" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            No accuracy over time data available
                        </div>
                    )}
                </div>

                {/* Reaction Time Distribution */}
                <div className="bg-brand-surface p-4 rounded border border-gray-700">
                    <h3 className="text-xl font-semibold mb-4">Reaction Time Distribution</h3>
                    {reactionDist.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={reactionDist}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="range" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151' }} />
                                <Bar dataKey="count" fill="#38bdf8">
                                    {reactionDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            No reaction time data available
                        </div>
                    )}
                </div>

                {/* Distance to Target Scatter */}
                <div className="bg-brand-surface p-4 rounded border border-gray-700">
                    <h3 className="text-xl font-semibold mb-4">Distance to Target Analysis</h3>
                    {distanceScatter.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <ScatterChart data={distanceScatter}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis type="number" dataKey="distance" name="Distance" stroke="#9ca3af" />
                                <YAxis type="number" dataKey="hit" name="Hit" stroke="#9ca3af" domain={[-0.1, 1.1]} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151' }} />
                                <Scatter name="Shots" data={distanceScatter} fill="#38bdf8">
                                    {distanceScatter.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.hit ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            No distance data available
                        </div>
                    )}
                </div>

                {/* Session History - Accuracy Trend */}
                {historyData.length > 0 && (
                    <div className="bg-brand-surface p-4 rounded border border-gray-700 lg:col-span-2">
                        <h3 className="text-xl font-semibold mb-4">Session History - Accuracy Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={historyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="session" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151' }} />
                                <Legend />
                                <Line type="monotone" dataKey="accuracy" stroke="#38bdf8" strokeWidth={2} name="Accuracy %" />
                                <Line type="monotone" dataKey="reactionTime" stroke="#10b981" strokeWidth={2} name="Reaction Time (ms)" />
                                <Line type="monotone" dataKey="overshoot" stroke="#ef4444" strokeWidth={2} name="Overshoot %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
