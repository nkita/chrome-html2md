import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Content Security Policy Compliance', () => {
  it('should not have inline JavaScript in settings.html', () => {
    const settingsHTML = fs.readFileSync(path.resolve('settings.html'), 'utf8');
    
    // Check that there are no inline script tags with content
    const inlineScriptRegex = /<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/gi;
    const inlineScripts = settingsHTML.match(inlineScriptRegex);
    
    expect(inlineScripts).toBeNull();
  });

  it('should reference external JavaScript files only', () => {
    const settingsHTML = fs.readFileSync(path.resolve('settings.html'), 'utf8');
    
    // Check that script tags have src attributes
    const externalScriptRegex = /<script\s+src=["'][^"']+["'][^>]*><\/script>/gi;
    const externalScripts = settingsHTML.match(externalScriptRegex);
    
    expect(externalScripts).not.toBeNull();
    expect(externalScripts).toHaveLength(1);
    expect(externalScripts[0]).toContain('settings.js');
  });

  it('should have settings.js file with expected functionality', () => {
    const settingsJS = fs.readFileSync(path.resolve('settings.js'), 'utf8');
    
    // Verify key functionality is present
    expect(settingsJS).toContain('class SettingsManager');
    expect(settingsJS).toContain('initializeSettings');
    expect(settingsJS).toContain('setupEventListeners');
    expect(settingsJS).toContain('setupKeyboardNavigation');
    expect(settingsJS).toContain('goBackToPopup');
    expect(settingsJS).toContain('closeSettings');
  });

  it('should not have inline event handlers in HTML', () => {
    const settingsHTML = fs.readFileSync(path.resolve('settings.html'), 'utf8');
    
    // Check for common inline event handlers
    const inlineEventHandlers = [
      /onclick=/gi,
      /onload=/gi,
      /onchange=/gi,
      /onsubmit=/gi,
      /onkeydown=/gi,
      /onkeyup=/gi,
      /onmouseover=/gi,
      /onmouseout=/gi
    ];
    
    inlineEventHandlers.forEach(regex => {
      expect(settingsHTML.match(regex)).toBeNull();
    });
  });

  it('should not have inline styles that could violate CSP', () => {
    const settingsHTML = fs.readFileSync(path.resolve('settings.html'), 'utf8');
    
    // Check for javascript: URLs in style attributes (potential CSP violation)
    const javascriptUrlRegex = /javascript:/gi;
    expect(settingsHTML.match(javascriptUrlRegex)).toBeNull();
  });

  it('should have proper external resource references', () => {
    const settingsHTML = fs.readFileSync(path.resolve('settings.html'), 'utf8');
    
    // Verify CSS is external
    expect(settingsHTML).toContain('href="popup.css"');
    
    // Verify JS is external
    expect(settingsHTML).toContain('src="settings.js"');
    
    // Should not have data: URLs or other potentially problematic sources
    expect(settingsHTML).not.toMatch(/src="data:/);
    expect(settingsHTML).not.toMatch(/href="data:/);
  });
});