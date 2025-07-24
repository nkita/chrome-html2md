if (window.isExtensionActive) {
  // Avoid running the script twice
} else {
  window.isExtensionActive = true;

  var turndownService = new TurndownService({
    codeBlockStyle: 'fenced',
    headingStyle: 'atx',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**'
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

  // Enhanced table rule for better table conversion
  turndownService.addRule('enhancedTable', {
    filter: 'table',
    replacement: function (content, node) {
      const rows = Array.from(node.querySelectorAll('tr'));
      if (rows.length === 0) return content;

      let markdown = '\n\n';
      let hasHeader = false;

      rows.forEach((row, rowIndex) => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        if (cells.length === 0) return;

        // Check if this row contains header cells
        const isHeaderRow = cells.some(cell => cell.tagName.toLowerCase() === 'th');
        if (isHeaderRow) hasHeader = true;

        // Build the row
        const cellContents = cells.map(cell => {
          return cell.textContent.trim().replace(/\|/g, '\\|').replace(/\n/g, ' ');
        });

        markdown += '| ' + cellContents.join(' | ') + ' |\n';

        // Add separator after header row
        if (isHeaderRow || (rowIndex === 0 && !hasHeader)) {
          const separator = cells.map(() => '---').join(' | ');
          markdown += '| ' + separator + ' |\n';
        }
      });

      return markdown + '\n';
    }
  });

  // Enhanced blockquote rule
  turndownService.addRule('enhancedBlockquote', {
    filter: 'blockquote',
    replacement: function (content, node) {
      const lines = content.trim().split('\n');
      const quotedLines = lines.map(line => '> ' + line.trim()).join('\n');
      return '\n\n' + quotedLines + '\n\n';
    }
  });

  // Enhanced list handling for nested lists
  turndownService.addRule('enhancedList', {
    filter: ['ul', 'ol'],
    replacement: function (content, node, options) {
      const isOrdered = node.tagName.toLowerCase() === 'ol';
      const items = Array.from(node.children).filter(child => child.tagName.toLowerCase() === 'li');

      if (items.length === 0) return content;

      let markdown = '\n';
      items.forEach((item, index) => {
        const marker = isOrdered ? `${index + 1}. ` : '- ';
        const itemContent = turndownService.turndown(item.innerHTML).trim();
        const lines = itemContent.split('\n');

        markdown += marker + lines[0] + '\n';
        // Handle multi-line list items
        for (let i = 1; i < lines.length; i++) {
          markdown += '  ' + lines[i] + '\n';
        }
      });

      return markdown + '\n';
    }
  });

  // Enhanced code inline rule
  turndownService.addRule('enhancedCode', {
    filter: 'code',
    replacement: function (content, node) {
      // Don't process code inside pre tags (already handled by preToCodeBlock)
      if (node.parentNode && node.parentNode.tagName.toLowerCase() === 'pre') {
        return content;
      }
      const code = node.textContent || '';
      return '`' + code + '`';
    }
  });

  // Enhanced image rule with alt text and title
  turndownService.addRule('enhancedImage', {
    filter: 'img',
    replacement: function (content, node) {
      const src = node.getAttribute('src') || '';
      const alt = node.getAttribute('alt') || '';
      const title = node.getAttribute('title');

      if (!src) return '';

      let markdown = `![${alt}](${src}`;
      if (title) {
        markdown += ` "${title}"`;
      }
      markdown += ')';

      return markdown;
    }
  });

  // Enhanced link rule
  turndownService.addRule('enhancedLink', {
    filter: 'a',
    replacement: function (content, node) {
      const href = node.getAttribute('href');
      const title = node.getAttribute('title');

      if (!href) return content;

      let markdown = `[${content}](${href}`;
      if (title) {
        markdown += ` "${title}"`;
      }
      markdown += ')';

      return markdown;
    }
  });

  // Horizontal rule (hr) support
  turndownService.addRule('horizontalRule', {
    filter: 'hr',
    replacement: function () {
      return '\n\n---\n\n';
    }
  });

  // Definition lists (dl, dt, dd) support
  turndownService.addRule('definitionList', {
    filter: 'dl',
    replacement: function (content, node) {
      const items = Array.from(node.children);
      let markdown = '\n\n';

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.tagName.toLowerCase() === 'dt') {
          markdown += `**${item.textContent.trim()}**\n`;
        } else if (item.tagName.toLowerCase() === 'dd') {
          markdown += `: ${item.textContent.trim()}\n\n`;
        }
      }

      return markdown;
    }
  });

  // Details/Summary (collapsible content) support
  turndownService.addRule('detailsSummary', {
    filter: 'details',
    replacement: function (content, node) {
      const summary = node.querySelector('summary');
      const summaryText = summary ? summary.textContent.trim() : 'Details';
      const detailsContent = content.replace(summaryText, '').trim();

      return `\n\n<details>\n<summary>${summaryText}</summary>\n\n${detailsContent}\n\n</details>\n\n`;
    }
  });

  // Mark (highlighted text) support
  turndownService.addRule('highlightedText', {
    filter: 'mark',
    replacement: function (content) {
      return `==${content}==`;
    }
  });

  // Strikethrough (del, s) support
  turndownService.addRule('strikethrough', {
    filter: ['del', 's', 'strike'],
    replacement: function (content) {
      return `~~${content}~~`;
    }
  });

  // Subscript and Superscript support
  turndownService.addRule('subscript', {
    filter: 'sub',
    replacement: function (content) {
      return `~${content}~`;
    }
  });

  turndownService.addRule('superscript', {
    filter: 'sup',
    replacement: function (content) {
      return `^${content}^`;
    }
  });

  // Keyboard input (kbd) support
  turndownService.addRule('keyboard', {
    filter: 'kbd',
    replacement: function (content) {
      return `<kbd>${content}</kbd>`;
    }
  });

  // Abbreviation (abbr) support
  turndownService.addRule('abbreviation', {
    filter: 'abbr',
    replacement: function (content, node) {
      const title = node.getAttribute('title');
      if (title) {
        return `${content} (${title})`;
      }
      return content;
    }
  });

  // Figure and figcaption support
  turndownService.addRule('figure', {
    filter: 'figure',
    replacement: function (content, node) {
      const figcaption = node.querySelector('figcaption');
      const caption = figcaption ? figcaption.textContent.trim() : '';

      if (caption) {
        return `\n\n${content}\n\n*${caption}*\n\n`;
      }
      return `\n\n${content}\n\n`;
    }
  });

  // Address support
  turndownService.addRule('address', {
    filter: 'address',
    replacement: function (content) {
      return `\n\n*${content.trim()}*\n\n`;
    }
  });

  // Time element support
  turndownService.addRule('time', {
    filter: 'time',
    replacement: function (content, node) {
      const datetime = node.getAttribute('datetime');
      if (datetime && datetime !== content.trim()) {
        return `${content} (${datetime})`;
      }
      return content;
    }
  });

  // Progress and meter elements (convert to text representation)
  turndownService.addRule('progress', {
    filter: 'progress',
    replacement: function (content, node) {
      const value = node.getAttribute('value') || '0';
      const max = node.getAttribute('max') || '100';
      const percentage = Math.round((parseFloat(value) / parseFloat(max)) * 100);
      return `Progress: ${percentage}% (${value}/${max})`;
    }
  });

  turndownService.addRule('meter', {
    filter: 'meter',
    replacement: function (content, node) {
      const value = node.getAttribute('value') || '0';
      const min = node.getAttribute('min') || '0';
      const max = node.getAttribute('max') || '1';
      return `Meter: ${value} (range: ${min}-${max})`;
    }
  });

  // Remove extension UI elements
  turndownService.addRule('removeExtensionUI', {
    filter: function (node) {
      // Remove elements created by this extension
      return node.nodeType === 1 && 
             (node.className === 'html-to-markdown-extension-ui' ||
              node.classList?.contains('html-to-markdown-extension-ui'));
    },
    replacement: function () {
      return '';
    }
  });

  // Remove script, style, and other non-content elements
  turndownService.addRule('removeNonContent', {
    filter: ['script', 'style', 'noscript', 'meta', 'link', 'head', 'title'],
    replacement: function () {
      return '';
    }
  });

  // Remove hidden elements and comments
  turndownService.addRule('removeHidden', {
    filter: function (node) {
      // Remove elements with display: none or visibility: hidden
      if (node.nodeType === 1) { // Element node
        const style = window.getComputedStyle(node);
        return style.display === 'none' || style.visibility === 'hidden';
      }
      // Remove comment nodes
      return node.nodeType === 8;
    },
    replacement: function () {
      return '';
    }
  });

  // Handle form elements appropriately
  turndownService.addRule('formElements', {
    filter: ['input', 'textarea', 'select', 'option', 'button', 'form'],
    replacement: function (content, node) {
      const tagName = node.tagName.toLowerCase();
      
      switch (tagName) {
        case 'input':
          const type = node.getAttribute('type') || 'text';
          const value = node.getAttribute('value') || '';
          const placeholder = node.getAttribute('placeholder') || '';
          return `[${type.toUpperCase()} INPUT${value ? ': ' + value : ''}${placeholder ? ' (' + placeholder + ')' : ''}]`;
        
        case 'textarea':
          return `[TEXTAREA: ${node.value || node.textContent || ''}]`;
        
        case 'select':
          const selectedOption = node.querySelector('option[selected]');
          const selectedText = selectedOption ? selectedOption.textContent : '';
          return `[SELECT${selectedText ? ': ' + selectedText : ''}]`;
        
        case 'button':
          return `[BUTTON: ${node.textContent || ''}]`;
        
        case 'form':
          return content; // Process form content normally
        
        default:
          return `[${tagName.toUpperCase()}]`;
      }
    }
  });

  // Preserve certain HTML elements that don't have Markdown equivalents
  turndownService.addRule('preserveHtml', {
    filter: ['video', 'audio', 'iframe', 'embed', 'object', 'canvas', 'svg'],
    replacement: function (content, node) {
      return node.outerHTML;
    }
  });

  let selectedElement = null;

  // --- UI Elements ---
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

  const infoBanner = document.createElement('div');
  infoBanner.className = 'html-to-markdown-extension-ui';
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

  // Check if clipboard API is available
  function isClipboardAvailable() {
    return navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function' &&
      window.isSecureContext;
  }

  // Fallback clipboard function for older browsers or insecure contexts
  function fallbackCopyToClipboard(text) {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.className = 'html-to-markdown-extension-ui';
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      document.body.appendChild(textArea);

      // Select and copy the text
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        showNotification('Copied to clipboard!');
      } else {
        showNotification('Copy failed - please copy manually');
        console.log('Markdown content:', text);
      }
    } catch (err) {
      console.error('Fallback copy failed: ', err);
      showNotification('Copy failed - check console for content');
      console.log('Markdown content:', text);
    }
    cleanup();
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'html-to-markdown-extension-ui';
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

      // Try modern clipboard API first, fallback to legacy method
      if (isClipboardAvailable()) {
        navigator.clipboard.writeText(markdown).then(() => {
          showNotification('Copied to clipboard!');
          cleanup();
        }).catch(err => {
          console.error('Failed to copy with clipboard API: ', err);
          fallbackCopyToClipboard(markdown);
        });
      } else {
        fallbackCopyToClipboard(markdown);
      }
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