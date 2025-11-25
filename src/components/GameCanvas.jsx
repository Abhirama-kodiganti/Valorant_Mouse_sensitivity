import React, { useRef, useEffect, useState } from 'react';
import { GameManager } from '../managers/GameManager';

const GameCanvas = ({ config, onGameEnd }) => {
    const canvasRef = useRef(null);
    const [gameManager, setGameManager] = useState(null);
    const requestRef = useRef();
    const [isLocked, setIsLocked] = useState(false);
    const [hudMetrics, setHudMetrics] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const width = window.innerWidth;
        const height = window.innerHeight;

        canvas.width = width;
        canvas.height = height;

        const manager = new GameManager(width, height, config, onGameEnd);
        setGameManager(manager);
        manager.start();

        let lastTime = performance.now();
        const render = (currentTime) => {
            if (!manager.isPlaying) return;

            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            const ctx = canvas.getContext('2d');

            // Clear screen
            ctx.fillStyle = '#1e293b'; // brand-surface
            ctx.fillRect(0, 0, width, height);

            // Render Targets
            manager.targets.forEach(target => {
                ctx.beginPath();
                ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#38bdf8'; // brand-accent
                ctx.fill();
                
                // Add inner circle for better visibility
                ctx.beginPath();
                ctx.arc(target.x, target.y, target.radius * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = '#0ea5e9';
                ctx.fill();
                ctx.closePath();
            });

            // Render Reticle
            ctx.beginPath();
            ctx.arc(manager.reticle.x, manager.reticle.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            
            // Reticle crosshair
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(manager.reticle.x - 10, manager.reticle.y);
            ctx.lineTo(manager.reticle.x + 10, manager.reticle.y);
            ctx.moveTo(manager.reticle.x, manager.reticle.y - 10);
            ctx.lineTo(manager.reticle.x, manager.reticle.y + 10);
            ctx.stroke();
            ctx.closePath();

            // Update HUD metrics
            const metrics = manager.getCurrentMetrics();
            setHudMetrics(metrics);

            // HUD Text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.fillText(`Hits: ${manager.hits} / ${manager.config.maxTargets}`, 20, 40);

            manager.update(deltaTime);
            if (manager.isPlaying) {
                requestRef.current = requestAnimationFrame(render);
            }
        };

        requestRef.current = requestAnimationFrame(render);

        return () => cancelAnimationFrame(requestRef.current);
    }, [config, onGameEnd]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (document.pointerLockElement === canvasRef.current && gameManager) {
                gameManager.handleMouseMove(e.movementX, e.movementY);
            }
        };

        const handleMouseDown = () => {
            if (document.pointerLockElement === canvasRef.current && gameManager) {
                gameManager.handleClick();
            } else {
                canvasRef.current.requestPointerLock();
            }
        };

        const handleLockChange = () => {
            setIsLocked(document.pointerLockElement === canvasRef.current);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('pointerlockchange', handleLockChange);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('pointerlockchange', handleLockChange);
        };
    }, [gameManager]);

    return (
        <div className="relative w-full h-full">
            {!isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white pointer-events-none z-10">
                    <p className="text-2xl font-bold">Click to Start / Lock Cursor</p>
                </div>
            )}
            
            {/* Real-time HUD Overlay */}
            {isLocked && hudMetrics && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-6 py-3 z-20">
                    <div className="flex gap-6 text-sm font-mono">
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">RT</span>
                            <span className="text-white font-bold">{Math.round(hudMetrics.reactionTime)}ms</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">Accuracy</span>
                            <span className="text-white font-bold">{hudMetrics.accuracy.toFixed(1)}%</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">Overshoot</span>
                            <span className="text-white font-bold">{hudMetrics.overshootRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">Stability</span>
                            <span className="text-white font-bold">{Math.round(hudMetrics.stabilityScore)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">Sens</span>
                            <span className="text-brand-accent font-bold">x{hudMetrics.currentSensitivity.toFixed(2)}</span>
                        </div>
                        {hudMetrics.correctionDelay > 0 && (
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-xs">Correction</span>
                                <span className="text-yellow-400 font-bold">{hudMetrics.correctionDelay}ms</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <canvas ref={canvasRef} className="block w-full h-full cursor-none" />
        </div>
    );
};

export default GameCanvas;
