// Popup JavaScript functionality for HTML to Markdown Converter Extension

class PopupManager {
  constructor() {
    this.currentTab = null;
    this.screenSelectionButton = null;
    this.settingsButton = null;
    this.isInitialized = false;

    // Language translations
    this.translations = {
      en: {
        'app-title': 'HTML to Markdown',
        'screen-selection': 'Screen Selection',
        'select-and-convert': 'Select & Convert',
        'convert-page': 'Convert Page',
        'settings': 'Settings',
        'restricted-message-chrome': 'Screen selection is not available on browser internal pages',
        'restricted-message-extension': 'Screen selection is not available on extension pages',
        'restricted-message-webstore': 'Screen selection is not available on Chrome Web Store pages',
        'restricted-message-file': 'Screen selection is not available on local file pages',
        'restricted-message-about': 'Screen selection is not available on browser about pages',
        'restricted-message-default': 'Screen selection is not available on this page'
      },
      ja: {
        'app-title': 'HTML to Markdown',
        'screen-selection': '画面選択',
        'select-and-convert': '選択して変換',
        'convert-page': 'ページを変換',
        'settings': '設定',
        'restricted-message-chrome': 'ブラウザの内部ページでは画面選択を使用できません',
        'restricted-message-extension': '拡張機能ページでは画面選択を使用できません',
        'restricted-message-webstore': 'Chrome ウェブストアページでは画面選択を使用できません',
        'restricted-message-file': 'ローカルファイルページでは画面選択を使用できません',
        'restricted-message-about': 'ブラウザのaboutページでは画面選択を使用できません',
        'restricted-message-default': 'このページでは画面選択を使用できません'
      }
    };
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

      // Load and apply language settings
      await this.loadLanguageSettings();

      // Update button text based on conversion mode
      await this.updateButtonText();

      // Check permissions and update UI accordingly
      this.checkTabPermissions();

      // Set up event listeners
      this.setupEventListeners();

      // Set up keyboard navigation
      this.setupKeyboardNavigation();

      this.isInitialized = true;

      // Focus the first available button for keyboard navigation
      this.focusFirstAvailableButton();

      // Listen for storage changes to update button text
      this.setupStorageListener();

    } catch (error) {
      console.error('Error initializing popup:', error);
      this.handleInitializationError();
    }
  }

  /**
   * Load and apply language settings
   */
  async loadLanguageSettings() {
    try {
      const result = await chrome.storage.sync.get({ language: 'en' });
      this.applyLanguage(result.language);
    } catch (error) {
      console.error('Error loading language settings:', error);
      // Use default language
      this.applyLanguage('en');
    }
  }

  /**
   * Apply language to the interface
   */
  applyLanguage(language) {
    const translations = this.translations[language] || this.translations.en;

    // Update all elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (translations[key]) {
        element.textContent = translations[key];
      }
    });

    // Update page title
    document.title = `${translations['app-title']} - Extension`;
  }

  /**
   * Update button text based on conversion mode
   */
  async updateButtonText() {
    try {
      const settings = await chrome.storage.sync.get({ conversionMode: 'selection', language: 'en' });
      const translations = this.translations[settings.language] || this.translations.en;

      if (this.screenSelectionButton) {
        const buttonText = this.screenSelectionButton.querySelector('.text');
        if (buttonText) {
          if (settings.conversionMode === 'fullpage') {
            buttonText.textContent = translations['convert-page'];
          } else {
            buttonText.textContent = translations['select-and-convert'];
          }
        }
      }
    } catch (error) {
      console.error('Error updating button text:', error);
    }
  }

  /**
   * Setup storage change listener
   */
  setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        if (changes.conversionMode || changes.language) {
          this.updateButtonText();
        }
      }
    });
  }

  /**
   * Get localized restricted message
   */
  getLocalizedRestrictedMessage(url, language = 'en') {
    const translations = this.translations[language] || this.translations.en;

    if (url.startsWith('chrome://') || url.startsWith('edge://')) {
      return translations['restricted-message-chrome'];
    } else if (url.startsWith('chrome-extension://') || url.startsWith('moz-extension://')) {
      return translations['restricted-message-extension'];
    } else if (url.startsWith('https://chrome.google.com') || url.startsWith('https://chromewebstore.google.com')) {
      return translations['restricted-message-webstore'];
    } else if (url.startsWith('file://')) {
      return translations['restricted-message-file'];
    } else if (url.startsWith('about:')) {
      return translations['restricted-message-about'];
    } else {
      return translations['restricted-message-default'];
    }
  }

  /**
   * Get current active tab information
   */
  async getCurrentTab() {
    this.currentTab = await CommonUtils.getCurrentTab();
  }

  /**
   * Check current tab permissions and disable options for restricted pages
   */
  async checkTabPermissions() {
    if (!this.currentTab || !this.currentTab.url) {
      this.disableScreenSelection('Unable to access current tab');
      this.showRestrictedMessage('Unable to access current tab information');
      return;
    }

    const url = this.currentTab.url;
    const isRestrictedPage = this.isRestrictedUrl(url);

    if (isRestrictedPage) {
      // Get current language for localized message
      const result = await chrome.storage.sync.get({ language: 'en' });
      const restrictedMessage = this.getLocalizedRestrictedMessage(url, result.language);
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
    return CommonUtils.isRestrictedUrl(url);
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
      // Get conversion mode setting
      const settings = await chrome.storage.sync.get({ conversionMode: 'selection' });

      // Send message to background script with conversion mode
      const message = {
        action: 'startScreenSelection',
        tabId: this.currentTab.id,
        conversionMode: settings.conversionMode
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