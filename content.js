if (window.isExtensionActive) {
  // Avoid running the script twice
} else {
  window.isExtensionActive = true;

  var turndownService = new TurndownService({
    codeBlockStyle: 'fenced'
  });

  // Add a specific rule for <pre> tags to handle them as code blocks
  turndownService.addRule('preToCodeBlock', {
    filter: 'pre',
    replacement: function (content, node) {
      const code = node.textContent || '';
      // Optionally, try to get the language from a class like 'language-js'
      const language = node.firstChild?.className?.match(/language-(\S+)/)?.[1] || '';
      return '\n\n```' + language + '\n' + code.trim() + '\n```\n\n';
    }
  });

  let selectedElement = null;

  // --- UI Elements ---
  const highlightOverlay = document.createElement('div');
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

  const infoLabel = document.createElement('div');
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

  const infoBanner = document.createElement('div');
  infoBanner.innerHTML = '🎯 Click to copy • ⇧+Click for context • Esc to exit';
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

  document.body.appendChild(highlightOverlay);
  document.body.appendChild(infoLabel);
  document.body.appendChild(infoBanner);

  // Animate banner entrance
  setTimeout(() => {
    infoBanner.style.opacity = '1';
    infoBanner.style.transform = 'translateX(-50%) translateY(0)';
  }, 100);

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    Object.assign(notification.style, {
        position: 'fixed',
        top: '70px',
        left: '50%',
        transform: 'translateX(-50%) translateY(-20px)',
        background: 'rgba(16, 185, 129, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '15px',
        fontWeight: '500',
        padding: '12px 20px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: '10001',
        opacity: '0',
        pointerEvents: 'none'
    });
    document.body.appendChild(notification);
    
    // Animate entrance
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 50);
    
    // Animate exit and remove
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 2000);
  }

  // --- Metadata Extraction ---
  function extractPageMetadata() {
    // Extract basic page information
    const title = document.title || 'Untitled Page';
    const url = window.location.href;
    const description = document.querySelector('meta[name="description"]')?.content || 
                       document.querySelector('meta[property="og:description"]')?.content || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
    const language = document.documentElement.lang || 'unknown';
    const extractedAt = new Date().toLocaleString('ja-JP', { 
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Extract SEO and social media metadata
    const keywords = document.querySelector('meta[name="keywords"]')?.content || '';
    const author = document.querySelector('meta[name="author"]')?.content || '';
    
    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
    const ogType = document.querySelector('meta[property="og:type"]')?.content || '';
    const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
    const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.content || '';
    
    // Twitter Card tags
    const twitterCard = document.querySelector('meta[name="twitter:card"]')?.content || '';
    const twitterSite = document.querySelector('meta[name="twitter:site"]')?.content || '';
    
    // Determine selected element context
    const selectedTag = selectedElement ? selectedElement.tagName.toLowerCase() : 'unknown';
    const selectedId = selectedElement?.id ? `#${selectedElement.id}` : '';
    const selectedClasses = selectedElement ? Array.from(selectedElement.classList).map(c => `.${c}`).join('') : '';
    const elementDescription = `${selectedTag}${selectedId}${selectedClasses}` || 'HTML要素';

    // Generate contextual description
    let contextualDescription = `# コンテンツコンテキスト\n\n`;
    
    contextualDescription += `このMarkdown文書は、Webページの一部をHTML-to-Markdown変換によって抽出したものです。`;
    contextualDescription += `元のページは「${title}」で、${extractedAt}に取得されました。\n\n`;

    // Source Information Section
    contextualDescription += `## ソース情報\n\n`;
    contextualDescription += `- **元ページタイトル**: ${title}\n`;
    contextualDescription += `- **ソースURL**: ${url}\n`;
    if (canonical && canonical !== url) {
      contextualDescription += `- **正規URL**: ${canonical} (元URLとは異なる正規URLが設定されています)\n`;
    }
    if (description) {
      contextualDescription += `- **ページ説明**: ${description}\n`;
    }
    contextualDescription += `- **言語**: ${language}\n`;
    contextualDescription += `- **抽出日時**: ${extractedAt}\n\n`;

    // Extraction Details Section
    contextualDescription += `## 抽出詳細\n\n`;
    contextualDescription += `このコンテンツは、ブラウザ拡張機能を使用してHTMLからMarkdownに変換されました。`;
    contextualDescription += `変換対象は「${elementDescription}」要素で、ページ全体ではなく選択された部分のみが含まれています。\n\n`;

    // Content Limitations Section
    contextualDescription += `## コンテンツの範囲と制限\n\n`;
    contextualDescription += `- このMarkdownは元のWebページの一部分のみを表現しています\n`;
    contextualDescription += `- ナビゲーションメニュー、サイドバー、フッターなどの周辺コンテンツは含まれていません\n`;
    contextualDescription += `- JavaScriptによって動的に生成されるコンテンツや、インタラクティブな要素は失われている可能性があります\n`;
    contextualDescription += `- 変換時点での静的なHTMLコンテンツのみが保持されています\n\n`;

    // SEO and Social Context (if available)
    if (keywords || author || ogTitle || twitterCard) {
      contextualDescription += `## SEO・ソーシャルメディアコンテキスト\n\n`;
      
      if (keywords) {
        contextualDescription += `**キーワード**: ${keywords} - このページの主要トピックやSEO対象キーワードを示しています。\n\n`;
      }
      
      if (author) {
        contextualDescription += `**著者**: ${author} - このコンテンツの作成者情報です。\n\n`;
      }
      
      if (ogTitle || ogType || ogImage || ogSiteName) {
        contextualDescription += `**Open Graph情報**: このページはソーシャルメディアでの共有を想定して設計されています。`;
        if (ogType) contextualDescription += ` コンテンツタイプは「${ogType}」として分類されています。`;
        if (ogSiteName) contextualDescription += ` サイト名は「${ogSiteName}」です。`;
        contextualDescription += `\n\n`;
      }
      
      if (twitterCard) {
        contextualDescription += `**Twitter Card**: Twitter上での表示形式として「${twitterCard}」が設定されています。`;
        if (twitterSite) contextualDescription += ` 関連Twitterアカウント: ${twitterSite}`;
        contextualDescription += `\n\n`;
      }
    }

    contextualDescription += `---\n\n`;
    return contextualDescription;
  }

  // --- Event Handlers ---
  function handleMouseOver(event) {
    // If the element is inside a pre, select the pre element itself
    const codeBlock = event.target.closest('pre');
    selectedElement = codeBlock || event.target;

    const rect = selectedElement.getBoundingClientRect();

    // Update highlight overlay with smooth animation
    highlightOverlay.style.width = `${rect.width}px`;
    highlightOverlay.style.height = `${rect.height}px`;
    highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
    highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
    highlightOverlay.style.opacity = '1';

    // Update info label with smooth animation
    const tag = selectedElement.tagName.toLowerCase();
    const id = selectedElement.id ? `#${selectedElement.id}` : '';
    const classes = Array.from(selectedElement.classList).map(c => `.${c}`).join('');
    infoLabel.textContent = `${tag}${id}${classes}`;
    
    // Position info label above the element
    const labelTop = rect.top + window.scrollY - 35; // Fixed offset for better positioning
    const labelLeft = Math.max(10, Math.min(rect.left + window.scrollX, window.innerWidth - 200));
    
    infoLabel.style.top = `${labelTop}px`;
    infoLabel.style.left = `${labelLeft}px`;
    infoLabel.style.opacity = '1';
  }

  function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (selectedElement) {
      // If the user clicked inside a code block, convert the whole block.
      const elementToConvert = selectedElement.closest('pre') || selectedElement;
      const html = elementToConvert.outerHTML;
      let markdown = turndownService.turndown(html);

      if (event.shiftKey) {
        const metadata = extractPageMetadata();
        markdown = metadata + markdown;
      }

      navigator.clipboard.writeText(markdown).then(() => {
        showNotification('Copied to clipboard!');
        cleanup();
      }).catch(err => {
        console.error('Failed to copy: ', err);
        showNotification('Failed to copy markdown.');
        cleanup();
      });
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      cleanup();
    }
  }

  // --- Cleanup ---
  function cleanup() {
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown);
    
    // Animate elements out before removing
    if (infoBanner.parentNode) {
      infoBanner.style.opacity = '0';
      infoBanner.style.transform = 'translateX(-50%) translateY(-20px)';
    }
    if (highlightOverlay.parentNode) {
      highlightOverlay.style.opacity = '0';
    }
    if (infoLabel.parentNode) {
      infoLabel.style.opacity = '0';
    }
    
    // Remove elements after animation
    setTimeout(() => {
      if (highlightOverlay.parentNode) document.body.removeChild(highlightOverlay);
      if (infoLabel.parentNode) document.body.removeChild(infoLabel);
      if (infoBanner.parentNode) document.body.removeChild(infoBanner);
    }, 300);

    window.isExtensionActive = false;
  }

  // --- Initialization ---
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('click', handleClick, { capture: true, once: true });
  document.addEventListener('keydown', handleKeyDown);
}