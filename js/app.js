// Main Application Class
class TabataApp {
    constructor() {
        this.timer = null;
        this.settings = null;
        this.settingsUI = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        // Initialize theme first
        ThemeManager.initializeTheme();
        
        // Load settings
        this.settings = SettingsManager.loadSettings();
        
        // Initialize timer with settings
        this.timer = new TabataTimer(this.settings);
        
        // Initialize settings UI
        this.settingsUI = new SettingsUI();
        
        // Bind events
        this.bindEvents();
        
        // Initialize display
        this.updateDisplay();
        this.updateLastWorkoutDisplay();
        this.displayRandomQuote();
        
        this.isInitialized = true;
        
        console.log('Tabata Timer App initialized');
    }
    
    bindEvents() {
        // Timer control buttons
        $('#start-btn').on('click', () => {
            this.handleStartPause();
        });
        
        $('#pause-btn').on('click', () => {
            this.handleStartPause();
        });
        
        $('#reset-btn').on('click', () => {
            this.handleReset();
        });
        
        $('#prev-btn').on('click', () => {
            this.handlePrevious();
        });
        
        $('#next-btn').on('click', () => {
            this.handleNext();
        });
        
        // Timer events
        this.timer.on('onTick', (data) => {
            this.updateTimerDisplay(data);
        });
        
        this.timer.on('onPhaseChange', (data) => {
            this.handlePhaseChange(data);
        });
        
        this.timer.on('onComplete', (data) => {
            this.handleWorkoutComplete(data);
        });
        
        this.timer.on('onSound', (data) => {
            console.log('Sound played:', data.type);
        });
        
        // Settings events
        $(document).on('settings:changed', (e, data) => {
            this.handleSettingsChange(data);
        });
        
        // Keyboard shortcuts
        $(document).on('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Tab switching
        $('#timer-tab, #settings-tab').on('shown.bs.tab', (e) => {
            const activeTab = $(e.target).attr('id');
            if (activeTab === 'timer-tab') {
                this.updateDisplay();
            }
        });
        
        // Visibility change for atomic timer behavior
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.timer) {
                // Page became visible - timer state is already handled by persistence
                this.updateDisplay();
            }
        });
    }
    
    handleStartPause() {
        if (!this.timer) return;
        
        if (this.timer.state.isRunning) {
            this.timer.pause();
        } else if (this.timer.state.isPaused) {
            this.timer.resume();
        } else {
            this.timer.start();
        }
    }
    
    handleReset() {
        if (!this.timer) return;
        
        if (this.timer.state.isRunning || this.timer.state.isPaused) {
            if (confirm('Are you sure you want to reset the timer? Your current progress will be lost.')) {
                this.timer.reset();
            }
        } else {
            this.timer.reset();
        }
    }
    
    handlePrevious() {
        if (!this.timer) return;
        
        // Skip to previous phase without confirmation
        this.timer.skipToPreviousPhase();
    }
    
    handleNext() {
        if (!this.timer) return;
        
        // Skip to next phase
        this.timer.skipToNextPhase();
    }
    
    handlePhaseChange(data) {
        this.updatePhaseDisplay(data);
        this.updateControlButtons(data);
        this.updateTimerDisplay(data);
        
        console.log('Phase changed:', data.phase, data.label);
    }
    
    handleWorkoutComplete(data) {
        this.updateControlButtons({ isRunning: false, isPaused: false });
        this.updateLastWorkoutDisplay();
        
        // Show completion message
        this.showCompletionNotification(data);
        
        console.log('Workout completed:', data);
    }
    
    handleSettingsChange(data) {
        if (!this.isInitialized) return;
        
        // Update timer settings
        this.settings = this.settingsUI.getSettings();
        this.timer.updateSettings(this.settings);
        
        // Update display
        this.updateDisplay();
        
        console.log('Settings changed:', data);
    }
    
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in inputs
        if ($(e.target).is('input, textarea')) return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.handleStartPause();
                break;
            case 'KeyR':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.handleReset();
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.handlePrevious();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.handleNext();
                break;
        }
    }
    
    updateDisplay() {
        if (!this.timer) return;
        
        // Update timer display
        const timeRemaining = this.timer.state.timeRemaining || this.timer.getPhases().initial.duration * 1000;
        const formattedTime = this.timer.formatTime(timeRemaining);
        $('#timer-display').text(formattedTime);
        
        // Update info displays
        $('#sets-display').text(this.timer.state.currentSet.toString().padStart(2, '0'));
        $('#cycles-display').text(this.timer.state.currentCycle.toString().padStart(2, '0'));
        
        // Calculate and display total workout time
        const totalTime = this.timer.getTotalWorkoutTime();
        const totalFormatted = this.timer.formatTime(totalTime * 1000);
        $('#total-time-display').text(totalFormatted);
        
        // Update phase display
        this.updatePhaseDisplay({
            phase: this.timer.state.currentPhase,
            label: this.timer.state.currentPhase === 'initial' ? 'Press Play To Start' : 
                   this.timer.getPhases()[this.timer.state.currentPhase]?.label || 'Ready',
            color: this.timer.getPhases()[this.timer.state.currentPhase]?.color || 'prepare',
            isRunning: this.timer.state.isRunning
        });
        
        // Update control buttons
        this.updateControlButtons({
            isRunning: this.timer.state.isRunning,
            isPaused: this.timer.state.isPaused
        });
    }
    
    updateTimerDisplay(data) {
        const formattedTime = this.timer.formatTime(data.timeRemaining);
        $('#timer-display').text(formattedTime);
        
        // Update counters
        $('#sets-display').text(data.currentSet.toString().padStart(2, '0'));
        $('#cycles-display').text(data.currentCycle.toString().padStart(2, '0'));
        
        // Add pulse animation during active phases
        const $timerDigits = $('#timer-display');
        if (data.phase === 'exercise' || data.phase === 'rest') {
            $timerDigits.addClass('active');
        } else {
            $timerDigits.removeClass('active');
        }
    }
    
    updatePhaseDisplay(data) {
        const $phaseIndicator = $('#phase-indicator');
        
        // Update text
        $phaseIndicator.text(data.label || 'Ready');
        
        // Update color class
        $phaseIndicator.removeClass('phase-exercise phase-rest phase-prepare');
        $phaseIndicator.addClass(`phase-${data.color || 'prepare'}`);
    }
    
    updateControlButtons(data) {
        const $startBtn = $('#start-btn');
        const $pauseBtn = $('#pause-btn');
        
        if (data.isRunning) {
            // Timer is running - show pause button
            $startBtn.hide();
            $pauseBtn.show();
        } else if (data.isPaused) {
            // Timer is paused - show start button (resume)
            $startBtn.show();
            $pauseBtn.hide();
            $startBtn.find('i').removeClass('bi-play-fill').addClass('bi-play-fill');
        } else {
            // Timer is stopped - show start button
            $startBtn.show();
            $pauseBtn.hide();
            $startBtn.find('i').removeClass('bi-play-fill').addClass('bi-play-fill');
        }
    }
    
    updateLastWorkoutDisplay() {
        const daysAgo = StatisticsManager.getLastWorkoutDaysAgo();
        $('#last-workout-days').text(daysAgo);
    }
    
    displayRandomQuote() {
        const quote = QuoteManager.getRandomQuote();
        $('#quote-text').text(quote.text);
        $('#quote-author').text(quote.author);
    }
    
    showCompletionNotification(data) {
        const totalTimeFormatted = this.timer.formatTime(data.totalTime);
        
        // Create a toast notification
        const toastHtml = `
            <div class="toast" role="alert">
                <div class="toast-header">
                    <i class="bi bi-check-circle-fill text-success me-2"></i>
                    <strong class="me-auto">Workout Complete!</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    <strong>Great job!</strong><br>
                    Total time: ${totalTimeFormatted}<br>
                    Cycles completed: ${data.totalCycles}<br>
                    Sets completed: ${data.totalSets}
                </div>
            </div>
        `;
        
        $('#toast-container').append(toastHtml);
        
        const $toast = $('#toast-container .toast').last();
        const toast = new bootstrap.Toast($toast[0], { delay: 5000 });
        toast.show();
        
        // Remove toast element after it's hidden
        $toast.on('hidden.bs.toast', function() {
            $(this).remove();
        });
        
        // Display a new random quote
        this.displayRandomQuote();
    }
}

// Initialize the app when DOM is ready
$(document).ready(() => {
    window.tabataApp = new TabataApp();
}); 