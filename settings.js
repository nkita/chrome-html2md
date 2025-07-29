// Settings page JavaScript functionality
class SettingsManager {
  constructor() {
    this.backButton = null;
    this.closeButton = null;
    this.metadataToggle = null;
    this.metadataPreview = null;
    this.isInitialized = false;
    
    // Default settings
    this.defaultSettings = {
      includeMetadata: true
    };
  }

  /**
   * Initialize the settings interface
   */
  async initializeSettings() {
    try {
      // Get DOM elements
      this.backButton = document.getElementById('back-to-popup');
      this.closeButton = document.getElementById('close-settings');
      this.metadataToggle = document.getElementById('include-metadata');
      this.metadataPreview = document.getElementById('metadata-preview');

      if (!this.backButton || !this.closeButton || !this.metadataToggle) {
        console.error('Required settings elements not found');
        return;
      }

      // Load current settings
      await this.loadSettings();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up keyboard navigation
      this.setupKeyboardNavigation();
      
      // Update preview based on current settings
      this.updateMetadataPreview();
      
      this.isInitialized = true;
      
      // Focus the metadata toggle for better UX
      this.metadataToggle.focus();
      
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  }

  /**
   * Set up event listeners for navigation buttons and settings controls
   */
  setupEventListeners() {
    // Back to popup button
    if (this.backButton) {
      this.backButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.goBackToPopup();
      });
    }

    // Close button
    if (this.closeButton) {
      this.closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeSettings();
      });
    }

    // Metadata toggle
    if (this.metadataToggle) {
      this.metadataToggle.addEventListener('change', (e) => {
        this.handleMetadataToggle(e.target.checked);
      });
    }
  }

  /**
   * Load settings from Chrome storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(this.defaultSettings);
      
      // Update UI with loaded settings
      if (this.metadataToggle) {
        this.metadataToggle.checked = result.includeMetadata;
      }
      
      console.log('Settings loaded:', result);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if loading fails
      if (this.metadataToggle) {
        this.metadataToggle.checked = this.defaultSettings.includeMetadata;
      }
    }
  }

  /**
   * Save settings to Chrome storage
   */
  async saveSettings(settings) {
    try {
      await chrome.storage.sync.set(settings);
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Handle metadata toggle change
   */
  async handleMetadataToggle(includeMetadata) {
    try {
      // Save the setting
      await this.saveSettings({ includeMetadata });
      
      // Update preview
      this.updateMetadataPreview();
      
      // Provide visual feedback
      this.showSettingsSaved();
      
    } catch (error) {
      console.error('Error handling metadata toggle:', error);
    }
  }

  /**
   * Update metadata preview based on current setting
   */
  updateMetadataPreview() {
    if (!this.metadataPreview || !this.metadataToggle) return;

    const includeMetadata = this.metadataToggle.checked;
    
    if (includeMetadata) {
      this.metadataPreview.classList.remove('hidden');
    } else {
      this.metadataPreview.classList.add('hidden');
    }
  }

  /**
   * Show visual feedback when settings are saved
   */
  showSettingsSaved() {
    // Create a temporary success indicator
    const indicator = document.createElement('div');
    indicator.textContent = '✓ Saved';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #34a853 0%, #137333 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(52, 168, 83, 0.3);
      z-index: 1000;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.2s ease;
    `;
    
    document.body.appendChild(indicator);
    
    // Animate in
    requestAnimationFrame(() => {
      indicator.style.opacity = '1';
      indicator.style.transform = 'translateY(0)';
    });
    
    // Remove after 2 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
      indicator.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 200);
    }, 2000);
  }

  /**
   * Set up keyboard navigation support
   */
  setupKeyboardNavigation() {
    // Handle Escape key to close settings
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeSettings();
      }
    });

    // Handle Enter and Space keys on buttons
    const buttons = [this.backButton, this.closeButton];
    buttons.forEach(button => {
      if (button) {
        button.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            button.click();
          }
        });
      }
    });
  }

  /**
   * Navigate back to main popup
   */
  goBackToPopup() {
    try {
      // Navigate back to popup.html
      window.location.href = 'popup.html';
    } catch (error) {
      console.error('Error navigating back to popup:', error);
      // Fallback: close the window
      this.closeSettings();
    }
  }

  /**
   * Close the settings window
   */
  closeSettings() {
    try {
      window.close();
    } catch (error) {
      console.error('Error closing settings:', error);
    }
  }
}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const settingsManager = new SettingsManager();
  settingsManager.initializeSettings();
});

// Handle settings visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Settings hidden');
  }
});