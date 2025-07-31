// 既存の拡張機能UIをクリーンアップ
function cleanupExistingExtension() {
  // 既存のUI要素を全て削除
  const existingElements = document.querySelectorAll('.html-to-markdown-extension-ui');
  existingElements.forEach(element => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
  
  // イベントリスナーを削除
  if (window.extensionMouseOverHandler) {
    document.removeEventListener('mouseover', window.extensionMouseOverHandler);
  }
  if (window.extensionClickHandler) {
    document.removeEventListener('click', window.extensionClickHandler, true);
  }
  if (window.extensionKeyDownHandler) {
    document.removeEventListener('keydown', window.extensionKeyDownHandler);
  }
  
  // グローバル参照をクリア
  window.extensionInfoBanner = null;
  window.extensionHighlightOverlay = null;
  window.extensionInfoLabel = null;
}

// 既存の拡張機能をクリーンアップしてから開始
cleanupExistingExtension();

if (window.isExtensionActive) {
  // 既に実行中の場合は一旦クリーンアップしてから再開
  console.log('Extension already active, cleaning up and restarting...');
  cleanupExistingExtension();
}

window.isExtensionActive = true;

// Global conversion mode setting (重複宣言を防ぐ)
if (typeof window.conversionMode === 'undefined') {
  window.conversionMode = 'selection'; // default
}

// Turndownサービスを設定から作成 (重複宣言を防ぐ)
if (typeof window.turndownService === 'undefined') {
  window.turndownService = TurndownConfig.createService();
}

// カスタムルールは TurndownConfig で設定済み

// 選択された要素 (重複宣言を防ぐ)
if (typeof window.selectedElement === 'undefined') {
  window.selectedElement = null;
}

// --- UI Elements ---
// UI要素を作成（常に新しく作成）
function createUIElements() {
  // ハイライトオーバーレイを作成
  if (!window.extensionHighlightOverlay || !document.body.contains(window.extensionHighlightOverlay)) {
    const highlightOverlay = document.createElement('div');
    highlightOverlay.className = 'html-to-markdown-extension-ui';
    Object.assign(highlightOverlay.style, {
      position: 'absolute',
      background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.15), rgba(66, 133, 244, 0.25))',
      border: '2px solid rgba(66, 133, 244, 0.6)',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(66, 133, 244, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(4px)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: '9998',
      pointerEvents: 'none',
      opacity: '0'
    });

    document.body.appendChild(highlightOverlay);
    window.extensionHighlightOverlay = highlightOverlay;
  }

  // 情報ラベルを作成
  if (!window.extensionInfoLabel || !document.body.contains(window.extensionInfoLabel)) {
    const infoLabel = document.createElement('div');
    infoLabel.className = 'html-to-markdown-extension-ui';
    Object.assign(infoLabel.style, {
      position: 'absolute',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '6px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '13px',
      fontWeight: '500',
      padding: '6px 12px',
      transition: 'all 0.2s ease-out',
      zIndex: '9999',
      pointerEvents: 'none',
      opacity: '0'
    });

    document.body.appendChild(infoLabel);
    window.extensionInfoLabel = infoLabel;
  }
}

// UI要素を作成
createUIElements();

  // クリップボード機能は CommonUtils を使用
// クリップボード機能は CommonUtils を使用
async function copyToClipboard(markdown, isSelectionMode = false) {
  const success = await CommonUtils.copyToClipboard(markdown);
  
  if (success) {
    if (isSelectionMode) {
      CommonUtils.showNotification('Copied to clipboard!');
      cleanup();
    }
  } else {
    CommonUtils.showNotification('Copy failed - please copy manually', 'error');
    console.log('Markdown content:', markdown);
    if (isSelectionMode) {
      cleanup();
    }
  }
}

  // メタデータ抽出は MetadataExtractor を使用

  // --- Event Handlers ---
function handleMouseOver(event) {
  // If the element is inside a pre, select the pre element itself
  const codeBlock = event.target.closest('pre');
  window.selectedElement = codeBlock || event.target;

  const rect = window.selectedElement.getBoundingClientRect();

  // Update highlight overlay with smooth animation
  const highlightOverlay = window.extensionHighlightOverlay;
  if (highlightOverlay) {
    highlightOverlay.style.width = `${rect.width}px`;
    highlightOverlay.style.height = `${rect.height}px`;
    highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
    highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
    highlightOverlay.style.opacity = '1';
  }

  // Update info label with smooth animation
  const tag = window.selectedElement.tagName.toLowerCase();
  const id = window.selectedElement.id ? `#${window.selectedElement.id}` : '';
  const classes = Array.from(window.selectedElement.classList).map(c => `.${c}`).join('');
  const infoLabel = window.extensionInfoLabel;
  
  if (infoLabel) {
    infoLabel.textContent = `${tag}${id}${classes}`;

    // Position info label above the element
    const labelTop = rect.top + window.scrollY - 35; // Fixed offset for better positioning
    const labelLeft = Math.max(10, Math.min(rect.left + window.scrollX, window.innerWidth - 200));

    infoLabel.style.top = `${labelTop}px`;
    infoLabel.style.left = `${labelLeft}px`;
    infoLabel.style.opacity = '1';
  }
}

function handleClick(event) {
  event.preventDefault();
  event.stopPropagation();

  if (window.selectedElement) {
    // If the user clicked inside a code block, convert the whole block.
    const elementToConvert = window.selectedElement.closest('pre') || window.selectedElement;
    const html = elementToConvert.outerHTML;
    let markdown = window.turndownService.turndown(html);

    // Check settings for metadata inclusion
    chrome.storage.sync.get({ includeMetadata: true, language: 'en' }, (result) => {
      if (result.includeMetadata || event.shiftKey) {
        const metadata = MetadataExtractor.extractPageMetadata(window.selectedElement, result.language);
        markdown = metadata + markdown;
      }

      // Copy to clipboard (selection mode)
      copyToClipboard(markdown, true);
    });
  }
}

function handleKeyDown(event) {
  if (event.key === 'Escape') {
    cleanup();
  }
}

  // グローバル参照として保存（クリーンアップ用）
  window.extensionMouseOverHandler = handleMouseOver;
  window.extensionClickHandler = handleClick;
  window.extensionKeyDownHandler = handleKeyDown;

// --- Cleanup ---
function cleanup() {
  // イベントリスナーを削除
  document.removeEventListener('mouseover', window.extensionMouseOverHandler);
  document.removeEventListener('click', window.extensionClickHandler, true);
  document.removeEventListener('keydown', window.extensionKeyDownHandler);

  // 全ての拡張機能UI要素を取得
  const allExtensionElements = document.querySelectorAll('.html-to-markdown-extension-ui');
  
  // アニメーションで要素を非表示にする
  allExtensionElements.forEach(element => {
    if (element.style.position === 'fixed') {
      // バナー系要素
      element.style.opacity = '0';
      element.style.transform = 'translateX(-50%) translateY(-20px)';
    } else {
      // オーバーレイ系要素
      element.style.opacity = '0';
    }
  });

  // アニメーション後に要素を削除
  setTimeout(() => {
    allExtensionElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // グローバル参照をクリア
    window.extensionInfoBanner = null;
    window.extensionHighlightOverlay = null;
    window.extensionInfoLabel = null;
    window.extensionMouseOverHandler = null;
    window.extensionClickHandler = null;
    window.extensionKeyDownHandler = null;
  }, 300);

  window.isExtensionActive = false;
}

  // --- Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  if (message.action === 'setConversionMode') {
    window.conversionMode = message.conversionMode;
    console.log('Conversion mode set to:', window.conversionMode);
    
    // If full page mode, convert immediately and close
    if (window.conversionMode === 'fullpage') {
      console.log('Starting full page conversion');
      convertFullPage();
    } else {
      console.log('Starting selection mode');
      // Initialize selection mode
      initializeSelectionMode();
    }
  }
});

  // --- Full Page Conversion ---
function convertFullPage() {
  console.log('convertFullPage called');
  try {
    // Get the main content or entire body
    const contentElement = document.querySelector('main') || 
                         document.querySelector('article') || 
                         document.querySelector('.content') || 
                         document.querySelector('#content') || 
                         document.body;
    
    console.log('Content element found:', contentElement.tagName);
    const html = contentElement.outerHTML;
    let markdown = window.turndownService.turndown(html);
    console.log('Markdown generated, length:', markdown.length);

    // Check settings for metadata inclusion
    chrome.storage.sync.get({ includeMetadata: true, language: 'en' }, (result) => {
      if (result.includeMetadata) {
        const metadata = MetadataExtractor.extractPageMetadata(null, result.language);
        markdown = metadata + markdown;
      }

      // Copy to clipboard (full page mode)
      copyToClipboard(markdown, false);
      
      // Show success notification with language support
      const successMessage = result.language === 'ja' ? 
        'ページ全体をクリップボードに変換しました！' : 
        'Full page converted to clipboard!';
      CommonUtils.showNotification(successMessage);
      
      // Clean up - no selection interface needed
      window.isExtensionActive = false;
    });
    
  } catch (error) {
    console.error('Error in full page conversion:', error);
    const errorMessage = 'Conversion failed - please try again';
    CommonUtils.showNotification(errorMessage, 'error');
  }
}

  // --- Selection Mode Initialization ---
  function initializeSelectionMode() {
    // 既存のUI要素をクリーンアップ
    cleanupExistingExtension();
    
    // UI要素を確実に作成
    createUIElements();
    
    // Show selection interface
    showSelectionInterface();
    
    // Initialize selection event listeners
    document.addEventListener('mouseover', window.extensionMouseOverHandler);
    document.addEventListener('click', window.extensionClickHandler, { capture: true, once: true });
    document.addEventListener('keydown', window.extensionKeyDownHandler);
  }

  // --- Show Selection Interface ---
  function showSelectionInterface() {
    // Create and show the info banner for selection mode
    infoBanner = document.createElement('div');
    infoBanner.className = 'html-to-markdown-extension-ui';
    infoBanner.innerHTML = '🎯 Click to copy • Esc to exit';
    
    Object.assign(infoBanner.style, {
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%) translateY(-20px)',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      color: '#1a1a1a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      padding: '8px 16px',
      textAlign: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: '10000',
      opacity: '0',
      pointerEvents: 'none'
    });

    document.body.appendChild(infoBanner);

    // Animate banner entrance
    setTimeout(() => {
      infoBanner.style.opacity = '1';
      infoBanner.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);

    // Store reference for cleanup
    window.extensionInfoBanner = infoBanner;
  }