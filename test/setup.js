// Test setup file for Chrome extension testing
import { vi } from 'vitest';

// Mock Chrome APIs
global.chrome = {
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
    lastError: null,
  },
  scripting: {
    executeScript: vi.fn(),
  },
  action: {
    onClicked: {
      addListener: vi.fn(),
    },
  },
};

// Mock window.close for popup tests
global.window.close = vi.fn();

// Mock console methods to avoid noise in tests
global.console.error = vi.fn();
global.console.warn = vi.fn();
global.console.log = vi.fn();