import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Read the background script
const backgroundJS = fs.readFileSync(path.resolve('background.js'), 'utf8');

describe('Background Script Integration Tests', () => {
  let handleScreenSelection;
  let handleSettings;

  beforeEach(() => {
    // Reset Chrome API mocks
    vi.clearAllMocks();
    chrome.runtime.lastError = null;

    // Execute background script to define functions in global scope
    eval(backgroundJS);
    
    // Functions are now available in global scope
    handleScreenSelection = global.handleScreenSelection;
    handleSettings = global.handleSettings;
  });

  describe('Message Handling', () => {
    it('should handle startScreenSelection message correctly', () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.get.mockImplementation((tabId, callback) => {
        callback(mockTab);
      });
      chrome.scripting.executeScript.mockImplementation((options, callback) => {
        callback();
      });

      const message = { action: 'startScreenSelection', tabId: 123 };
      
      // Simulate message listener
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      messageListener(message);

      expect(chrome.tabs.get).toHaveBeenCalledWith(123, expect.any(Function));
    });

    it('should handle openSettings message correctly', () => {
      const message = { action: 'openSettings' };
      
      // Simulate message listener
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      messageListener(message);

      expect(console.log).toHaveBeenCalledWith('Settings functionality not yet implemented');
    });

    it('should handle unknown message actions', () => {
      const message = { action: 'unknownAction' };
      
      // Simulate message listener
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      messageListener(message);

      expect(console.warn).toHaveBeenCalledWith('Unknown message action:', 'unknownAction');
    });

    it('should handle message processing errors', () => {
      // Mock chrome.tabs.get to throw an error
      chrome.tabs.get.mockImplementation(() => {
        throw new Error('Tab access error');
      });

      const message = { action: 'startScreenSelection', tabId: 123 };
      
      // Simulate message listener
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      messageListener(message);

      expect(console.error).toHaveBeenCalledWith('Error in handleScreenSelection:', expect.any(Error));
    });
  });

  describe('Screen Selection Handling', () => {
    it('should inject scripts for valid pages', () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.get.mockImplementation((tabId, callback) => {
        callback(mockTab);
      });
      chrome.scripting.executeScript.mockImplementation((options, callback) => {
        callback();
      });

      handleScreenSelection(123);

      expect(chrome.tabs.get).toHaveBeenCalledWith(123, expect.any(Function));
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['turndown.js', 'content.js']
      }, expect.any(Function));
    });

    it('should not inject scripts for chrome:// pages', () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.get.mockImplementation((tabId, callback) => {
        callback(mockTab);
      });

      handleScreenSelection(123);

      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('Cannot inject scripts on restricted pages:', 'chrome://settings');
    });

    it('should not inject scripts for Chrome Web Store pages', () => {
      const mockTab = { id: 123, url: 'https://chrome.google.com/webstore' };
      chrome.tabs.get.mockImplementation((tabId, callback) => {
        callback(mockTab);
      });

      handleScreenSelection(123);

      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('Cannot inject scripts on restricted pages:', 'https://chrome.google.com/webstore');
    });

    it('should handle tab get errors', () => {
      chrome.tabs.get.mockImplementation((tabId, callback) => {
        chrome.runtime.lastError = { message: 'Tab not found' };
        callback(null);
      });

      handleScreenSelection(123);

      expect(console.error).toHaveBeenCalledWith('Error getting tab information:', { message: 'Tab not found' });
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    it('should handle script injection errors', () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.get.mockImplementation((tabId, callback) => {
        callback(mockTab);
      });
      chrome.scripting.executeScript.mockImplementation((options, callback) => {
        chrome.runtime.lastError = { message: 'Script injection failed' };
        callback();
      });

      handleScreenSelection(123);

      expect(console.error).toHaveBeenCalledWith('Error injecting scripts:', { message: 'Script injection failed' });
    });

    it('should handle handleScreenSelection function errors', () => {
      // Mock chrome.tabs.get to throw an error
      chrome.tabs.get.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      handleScreenSelection(123);

      expect(console.error).toHaveBeenCalledWith('Error in handleScreenSelection:', expect.any(Error));
    });
  });

  describe('Settings Handling', () => {
    it('should log placeholder message for settings', () => {
      handleSettings();

      expect(console.log).toHaveBeenCalledWith('Settings functionality not yet implemented');
    });

    it('should handle settings function errors', () => {
      // Mock console.log to throw an error to test error handling
      const originalLog = console.log;
      console.log = vi.fn(() => {
        throw new Error('Console error');
      });

      handleSettings();

      expect(console.error).toHaveBeenCalledWith('Error in handleSettings:', expect.any(Error));

      // Restore original console.log
      console.log = originalLog;
    });
  });
});