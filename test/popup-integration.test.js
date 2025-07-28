import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Read the actual popup files
const popupHTML = fs.readFileSync(path.resolve('popup.html'), 'utf8');
const popupJS = fs.readFileSync(path.resolve('popup.js'), 'utf8');

describe('Popup Integration Tests', () => {
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
    
    // Execute the popup JavaScript
    const script = document.createElement('script');
    script.textContent = popupJS;
    document.head.appendChild(script);
    
    // Wait for DOM to be ready
    await new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Screen Selection Flow', () => {
    it('should send correct message when screen selection button is clicked', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockResolvedValue();

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      const screenSelectionButton = document.getElementById('screen-selection');
      expect(screenSelectionButton).not.toBeNull();

      // Click the button
      screenSelectionButton.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'startScreenSelection',
        tabId: 123
      });
    });

    it('should close popup after successful screen selection', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockResolvedValue();

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const screenSelectionButton = document.getElementById('screen-selection');
      screenSelectionButton.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(window.close).toHaveBeenCalled();
    });
  });

  describe('Settings Flow', () => {
    it('should navigate to settings when settings button is clicked', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      // Mock window.location
      delete window.location;
      window.location = { href: '' };

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const settingsButton = document.getElementById('settings');
      expect(settingsButton).not.toBeNull();

      settingsButton.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(window.location.href).toBe('settings.html');
    });
  });

  describe('Restricted Pages Handling', () => {
    it('should disable screen selection for chrome:// pages', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton.disabled).toBe(true);
      expect(settingsButton.disabled).toBe(false);
      expect(screenSelectionButton.classList.contains('disabled')).toBe(true);
      
      const restrictedMessage = document.querySelector('.restricted-message');
      expect(restrictedMessage).not.toBeNull();
    });

    it('should not send message when screen selection is disabled', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const screenSelectionButton = document.getElementById('screen-selection');
      screenSelectionButton.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close popup when Escape key is pressed', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const escapeEvent = new window.KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(window.close).toHaveBeenCalled();
    });

    it('should activate button when Enter key is pressed', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockResolvedValue();

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const screenSelectionButton = document.getElementById('screen-selection');
      const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
      
      screenSelectionButton.dispatchEvent(enterEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'startScreenSelection',
        tabId: 123
      });
    });

    it('should activate button when Space key is pressed', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      // Mock window.location
      delete window.location;
      window.location = { href: '' };

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const settingsButton = document.getElementById('settings');
      const spaceEvent = new window.KeyboardEvent('keydown', { key: ' ' });
      
      settingsButton.dispatchEvent(spaceEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(window.location.href).toBe('settings.html');
    });
  });

  describe('Error Handling', () => {
    it('should handle tab query errors gracefully', async () => {
      chrome.tabs.query.mockRejectedValue(new Error('Tab access denied'));

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const screenSelectionButton = document.getElementById('screen-selection');
      expect(screenSelectionButton.disabled).toBe(true);
      
      const restrictedMessage = document.querySelector('.restricted-message');
      expect(restrictedMessage).not.toBeNull();
    });

    it('should handle message sending errors gracefully', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Connection failed'));

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const screenSelectionButton = document.getElementById('screen-selection');
      screenSelectionButton.click();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not throw error and should log error
      expect(console.error).toHaveBeenCalledWith('Error starting screen selection:', expect.any(Error));
    });

    it('should handle missing tab information', async () => {
      chrome.tabs.query.mockResolvedValue([]);

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const screenSelectionButton = document.getElementById('screen-selection');
      expect(screenSelectionButton.disabled).toBe(true);
    });
  });

  describe('UI State Management', () => {
    it('should focus first available button on initialization', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const screenSelectionButton = document.getElementById('screen-selection');
      expect(document.activeElement).toBe(screenSelectionButton);
    });

    it('should focus settings when screen selection is disabled', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const settingsButton = document.getElementById('settings');
      expect(document.activeElement).toBe(settingsButton);
    });

    it('should update ARIA attributes correctly', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      // Trigger DOMContentLoaded to initialize popup
      const event = new window.Event('DOMContentLoaded');
      document.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 10));

      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton.getAttribute('aria-disabled')).toBe('true');
      expect(settingsButton.getAttribute('aria-disabled')).toBe('false');
    });
  });

  describe('Message Content Validation', () => {
    it('should show appropriate restricted message for different page types', async () => {
      const testCases = [
        { url: 'chrome://settings', expectedText: 'Screen selection is not available on browser internal pages' },
        { url: 'https://chrome.google.com/webstore', expectedText: 'Screen selection is not available on Chrome Web Store pages' },
        { url: 'chrome-extension://test/popup.html', expectedText: 'Screen selection is not available on extension pages' },
        { url: 'file:///path/to/file.html', expectedText: 'Screen selection is not available on local file pages' }
      ];

      for (const testCase of testCases) {
        // Reset DOM for each test case
        const freshEvent = new window.Event('DOMContentLoaded');
        
        chrome.tabs.query.mockResolvedValue([{ id: 123, url: testCase.url }]);
        
        document.dispatchEvent(freshEvent);
        await new Promise(resolve => setTimeout(resolve, 10));

        const message = document.querySelector('.restricted-message .text');
        expect(message?.textContent).toBe(testCase.expectedText);
        
        // Clean up for next iteration
        const existingMessage = document.querySelector('.restricted-message');
        if (existingMessage) {
          existingMessage.remove();
        }
      }
    });
  });
});