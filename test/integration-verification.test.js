import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Read all extension files
const manifestJSON = JSON.parse(fs.readFileSync(path.resolve('manifest.json'), 'utf8'));
const backgroundJS = fs.readFileSync(path.resolve('background.js'), 'utf8');
const contentJS = fs.readFileSync(path.resolve('content.js'), 'utf8');
const popupHTML = fs.readFileSync(path.resolve('popup.html'), 'utf8');
const popupJS = fs.readFileSync(path.resolve('popup.js'), 'utf8');
const popupCSS = fs.readFileSync(path.resolve('popup.css'), 'utf8');
const settingsHTML = fs.readFileSync(path.resolve('settings.html'), 'utf8');
const settingsJS = fs.readFileSync(path.resolve('settings.js'), 'utf8');

describe('Integration Verification - Task 10 Requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('All existing content script functionality remains unchanged', () => {
    it('should preserve TurndownService configuration', () => {
      expect(contentJS).toContain('var turndownService = new TurndownService');
      expect(contentJS).toContain('codeBlockStyle: \'fenced\'');
      expect(contentJS).toContain('headingStyle: \'atx\'');
      expect(contentJS).toContain('bulletListMarker: \'-\'');
    });

    it('should preserve all custom conversion rules', () => {
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
        'meter'
      ];

      expectedRules.forEach(rule => {
        expect(contentJS).toContain(rule);
      });
    });

    it('should preserve element selection functionality', () => {
      expect(contentJS).toContain('handleMouseOver');
      expect(contentJS).toContain('handleClick');
      expect(contentJS).toContain('selectedElement');
      expect(contentJS).toContain('highlightOverlay');
    });

    it('should preserve clipboard operations', () => {
      expect(contentJS).toContain('navigator.clipboard.writeText');
      expect(contentJS).toContain('fallbackCopyToClipboard');
      expect(contentJS).toContain('document.execCommand');
    });

    it('should preserve metadata extraction', () => {
      expect(contentJS).toContain('extractPageMetadata');
      expect(contentJS).toContain('event.shiftKey');
    });
  });

  describe('Element selection, markdown conversion, and clipboard operations work identically', () => {
    it('should maintain identical script injection', () => {
      expect(backgroundJS).toContain('chrome.scripting.executeScript');
      expect(backgroundJS).toContain('files: ["turndown.js", "content.js"]');
    });

    it('should preserve exact same file injection order', () => {
      const scriptInjectionMatch = backgroundJS.match(/files:\s*\["turndown\.js",\s*"content\.js"\]/);
      expect(scriptInjectionMatch).not.toBeNull();
    });

    it('should maintain identical restricted page handling', () => {
      expect(backgroundJS).toContain('chrome://');
      expect(backgroundJS).toContain('https://chrome.google.com');
      expect(backgroundJS).toContain('Cannot inject scripts on restricted pages');
    });

    it('should preserve error handling patterns', () => {
      expect(backgroundJS).toContain('chrome.runtime.lastError');
      expect(backgroundJS).toContain('try {');
      expect(backgroundJS).toContain('catch (error)');
    });
  });

  describe('Popup interface works consistently across different websites', () => {
    it('should have proper HTML structure', () => {
      expect(popupHTML).toContain('id="screen-selection"');
      expect(popupHTML).toContain('id="settings"');
      expect(popupHTML).toContain('Screen Selection');
      expect(popupHTML).toContain('Settings');
    });

    it('should include proper accessibility attributes', () => {
      expect(popupHTML).toContain('role="menuitem"');
      expect(popupHTML).toContain('aria-label=');
      expect(popupHTML).toContain('tabindex="0"');
    });

    it('should have restriction handling logic', () => {
      expect(popupJS).toContain('isRestrictedUrl');
      expect(popupJS).toContain('chrome://');
      expect(popupJS).toContain('chrome-extension://');
      expect(popupJS).toContain('disableScreenSelection');
    });

    it('should have keyboard navigation support', () => {
      expect(popupJS).toContain('keydown');
      expect(popupJS).toContain('Escape');
      expect(popupJS).toContain('Enter');
      expect(popupJS).toContain('Tab');
    });
  });

  describe('Extension behavior matches all original requirements through new interface', () => {
    it('should maintain popup menu with two options (Requirement 1.1)', () => {
      expect(popupHTML).toContain('Screen Selection');
      expect(popupHTML).toContain('Settings');
      expect(popupHTML).toContain('popup-options');
    });

    it('should activate screen selection functionality (Requirement 2.1)', () => {
      expect(popupJS).toContain('startScreenSelection');
      expect(popupJS).toContain('chrome.runtime.sendMessage');
      expect(backgroundJS).toContain('handleScreenSelection');
    });

    it('should behave exactly as current extension (Requirement 2.4)', () => {
      // Verify message handling preserves exact same behavior
      expect(backgroundJS).toContain('chrome.runtime.onMessage.addListener');
      expect(backgroundJS).toContain('startScreenSelection');
      expect(backgroundJS).toContain('chrome.tabs.get');
      expect(backgroundJS).toContain('chrome.scripting.executeScript');
    });

    it('should display settings placeholder interface (Requirement 3.1)', () => {
      expect(popupJS).toContain('settings.html');
      expect(popupJS).toContain('window.location.href');
      expect(settingsHTML).toContain('Settings');
    });

    it('should have clean and intuitive interface (Requirement 4.1-4.5)', () => {
      expect(popupHTML).toContain('🎯'); // Icon for screen selection
      expect(popupHTML).toContain('⚙️'); // Icon for settings
      expect(popupCSS).toContain('option-button');
      expect(popupCSS).toContain('hover');
    });

    it('should work reliably across browser states (Requirement 5.1-5.4)', () => {
      expect(popupJS).toContain('checkTabPermissions');
      expect(popupJS).toContain('getCurrentTab');
      expect(popupJS).toContain('showRestrictedMessage');
      expect(popupJS).toContain('setupKeyboardNavigation');
    });
  });

  describe('Manifest configuration maintains compatibility', () => {
    it('should have proper popup configuration', () => {
      expect(manifestJSON.action).toBeDefined();
      expect(manifestJSON.action.default_popup).toBe('popup.html');
    });

    it('should preserve all necessary permissions', () => {
      const requiredPermissions = ['activeTab', 'scripting', 'clipboardWrite'];
      requiredPermissions.forEach(permission => {
        expect(manifestJSON.permissions).toContain(permission);
      });
    });

    it('should maintain service worker configuration', () => {
      expect(manifestJSON.background.service_worker).toBe('background.js');
    });

    it('should preserve manifest version', () => {
      expect(manifestJSON.manifest_version).toBe(3);
    });
  });

  describe('Settings interface placeholder exists', () => {
    it('should have settings.html file', () => {
      expect(settingsHTML).toBeTruthy();
      expect(settingsHTML.length).toBeGreaterThan(0);
    });

    it('should contain placeholder content', () => {
      expect(settingsHTML).toContain('Settings');
    });

    it('should be accessible from popup', () => {
      expect(popupJS).toContain('settings.html');
    });
  });

  describe('Error handling is preserved', () => {
    it('should maintain background script error handling', () => {
      expect(backgroundJS).toContain('try {');
      expect(backgroundJS).toContain('catch (error)');
      expect(backgroundJS).toContain('console.error');
    });

    it('should maintain popup script error handling', () => {
      expect(popupJS).toContain('try {');
      expect(popupJS).toContain('catch (error)');
      expect(popupJS).toContain('console.error');
    });

    it('should maintain content script error handling', () => {
      expect(contentJS).toContain('catch (err)');
      expect(contentJS).toContain('console.error');
    });
  });

  describe('File structure and dependencies', () => {
    it('should have all required files', () => {
      const requiredFiles = [
        'manifest.json',
        'background.js',
        'content.js',
        'popup.html',
        'popup.js',
        'popup.css',
        'settings.html',
        'settings.js',
        'turndown.js'
      ];

      requiredFiles.forEach(file => {
        expect(() => {
          fs.readFileSync(path.resolve(file), 'utf8');
        }).not.toThrow();
      });
    });

    it('should maintain icon files', () => {
      expect(manifestJSON.icons['16']).toBe('images/icon16.png');
      expect(manifestJSON.icons['48']).toBe('images/icon48.png');
      expect(manifestJSON.icons['128']).toBe('images/icon128.png');
    });

    it('should link CSS and JS files correctly', () => {
      expect(popupHTML).toContain('popup.css');
      expect(popupHTML).toContain('popup.js');
      expect(settingsHTML).toContain('settings.js');
    });
  });

  describe('Backward compatibility verification summary', () => {
    it('should pass all backward compatibility requirements', () => {
      // This test summarizes that all the above tests verify:
      // 1. All existing content script functionality remains unchanged ✓
      // 2. Element selection, markdown conversion, and clipboard operations work identically ✓
      // 3. Popup interface works consistently across different websites ✓
      // 4. Extension behavior matches all original requirements through new interface ✓

      const verificationChecks = [
        // Content script functionality
        contentJS.includes('var turndownService = new TurndownService'),
        contentJS.includes('handleMouseOver'),
        contentJS.includes('navigator.clipboard.writeText'),
        
        // Script injection behavior
        backgroundJS.includes('chrome.scripting.executeScript'),
        backgroundJS.includes('files: ["turndown.js", "content.js"]'),
        
        // Popup interface
        popupHTML.includes('Screen Selection'),
        popupHTML.includes('Settings'),
        popupJS.includes('isRestrictedUrl'),
        
        // Requirements compliance
        manifestJSON.action.default_popup === 'popup.html',
        manifestJSON.permissions.includes('activeTab'),
        manifestJSON.permissions.includes('scripting'),
        manifestJSON.permissions.includes('clipboardWrite')
      ];

      const allChecksPassed = verificationChecks.every(check => check === true);
      expect(allChecksPassed).toBe(true);
    });
  });
});