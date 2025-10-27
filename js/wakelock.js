// Wake Lock Manager
// Keeps the device awake during timer operation
// Uses Screen Wake Lock API for Android and silent audio loop for iOS

class WakeLockManager {
    constructor() {
        this.wakeLock = null;
        this.silentAudio = null;
        this.isActive = false;
        this.supportsWakeLock = 'wakeLock' in navigator;
        
        this.initializeSilentAudio();
        
        console.log('WakeLockManager initialized. Wake Lock API support:', this.supportsWakeLock);
    }
    
    // Initialize silent audio for iOS fallback
    initializeSilentAudio() {
        try {
            // Create a tiny silent audio using data URL (0.5 second silence)
            // This is a very small MP3 file encoded as base64
            const silentAudioData = 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAABhTEFNRTMuMTAwAZYAAAAAAAAAABQ4JAMGQgAAOAAAKnGL93WUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EMQpg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
            
            this.silentAudio = new Audio(silentAudioData);
            this.silentAudio.loop = true;
            
            // Set very low volume to be completely inaudible
            this.silentAudio.volume = 0.01;
            
            // Preload the audio
            this.silentAudio.load();
            
            console.log('Silent audio initialized for iOS wake lock');
        } catch (error) {
            console.warn('Failed to initialize silent audio:', error);
        }
    }
    
    // Request wake lock
    async request() {
        if (this.isActive) {
            console.log('Wake lock already active');
            return;
        }
        
        // Try Screen Wake Lock API first (works on Android Chrome, new browsers)
        if (this.supportsWakeLock) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                this.isActive = true;
                
                console.log('Screen Wake Lock acquired');
                
                // Listen for wake lock release
                this.wakeLock.addEventListener('release', () => {
                    console.log('Screen Wake Lock released');
                    this.wakeLock = null;
                });
                
                return;
            } catch (error) {
                console.warn('Failed to acquire Screen Wake Lock:', error);
                // Fall through to silent audio fallback
            }
        }
        
        // Fallback to silent audio (works on iOS)
        if (this.silentAudio) {
            try {
                await this.silentAudio.play();
                this.isActive = true;
                console.log('Silent audio wake lock activated (iOS fallback)');
            } catch (error) {
                console.warn('Failed to play silent audio:', error);
            }
        }
    }
    
    // Release wake lock
    async release() {
        if (!this.isActive) {
            console.log('Wake lock not active');
            return;
        }
        
        // Release Screen Wake Lock
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                console.log('Screen Wake Lock released');
            } catch (error) {
                console.warn('Failed to release Screen Wake Lock:', error);
            }
        }
        
        // Stop silent audio
        if (this.silentAudio) {
            try {
                this.silentAudio.pause();
                this.silentAudio.currentTime = 0;
                console.log('Silent audio wake lock deactivated');
            } catch (error) {
                console.warn('Failed to stop silent audio:', error);
            }
        }
        
        this.isActive = false;
    }
    
    // Re-request wake lock (useful after visibility change)
    async reacquire() {
        if (this.isActive) {
            await this.release();
            await this.request();
        }
    }
    
    // Check if wake lock is active
    isWakeLockActive() {
        return this.isActive;
    }
}

