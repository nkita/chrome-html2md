// Settings page JavaScript functionality
class SettingsManager {
  constructor() {
    this.backButton = null;
    this.closeButton = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the settings interface
   */
  initializeSettings() {
    try {
      // Get DOM elements
      this.backButton = document.getElementById('back-to-popup');
      this.closeButton = document.getElementById('close-settings');

      if (!this.backButton || !this.closeButton) {
        console.error('Required settings elements not found');
        return;
      }

      // Set up event listeners
      this.setupEventListeners();
      
      // Set up keyboard navigation
      this.setupKeyboardNavigation();
      
      this.isInitialized = true;
      
      // Focus the back button for keyboard navigation
      this.backButton.focus();
      
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  }

  /**
   * Set up event listeners for navigation buttons
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