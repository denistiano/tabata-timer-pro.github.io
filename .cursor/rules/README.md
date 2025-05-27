---
type: Manual
description: Overview of all Cursor rules and project structure for Tabata Timer
---

# Tabata Timer - Cursor Rules Overview

This directory contains all the Cursor rules and AI guidance for building the Tabata Timer web application. Each rule file focuses on a specific aspect of the project to ensure consistency and maintainability.

## Rule Files Summary

### 1. `project-architecture.mdc` (Always)
- **Purpose**: Core project structure and technology stack
- **Scope**: Overall application architecture
- **Key Points**: Single-page app, file structure, technology choices
- **When Applied**: Always included in context

### 2. `javascript-jquery-practices.mdc` (Auto Attached: `**/*.js`)
- **Purpose**: JavaScript and jQuery coding standards
- **Scope**: All JavaScript files
- **Key Points**: Code style, timer implementation, event handling, performance
- **When Applied**: When working on any `.js` file

### 3. `bootstrap-theming.mdc` (Auto Attached: `**/*.{css,html}`)
- **Purpose**: Bootstrap customization and dark/light theme support
- **Scope**: CSS and HTML files
- **Key Points**: Theme variables, responsive design, component styling
- **When Applied**: When working on styling or HTML structure

### 4. `localstorage-management.mdc` (Agent Requested)
- **Purpose**: Data persistence and storage utilities
- **Scope**: Settings, presets, statistics storage
- **Key Points**: Storage patterns, error handling, data validation
- **When Applied**: When AI determines storage functionality is needed

### 5. `timer-functionality.mdc` (Auto Attached: `**/timer.js`)
- **Purpose**: Core timer logic and phase management
- **Scope**: Timer implementation
- **Key Points**: Phase transitions, sound system, progress tracking
- **When Applied**: When working on `timer.js`

### 6. `settings-ui-management.mdc` (Auto Attached: `**/settings.js`)
- **Purpose**: Settings interface and form handling
- **Scope**: Settings UI and validation
- **Key Points**: Form validation, preset management, user feedback
- **When Applied**: When working on `settings.js`

### 7. `app-initialization.mdc` (Always)
- **Purpose**: Main application coordination and initialization
- **Scope**: App startup, event coordination, tab management
- **Key Points**: Component initialization, event binding, keyboard shortcuts
- **When Applied**: Always included in context

## Project File Structure

Based on the rules, the recommended file structure is:

```
tabata-timer/
├── .cursor/
│   └── rules/
│       ├── project-architecture.mdc
│       ├── javascript-jquery-practices.mdc
│       ├── bootstrap-theming.mdc
│       ├── localstorage-management.mdc
│       ├── timer-functionality.mdc
│       ├── settings-ui-management.mdc
│       ├── app-initialization.mdc
│       └── README.mdc
├── index.html                 # Single HTML file
├── css/
│   └── styles.css            # Custom styles and theme variables
├── js/
│   ├── app.js               # Main application logic
│   ├── timer.js             # Timer functionality
│   ├── settings.js          # Settings management
│   └── storage.js           # LocalStorage utilities
└── assets/
    └── sounds/              # Audio files for notifications
```

## Key Features Covered

### Timer Functionality
- Customizable interval phases (prepare, warmup, exercise, rest, recovery, cooldown)
- Accurate timing with smooth display updates
- Phase transitions and progress tracking
- Sound notifications and voice announcements

### Settings Management
- Complete settings form with validation
- Real-time saving to localStorage
- Preset system for saving/loading configurations
- Theme switching (dark/light mode)

### User Interface
- Bootstrap 5 responsive design
- Tab-based navigation
- Smooth animations and transitions
- Mobile-optimized controls
- Accessibility support

### Data Persistence
- LocalStorage for all settings and state
- Statistics tracking
- Preset management
- Error handling and recovery

## Development Guidelines

### Code Style
- Use modern JavaScript (ES6+)
- Consistent naming conventions
- Modular, maintainable code
- Comprehensive error handling

### Performance
- Minimal DOM queries (cache selectors)
- Efficient event handling
- Smooth animations
- Lightweight bundle size

### User Experience
- Intuitive interface
- Visual feedback for all actions
- Keyboard shortcuts support
- Responsive design for all devices

### Testing Considerations
- Input validation
- Edge case handling
- Cross-browser compatibility
- Offline functionality

## Usage Instructions

1. **Creating Rules**: Use `Cmd + Shift + P` > "New Cursor Rule" in VS Code
2. **Rule Types**: Choose appropriate type based on when rule should apply
3. **File References**: Use `@filename.ext` to include specific files in rule context
4. **Keep Focused**: Each rule should cover one specific aspect of the project

## Best Practices

- Rules should be **concise** and **actionable**
- Provide **concrete examples** rather than vague guidance
- **Split large concepts** into multiple, focused rules
- Use **Auto Attached** rules for file-specific guidance
- Reserve **Always** rules for core project information
- Use **Agent Requested** for specialized functionality

## Maintenance

- Review rules periodically as project evolves
- Update examples when best practices change
- Remove or merge redundant rules
- Keep rule descriptions current and accurate

---

*This overview helps developers understand the complete rule system and how each component contributes to the Tabata Timer project.*