export class GameManager {
    constructor(width, height, config, onGameEnd) {
        this.width = width;
        this.height = height;
        this.targets = [];
        this.shots = 0;
        this.hits = 0;
        this.startTime = 0;
        this.isPlaying = false;
        this.config = {
            sensitivity: config.sensitivity || 1.0,
            targetSize: 20,
            spawnRate: 1000,
            maxTargets: 10,
            mode: config.mode || 'static',
            dpi: config.dpi || 800,
            ...config
        };
        this.onGameEnd = onGameEnd;

        // Enhanced Metrics
        this.reactionTimes = [];
        this.overshootCount = 0;
        this.edgeHits = 0;
        this.lastSpawnTime = 0;
        this.hasMovedSinceSpawn = false;
        this.currentReactionTime = 0;
        this.lastReactionTime = 0;
        
        // Movement tracking for heatmaps and stability
        this.movementPath = [];
        this.movementDeltas = [];
        this.lastMousePosition = { x: width / 2, y: height / 2 };
        this.stabilityScore = 100;
        this.correctionDelays = [];
        this.lastOvershootTime = 0;
        
        // Accuracy over time tracking
        this.accuracyOverTime = [];
        this.timeStamps = [];
        
        // Distance-to-target tracking
        this.distanceToTarget = [];
        
        // Mode-specific state
        this.modeState = this.initModeState();
        this.currentSensitivity = this.config.sensitivity;
        
        // Reticle position
        this.reticle = { x: width / 2, y: height / 2 };
        this.lastFrameTime = Date.now();
    }

    initModeState() {
        const mode = this.config.mode;
        switch (mode) {
            case 'dynamicFlick':
                return {
                    minDistance: 400,
                    maxDistance: 800,
                };
            case 'microAdjust':
                return {
                    targetSize: 8,
                    maxDistance: 150,
                };
            case 'tracking':
                return {
                    targetSpeed: 2,
                    direction: { x: 1, y: 0 },
                    curvePhase: 0,
                };
            case 'stressTest':
                return {
                    baseSpawnRate: 1000,
                    currentSpawnRate: 1000,
                    difficulty: 1,
                };
            case 'staircase':
                return {
                    baseSensitivity: this.config.sensitivity,
                    currentStep: 0,
                    performanceHistory: [],
                    adjustmentDirection: 1, // 1 = up, -1 = down
                };
            default:
                return {};
        }
    }

    start() {
        this.isPlaying = true;
        this.startTime = Date.now();
        this.targets = [];
        this.shots = 0;
        this.hits = 0;
        this.reactionTimes = [];
        this.overshootCount = 0;
        this.edgeHits = 0;
        this.movementPath = [];
        this.movementDeltas = [];
        this.accuracyOverTime = [];
        this.timeStamps = [];
        this.distanceToTarget = [];
        this.correctionDelays = [];
        this.lastMousePosition = { x: this.width / 2, y: this.height / 2 };
        this.reticle = { x: this.width / 2, y: this.height / 2 };
        this.currentSensitivity = this.config.sensitivity;
        this.modeState = this.initModeState();
        this.lastFrameTime = Date.now();
        
        // Mode-specific initialization
        if (this.config.mode === 'stressTest') {
            this.modeState.currentSpawnRate = this.modeState.baseSpawnRate;
            this.modeState.difficulty = 1;
        }
        
        this.spawnTarget();
    }

    stop() {
        this.isPlaying = false;
        if (this.onGameEnd) {
            const avgReactionTime = this.reactionTimes.length > 0
                ? this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length
                : 0;
            const overshootRate = this.shots > 0 ? this.overshootCount / this.shots : 0;
            const avgCorrectionDelay = this.correctionDelays.length > 0
                ? this.correctionDelays.reduce((a, b) => a + b, 0) / this.correctionDelays.length
                : 0;
            
            // Calculate accuracy over time
            const accuracyData = this.accuracyOverTime.map((acc, idx) => ({
                time: this.timeStamps[idx] || idx,
                accuracy: acc
            }));

            this.onGameEnd({
                shots: this.shots,
                hits: this.hits,
                config: this.config,
                avgReactionTime,
                overshootRate,
                edgeHits: this.edgeHits,
                movementPath: this.movementPath,
                reactionTimes: this.reactionTimes,
                accuracyOverTime: accuracyData,
                distanceToTarget: this.distanceToTarget,
                stabilityScore: this.stabilityScore,
                avgCorrectionDelay,
                currentSensitivity: this.currentSensitivity,
                modeState: this.modeState
            });
        }
    }

    update(deltaTime) {
        if (!this.isPlaying) return;

        const now = Date.now();
        const elapsed = now - this.startTime;

        // Update targets based on mode
        if (this.config.mode === 'tracking') {
            this.updateTrackingTargets(deltaTime);
        }

        // Stress test: increase difficulty over time
        if (this.config.mode === 'stressTest') {
            const difficultyIncrease = Math.floor(elapsed / 10000); // Every 10 seconds
            this.modeState.difficulty = 1 + difficultyIncrease * 0.2;
            this.modeState.currentSpawnRate = Math.max(200, this.modeState.baseSpawnRate / this.modeState.difficulty);
        }

        // Staircase mode: adjust sensitivity based on performance
        if (this.config.mode === 'staircase' && this.hits > 0 && this.hits % 5 === 0) {
            this.adjustStaircaseSensitivity();
        }

        // Update accuracy over time
        if (this.shots > 0) {
            const currentAccuracy = (this.hits / this.shots) * 100;
            this.accuracyOverTime.push(currentAccuracy);
            this.timeStamps.push(elapsed);
        }

        // Check win condition
        if (this.hits >= this.config.maxTargets) {
            this.stop();
        }
    }

    updateTrackingTargets(deltaTime) {
        // deltaTime is in milliseconds, convert to seconds for smooth movement
        const deltaSeconds = deltaTime / 1000;
        this.targets.forEach(target => {
            if (target.tracking) {
                // Linear motion (velocity is in pixels per second)
                target.x += target.velocityX * deltaSeconds * 60; // Scale for 60fps
                target.y += target.velocityY * deltaSeconds * 60;

                // Bounce off edges
                if (target.x <= target.radius || target.x >= this.width - target.radius) {
                    target.velocityX *= -1;
                }
                if (target.y <= target.radius || target.y >= this.height - target.radius) {
                    target.velocityY *= -1;
                }

                // Curved motion option
                if (target.curve) {
                    this.modeState.curvePhase += deltaSeconds;
                    target.x += Math.sin(this.modeState.curvePhase) * 2;
                    target.y += Math.cos(this.modeState.curvePhase) * 2;
                }
            }
        });
    }

    adjustStaircaseSensitivity() {
        const recentHits = Math.min(5, this.hits);
        const recentShots = Math.min(5, this.shots);
        const recentAccuracy = recentShots > 0 ? recentHits / recentShots : 0;

        this.modeState.performanceHistory.push(recentAccuracy);

        if (recentAccuracy > 0.8) {
            // Too easy, increase sensitivity
            this.currentSensitivity *= 1.1;
            this.modeState.adjustmentDirection = 1;
        } else if (recentAccuracy < 0.5) {
            // Too hard, decrease sensitivity
            this.currentSensitivity *= 0.9;
            this.modeState.adjustmentDirection = -1;
        }
    }

    handleMouseMove(movementX, movementY) {
        if (!this.isPlaying) return;

        const now = Date.now();
        const deltaX = movementX * this.currentSensitivity;
        const deltaY = movementY * this.currentSensitivity;
        const totalDelta = Math.hypot(deltaX, deltaY);

        // Track movement path for heatmap
        this.movementPath.push({
            x: this.reticle.x,
            y: this.reticle.y,
            time: now
        });

        // Track movement deltas for stability
        this.movementDeltas.push({
            delta: totalDelta,
            time: now
        });

        // Calculate stability score (lower variance = higher stability)
        if (this.movementDeltas.length > 10) {
            const recent = this.movementDeltas.slice(-10);
            const avg = recent.reduce((a, b) => a + b.delta, 0) / recent.length;
            const variance = recent.reduce((a, b) => a + Math.pow(b.delta - avg, 2), 0) / recent.length;
            this.stabilityScore = Math.max(0, Math.min(100, 100 - Math.sqrt(variance) * 10));
        }

        // Reaction time tracking
        if (!this.hasMovedSinceSpawn && this.targets.length > 0) {
            const reactionTime = now - this.lastSpawnTime;
            this.reactionTimes.push(reactionTime);
            this.currentReactionTime = reactionTime;
            this.lastReactionTime = reactionTime;
            this.hasMovedSinceSpawn = true;
        } else if (this.targets.length > 0) {
            this.currentReactionTime = now - this.lastSpawnTime;
        }

        // Apply sensitivity
        this.reticle.x += deltaX;
        this.reticle.y += deltaY;

        // Check edge hits
        if (this.reticle.x <= 0 || this.reticle.x >= this.width ||
            this.reticle.y <= 0 || this.reticle.y >= this.height) {
            this.edgeHits++;
        }

        // Clamp
        this.reticle.x = Math.max(0, Math.min(this.width, this.reticle.x));
        this.reticle.y = Math.max(0, Math.min(this.height, this.reticle.y));

        // Track distance to nearest target
        if (this.targets.length > 0) {
            const nearest = this.targets.reduce((closest, target) => {
                const dist = Math.hypot(target.x - this.reticle.x, target.y - this.reticle.y);
                return dist < closest.dist ? { dist, target } : closest;
            }, { dist: Infinity, target: null });
            
            if (nearest.target) {
                this.distanceToTarget.push({
                    distance: nearest.dist,
                    time: now,
                    hit: false
                });
            }
        }
    }

    handleClick() {
        if (!this.isPlaying) return;
        this.shots++;

        let hitIndex = -1;
        let hitDistance = Infinity;
        
        for (let i = 0; i < this.targets.length; i++) {
            const t = this.targets[i];
            const dist = Math.hypot(t.x - this.reticle.x, t.y - this.reticle.y);
            if (dist < t.radius) {
                if (dist < hitDistance) {
                    hitDistance = dist;
                    hitIndex = i;
                }
            }
        }

        if (hitIndex !== -1) {
            this.hits++;
            const hitTarget = this.targets[hitIndex];
            
            // Record distance for this hit
            this.distanceToTarget.push({
                distance: hitDistance,
                time: Date.now(),
                hit: true
            });
            
            this.targets.splice(hitIndex, 1);
            
            // Calculate correction delay if there was an overshoot
            if (this.lastOvershootTime > 0) {
                const correctionDelay = Date.now() - this.lastOvershootTime;
                this.correctionDelays.push(correctionDelay);
                this.lastOvershootTime = 0;
            }
            
            this.spawnTarget();
            return true;
        } else {
            // Missed - check if overshoot
            const nearest = this.targets.reduce((closest, target) => {
                const dist = Math.hypot(target.x - this.reticle.x, target.y - this.reticle.y);
                return dist < closest.dist ? { dist, target } : closest;
            }, { dist: Infinity, target: null });
            
            if (nearest.target && nearest.dist < nearest.target.radius * 2) {
                // Likely overshoot - target was close
                this.overshootCount++;
                this.lastOvershootTime = Date.now();
            } else {
                this.overshootCount++;
            }
        }
        return false;
    }

    spawnTarget() {
        const margin = 50;
        let x, y, radius = this.config.targetSize;
        
        const mode = this.config.mode;
        
        if (mode === 'dynamicFlick') {
            // Spawn far from current reticle position
            const angle = Math.random() * Math.PI * 2;
            const distance = this.modeState.minDistance + 
                Math.random() * (this.modeState.maxDistance - this.modeState.minDistance);
            x = this.reticle.x + Math.cos(angle) * distance;
            y = this.reticle.y + Math.sin(angle) * distance;
            
            // Clamp to screen
            x = Math.max(margin, Math.min(this.width - margin, x));
            y = Math.max(margin, Math.min(this.height - margin, y));
        } else if (mode === 'microAdjust') {
            // Spawn close to reticle
            radius = this.modeState.targetSize;
            const maxDist = this.modeState.maxDistance;
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * (maxDist - 50);
            x = this.reticle.x + Math.cos(angle) * distance;
            y = this.reticle.y + Math.sin(angle) * distance;
            
            x = Math.max(margin, Math.min(this.width - margin, x));
            y = Math.max(margin, Math.min(this.height - margin, y));
        } else if (mode === 'tracking') {
            // Spawn at edge, moving inward
            const side = Math.floor(Math.random() * 4);
            const speed = this.modeState.targetSpeed;
            
            if (side === 0) { // Top
                x = margin + Math.random() * (this.width - margin * 2);
                y = margin;
                this.modeState.direction = { x: (Math.random() - 0.5) * speed, y: speed };
            } else if (side === 1) { // Right
                x = this.width - margin;
                y = margin + Math.random() * (this.height - margin * 2);
                this.modeState.direction = { x: -speed, y: (Math.random() - 0.5) * speed };
            } else if (side === 2) { // Bottom
                x = margin + Math.random() * (this.width - margin * 2);
                y = this.height - margin;
                this.modeState.direction = { x: (Math.random() - 0.5) * speed, y: -speed };
            } else { // Left
                x = margin;
                y = margin + Math.random() * (this.height - margin * 2);
                this.modeState.direction = { x: speed, y: (Math.random() - 0.5) * speed };
            }
        } else {
            // Static mode - random position
            x = margin + Math.random() * (this.width - margin * 2);
            y = margin + Math.random() * (this.height - margin * 2);
        }

        const target = {
            x,
            y,
            radius,
            spawnTime: Date.now(),
            tracking: mode === 'tracking',
            velocityX: mode === 'tracking' ? this.modeState.direction.x : 0,
            velocityY: mode === 'tracking' ? this.modeState.direction.y : 0,
            curve: mode === 'tracking' && Math.random() > 0.5
        };
        
        this.targets.push(target);
        this.lastSpawnTime = Date.now();
        this.hasMovedSinceSpawn = false;
    }

    getCurrentMetrics() {
        const accuracy = this.shots > 0 ? (this.hits / this.shots) * 100 : 0;
        const overshootRate = this.shots > 0 ? (this.overshootCount / this.shots) * 100 : 0;
        
        return {
            accuracy,
            reactionTime: this.currentReactionTime,
            overshootRate,
            stabilityScore: this.stabilityScore,
            currentSensitivity: this.currentSensitivity,
            correctionDelay: this.correctionDelays.length > 0
                ? this.correctionDelays[this.correctionDelays.length - 1]
                : 0
        };
    }
}
