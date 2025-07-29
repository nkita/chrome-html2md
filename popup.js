// Popup JavaScript functionality for HTML to Markdown Converter Extension

class PopupManager {
  constructor() {
    this.currentTab = null;
    this.screenSelectionButton = null;
    this.settingsButton = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the popup interface
   */
  async initializePopup() {
    try {
      // Get DOM elements
      this.screenSelectionButton = document.getElementById('screen-selection');
      this.settingsButton = document.getElementById('settings');

      if (!this.screenSelectionButton || !this.settingsButton) {
        console.error('Required popup elements not found');
        return;
      }

      // Get current tab information
      await this.getCurrentTab();
      
      // Check permissions and update UI accordingly
      this.checkTabPermissions();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up keyboard navigation
      this.setupKeyboardNavigation();
      
      this.isInitialized = true;
      
      // Focus the first available button for keyboard navigation
      this.focusFirstAvailableButton();
      
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.handleInitializationError();
    }
  }

  /**
   * Get current active tab information
   */
  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
    } catch (error) {
      console.error('Error getting current tab:', error);
      this.currentTab = null;
    }
  }

  /**
   * Check current tab permissions and disable options for restricted pages
   */
  checkTabPermissions() {
    if (!this.currentTab || !this.currentTab.url) {
      this.disableScreenSelection('Unable to access current tab');
      this.showRestrictedMessage('Unable to access current tab information');
      return;
    }

    const url = this.currentTab.url;
    const isRestrictedPage = this.isRestrictedUrl(url);

    if (isRestrictedPage) {
      const restrictedMessage = this.getRestrictedPageMessage(url);
      this.disableScreenSelection(restrictedMessage);
      this.showRestrictedMessage(restrictedMessage);
    } else {
      this.enableScreenSelection();
      this.hideRestrictedMessage();
    }

    // Settings should always be available
    this.enableSettings();
  }

  /**
   * Check if URL is for content script injection
   */
  isRestrictedUrl(url) {
    const restrictedPrefixes = [
      'chrome://',
      'chrome-extension://',
      'moz-extension://',
      'https://chrome.google.com',
      'https://chromewebstore.google.com',
      'edge://',
      'about:',
      // 'file://',
      'data:',
      'javascript:'
    ];

    return restrictedPrefixes.some(prefix => url.startsWith(prefix));
  }

  /**
   * Get appropriate message for restricted page type
   */
  getRestrictedPageMessage(url) {
    if (url.startsWith('chrome://') || url.startsWith('edge://')) {
      return 'Screen selection is not available on browser internal pages';
    } else if (url.startsWith('chrome-extension://') || url.startsWith('moz-extension://')) {
      return 'Screen selection is not available on extension pages';
    } else if (url.startsWith('https://chrome.google.com') || url.startsWith('https://chromewebstore.google.com')) {
      return 'Screen selection is not available on Chrome Web Store pages';
    } else if (url.startsWith('file://')) {
      return 'Screen selection is not available on local file pages';
    } else if (url.startsWith('about:')) {
      return 'Screen selection is not available on browser about pages';
    } else {
      return 'Screen selection is not available on this page';
    }
  }

  /**
   * Disable screen selection button with appropriate feedback
   */
  disableScreenSelection(reason) {
    if (this.screenSelectionButton) {
      this.screenSelectionButton.disabled = true;
      this.screenSelectionButton.classList.add('disabled');
      this.screenSelectionButton.setAttribute('aria-disabled', 'true');
      this.screenSelectionButton.title = reason;
    }
  }

  /**
   * Enable screen selection button
   */
  enableScreenSelection() {
    if (this.screenSelectionButton) {
      this.screenSelectionButton.disabled = false;
      this.screenSelectionButton.classList.remove('disabled');
      this.screenSelectionButton.setAttribute('aria-disabled', 'false');
      this.screenSelectionButton.title = 'Start screen selection to convert HTML elements to Markdown';
    }
  }

  /**
   * Enable settings button
   */
  enableSettings() {
    if (this.settingsButton) {
      this.settingsButton.disabled = false;
      this.settingsButton.classList.remove('disabled');
      this.settingsButton.setAttribute('aria-disabled', 'false');
    }
  }

  /**
   * Show restricted page message
   */
  showRestrictedMessage(message) {
    // Remove existing message if present
    this.hideRestrictedMessage();

    const optionsContainer = document.querySelector('.popup-options');
    if (!optionsContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = 'restricted-message';
    messageEl.innerHTML = `
      <span class="icon">⚠️</span>
      <span class="text">${message}</span>
    `;

    // Insert message before the options
    optionsContainer.insertBefore(messageEl, optionsContainer.firstChild);
  }

  /**
   * Hide restricted page message
   */
  hideRestrictedMessage() {
    const existingMessage = document.querySelector('.restricted-message');
    if (existingMessage) {
      existingMessage.remove();
    }
  }

  /**
   * Set up event listeners for popup buttons
   */
  setupEventListeners() {
    // Screen Selection button
    if (this.screenSelectionButton) {
      this.screenSelectionButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleScreenSelection();
      });
    }

    // Settings button
    if (this.settingsButton) {
      this.settingsButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSettings();
      });
    }
  }

  /**
   * Set up keyboard navigation support
   */
  setupKeyboardNavigation() {
    // Handle Escape key to close popup
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closePopup();
      }
    });

    // Handle Enter key on buttons
    const buttons = [this.screenSelectionButton, this.settingsButton];
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

    // Handle Tab navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
    });
  }

  /**
   * Handle Tab key navigation between buttons
   */
  handleTabNavigation(e) {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);

    if (e.shiftKey) {
      // Shift+Tab - move backwards
      const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
      focusableElements[prevIndex]?.focus();
    } else {
      // Tab - move forwards
      const nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
      focusableElements[nextIndex]?.focus();
    }
  }

  /**
   * Get all focusable elements in the popup
   */
  getFocusableElements() {
    const elements = [];
    if (this.screenSelectionButton && !this.screenSelectionButton.disabled) {
      elements.push(this.screenSelectionButton);
    }
    if (this.settingsButton && !this.settingsButton.disabled) {
      elements.push(this.settingsButton);
    }
    return elements;
  }

  /**
   * Focus the first available button
   */
  focusFirstAvailableButton() {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  /**
   * Handle screen selection button click
   */
  async handleScreenSelection() {
    if (!this.currentTab || this.screenSelectionButton?.disabled) {
      return;
    }

    try {
      // Send message to background script to start screen selection
      const message = {
        action: 'startScreenSelection',
        tabId: this.currentTab.id
      };

      await chrome.runtime.sendMessage(message);
      
      // Close the popup after successful message sending
      this.closePopup();
      
    } catch (error) {
      console.error('Error starting screen selection:', error);
      this.handleScreenSelectionError(error);
    }
  }

  /**
   * Handle settings button click
   */
  async handleSettings() {
    if (this.settingsButton?.disabled) {
      return;
    }

    try {
      // Navigate to settings page
      window.location.href = 'settings.html';
      
    } catch (error) {
      console.error('Error opening settings:', error);
      this.handleSettingsError(error);
    }
  }

  /**
   * Close the popup window
   */
  closePopup() {
    try {
      window.close();
    } catch (error) {
      console.error('Error closing popup:', error);
    }
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError() {
    // Show error state in popup
    const container = document.querySelector('.popup-container');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <p>Unable to initialize extension popup.</p>
          <p>Please try refreshing the page and clicking the extension again.</p>
        </div>
      `;
    }
  }

  /**
   * Handle screen selection errors
   */
  handleScreenSelectionError(error) {
    // Could implement user feedback here, for now just log
    console.error('Screen selection failed:', error);
    
    // Optionally show temporary error message
    this.showTemporaryMessage('Failed to start screen selection. Please try again.');
  }

  /**
   * Handle settings errors
   */
  handleSettingsError(error) {
    // Could implement user feedback here, for now just log
    console.error('Settings failed:', error);
    
    // Optionally show temporary error message
    this.showTemporaryMessage('Failed to open settings. Please try again.');
  }

  /**
   * Show temporary message to user
   */
  showTemporaryMessage(message) {
    // Simple implementation - could be enhanced with better UI
    const existingMessage = document.querySelector('.temp-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = 'temp-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      background: #f44336;
      color: white;
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
    `;

    document.body.appendChild(messageEl);

    // Remove message after 3 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const popupManager = new PopupManager();
  await popupManager.initializePopup();
});

// Handle popup visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Popup is being hidden/closed
    console.log('Popup hidden');
  }
});