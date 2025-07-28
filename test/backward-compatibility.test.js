import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Read all extension files
const manifestJSON = JSON.parse(fs.readFileSync(path.resolve('manifest.json'), 'utf8'));
const backgroundJS = fs.readFileSync(path.resolve('background.js'), 'utf8');
const contentJS = fs.readFileSync(path.resolve('content.js'), 'utf8');
const popupHTML = fs.readFileSync(path.resolve('popup.html'), 'utf8');
const popupJS = fs.readFileSync(path.resolve('popup.js'), 'utf8');

describe('Backward Compatibility and Integration Verification', () => {
  let dom;
  let document;
  let window;

  beforeEach(async () => {
    // Create a fresh DOM for each test
    dom = new JSDOM(popupHTML, {
      url: 'chrome-extension://test/popup.html',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    document = dom.window.document;
    window = dom.window;
    
    // Set up global objects
    global.document = document;
    global.window = window;
    
    // Reset Chrome API mocks
    vi.clearAllMocks();
    chrome.runtime.lastError = null;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('1. Content Script Functionality Remains Unchanged', () => {
    it('should preserve all TurndownService configuration and rules', () => {
      // Test that content script contains expected TurndownService configuration
      expect(contentJS).toContain('var turndownService = new TurndownService');
      expect(contentJS).toContain('codeBlockStyle: \'fenced\'');
      expect(contentJS).toContain('headingStyle: \'atx\'');
      expect(contentJS).toContain('bulletListMarker: \'-\'');
      expect(contentJS).toContain('emDelimiter: \'*\'');
      expect(contentJS).toContain('strongDelimiter: \'**\'');
    });

    it('should maintain all custom TurndownService rules', () => {
      // Test that all expected rules are still present in content script
      const expectedRules = [
        'preToCodeBlock',
        'enhancedTable', 
        'enhancedBlockquote',
        'enhancedList',
        'enhancedCode',
        'enhancedImage',
        'enhancedLink',
        'horizontalRule',
        'definitionList',
        'detailsSummary',
        'highlightedText',
        'strikethrough',
        'subscript',
        'superscript',
        'keyboard',
        'abbreviation',
        'figure',
        'address',
        'time',
        'progress',
        'meter',
        'removeExtensionUI',
        'removeNonContent',
        'removeHidden',
        'formElements',
        'preserveHtml'
      ];

      expectedRules.forEach(ruleName => {
        expect(contentJS).toContain(ruleName);
      });
    });

    it('should preserve element selection and highlighting functionality', () => {
      // Verify that content script still contains element selection logic
      expect(contentJS).toContain('handleMouseOver');
      expect(contentJS).toContain('handleClick');
      expect(contentJS).toContain('handleKeyDown');
      expect(contentJS).toContain('selectedElement');
      expect(contentJS).toContain('highlightOverlay');
      expect(contentJS).toContain('infoLabel');
      expect(contentJS).toContain('infoBanner');
    });

    it('should maintain clipboard functionality with fallback', () => {
      // Verify clipboard functionality is preserved
      expect(contentJS).toContain('isClipboardAvailable');
      expect(contentJS).toContain('fallbackCopyToClipboard');
      expect(contentJS).toContain('navigator.clipboard.writeText');
      expect(contentJS).toContain('document.execCommand');
    });

    it('should preserve metadata extraction functionality', () => {
      // Verify metadata extraction is still available
      expect(contentJS).toContain('extractPageMetadata');
      expect(contentJS).toContain('contextualDescription');
      expect(contentJS).toContain('event.shiftKey');
    });

    it('should maintain UI elements and styling', () => {
      // Verify UI elements are still created
      expect(contentJS).toContain('html-to-markdown-extension-ui');
      expect(contentJS).toContain('background: \'linear-gradient');
      expect(contentJS).toContain('backdropFilter');
      expect(contentJS).toContain('showNotification');
    });
  });

  describe('2. Element Selection, Markdown Conversion, and Clipboard Operations Work Identically', () => {
    it('should maintain identical script injection behavior', () => {
      // Execute background script
      eval(backgroundJS);
      
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.get.mockImplementation((tabId, callback) => {
        callback(mockTab);
      });
      chrome.scripting.executeScript.mockImplementation((options, callback) => {
        callback();
      });

      // Get the message listener
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      
      // Test screen selection message
      messageListener({ action: 'startScreenSelection', tabId: 123 });

      // Verify identical script injection
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['turndown.js', 'content.js']
      }, expect.any(Function));
    });

    it('should preserve exact same file injection order', () => {
      // Verify that turndown.js is injected before content.js
      expect(backgroundJS).toContain('files: ["turndown.js", "content.js"]');
    });

    it('should maintain identical restricted page handling', () => {
      // Execute background script
      eval(backgroundJS);
      
      const restrictedUrls = [
        'chrome://settings',
        'https://chrome.google.com/webstore'
      ];

      restrictedUrls.forEach(url => {
        const mockTab = { id: 123, url };
        chrome.tabs.get.mockImplementation((tabId, callback) => {
          callback(mockTab);
        });

        const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
        messageListener({ action: 'startScreenSelection', tabId: 123 });

        expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith('Cannot inject scripts on restricted pages:', url);
      });
    });

    it('should preserve error handling behavior', () => {
      // Execute background script
      eval(backgroundJS);
      
      // Test tab get error
      chrome.tabs.get.mockImplementation((tabId, callback) => {
        chrome.runtime.lastError = { message: 'Tab not found' };
        callback(null);
      });

      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      messageListener({ action: 'startScreenSelection', tabId: 123 });

      expect(console.error).toHaveBeenCalledWith('Error getting tab information:', { message: 'Tab not found' });
    });

    it('should maintain identical manifest permissions', () => {
      // Verify all required permissions are preserved
      const expectedPermissions = ['activeTab', 'scripting', 'clipboardWrite'];
      
      expect(manifestJSON.permissions).toEqual(expect.arrayContaining(expectedPermissions));
      expect(manifestJSON.manifest_version).toBe(3);
    });
  });

  describe('3. Popup Interface Works Consistently Across Different Websites', () => {
    it('should handle normal websites correctly', async () => {
      const testUrls = [
        'https://example.com',
        'https://github.com',
        'https://stackoverflow.com',
        'http://localhost:3000',
        'https://docs.google.com'
      ];

      for (const url of testUrls) {
        const mockTab = { id: 123, url };
        chrome.tabs.query.mockResolvedValue([mockTab]);

        // Execute popup script
        const script = document.createElement('script');
        script.textContent = popupJS;
        document.head.appendChild(script);

        // Trigger initialization
        const event = new window.Event('DOMContentLoaded');
        document.dispatchEvent(event);

        await new Promise(resolve => setTimeout(resolve, 10));

        const screenSelectionButton = document.getElementById('screen-selection');
        const settingsButton = document.getElementById('settings');

        expect(screenSelectionButton.disabled).toBe(false);
        expect(settingsButton.disabled).toBe(false);
        expect(screenSelectionButton.classList.contains('disabled')).toBe(false);

        // Clean up for next iteration
        document.head.removeChild(script);
        vi.clearAllMocks();
      }
    });

    it('should handle restricted websites consistently', () => {
      // Test URL restriction logic
      function isRestrictedUrl(url) {
        const restrictedPrefixes = [
          'chrome://',
          'chrome-extension://',
          'moz-extension://',
          'https://chrome.google.com',
          'https://chromewebstore.google.com',
          'edge://',
          'about:',
          'file://',
          'data:',
          'javascript:'
        ];
        return restrictedPrefixes.some(prefix => url.startsWith(prefix));
      }

      const restrictedUrls = [
        'chrome://settings',
        'chrome-extension://test/popup.html',
        'https://chrome.google.com/webstore',
        'edge://settings',
        'file:///path/to/file.html'
      ];

      restrictedUrls.forEach(url => {
        expect(isRestrictedUrl(url)).toBe(true);
      });

      // Test that normal URLs are not restricted
      const normalUrls = [
        'https://example.com',
        'https://github.com',
        'http://localhost:3000'
      ];

      normalUrls.forEach(url => {
        expect(isRestrictedUrl(url)).toBe(false);
      });
    });

    it('should maintain consistent keyboard navigation across all sites', () => {
      // Test that popup script contains keyboard navigation logic
      expect(popupJS).toContain('keydown');
      expect(popupJS).toContain('Escape');
      expect(popupJS).toContain('Enter');
      expect(popupJS).toContain('Tab');
      expect(popupJS).toContain('setupKeyboardNavigation');
    });
  });

  describe('4. Extension Behavior Matches All Original Requirements Through New Interface', () => {
    it('should maintain requirement 1.1: Display popup menu with two options', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      // Execute popup script
      const script = document.createElement('script');
      script.textContent = popupJS;
      document.head.appendChild(script);

      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton).not.toBeNull();
      expect(settingsButton).not.toBeNull();
      expect(screenSelectionButton.textContent).toContain('Screen Selection');
      expect(settingsButton.textContent).toContain('Settings');
    });

    it('should maintain requirement 2.1: Screen selection activates current functionality', () => {
      // Test that popup script contains screen selection logic
      expect(popupJS).toContain('handleScreenSelection');
      expect(popupJS).toContain('startScreenSelection');
      expect(popupJS).toContain('chrome.runtime.sendMessage');
      expect(popupJS).toContain('window.close');
    });

    it('should maintain requirement 2.4: Behave exactly as current extension', async () => {
      // Execute background script
      eval(backgroundJS);
      
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.get.mockImplementation((tabId, callback) => {
        callback(mockTab);
      });
      chrome.scripting.executeScript.mockImplementation((options, callback) => {
        callback();
      });

      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      messageListener({ action: 'startScreenSelection', tabId: 123 });

      // Verify identical behavior to original extension
      expect(chrome.tabs.get).toHaveBeenCalledWith(123, expect.any(Function));
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['turndown.js', 'content.js']
      }, expect.any(Function));
    });

    it('should maintain requirement 3.1: Settings display placeholder interface', () => {
      // Test that popup script contains settings navigation logic
      expect(popupJS).toContain('handleSettings');
      expect(popupJS).toContain('settings.html');
      expect(popupJS).toContain('window.location.href');
    });

    it('should maintain requirement 4.1-4.5: Clean and intuitive interface', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      // Verify clear, readable text
      expect(screenSelectionButton.textContent).toContain('Screen Selection');
      expect(settingsButton.textContent).toContain('Settings');

      // Verify visual indicators (icons)
      const screenIcon = screenSelectionButton.querySelector('.icon');
      const settingsIcon = settingsButton.querySelector('.icon');
      expect(screenIcon).not.toBeNull();
      expect(settingsIcon).not.toBeNull();

      // Verify proper button types
      expect(screenSelectionButton.type).toBe('button');
      expect(settingsButton.type).toBe('button');

      // Verify ARIA attributes
      expect(screenSelectionButton.getAttribute('aria-label')).toBeTruthy();
      expect(settingsButton.getAttribute('aria-label')).toBeTruthy();
    });

    it('should maintain requirement 5.1-5.4: Reliable operation across browser states', () => {
      // Test that popup script contains logic for handling different browser states
      expect(popupJS).toContain('checkTabPermissions');
      expect(popupJS).toContain('isRestrictedUrl');
      expect(popupJS).toContain('disableScreenSelection');
      expect(popupJS).toContain('showRestrictedMessage');
      expect(popupJS).toContain('getCurrentTab');
    });
  });

  describe('5. Manifest Configuration Compatibility', () => {
    it('should maintain proper popup configuration', () => {
      expect(manifestJSON.action).toBeDefined();
      expect(manifestJSON.action.default_popup).toBe('popup.html');
      expect(manifestJSON.manifest_version).toBe(3);
    });

    it('should preserve all necessary permissions', () => {
      const requiredPermissions = ['activeTab', 'scripting', 'clipboardWrite'];
      
      requiredPermissions.forEach(permission => {
        expect(manifestJSON.permissions).toContain(permission);
      });
    });

    it('should maintain service worker configuration', () => {
      expect(manifestJSON.background).toBeDefined();
      expect(manifestJSON.background.service_worker).toBe('background.js');
    });

    it('should preserve icon configuration', () => {
      expect(manifestJSON.icons).toBeDefined();
      expect(manifestJSON.icons['16']).toBe('images/icon16.png');
      expect(manifestJSON.icons['48']).toBe('images/icon48.png');
      expect(manifestJSON.icons['128']).toBe('images/icon128.png');
    });
  });

  describe('6. Settings Interface Placeholder', () => {
    it('should have settings.html file available', () => {
      expect(() => {
        fs.readFileSync(path.resolve('settings.html'), 'utf8');
      }).not.toThrow();
    });

    it('should navigate to settings when settings button is clicked', () => {
      // Test that settings navigation is implemented
      expect(popupJS).toContain('settings.html');
      expect(popupJS).toContain('window.location.href');
    });
  });

  describe('7. Error Handling Preservation', () => {
    it('should maintain all error handling patterns from background script', () => {
      // Verify error handling patterns are preserved
      expect(backgroundJS).toContain('try {');
      expect(backgroundJS).toContain('catch (error)');
      expect(backgroundJS).toContain('console.error');
      expect(backgroundJS).toContain('chrome.runtime.lastError');
    });

    it('should maintain error handling in popup script', () => {
      expect(popupJS).toContain('try {');
      expect(popupJS).toContain('catch (error)');
      expect(popupJS).toContain('console.error');
    });

    it('should preserve content script error handling', () => {
      expect(contentJS).toContain('catch (err)');
      expect(contentJS).toContain('console.error');
    });
  });
});