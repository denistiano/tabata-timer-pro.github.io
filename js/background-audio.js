// Background Audio Manager
// Uses Media Session API to keep timer running in background on iOS
// Plays periodic audio tones that keep the audio session alive

class BackgroundAudioManager {
    constructor() {
        this.audioContext = null;
        this.audioElement = null;
        this.isPlaying = false;
        this.mediaSessionSupported = 'mediaSession' in navigator;
        this.timerInterval = null;
        this.currentPhase = 'Get Ready';
        this.timeRemaining = 0;
        
        this.initializeAudio();
        this.setupMediaSession();
        
        console.log('BackgroundAudioManager initialized. Media Session support:', this.mediaSessionSupported);
    }
    
    initializeAudio() {
        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create a silent audio element that plays continuously
        // This keeps the audio session alive on iOS
        this.audioElement = new Audio();
        
        // Use a very short silent MP3 that loops
        // This is more efficient than the data URL approach
        const silenceBase64 = 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAABhTEFNRTMuMTAwAZYAAAAAAAAAABQ4JAMGQgAAOAAAKnGL93WUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EMQpg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        
        this.audioElement.src = silenceBase64;
        this.audioElement.loop = true;
        this.audioElement.volume = 0.01; // Very low volume, almost inaudible
        
        // Preload
        this.audioElement.load();
    }
    
    setupMediaSession() {
        if (!this.mediaSessionSupported) {
            console.log('Media Session API not supported');
            return;
        }
        
        // Set metadata for lock screen display
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Tabata Timer',
            artist: 'Workout in Progress',
            album: 'Get Ready',
            artwork: [
                { src: '/favicon.png', sizes: '192x192', type: 'image/png' }
            ]
        });
        
        // Set up action handlers for media controls
        navigator.mediaSession.setActionHandler('play', () => {
            console.log('Media Session: play');
            // This will be handled by the main app
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            console.log('Media Session: pause');
            // This will be handled by the main app
        });
        
        // Optional: handle seek/skip if needed
        try {
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                console.log('Media Session: previous');
                // Trigger previous phase
                document.dispatchEvent(new CustomEvent('media-session-previous'));
            });
            
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                console.log('Media Session: next');
                // Trigger next phase
                document.dispatchEvent(new CustomEvent('media-session-next'));
            });
        } catch (error) {
            console.log('Skip controls not supported:', error);
        }
    }
    
    // Start background audio to keep session alive
    async start() {
        if (this.isPlaying) {
            console.log('Background audio already playing');
            return;
        }
        
        try {
            // Resume audio context if suspended
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Play the silent audio loop
            await this.audioElement.play();
            
            this.isPlaying = true;
            
            // Update media session playback state
            if (this.mediaSessionSupported) {
                navigator.mediaSession.playbackState = 'playing';
            }
            
            // Start periodic beeps to ensure audio session stays alive
            this.startPeriodicBeeps();
            
            console.log('Background audio started');
        } catch (error) {
            console.error('Failed to start background audio:', error);
        }
    }
    
    // Stop background audio
    stop() {
        if (!this.isPlaying) {
            return;
        }
        
        try {
            // Stop the silent audio
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            
            this.isPlaying = false;
            
            // Stop periodic beeps
            this.stopPeriodicBeeps();
            
            // Update media session playback state
            if (this.mediaSessionSupported) {
                navigator.mediaSession.playbackState = 'paused';
            }
            
            console.log('Background audio stopped');
        } catch (error) {
            console.error('Failed to stop background audio:', error);
        }
    }
    
    // Play periodic beeps to keep audio session alive (every 10 seconds)
    startPeriodicBeeps() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Play a very short, quiet beep every 10 seconds
        // This ensures iOS doesn't suspend the audio session
        this.timerInterval = setInterval(() => {
            this.playQuietBeep();
        }, 10000); // Every 10 seconds
    }
    
    stopPeriodicBeeps() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // Play a very short, quiet beep
    playQuietBeep() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Very low frequency and very quiet
            oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.005, this.audioContext.currentTime); // Very quiet (0.5%)
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05); // Very short - 50ms
        } catch (error) {
            console.warn('Failed to play quiet beep:', error);
        }
    }
    
    // Update media session metadata with current timer state
    updateMetadata(phase, timeRemaining) {
        if (!this.mediaSessionSupported) return;
        
        this.currentPhase = phase;
        this.timeRemaining = timeRemaining;
        
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `${phase} - ${timeStr}`,
                artist: 'Tabata Timer',
                album: 'Workout in Progress',
                artwork: [
                    { src: '/favicon.png', sizes: '192x192', type: 'image/png' }
                ]
            });
        } catch (error) {
            console.warn('Failed to update media session metadata:', error);
        }
    }
    
    // Update position state for seeking (if supported)
    updatePositionState(duration, position) {
        if (!this.mediaSessionSupported) return;
        
        try {
            if ('setPositionState' in navigator.mediaSession) {
                navigator.mediaSession.setPositionState({
                    duration: duration / 1000, // Convert to seconds
                    playbackRate: 1,
                    position: position / 1000 // Convert to seconds
                });
            }
        } catch (error) {
            // Position state not supported, ignore
        }
    }
    
    // Check if currently playing
    isActive() {
        return this.isPlaying;
    }
}

