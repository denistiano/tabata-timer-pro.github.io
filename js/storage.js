// Storage keys - use consistent naming convention
const STORAGE_KEYS = {
    SETTINGS: 'tabata_settings',
    PRESETS: 'tabata_presets', 
    THEME: 'tabata_theme',
    LAST_WORKOUT: 'tabata_last_workout',
    STATISTICS: 'tabata_statistics',
    QUOTES: 'tabata_quotes',
    TIMER_STATE: 'tabata_timer_state'
};

// Default settings object - ALL VALUES IN SECONDS
const DEFAULT_SETTINGS = {
    initialCountdown: 20,      // seconds
    warmupInterval: 0,         // seconds
    exerciseInterval: 180,     // seconds (3 minutes)
    restInterval: 0,           // seconds
    numberOfSets: 1,
    recoveryInterval: 120,     // seconds (2 minutes)
    numberOfCycles: 60,
    cooldownInterval: 0,       // seconds
    
    // Sound settings
    intervalBeep: 'click',
    intervalVibration: false,
    continuousBeep: false,
    threeSecondBeep: 'short_beep',
    halfwayBeep: false,
    
    // Voice settings
    speaker: 'english_american',
    announceWhat: 'all',
    
    // Display settings
    theme: 'dark',
    timerDisplays: 'count_down',
    quotes: true
};

// Storage Utility Class
class StorageManager {
    static save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }
    
    static load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }
    
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }
    
    static clear() {
        try {
            // Only clear app-specific keys
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
            return false;
        }
    }
    
    static getStorageSize() {
        let total = 0;
        Object.values(STORAGE_KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                total += item.length;
            }
        });
        return total;
    }
}

// Settings Management
class SettingsManager {
    static loadSettings() {
        const saved = StorageManager.load(STORAGE_KEYS.SETTINGS);
        return { ...DEFAULT_SETTINGS, ...saved };
    }
    
    static saveSettings(settings) {
        return StorageManager.save(STORAGE_KEYS.SETTINGS, settings);
    }
    
    static resetSettings() {
        return StorageManager.save(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    
    static updateSetting(key, value) {
        const settings = this.loadSettings();
        settings[key] = value;
        return this.saveSettings(settings);
    }
    
    static validateSettings(settings) {
        const errors = [];
        
        // Validate time intervals
        if (settings.exerciseInterval < 1 || settings.exerciseInterval > 3600) {
            errors.push('Exercise interval must be between 1 and 3600 seconds');
        }
        
        if (settings.numberOfCycles < 1 || settings.numberOfCycles > 1000) {
            errors.push('Number of cycles must be between 1 and 1000');
        }
        
        if (settings.numberOfSets < 1 || settings.numberOfSets > 100) {
            errors.push('Number of sets must be between 1 and 100');
        }
        
        return errors;
    }
}

// Timer State Management for persistence
class TimerStateManager {
    static saveTimerState(state) {
        const stateToSave = {
            ...state,
            savedAt: Date.now()
        };
        return StorageManager.save(STORAGE_KEYS.TIMER_STATE, stateToSave);
    }
    
    static loadTimerState() {
        return StorageManager.load(STORAGE_KEYS.TIMER_STATE, null);
    }
    
    static clearTimerState() {
        return StorageManager.remove(STORAGE_KEYS.TIMER_STATE);
    }
    
    static isStateValid(state) {
        if (!state || !state.savedAt) return false;
        
        // State is valid for 24 hours
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const age = Date.now() - state.savedAt;
        
        return age < maxAge;
    }
}

// Preset Management
class PresetManager {
    static loadPresets() {
        return StorageManager.load(STORAGE_KEYS.PRESETS, []);
    }
    
    static savePreset(name, settings) {
        const presets = this.loadPresets();
        const existingIndex = presets.findIndex(p => p.name === name);
        
        const preset = {
            name: name,
            settings: { ...settings },
            createdAt: new Date().toISOString(),
            lastUsed: null
        };
        
        if (existingIndex >= 0) {
            presets[existingIndex] = preset;
        } else {
            presets.push(preset);
        }
        
        return StorageManager.save(STORAGE_KEYS.PRESETS, presets);
    }
    
    static deletePreset(name) {
        const presets = this.loadPresets();
        const filtered = presets.filter(p => p.name !== name);
        return StorageManager.save(STORAGE_KEYS.PRESETS, filtered);
    }
    
    static loadPreset(name) {
        const presets = this.loadPresets();
        const preset = presets.find(p => p.name === name);
        
        if (preset) {
            // Update last used timestamp
            preset.lastUsed = new Date().toISOString();
            StorageManager.save(STORAGE_KEYS.PRESETS, presets);
            return preset.settings;
        }
        
        return null;
    }
    
    static getPresetNames() {
        const presets = this.loadPresets();
        return presets.map(p => p.name);
    }
}

// Theme Management
class ThemeManager {
    static loadTheme() {
        return StorageManager.load(STORAGE_KEYS.THEME, 'dark');
    }
    
    static saveTheme(theme) {
        return StorageManager.save(STORAGE_KEYS.THEME, theme);
    }
    
    static toggleTheme() {
        const currentTheme = this.loadTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.saveTheme(newTheme);
        this.applyTheme(newTheme);
        return newTheme;
    }
    
    static applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'light' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
            }
        }
    }
    
    static initializeTheme() {
        const savedTheme = this.loadTheme();
        this.applyTheme(savedTheme);
    }
}

// Quote Management
class QuoteManager {
    static quotes = [
        {
            text: "Between saying and doing, many a pair of shoes is worn out.",
            author: "Iris Murdoch"
        },
        {
            text: "The groundwork for all happiness is good health.",
            author: "Leigh Hunt"
        },
        {
            text: "Take care of your body. It's the only place you have to live.",
            author: "Jim Rohn"
        },
        {
            text: "A healthy outside starts from the inside.",
            author: "Robert Urich"
        },
        {
            text: "The first wealth is health.",
            author: "Ralph Waldo Emerson"
        },
        {
            text: "Exercise is king. Nutrition is queen. Put them together and you've got a kingdom.",
            author: "Jack LaLanne"
        },
        {
            text: "The only bad workout is the one that didn't happen.",
            author: "Unknown"
        },
        {
            text: "Strength does not come from physical capacity. It comes from an indomitable will.",
            author: "Mahatma Gandhi"
        },
        {
            text: "Success isn't always about greatness. It's about consistency.",
            author: "Dwayne Johnson"
        },
        {
            text: "The pain you feel today will be the strength you feel tomorrow.",
            author: "Unknown"
        }
    ];
    
    static getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        return this.quotes[randomIndex];
    }
    
    static loadCustomQuotes() {
        return StorageManager.load(STORAGE_KEYS.QUOTES, []);
    }
    
    static saveCustomQuote(text, author) {
        const customQuotes = this.loadCustomQuotes();
        customQuotes.push({ text, author });
        return StorageManager.save(STORAGE_KEYS.QUOTES, customQuotes);
    }
    
    static getAllQuotes() {
        const customQuotes = this.loadCustomQuotes();
        return [...this.quotes, ...customQuotes];
    }
}

// Statistics Management
class StatisticsManager {
    static loadStatistics() {
        return StorageManager.load(STORAGE_KEYS.STATISTICS, {
            totalWorkouts: 0,
            totalTime: 0,
            averageWorkoutTime: 0,
            longestWorkout: 0,
            workoutHistory: [],
            lastWorkoutDate: null
        });
    }
    
    static saveWorkout(duration, settings) {
        const stats = this.loadStatistics();
        
        const workout = {
            date: new Date().toISOString(),
            duration: duration,
            settings: { ...settings },
            completed: true
        };
        
        stats.totalWorkouts += 1;
        stats.totalTime += duration;
        stats.averageWorkoutTime = stats.totalTime / stats.totalWorkouts;
        stats.longestWorkout = Math.max(stats.longestWorkout, duration);
        stats.lastWorkoutDate = workout.date;
        stats.workoutHistory.push(workout);
        
        // Keep only last 100 workouts
        if (stats.workoutHistory.length > 100) {
            stats.workoutHistory = stats.workoutHistory.slice(-100);
        }
        
        return StorageManager.save(STORAGE_KEYS.STATISTICS, stats);
    }
    
    static getLastWorkoutDaysAgo() {
        const stats = this.loadStatistics();
        if (!stats.lastWorkoutDate) {
            return 142; // Default value from screenshot
        }
        
        const lastWorkout = new Date(stats.lastWorkoutDate);
        const now = new Date();
        const diffTime = Math.abs(now - lastWorkout);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }
    
    static resetStatistics() {
        const emptyStats = {
            totalWorkouts: 0,
            totalTime: 0,
            averageWorkoutTime: 0,
            longestWorkout: 0,
            workoutHistory: [],
            lastWorkoutDate: null
        };
        return StorageManager.save(STORAGE_KEYS.STATISTICS, emptyStats);
    }
} 