// Simple test for restricted page detection
// This can be run in browser console to verify functionality

function testRestrictedPageDetection() {
  // Mock the PopupManager class for testing
  class TestPopupManager {
    isRestrictedUrl(url) {
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

    getRestrictedPageMessage(url) {
      if (url.startsWith('chrome://') || url.startsWith('edge://')) {
        return 'Screen selection is not available on browser internal pages';
      } else if (url.startsWith('chrome-extension://') || url.startsWith('moz-extension://')) {
        return 'Screen selection is not available on extension pages';
      } else if (url.startsWith('https://chrome.google.com') || url.startsWith('https://chromewebstore.google.com')) {
        return 'Screen selection is not available on Chrome Web Store pages';
      } else if (url.startsWith('file://')) {
        return 'Screen selection is not available on local file pages';
      } else if (url.startsWith('about:')) {
        return 'Screen selection is not available on browser about pages';
      } else {
        return 'Screen selection is not available on this page';
      }
    }
  }

  const manager = new TestPopupManager();
  
  // Test cases
  const testCases = [
    // Restricted URLs
    { url: 'chrome://settings/', expected: true, message: 'browser internal pages' },
    { url: 'chrome-extension://abc123/popup.html', expected: true, message: 'extension pages' },
    { url: 'https://chrome.google.com/webstore', expected: true, message: 'Chrome Web Store pages' },
    { url: 'https://chromewebstore.google.com/detail/test', expected: true, message: 'Chrome Web Store pages' },
    { url: 'edge://settings/', expected: true, message: 'browser internal pages' },
    { url: 'about:blank', expected: true, message: 'browser about pages' },
    { url: 'file:///Users/test/file.html', expected: true, message: 'local file pages' },
    { url: 'data:text/html,<h1>Test</h1>', expected: true, message: 'this page' },
    { url: 'javascript:alert("test")', expected: true, message: 'this page' },
    
    // Non-restricted URLs
    { url: 'https://www.google.com', expected: false },
    { url: 'https://github.com', expected: false },
    { url: 'http://localhost:3000', expected: false },
    { url: 'https://example.com/page', expected: false }
  ];

  console.log('Testing restricted page detection...\n');
  
  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    const isRestricted = manager.isRestrictedUrl(testCase.url);
    const message = isRestricted ? manager.getRestrictedPageMessage(testCase.url) : '';
    
    const success = isRestricted === testCase.expected;
    
    if (success) {
      passed++;
      console.log(`✅ Test ${index + 1}: ${testCase.url} - PASSED`);
      if (testCase.message && message.includes(testCase.message)) {
        console.log(`   Message correctly contains: "${testCase.message}"`);
      }
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: ${testCase.url} - FAILED`);
      console.log(`   Expected: ${testCase.expected}, Got: ${isRestricted}`);
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run the test
testRestrictedPageDetection();