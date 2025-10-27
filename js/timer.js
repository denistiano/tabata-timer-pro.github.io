// Timer State Management
class TabataTimer {
    constructor(settings) {
        this.settings = settings;
        this.state = {
            isRunning: false,
            isPaused: false,
            isStopped: false,
            currentPhase: 'initial',  // initial, warmup, exercise, rest, recovery, cooldown, complete
            timeRemaining: 0,
            currentCycle: 1,
            currentSet: 1,
            totalElapsed: 0,
            startTime: null,
            phaseStartTime: null,
            pausedTime: 0
        };
        
        this.intervalId = null;
        this.callbacks = {
            onTick: [],
            onPhaseChange: [],
            onComplete: [],
            onSound: []
        };
        
        this.audioContext = null;
        this.exerciseBeepAudio = null;
        this.initializeAudio();
        
        // Initialize wake lock manager
        this.wakeLockManager = new WakeLockManager();
        
        // Load persisted state if available
        this.loadPersistedState();
    }
    
    // Initialize Web Audio API and load beep.mp3
    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Load the beep.mp3 file
            try {
                const response = await fetch('sounds/beep.mp3');
                const arrayBuffer = await response.arrayBuffer();
                this.exerciseBeepAudio = await this.audioContext.decodeAudioData(arrayBuffer);
            } catch (error) {
                console.warn('Failed to load beep.mp3:', error);
            }
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }
    
    // Load persisted timer state for atomic behavior
    loadPersistedState() {
        const persistedState = TimerStateManager.loadTimerState();
        
        if (persistedState && TimerStateManager.isStateValid(persistedState)) {
            // Calculate how much time has passed since the state was saved
            const timePassed = Date.now() - persistedState.savedAt;
            
            // Only restore if timer was running
            if (persistedState.isRunning && !persistedState.isPaused) {
                this.state = { ...persistedState };
                this.state.timeRemaining = Math.max(0, persistedState.timeRemaining - timePassed);
                this.state.totalElapsed = persistedState.totalElapsed + timePassed;
                
                // If time has run out, advance phases
                while (this.state.timeRemaining <= 0 && this.state.currentPhase !== 'complete') {
                    this.nextPhase();
                }
                
                // Resume timer if still running
                if (this.state.currentPhase !== 'complete') {
                    this.start();
                }
            }
        }
    }
    
    // Save timer state for persistence
    saveState() {
        if (this.state.isRunning || this.state.isPaused) {
            TimerStateManager.saveTimerState(this.state);
        }
    }
    
    // Event system
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    emit(event, data = null) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }
    
    // Phase definitions
    getPhases() {
        return {
            initial: {
                duration: this.settings.initialCountdown,
                color: 'prepare',
                label: 'Get Ready',
                next: this.settings.warmupInterval > 0 ? 'warmup' : 'exercise'
            },
            warmup: {
                duration: this.settings.warmupInterval,
                color: 'prepare',
                label: 'Warm Up',
                next: 'exercise'
            },
            exercise: {
                duration: this.settings.exerciseInterval,
                color: 'exercise',
                label: 'Exercise',
                next: this.settings.restInterval > 0 ? 'rest' : this.getNextAfterExercise()
            },
            rest: {
                duration: this.settings.restInterval,
                color: 'rest',
                label: 'Rest',
                next: this.getNextAfterRest()
            },
            recovery: {
                duration: this.settings.recoveryInterval,
                color: 'rest',
                label: 'Recovery',
                next: this.shouldMoveToNextCycle() ? 'exercise' : 'cooldown'
            },
            cooldown: {
                duration: this.settings.cooldownInterval,
                color: 'prepare',
                label: 'Cool Down',
                next: 'complete'
            }
        };
    }
    
    getNextAfterExercise() {
        if (this.shouldMoveToRecovery()) {
            return 'recovery';
        } else if (this.shouldMoveToNextCycle()) {
            return 'exercise';
        } else {
            return this.settings.cooldownInterval > 0 ? 'cooldown' : 'complete';
        }
    }
    
    getNextAfterRest() {
        if (this.state.currentSet < this.settings.numberOfSets) {
            return 'exercise';
        } else if (this.shouldMoveToRecovery()) {
            return 'recovery';
        } else if (this.shouldMoveToNextCycle()) {
            return 'exercise';
        } else {
            return this.settings.cooldownInterval > 0 ? 'cooldown' : 'complete';
        }
    }
    
    shouldMoveToRecovery() {
        return this.state.currentSet >= this.settings.numberOfSets && 
               this.settings.recoveryInterval > 0 &&
               this.state.currentCycle < this.settings.numberOfCycles;
    }
    
    shouldMoveToNextCycle() {
        return this.state.currentCycle < this.settings.numberOfCycles;
    }
    
    // Core Timer Methods
    start() {
        if (this.state.isRunning) return;
        
        // Resume audio context if needed
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Request wake lock to keep device awake
        this.wakeLockManager.request();
        
        this.state.isRunning = true;
        this.state.isPaused = false;
        this.state.isStopped = false;
        
        if (!this.state.startTime) {
            this.state.startTime = Date.now();
        }
        
        // Initialize first phase if not already set
        if (this.state.currentPhase === 'initial' && this.state.timeRemaining === 0) {
            this.initializePhase('initial');
        }
        
        // Start the timer loop
        this.intervalId = setInterval(() => {
            this.tick();
        }, 100); // Update every 100ms for smooth display
        
        this.saveState();
        
        this.emit('onPhaseChange', {
            phase: this.state.currentPhase,
            timeRemaining: this.state.timeRemaining,
            isRunning: true
        });
    }
    
    pause() {
        if (!this.state.isRunning) return;
        
        // Release wake lock when paused
        this.wakeLockManager.release();
        
        this.state.isPaused = true;
        this.state.isRunning = false;
        this.state.pausedTime = Date.now();
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.saveState();
        
        this.emit('onPhaseChange', {
            phase: this.state.currentPhase,
            timeRemaining: this.state.timeRemaining,
            isRunning: false,
            isPaused: true
        });
    }
    
    resume() {
        if (!this.state.isPaused) return;
        
        // Request wake lock when resuming
        this.wakeLockManager.request();
        
        this.state.isRunning = true;
        this.state.isPaused = false;
        
        // Adjust start time to account for pause duration
        if (this.state.pausedTime && this.state.startTime) {
            const pauseDuration = Date.now() - this.state.pausedTime;
            this.state.startTime += pauseDuration;
        }
        
        this.intervalId = setInterval(() => {
            this.tick();
        }, 100);
        
        this.saveState();
        
        this.emit('onPhaseChange', {
            phase: this.state.currentPhase,
            timeRemaining: this.state.timeRemaining,
            isRunning: true,
            isPaused: false
        });
    }
    
    stop() {
        // Release wake lock when stopped
        this.wakeLockManager.release();
        
        this.state.isRunning = false;
        this.state.isPaused = false;
        this.state.isStopped = true;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        TimerStateManager.clearTimerState();
        
        this.emit('onPhaseChange', {
            phase: this.state.currentPhase,
            timeRemaining: this.state.timeRemaining,
            isRunning: false,
            isPaused: false,
            isStopped: true
        });
    }
    
    reset() {
        this.state = {
            isRunning: false,
            isPaused: false,
            isStopped: false,
            currentPhase: 'initial',
            timeRemaining: 0,
            currentCycle: 1,
            currentSet: 1,
            totalElapsed: 0,
            startTime: null,
            phaseStartTime: null,
            pausedTime: 0
        };
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        TimerStateManager.clearTimerState();
        this.initializePhase('initial');
        
        this.emit('onPhaseChange', {
            phase: this.state.currentPhase,
            timeRemaining: this.state.timeRemaining,
            isRunning: false,
            reset: true
        });
    }
    
    // Skip to previous phase
    skipToPreviousPhase() {
        const phases = this.getPhases();
        const phaseOrder = ['initial', 'warmup', 'exercise', 'rest', 'recovery', 'cooldown'];
        
        let targetPhase = 'initial';
        
        // Find previous phase based on current state
        switch (this.state.currentPhase) {
            case 'warmup':
                targetPhase = 'initial';
                break;
            case 'exercise':
                if (this.settings.warmupInterval > 0) {
                    targetPhase = 'warmup';
                } else {
                    targetPhase = 'initial';
                }
                break;
            case 'rest':
                targetPhase = 'exercise';
                break;
            case 'recovery':
                if (this.settings.restInterval > 0) {
                    targetPhase = 'rest';
                } else {
                    targetPhase = 'exercise';
                }
                break;
            case 'cooldown':
                if (this.settings.recoveryInterval > 0) {
                    targetPhase = 'recovery';
                } else if (this.settings.restInterval > 0) {
                    targetPhase = 'rest';
                } else {
                    targetPhase = 'exercise';
                }
                break;
            default:
                targetPhase = 'initial';
        }
        
        // Update counters if going back
        if (this.state.currentPhase === 'exercise' && this.state.currentSet > 1) {
            this.state.currentSet--;
        } else if (this.state.currentPhase === 'exercise' && this.state.currentCycle > 1) {
            this.state.currentCycle--;
            this.state.currentSet = this.settings.numberOfSets;
        }
        
        this.initializePhase(targetPhase);
        this.saveState();
    }
    
    // Skip to next phase
    skipToNextPhase() {
        this.nextPhase();
        this.saveState();
    }
    
    // Timer Logic and Phase Transitions
    tick() {
        const now = Date.now();
        
        // Update time remaining
        this.state.timeRemaining -= 100;
        this.state.totalElapsed = now - this.state.startTime;
        
        // Save state periodically for atomic behavior
        this.saveState();
        
        // Check for sound cues
        this.checkSoundCues();
        
        // Check phase transition
        if (this.state.timeRemaining <= 0) {
            this.nextPhase();
        } else {
            // Emit tick event
            this.emit('onTick', {
                timeRemaining: this.state.timeRemaining,
                phase: this.state.currentPhase,
                currentSet: this.state.currentSet,
                currentCycle: this.state.currentCycle,
                totalElapsed: this.state.totalElapsed,
                progress: this.getProgress()
            });
        }
    }
    
    nextPhase() {
        const phases = this.getPhases();
        const currentPhase = phases[this.state.currentPhase];
        
        if (!currentPhase) {
            this.complete();
            return;
        }
        
        const nextPhaseName = currentPhase.next;
        
        // Update counters based on phase transition
        this.updateCounters(nextPhaseName);
        
        if (nextPhaseName === 'complete') {
            this.complete();
        } else {
            this.initializePhase(nextPhaseName);
        }
    }
    
    updateCounters(nextPhase) {
        // Update set counter
        if (this.state.currentPhase === 'rest' && nextPhase === 'exercise') {
            this.state.currentSet++;
        }
        
        // Reset set counter and update cycle counter
        if (this.state.currentPhase === 'recovery' && nextPhase === 'exercise') {
            this.state.currentSet = 1;
            this.state.currentCycle++;
        }
        
        // Handle direct exercise to exercise transition (no rest)
        if (this.state.currentPhase === 'exercise' && nextPhase === 'exercise') {
            if (this.state.currentSet < this.settings.numberOfSets) {
                this.state.currentSet++;
            } else {
                this.state.currentSet = 1;
                this.state.currentCycle++;
            }
        }
    }
    
    initializePhase(phaseName) {
        const phases = this.getPhases();
        const phase = phases[phaseName];
        
        if (!phase) {
            console.error('Invalid phase:', phaseName);
            return;
        }
        
        this.state.currentPhase = phaseName;
        this.state.timeRemaining = phase.duration * 1000; // Convert to milliseconds
        this.state.phaseStartTime = Date.now();
        
        // Play exercise beep sound ONLY at the beginning of exercise rounds
        if (phaseName === 'exercise') {
            this.playExerciseBeep();
        }
        
        // Play phase transition sound (existing beeps)
        this.playSound('phase_change');
        
        this.emit('onPhaseChange', {
            phase: phaseName,
            timeRemaining: this.state.timeRemaining,
            currentSet: this.state.currentSet,
            currentCycle: this.state.currentCycle,
            label: phase.label,
            color: phase.color,
            isRunning: this.state.isRunning
        });
    }
    
    complete() {
        // Release wake lock when workout completes
        this.wakeLockManager.release();
        
        this.state.isRunning = false;
        this.state.currentPhase = 'complete';
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        TimerStateManager.clearTimerState();
        
        // Save workout statistics
        StatisticsManager.saveWorkout(this.state.totalElapsed, this.settings);
        
        this.playSound('workout_complete');
        
        this.emit('onComplete', {
            totalTime: this.state.totalElapsed,
            totalCycles: this.state.currentCycle,
            totalSets: this.state.currentSet
        });
    }
    
    checkSoundCues() {
        const remaining = Math.ceil(this.state.timeRemaining / 1000);
        
        // 3-second countdown beep
        if (remaining === 3 || remaining === 2 || remaining === 1) {
            this.playSound('countdown');
        }
        
        // Halfway beep
        const phases = this.getPhases();
        const currentPhase = phases[this.state.currentPhase];
        if (currentPhase && this.settings.halfwayBeep) {
            const halfwayPoint = (currentPhase.duration * 1000) / 2;
            const elapsed = (currentPhase.duration * 1000) - this.state.timeRemaining;
            if (Math.abs(elapsed - halfwayPoint) < 100) {
                this.playSound('halfway');
            }
        }
    }
    
    // Play the beep.mp3 file for exercise rounds
    playExerciseBeep() {
        if (!this.audioContext || !this.exerciseBeepAudio) return;
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.exerciseBeepAudio;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime); // 30% volume
            source.start(this.audioContext.currentTime);
            
            this.emit('onSound', { type: 'exercise_beep' });
        } catch (error) {
            console.warn('Failed to play exercise beep:', error);
        }
    }
    
    playSound(type) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Different frequencies for different sound types
            switch (type) {
                case 'countdown':
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    break;
                case 'phase_change':
                    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
                    break;
                case 'halfway':
                    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                    break;
                case 'workout_complete':
                    oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime);
                    break;
                default:
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            }
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
            
            this.emit('onSound', { type });
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }
    
    getProgress() {
        const phases = this.getPhases();
        const currentPhase = phases[this.state.currentPhase];
        
        if (!currentPhase || currentPhase.duration === 0) {
            return 0;
        }
        
        const elapsed = (currentPhase.duration * 1000) - this.state.timeRemaining;
        return Math.min(100, Math.max(0, (elapsed / (currentPhase.duration * 1000)) * 100));
    }
    
    getTotalWorkoutTime() {
        let total = 0;
        
        total += this.settings.initialCountdown;
        total += this.settings.warmupInterval;
        total += this.settings.exerciseInterval * this.settings.numberOfSets * this.settings.numberOfCycles;
        total += this.settings.restInterval * (this.settings.numberOfSets - 1) * this.settings.numberOfCycles;
        total += this.settings.recoveryInterval * (this.settings.numberOfCycles - 1);
        total += this.settings.cooldownInterval;
        
        return total;
    }
    
    formatTime(milliseconds) {
        const totalSeconds = Math.ceil(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // If timer is not running, reset to apply new settings
        if (!this.state.isRunning && !this.state.isPaused) {
            this.reset();
        }
    }
} 