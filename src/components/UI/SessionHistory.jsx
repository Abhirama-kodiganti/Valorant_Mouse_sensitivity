// src/components/UI/SessionHistory.jsx

import React, { useEffect, useState } from 'react';
import { loadSessions } from '../../utils/storage';

export default function SessionHistory() {
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        const data = loadSessions();
        setSessions(data);
    }, []);

    if (sessions.length === 0) {
        return <p className="text-gray-400">No previous sessions recorded.</p>;
    }

    return (
        <div className="overflow-x-auto p-4 bg-brand-surface rounded">
            <table className="min-w-full text-sm text-left text-gray-200">
                <thead className="bg-brand-dark">
                    <tr>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Mode</th>
                        <th className="px-4 py-2">Accuracy</th>
                        <th className="px-4 py-2">Avg RT (ms)</th>
                        <th className="px-4 py-2">Overshoot %</th>
                    </tr>
                </thead>
                <tbody>
                    {sessions.map((s, idx) => {
                        const accuracy = s.shots ? ((s.hits / s.shots) * 100).toFixed(1) : 0;
                        const overshoot = (s.overshootRate * 100).toFixed(1);
                        const date = new Date(s.date).toLocaleString();
                        return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-brand-dark/50' : ''}>
                                <td className="px-4 py-2">{date}</td>
                                <td className="px-4 py-2">{s.config?.mode || 'static'}</td>
                                <td className="px-4 py-2">{accuracy}%</td>
                                <td className="px-4 py-2">{s.avgReactionTime?.toFixed(0) || '—'}</td>
                                <td className="px-4 py-2">{overshoot}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
