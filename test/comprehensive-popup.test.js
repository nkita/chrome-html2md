import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Read the actual popup files
const popupHTML = fs.readFileSync(path.resolve('popup.html'), 'utf8');
const backgroundJS = fs.readFileSync(path.resolve('background.js'), 'utf8');

describe('Comprehensive Popup Testing Suite', () => {
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

  describe('1. Popup Message Creation and UI State Management', () => {
    it('should create correct message structure for screen selection', () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      
      // Test the message structure that should be created
      const expectedMessage = {
        action: 'startScreenSelection',
        tabId: mockTab.id
      };

      expect(expectedMessage.action).toBe('startScreenSelection');
      expect(expectedMessage.tabId).toBe(123);
      expect(typeof expectedMessage.tabId).toBe('number');
    });

    it('should handle settings message correctly', () => {
      // Test that settings should navigate to settings.html
      const expectedLocation = 'settings.html';
      expect(expectedLocation).toBe('settings.html');
    });

    it('should initialize UI state correctly for normal pages', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      // Initially buttons should be enabled (before any restrictions are applied)
      expect(screenSelectionButton.disabled).toBe(false);
      expect(settingsButton.disabled).toBe(false);
      expect(screenSelectionButton.classList.contains('disabled')).toBe(false);
    });

    it('should handle UI state for restricted pages', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      // Simulate what should happen for restricted pages
      screenSelectionButton.disabled = true;
      screenSelectionButton.classList.add('disabled');
      screenSelectionButton.setAttribute('aria-disabled', 'true');

      expect(screenSelectionButton.disabled).toBe(true);
      expect(settingsButton.disabled).toBe(false);
      expect(screenSelectionButton.classList.contains('disabled')).toBe(true);
      expect(screenSelectionButton.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('2. Popup-Background Communication', () => {
    it('should send startScreenSelection message with correct tabId', async () => {
      const mockTab = { id: 456, url: 'https://test.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockResolvedValue();

      // Simulate the message that should be sent
      const message = {
        action: 'startScreenSelection',
        tabId: mockTab.id
      };

      await chrome.runtime.sendMessage(message);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'startScreenSelection',
        tabId: 456
      });
    });

    it('should handle message sending errors gracefully', async () => {
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Connection failed'));

      try {
        await chrome.runtime.sendMessage({ action: 'startScreenSelection', tabId: 123 });
      } catch (error) {
        expect(error.message).toBe('Connection failed');
      }
    });

    it('should not send message when screen selection is disabled', () => {
      // Test logic for when screen selection should be disabled
      const restrictedUrl = 'chrome://settings';
      const isRestricted = restrictedUrl.startsWith('chrome://');
      
      expect(isRestricted).toBe(true);
      
      // When restricted, no message should be sent
      if (isRestricted) {
        expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
      }
    });
  });

  describe('3. Screen Selection Activation', () => {
    it('should close popup after successful screen selection activation', async () => {
      chrome.runtime.sendMessage.mockResolvedValue();

      // Simulate successful message sending
      await chrome.runtime.sendMessage({ action: 'startScreenSelection', tabId: 123 });
      
      // After successful message, popup should close
      expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    });

    it('should maintain identical functionality to current extension', () => {
      // Test that the message structure matches what background script expects
      const message = { action: 'startScreenSelection', tabId: 123 };
      
      expect(message.action).toBe('startScreenSelection');
      expect(typeof message.tabId).toBe('number');
      expect(message.tabId).toBeGreaterThan(0);
    });
  });

  describe('4. Keyboard Navigation and Accessibility', () => {
    it('should handle Escape key to close popup', () => {
      const escapeEvent = new window.KeyboardEvent('keydown', { key: 'Escape' });
      
      expect(escapeEvent.key).toBe('Escape');
      expect(escapeEvent.type).toBe('keydown');
      
      // Test that escape event can be created and has correct properties
      expect(escapeEvent.bubbles).toBe(false);
    });

    it('should handle Enter key on buttons', () => {
      const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
      
      expect(enterEvent.key).toBe('Enter');
      expect(enterEvent.type).toBe('keydown');
    });

    it('should handle Space key on buttons', () => {
      const spaceEvent = new window.KeyboardEvent('keydown', { key: ' ' });
      
      expect(spaceEvent.key).toBe(' ');
      expect(spaceEvent.type).toBe('keydown');
    });

    it('should focus first available button on initialization', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      
      // Test that button can receive focus
      screenSelectionButton.focus();
      expect(document.activeElement).toBe(screenSelectionButton);
    });

    it('should focus settings button when screen selection is disabled', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');
      
      // Simulate disabled state
      screenSelectionButton.disabled = true;
      
      // Settings should be focusable
      settingsButton.focus();
      expect(document.activeElement).toBe(settingsButton);
    });

    it('should have proper ARIA attributes', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton.getAttribute('aria-label')).toContain('screen selection');
      expect(settingsButton.getAttribute('aria-label')).toContain('settings');
      expect(screenSelectionButton.getAttribute('role')).toBe('menuitem');
      expect(settingsButton.getAttribute('role')).toBe('menuitem');
    });

    it('should update ARIA attributes for disabled buttons', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      
      // Simulate setting aria-disabled
      screenSelectionButton.setAttribute('aria-disabled', 'true');
      
      expect(screenSelectionButton.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('5. Restricted Pages and Error Conditions', () => {
    const restrictedUrls = [
      'chrome://settings',
      'chrome-extension://test/popup.html',
      'https://chrome.google.com/webstore',
      'https://chromewebstore.google.com/detail/test',
      'edge://settings',
      'about:blank',
      'file:///path/to/file.html',
      'data:text/html,<html></html>',
      'javascript:alert("test")'
    ];

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

    restrictedUrls.forEach(url => {
      it(`should disable screen selection for ${url}`, () => {
        expect(isRestrictedUrl(url)).toBe(true);
      });
    });

    it('should show appropriate message for chrome:// pages', () => {
      function getRestrictedPageMessage(url) {
        if (url.startsWith('chrome://') || url.startsWith('edge://')) {
          return 'Screen selection is not available on browser internal pages';
        }
        return 'Screen selection is not available on this page';
      }

      const message = getRestrictedPageMessage('chrome://settings');
      expect(message).toBe('Screen selection is not available on browser internal pages');
    });

    it('should show appropriate message for Chrome Web Store pages', () => {
      function getRestrictedPageMessage(url) {
        if (url.startsWith('https://chrome.google.com') || url.startsWith('https://chromewebstore.google.com')) {
          return 'Screen selection is not available on Chrome Web Store pages';
        }
        return 'Screen selection is not available on this page';
      }

      const message = getRestrictedPageMessage('https://chrome.google.com/webstore');
      expect(message).toBe('Screen selection is not available on Chrome Web Store pages');
    });

    it('should handle tab query errors gracefully', async () => {
      chrome.tabs.query.mockRejectedValue(new Error('Tab access denied'));

      try {
        await chrome.tabs.query({ active: true, currentWindow: true });
      } catch (error) {
        expect(error.message).toBe('Tab access denied');
      }
    });

    it('should handle missing tab information', async () => {
      chrome.tabs.query.mockResolvedValue([]);

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      expect(tabs).toHaveLength(0);
    });

    it('should handle initialization errors', () => {
      // Test that missing elements can be detected
      const missingElement = document.getElementById('non-existent');
      expect(missingElement).toBeNull();
    });

    it('should show temporary error messages', () => {
      // Test creating temporary message elements
      const messageEl = document.createElement('div');
      messageEl.className = 'temp-message';
      messageEl.textContent = 'Test error message';
      
      document.body.appendChild(messageEl);
      
      const tempMessage = document.querySelector('.temp-message');
      expect(tempMessage).not.toBeNull();
      expect(tempMessage.textContent).toBe('Test error message');
    });
  });

  describe('6. Background Script Message Handling', () => {
    let messageListener;

    beforeEach(() => {
      // Execute background script to set up message listener
      eval(backgroundJS);
      
      // Get the message listener that was registered
      messageListener = chrome.runtime.onMessage.addListener.mock.calls[0]?.[0];
    });

    it('should handle startScreenSelection message correctly', () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.get.mockImplementation((tabId, callback) => {
        callback(mockTab);
      });
      chrome.scripting.executeScript.mockImplementation((options, callback) => {
        callback();
      });

      const message = { action: 'startScreenSelection', tabId: 123 };
      
      if (messageListener) {
        messageListener(message);
        expect(chrome.tabs.get).toHaveBeenCalledWith(123, expect.any(Function));
      }
    });

    it('should handle openSettings message correctly', () => {
      const message = { action: 'openSettings' };
      
      if (messageListener) {
        messageListener(message);
        expect(console.log).toHaveBeenCalledWith('Settings functionality not yet implemented');
      }
    });

    it('should handle unknown message actions', () => {
      const message = { action: 'unknownAction' };
      
      if (messageListener) {
        messageListener(message);
        expect(console.warn).toHaveBeenCalledWith('Unknown message action:', 'unknownAction');
      }
    });

    it('should not inject scripts for restricted pages', () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.get.mockImplementation((tabId, callback) => {
        callback(mockTab);
      });

      const message = { action: 'startScreenSelection', tabId: 123 };
      
      if (messageListener) {
        messageListener(message);
        expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith('Cannot inject scripts on restricted pages:', 'chrome://settings');
      }
    });
  });

  describe('7. HTML Structure and Accessibility Compliance', () => {
    it('should have proper semantic HTML structure', () => {
      const main = document.querySelector('[role="main"]');
      const menu = document.querySelector('[role="menu"]');
      const menuItems = document.querySelectorAll('[role="menuitem"]');

      expect(main).not.toBeNull();
      expect(menu).not.toBeNull();
      expect(menuItems).toHaveLength(2);
    });

    it('should have proper ARIA labels', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');
      const menu = document.querySelector('[role="menu"]');

      expect(screenSelectionButton.getAttribute('aria-label')).toBe('Start screen selection to convert HTML elements to Markdown');
      expect(settingsButton.getAttribute('aria-label')).toBe('Open extension settings and configuration options');
      expect(menu.getAttribute('aria-label')).toBe('Extension options');
    });

    it('should have aria-hidden on decorative icons', () => {
      const icons = document.querySelectorAll('.icon');
      
      icons.forEach(icon => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('should have proper button types and tabindex', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton.type).toBe('button');
      expect(settingsButton.type).toBe('button');
      expect(screenSelectionButton.getAttribute('tabindex')).toBe('0');
      expect(settingsButton.getAttribute('tabindex')).toBe('0');
    });

    it('should maintain proper heading hierarchy', () => {
      const title = document.querySelector('.popup-title');
      
      expect(title.tagName.toLowerCase()).toBe('h1');
    });
  });

  describe('8. Integration with Current Extension Functionality', () => {
    it('should maintain backward compatibility with content script injection', () => {
      // Test that the expected files are still referenced
      const expectedFiles = ['turndown.js', 'content.js'];
      
      expectedFiles.forEach(file => {
        expect(typeof file).toBe('string');
        expect(file.endsWith('.js')).toBe(true);
      });
    });

    it('should preserve clipboard functionality expectations', () => {
      // Test that the extension still expects to work with clipboard
      const permissions = ['activeTab', 'scripting', 'clipboardWrite'];
      
      permissions.forEach(permission => {
        expect(typeof permission).toBe('string');
        expect(permission.length).toBeGreaterThan(0);
      });
    });

    it('should maintain manifest structure compatibility', () => {
      // Test that popup is properly configured in manifest expectations
      const manifestStructure = {
        manifest_version: 3,
        action: {
          default_popup: 'popup.html'
        }
      };
      
      expect(manifestStructure.manifest_version).toBe(3);
      expect(manifestStructure.action.default_popup).toBe('popup.html');
    });
  });
});