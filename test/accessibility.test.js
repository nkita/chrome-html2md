import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Read the actual popup files
const popupHTML = fs.readFileSync(path.resolve('popup.html'), 'utf8');
const popupJS = fs.readFileSync(path.resolve('popup.js'), 'utf8');
const popupCSS = fs.readFileSync(path.resolve('popup.css'), 'utf8');

describe('Accessibility and Keyboard Navigation Tests', () => {
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

  describe('ARIA Attributes and Semantic HTML', () => {
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

    it('should have proper tabindex values', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton.getAttribute('tabindex')).toBe('0');
      expect(settingsButton.getAttribute('tabindex')).toBe('0');
    });

    it('should have aria-hidden on decorative icons', () => {
      const icons = document.querySelectorAll('.icon');
      
      icons.forEach(icon => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('should update aria-disabled when buttons are disabled', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton.getAttribute('aria-disabled')).toBe('true');
      expect(settingsButton.getAttribute('aria-disabled')).toBe('false');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Tab key navigation forward', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      // Start with screen selection focused
      screenSelectionButton.focus();
      expect(document.activeElement).toBe(screenSelectionButton);

      // Press Tab
      const tabEvent = new window.KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(tabEvent);

      expect(document.activeElement).toBe(settingsButton);
    });

    it('should handle Tab key navigation backward with Shift', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      // Start with settings focused
      settingsButton.focus();
      expect(document.activeElement).toBe(settingsButton);

      // Press Shift+Tab
      const shiftTabEvent = new window.KeyboardEvent('keydown', { 
        key: 'Tab', 
        shiftKey: true 
      });
      document.dispatchEvent(shiftTabEvent);

      expect(document.activeElement).toBe(screenSelectionButton);
    });

    it('should wrap Tab navigation at boundaries', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      // Start with settings focused (last element)
      settingsButton.focus();

      // Press Tab (should wrap to first element)
      const tabEvent = new window.KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(tabEvent);

      expect(document.activeElement).toBe(screenSelectionButton);
    });

    it('should handle Enter key activation', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      chrome.runtime.sendMessage.mockResolvedValue();

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      screenSelectionButton.focus();

      const enterEvent = new window.KeyboardEvent('keydown', { key: 'Enter' });
      screenSelectionButton.dispatchEvent(enterEvent);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'startScreenSelection',
        tabId: 123
      });
    });

    it('should handle Space key activation', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      // Mock window.location for settings test
      delete window.location;
      window.location = { href: '' };

      const settingsButton = document.getElementById('settings');
      settingsButton.focus();

      const spaceEvent = new window.KeyboardEvent('keydown', { key: ' ' });
      settingsButton.dispatchEvent(spaceEvent);

      expect(window.location.href).toBe('settings.html');
    });

    it('should handle Escape key to close popup', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const escapeEvent = new window.KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(window.close).toHaveBeenCalled();
    });

    it('should skip disabled buttons in Tab navigation', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const settingsButton = document.getElementById('settings');

      // Should focus settings button (screen selection is disabled)
      expect(document.activeElement).toBe(settingsButton);

      // Tab navigation should only include enabled buttons
      const focusableElements = popupManager.getFocusableElements();
      expect(focusableElements).toHaveLength(1);
      expect(focusableElements[0]).toBe(settingsButton);
    });
  });

  describe('Focus Management', () => {
    it('should focus first available button on initialization', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      expect(document.activeElement).toBe(screenSelectionButton);
    });

    it('should focus settings when screen selection is disabled', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const settingsButton = document.getElementById('settings');
      expect(document.activeElement).toBe(settingsButton);
    });

    it('should maintain focus visibility', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      // Test focus styles are applied (this would be visual in real browser)
      screenSelectionButton.focus();
      expect(document.activeElement).toBe(screenSelectionButton);

      settingsButton.focus();
      expect(document.activeElement).toBe(settingsButton);
    });
  });

  describe('Screen Reader Support', () => {
    it('should have descriptive button text', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      const screenSelectionText = screenSelectionButton.querySelector('.text').textContent;
      const settingsText = settingsButton.querySelector('.text').textContent;

      expect(screenSelectionText).toBe('Screen Selection');
      expect(settingsText).toBe('Settings');
    });

    it('should provide context through aria-label', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton.getAttribute('aria-label')).toContain('convert HTML elements to Markdown');
      expect(settingsButton.getAttribute('aria-label')).toContain('settings and configuration');
    });

    it('should indicate disabled state to screen readers', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      
      expect(screenSelectionButton.getAttribute('aria-disabled')).toBe('true');
      expect(screenSelectionButton.disabled).toBe(true);
    });

    it('should provide helpful title attributes for disabled buttons', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      
      expect(screenSelectionButton.title).toContain('Screen selection is not available');
    });
  });

  describe('High Contrast and Visual Accessibility', () => {
    it('should have proper button types', () => {
      const screenSelectionButton = document.getElementById('screen-selection');
      const settingsButton = document.getElementById('settings');

      expect(screenSelectionButton.type).toBe('button');
      expect(settingsButton.type).toBe('button');
    });

    it('should have disabled class for visual styling', async () => {
      const mockTab = { id: 123, url: 'chrome://settings' };
      chrome.tabs.query.mockResolvedValue([mockTab]);

      const popupManager = new PopupManager();
      await popupManager.initializePopup();

      const screenSelectionButton = document.getElementById('screen-selection');
      
      expect(screenSelectionButton.classList.contains('disabled')).toBe(true);
    });

    it('should maintain proper heading hierarchy', () => {
      const title = document.querySelector('.popup-title');
      
      expect(title.tagName.toLowerCase()).toBe('h1');
    });
  });
});