import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Read the actual popup files
const popupHTML = fs.readFileSync(path.resolve('popup.html'), 'utf8');
const popupJS = fs.readFileSync(path.resolve('popup.js'), 'utf8');
const popupCSS = fs.readFileSync(path.resolve('popup.css'), 'utf8');

describe('Popup Functionality Tests', () => {
  let dom;
  let document;
  let window;
  let PopupManager;

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
    
    // Add CSS to the document
    const style = document.createElement('style');
    style.textContent = popupCSS;
    document.head.appendChild(style);
    
    // Reset Chrome API mocks
    vi.clearAllMocks();
    chrome.runtime.lastError = null;
    
    // Execute the popup JavaScript in the context
    const script = document.createElement('script');
    script.textContent = popupJS;
    document.head.appendChild(script);
    
    // Get the PopupManager class from the global scope
    PopupManager = window.PopupManager;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Popup Message Creation and UI State Management', () => {
    it('should create correct message for screen selection', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockResolvedValue();

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      // Simulate screen selection button click
      const screenSelectionButton = document.getElementById('screen-selection');
      await screenSelectionButton.click();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'startScreenSelection',
        tabId: 123
      });
    });

    it('should handle settings message correctly', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      // Mock window.location for settings navigation
      delete window.location;
      window.location = { href: '' };

      const settingsButton = document.getElementById('settings');
      await settingsButton.click();

      expect(window.location.href).toBe('settings.html');
    });

    it('should initialize UI state correctly for normal pages', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton.disabled).toBe(false);
      expect(settingsButton.disabled).toBe(false);
      expect(screenSelectionButton.classList.contains('disabled')).toBe(false);
      expect(document.querySelector('.restricted-message')).toBeNull();
    });

    it('should initialize UI state correctly for restricted pages', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton.disabled).toBe(true);
      expect(settingsButton.disabled).toBe(false);
      expect(screenSelectionButton.classList.contains('disabled')).toBe(true);
      expect(document.querySelector('.restricted-message')).not.toBeNull();
    });
  });

  describe('Popup-Background Communication', () => {
    it('should send startScreenSelection message with correct tabId', async () => {
      const mockTab = { id: 456, url: 'https://test.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockResolvedValue();

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      await popupManager.handleScreenSelection();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'startScreenSelection',
        tabId: 456
      });
    });

    it('should handle message sending errors gracefully', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Connection failed'));

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      // Should not throw error
      await expect(popupManager.handleScreenSelection()).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith('Error starting screen selection:', expect.any(Error));
    });

    it('should not send message when screen selection is disabled', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      await popupManager.handleScreenSelection();

      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Screen Selection Activation', () => {
    it('should close popup after successful screen selection activation', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockResolvedValue();

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      await popupManager.handleScreenSelection();

      expect(window.close).toHaveBeenCalled();
    });

    it('should maintain identical functionality to current extension', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockResolvedValue();

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      screenSelectionButton.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'startScreenSelection',
        tabId: 123
      });
      expect(window.close).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation and Accessibility', () => {
    it('should handle Escape key to close popup', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const escapeEvent = new window.KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(window.close).toHaveBeenCalled();
    });

    it('should handle Enter key on buttons', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockResolvedValue();

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
      
      screenSelectionButton.dispatchEvent(enterEvent);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'startScreenSelection',
        tabId: 123
      });
    });

    it('should handle Space key on buttons', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      // Mock window.location for settings test
      delete window.location;
      window.location = { href: '' };

      const settingsButton = document.getElementById('settings');
      const spaceEvent = new window.KeyboardEvent('keydown', { key: ' ' });
      
      settingsButton.dispatchEvent(spaceEvent);

      expect(window.location.href).toBe('settings.html');
    });

    it('should focus first available button on initialization', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      expect(document.activeElement).toBe(screenSelectionButton);
    });

    it('should focus settings button when screen selection is disabled', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const settingsButton = document.getElementById('settings');
      expect(document.activeElement).toBe(settingsButton);
    });

    it('should have proper ARIA attributes', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton.getAttribute('aria-disabled')).toBe('false');
      expect(settingsButton.getAttribute('aria-disabled')).toBe('false');
      expect(screenSelectionButton.getAttribute('role')).toBe('menuitem');
      expect(settingsButton.getAttribute('role')).toBe('menuitem');
    });

    it('should update ARIA attributes for disabled buttons', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      expect(screenSelectionButton.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Restricted Pages and Error Conditions', () => {
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

    restrictedUrls.forEach(url => {
      it(`should disable screen selection for ${url}`, async () => {
        const mockTab = { id: 123, url };
        chrome.tabs.query.mockResolvedValue([mockTab]);

        const popupManager = new PopupManager();
        await popupManager.initializePopup();

        const screenSelectionButton = document.getElementById('screen-selection');
        const settingsButton = document.getElementById('settings');

        expect(screenSelectionButton.disabled).toBe(true);
        expect(settingsButton.disabled).toBe(false);
        expect(screenSelectionButton.classList.contains('disabled')).toBe(true);
        expect(document.querySelector('.restricted-message')).not.toBeNull();
      });
    });

    it('should show appropriate message for chrome:// pages', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const message = document.querySelector('.restricted-message .text');
      expect(message.textContent).toBe('Screen selection is not available on browser internal pages');
    });

    it('should show appropriate message for Chrome Web Store pages', async () => {
      const mockTab = { id: 123, url: 'https://chrome.google.com/webstore' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const message = document.querySelector('.restricted-message .text');
      expect(message.textContent).toBe('Screen selection is not available on Chrome Web Store pages');
    });

    it('should handle tab query errors gracefully', async () => {
      chrome.tabs.query.mockRejectedValue(new Error('Tab access denied'));

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      expect(screenSelectionButton.disabled).toBe(true);
      expect(document.querySelector('.restricted-message')).not.toBeNull();
    });

    it('should handle missing tab information', async () => {
      chrome.tabs.query.mockResolvedValue([]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      expect(screenSelectionButton.disabled).toBe(true);
    });

    it('should handle initialization errors', async () => {
      // Remove required elements to trigger initialization error
      document.getElementById('screen-selection').remove();

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      expect(console.error).toHaveBeenCalledWith('Required popup elements not found');
      expect(popupManager.isInitialized).toBe(false);
    });

    it('should show temporary error messages', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      popupManager.showTemporaryMessage('Test error message');

      const tempMessage = document.querySelector('.temp-message');
      expect(tempMessage).not.toBeNull();
      expect(tempMessage.textContent).toBe('Test error message');
    });
  });

  describe('UI State Management Edge Cases', () => {
    it('should handle multiple restricted message updates', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      // Should have one message
      expect(document.querySelectorAll('.restricted-message')).toHaveLength(1);

      // Update to another restricted page
      popupManager.currentTab = { id: 123, url: 'https://chrome.google.com/webstore' };
      popupManager.checkTabPermissions();

      // Should still have only one message (old one replaced)
      expect(document.querySelectorAll('.restricted-message')).toHaveLength(1);
    });

    it('should remove restricted message when switching to allowed page', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      expect(document.querySelector('.restricted-message')).not.toBeNull();

      // Switch to allowed page
      popupManager.currentTab = { id: 123, url: 'https://example.com' };
      popupManager.checkTabPermissions();

      expect(document.querySelector('.restricted-message')).toBeNull();
    });

    it('should handle getFocusableElements with disabled buttons', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const focusableElements = popupManager.getFocusableElements();
      
      // Only settings button should be focusable
      expect(focusableElements).toHaveLength(1);
      expect(focusableElements[0]).toBe(document.getElementById('settings'));
    });
  });
});