// Settings UI Management
class SettingsUI {
    constructor() {
        this.settings = SettingsManager.loadSettings();
        this.isInitialized = false;
        this.validationErrors = {};
        this.currentEditingSetting = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.populateForm();
        this.isInitialized = true;
    }
    
    bindEvents() {
        // Setting row clicks
        $('.setting-row[data-setting]').on('click', (e) => {
            const settingKey = $(e.currentTarget).data('setting');
            this.showSettingModal(settingKey);
        });
        
        // Setting modal save
        $('#save-setting-btn').on('click', () => {
            this.saveCurrentSetting();
        });
        
        // Preset management
        $('#save-preset-btn').on('click', () => {
            this.showSavePresetModal();
        });
        
        $('#load-preset-btn').on('click', () => {
            this.showLoadPresetModal();
        });
        
        $('#arrange-presets-btn').on('click', () => {
            this.showArrangePresetsModal();
        });
        
        // Preset modal events
        $('#confirm-preset-btn').on('click', () => {
            this.handlePresetAction();
        });
        
        // Theme toggle
        $('#theme-toggle').on('click', () => {
            ThemeManager.toggleTheme();
        });
    }
    
    populateForm() {
        // Update all setting displays
        this.updateSettingDisplay('initialCountdown', this.settings.initialCountdown);
        this.updateSettingDisplay('warmupInterval', this.settings.warmupInterval);
        this.updateSettingDisplay('exerciseInterval', this.settings.exerciseInterval);
        this.updateSettingDisplay('restInterval', this.settings.restInterval);
        this.updateSettingDisplay('numberOfSets', this.settings.numberOfSets);
        this.updateSettingDisplay('recoveryInterval', this.settings.recoveryInterval);
        this.updateSettingDisplay('numberOfCycles', this.settings.numberOfCycles);
        this.updateSettingDisplay('cooldownInterval', this.settings.cooldownInterval);
    }
    
    updateSettingDisplay(key, value) {
        const displayElement = $(`#${key}-display`);
        const hiddenInput = $(`#${key}`);
        
        if (displayElement.length) {
            let displayText = '';
            
            switch (key) {
                case 'numberOfSets':
                    displayText = `${value} ${value === 1 ? 'Set' : 'Sets'}`;
                    break;
                case 'numberOfCycles':
                    displayText = `${value} ${value === 1 ? 'Cycle' : 'Cycles'}`;
                    break;
                default:
                    // Time intervals - all in seconds
                    if (value === 0) {
                        displayText = '0 Seconds';
                    } else if (value < 60) {
                        displayText = `${value} Seconds`;
                    } else {
                        const minutes = Math.floor(value / 60);
                        const seconds = value % 60;
                        if (seconds === 0) {
                            displayText = `${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'}`;
                        } else {
                            displayText = `${minutes}:${seconds.toString().padStart(2, '0')} Minutes`;
                        }
                    }
                    break;
            }
            
            displayElement.text(displayText);
        }
        
        if (hiddenInput.length) {
            hiddenInput.val(value);
        }
    }
    
    showSettingModal(settingKey) {
        this.currentEditingSetting = settingKey;
        const currentValue = this.settings[settingKey];
        
        // Set modal title and labels
        const settingLabels = {
            initialCountdown: 'Initial Countdown',
            warmupInterval: 'Warmup Interval',
            exerciseInterval: 'Exercise Interval',
            restInterval: 'Rest Interval',
            numberOfSets: 'Number Of Sets',
            recoveryInterval: 'Recovery Interval',
            numberOfCycles: 'Number Of Cycles',
            cooldownInterval: 'Cooldown Interval'
        };
        
        $('#settingModalTitle').text(`Edit ${settingLabels[settingKey]}`);
        $('#setting-label').text(settingLabels[settingKey]);
        $('#setting-value-input').val(currentValue);
        
        // Set unit text
        if (settingKey === 'numberOfSets' || settingKey === 'numberOfCycles') {
            $('#setting-unit').text(settingKey === 'numberOfSets' ? 'Sets' : 'Cycles');
        } else {
            $('#setting-unit').text('Seconds');
        }
        
        // Set input constraints
        if (settingKey === 'numberOfSets') {
            $('#setting-value-input').attr({ min: 1, max: 100 });
        } else if (settingKey === 'numberOfCycles') {
            $('#setting-value-input').attr({ min: 1, max: 1000 });
        } else if (settingKey === 'exerciseInterval') {
            $('#setting-value-input').attr({ min: 1, max: 3600 });
        } else {
            $('#setting-value-input').attr({ min: 0, max: 3600 });
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('settingModal'));
        modal.show();
    }
    
    saveCurrentSetting() {
        if (!this.currentEditingSetting) return;
        
        const newValue = parseInt($('#setting-value-input').val(), 10);
        
        // Validate the value
        if (!this.validateValue(this.currentEditingSetting, newValue)) {
            return;
        }
        
        // Update settings
        this.settings[this.currentEditingSetting] = newValue;
        SettingsManager.saveSettings(this.settings);
        
        // Update display
        this.updateSettingDisplay(this.currentEditingSetting, newValue);
        
        // Trigger settings changed event
        $(document).trigger('settings:changed', { 
            key: this.currentEditingSetting, 
            value: newValue 
        });
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('settingModal'));
        modal.hide();
        
        this.currentEditingSetting = null;
    }
    
    validateValue(key, value) {
        let isValid = true;
        let errorMessage = '';
        
        switch (key) {
            case 'exerciseInterval':
                if (value < 1 || value > 3600) {
                    errorMessage = 'Exercise interval must be between 1 and 3600 seconds';
                    isValid = false;
                }
                break;
            case 'numberOfCycles':
                if (value < 1 || value > 1000) {
                    errorMessage = 'Number of cycles must be between 1 and 1000';
                    isValid = false;
                }
                break;
            case 'numberOfSets':
                if (value < 1 || value > 100) {
                    errorMessage = 'Number of sets must be between 1 and 100';
                    isValid = false;
                }
                break;
            case 'initialCountdown':
            case 'warmupInterval':
            case 'restInterval':
            case 'recoveryInterval':
            case 'cooldownInterval':
                if (value < 0 || value > 3600) {
                    errorMessage = 'Value must be between 0 and 3600 seconds';
                    isValid = false;
                }
                break;
        }
        
        if (!isValid) {
            this.showToast(errorMessage, 'error');
        }
        
        return isValid;
    }
    
    showSavePresetModal() {
        $('#presetModalTitle').text('Save Preset');
        $('#preset-form').show();
        $('#preset-list').hide();
        $('#preset-name').val('');
        $('#confirm-preset-btn').text('Save').data('action', 'save');
        
        const modal = new bootstrap.Modal(document.getElementById('presetModal'));
        modal.show();
    }
    
    showLoadPresetModal() {
        $('#presetModalTitle').text('Load Preset');
        $('#preset-form').hide();
        $('#preset-list').show();
        $('#confirm-preset-btn').text('Load').data('action', 'load');
        
        this.populatePresetList();
        
        const modal = new bootstrap.Modal(document.getElementById('presetModal'));
        modal.show();
    }
    
    showArrangePresetsModal() {
        $('#presetModalTitle').text('Arrange Presets');
        $('#preset-form').hide();
        $('#preset-list').show();
        $('#confirm-preset-btn').text('Delete Selected').data('action', 'delete');
        
        this.populatePresetList(true);
        
        const modal = new bootstrap.Modal(document.getElementById('presetModal'));
        modal.show();
    }
    
    populatePresetList(showDeleteButtons = false) {
        const presets = PresetManager.loadPresets();
        const $list = $('#preset-list');
        
        $list.empty();
        
        if (presets.length === 0) {
            $list.html('<p class="text-muted">No presets saved</p>');
            return;
        }
        
        presets.forEach(preset => {
            const $item = $(`
                <div class="preset-item" data-preset-name="${preset.name}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${preset.name}</strong>
                            <small class="d-block text-muted">
                                Created: ${new Date(preset.createdAt).toLocaleDateString()}
                            </small>
                        </div>
                        ${showDeleteButtons ? 
                            `<button class="btn btn-sm btn-outline-danger delete-preset-btn" data-preset-name="${preset.name}">
                                <i class="bi bi-trash"></i>
                            </button>` : ''
                        }
                    </div>
                </div>
            `);
            
            if (!showDeleteButtons) {
                $item.on('click', () => {
                    $('.preset-item').removeClass('selected');
                    $item.addClass('selected');
                });
            }
            
            $list.append($item);
        });
        
        // Bind delete buttons
        if (showDeleteButtons) {
            $('.delete-preset-btn').on('click', (e) => {
                e.stopPropagation();
                const presetName = $(e.currentTarget).data('preset-name');
                this.deletePreset(presetName);
            });
        }
    }
    
    handlePresetAction() {
        const action = $('#confirm-preset-btn').data('action');
        
        switch (action) {
            case 'save':
                this.savePreset();
                break;
            case 'load':
                const selectedPreset = $('.preset-item.selected').data('preset-name');
                if (selectedPreset) {
                    this.loadPreset(selectedPreset);
                } else {
                    this.showToast('Please select a preset to load', 'warning');
                }
                break;
            case 'delete':
                // Delete action is handled by individual delete buttons
                break;
        }
    }
    
    savePreset() {
        const name = $('#preset-name').val().trim();
        
        if (!name) {
            this.showToast('Please enter a preset name', 'warning');
            return;
        }
        
        if (PresetManager.savePreset(name, this.settings)) {
            this.showToast(`Preset "${name}" saved successfully`, 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('presetModal'));
            modal.hide();
        } else {
            this.showToast('Failed to save preset', 'error');
        }
    }
    
    loadPreset(name) {
        const presetSettings = PresetManager.loadPreset(name);
        
        if (presetSettings) {
            this.settings = { ...this.settings, ...presetSettings };
            SettingsManager.saveSettings(this.settings);
            this.populateForm();
            
            this.showToast(`Preset "${name}" loaded successfully`, 'success');
            $(document).trigger('settings:changed', { preset: name });
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('presetModal'));
            modal.hide();
        } else {
            this.showToast('Failed to load preset', 'error');
        }
    }
    
    deletePreset(name) {
        if (confirm(`Are you sure you want to delete the preset "${name}"?`)) {
            if (PresetManager.deletePreset(name)) {
                this.showToast(`Preset "${name}" deleted successfully`, 'success');
                this.populatePresetList(true); // Refresh the list
            } else {
                this.showToast('Failed to delete preset', 'error');
            }
        }
    }
    
    showToast(message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        const iconClass = {
            success: 'bi-check-circle-fill text-success',
            error: 'bi-exclamation-triangle-fill text-danger',
            warning: 'bi-exclamation-triangle-fill text-warning',
            info: 'bi-info-circle-fill text-info'
        }[type] || 'bi-info-circle-fill text-info';
        
        const toastHtml = `
            <div id="${toastId}" class="toast" role="alert">
                <div class="toast-header">
                    <i class="${iconClass} me-2"></i>
                    <strong class="me-auto">Settings</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">${message}</div>
            </div>
        `;
        
        $('#toast-container').append(toastHtml);
        
        const toast = new bootstrap.Toast(document.getElementById(toastId));
        toast.show();
        
        // Remove toast element after it's hidden
        $(`#${toastId}`).on('hidden.bs.toast', function() {
            $(this).remove();
        });
    }
    
    getSettings() {
        return { ...this.settings };
    }
    
    updateFromTimer(timerSettings) {
        this.settings = { ...this.settings, ...timerSettings };
        this.populateForm();
    }
} 