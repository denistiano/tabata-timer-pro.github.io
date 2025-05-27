# Tabata Timer

A minimalist single-page web application for Tabata/interval training. Built with vanilla JavaScript, jQuery, and Bootstrap 5.

## Features

### Timer Functionality
- **Customizable Intervals**: Set initial countdown, warmup, exercise, rest, recovery, and cooldown periods
- **Multiple Sets & Cycles**: Configure number of sets per cycle and total cycles
- **Phase Transitions**: Smooth transitions between different workout phases
- **Audio Notifications**: Built-in beep sounds for phase changes and countdown
- **Visual Feedback**: Color-coded phase indicators and smooth animations

### Settings Management
- **Real-time Saving**: Settings automatically save to localStorage
- **Preset System**: Save and load custom workout configurations
- **Input Validation**: Ensures all values are within valid ranges
- **Reset to Defaults**: Quick reset to original settings

### User Interface
- **Minimalist Design**: Clean, distraction-free interface
- **Dark/Light Theme**: Toggle between themes with smooth transitions
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Keyboard Shortcuts**: Space to start/pause, Ctrl+R to reset, etc.
- **Motivational Quotes**: Random fitness quotes to keep you motivated

### Data Persistence
- **LocalStorage**: All settings and preferences saved locally
- **Statistics Tracking**: Track workout history and statistics
- **Preset Management**: Save unlimited custom workout presets
- **Theme Persistence**: Remember your preferred theme

## Usage

### Basic Operation
1. **Start Timer**: Click the "Start" button or press Space
2. **Pause/Resume**: Click "Pause" or press Space while running
3. **Stop**: Click "Stop" to end the workout
4. **Reset**: Click "Reset" to return to initial state

### Keyboard Shortcuts
- **Space**: Start/Pause/Resume timer
- **Ctrl+R**: Reset timer
- **Ctrl+S**: Stop timer
- **Ctrl+T**: Toggle theme

### Settings Configuration
1. Navigate to the **Settings** tab
2. Adjust time intervals for each phase:
   - **Initial Countdown**: Preparation time before workout starts
   - **Warmup Interval**: Optional warmup period
   - **Exercise Interval**: Main workout time (required)
   - **Rest Interval**: Rest between sets
   - **Number of Sets**: Sets per cycle
   - **Recovery Interval**: Rest between cycles
   - **Number of Cycles**: Total workout cycles
   - **Cooldown Interval**: Optional cooldown period

3. Settings are automatically saved as you type

### Preset Management
- **Save Preset**: Save current settings with a custom name
- **Load Preset**: Restore previously saved settings
- **Arrange Presets**: Delete unwanted presets

## Technical Details

### Architecture
- **Single Page Application**: No page reloads, smooth navigation
- **Modular Design**: Separate classes for Timer, Settings, Storage, etc.
- **Event-Driven**: Loose coupling between components via events
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Web Audio API**: For sound notifications
- **LocalStorage**: For data persistence
- **CSS Custom Properties**: For theme switching

### File Structure
```
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Custom styles and themes
├── js/
│   ├── app.js         # Main application logic
│   ├── timer.js       # Timer functionality
│   ├── settings.js    # Settings management
│   └── storage.js     # LocalStorage utilities
└── sounds/            # Audio files (optional)
```

## Default Settings

- **Initial Countdown**: 20 seconds
- **Warmup Interval**: 0 seconds (disabled)
- **Exercise Interval**: 180 seconds (3 minutes)
- **Rest Interval**: 0 seconds (disabled)
- **Number of Sets**: 1
- **Recovery Interval**: 120 seconds (2 minutes)
- **Number of Cycles**: 60
- **Cooldown Interval**: 0 seconds (disabled)

This creates a simple 60-cycle workout with 3-minute exercise periods and 2-minute recovery between cycles.

## Customization

### Adding Custom Quotes
Edit the `QuoteManager.quotes` array in `js/storage.js` to add your own motivational quotes.

### Modifying Themes
Customize colors by editing the CSS custom properties in `css/styles.css`:
- `--exercise-color`: Color for exercise phases
- `--rest-color`: Color for rest/recovery phases  
- `--prepare-color`: Color for preparation phases

### Sound Customization
The app uses Web Audio API to generate beep sounds. You can modify the `playSound()` method in `js/timer.js` to use custom audio files instead.

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.

---

**Stay consistent, stay strong! 💪** 