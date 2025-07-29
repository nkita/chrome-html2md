// Settings page JavaScript functionality
class SettingsManager {
  constructor() {
    this.backButton = null;
    this.closeButton = null;
    this.metadataToggle = null;
    this.metadataPreview = null;
    this.languageSelect = null;
    this.isInitialized = false;
    
    // Default settings
    this.defaultSettings = {
      includeMetadata: true,
      language: 'en'
    };

    // Language translations
    this.translations = {
      en: {
        'language-settings': 'Language Settings',
        'interface-language': 'Interface Language',
        'language-description': 'Choose the language for the extension interface and metadata',
        'conversion-settings': 'Conversion Settings',
        'include-metadata': 'Include Metadata',
        'metadata-description': 'Include page metadata (title, URL, timestamp) in the converted Markdown',
        'metadata-preview': 'Metadata Preview',
        'back': 'Back',
        'close': 'Close',
        'settings': 'Settings'
      },
      ja: {
        'language-settings': '言語設定',
        'interface-language': 'インターフェース言語',
        'language-description': '拡張機能のインターフェースとメタデータの言語を選択してください',
        'conversion-settings': '変換設定',
        'include-metadata': 'メタデータを含める',
        'metadata-description': '変換されたMarkdownにページのメタデータ（タイトル、URL、タイムスタンプ）を含める',
        'metadata-preview': 'メタデータプレビュー',
        'back': '戻る',
        'close': '閉じる',
        'settings': '設定'
      }
    };

    // Metadata templates
    this.metadataTemplates = {
      en: {
        title: 'Page Title',
        url: 'URL',
        converted: 'Converted',
        content: '[Your converted content here]'
      },
      ja: {
        title: 'ページタイトル',
        url: 'URL',
        converted: '変換日時',
        content: '[変換されたコンテンツがここに表示されます]'
      }
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
      this.languageSelect = document.getElementById('language-select');

      if (!this.backButton || !this.closeButton || !this.metadataToggle || !this.languageSelect) {
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

    // Language select
    if (this.languageSelect) {
      this.languageSelect.addEventListener('change', (e) => {
        this.handleLanguageChange(e.target.value);
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
      
      if (this.languageSelect) {
        this.languageSelect.value = result.language;
      }

      // Apply language
      this.applyLanguage(result.language);
      
      console.log('Settings loaded:', result);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if loading fails
      if (this.metadataToggle) {
        this.metadataToggle.checked = this.defaultSettings.includeMetadata;
      }
      
      if (this.languageSelect) {
        this.languageSelect.value = this.defaultSettings.language;
      }

      // Apply default language
      this.applyLanguage(this.defaultSettings.language);
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
   * Handle language change
   */
  async handleLanguageChange(language) {
    try {
      // Save the setting
      await this.saveSettings({ language });
      
      // Apply the new language
      this.applyLanguage(language);
      
      // Update metadata preview with new language
      this.updateMetadataPreview();
      
      // Provide visual feedback
      this.showSettingsSaved();
      
    } catch (error) {
      console.error('Error handling language change:', error);
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
    document.title = `${translations.settings} - HTML to Markdown Converter`;
  }

  /**
   * Update metadata preview based on current setting
   */
  updateMetadataPreview() {
    if (!this.metadataPreview || !this.metadataToggle) return;

    const includeMetadata = this.metadataToggle.checked;
    const currentLanguage = this.languageSelect?.value || 'en';
    const template = this.metadataTemplates[currentLanguage] || this.metadataTemplates.en;
    
    if (includeMetadata) {
      this.metadataPreview.classList.remove('hidden');
      
      // Update preview content with current language
      const previewContent = document.getElementById('metadata-preview-content');
      if (previewContent) {
        previewContent.textContent = `# ${template.title}
**${template.url}:** https://example.com
**${template.converted}:** 2024-01-20 10:30:00

---

${template.content}`;
      }
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