// Turndownサービスの設定とルール
if (typeof window.TurndownConfig === 'undefined') {
  class TurndownConfig {
    static createService() {
      const turndownService = new TurndownService({
        codeBlockStyle: 'fenced',
        headingStyle: 'atx',
        bulletListMarker: '-',
        emDelimiter: '*',
        strongDelimiter: '**'
      });

      // カスタムルールを追加
      this.addCustomRules(turndownService);
      return turndownService;
    }

    static addCustomRules(service) {
      // preタグをコードブロックに変換
      service.addRule('preToCodeBlock', {
        filter: 'pre',
        replacement: function (content, node) {
          const code = node.textContent || '';
          const codeLang = node.firstChild?.className?.match(/language-(\S+)/)?.[1] || '';
          return '\n\n```' + codeLang + '\n' + code.trim() + '\n```\n\n';
        }
      });

      // テーブル変換の強化
      service.addRule('enhancedTable', {
        filter: 'table',
        replacement: function (content, node) {
          const rows = Array.from(node.querySelectorAll('tr'));
          if (rows.length === 0) return content;

          let markdown = '\n\n';
          let hasHeader = false;

          rows.forEach((row, rowIndex) => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            if (cells.length === 0) return;

            const isHeaderRow = cells.some(cell => cell.tagName.toLowerCase() === 'th');
            if (isHeaderRow) hasHeader = true;

            const cellContents = cells.map(cell => {
              return cell.textContent.trim().replace(/\|/g, '\\|').replace(/\n/g, ' ');
            });

            markdown += '| ' + cellContents.join(' | ') + ' |\n';

            if (isHeaderRow || (rowIndex === 0 && !hasHeader)) {
              const separator = cells.map(() => '---').join(' | ');
              markdown += '| ' + separator + ' |\n';
            }
          });

          return markdown + '\n';
        }
      });

      // ブロッククォートの強化
      service.addRule('enhancedBlockquote', {
        filter: 'blockquote',
        replacement: function (content) {
          const lines = content.trim().split('\n');
          const quotedLines = lines.map(line => '> ' + line.trim()).join('\n');
          return '\n\n' + quotedLines + '\n\n';
        }
      });

      // リストの強化
      service.addRule('enhancedList', {
        filter: ['ul', 'ol'],
        replacement: function (content, node) {
          const isOrdered = node.tagName.toLowerCase() === 'ol';
          const items = Array.from(node.children).filter(child => child.tagName.toLowerCase() === 'li');

          if (items.length === 0) return content;

          let markdown = '\n';
          items.forEach((item, index) => {
            const marker = isOrdered ? `${index + 1}. ` : '- ';
            const itemContent = service.turndown(item.innerHTML).trim();
            const lines = itemContent.split('\n');

            markdown += marker + lines[0] + '\n';
            for (let i = 1; i < lines.length; i++) {
              markdown += '  ' + lines[i] + '\n';
            }
          });

          return markdown + '\n';
        }
      });

      // インラインコードの強化
      service.addRule('enhancedCode', {
        filter: 'code',
        replacement: function (content, node) {
          if (node.parentNode && node.parentNode.tagName.toLowerCase() === 'pre') {
            return content;
          }
          const code = node.textContent || '';
          return '`' + code + '`';
        }
      });

      // 画像の強化
      service.addRule('enhancedImage', {
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

      // リンクの強化
      service.addRule('enhancedLink', {
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

      // 水平線
      service.addRule('horizontalRule', {
        filter: 'hr',
        replacement: () => '\n\n---\n\n'
      });

      // 定義リスト
      service.addRule('definitionList', {
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

      // 詳細/サマリー
      service.addRule('detailsSummary', {
        filter: 'details',
        replacement: function (content, node) {
          const summary = node.querySelector('summary');
          const summaryText = summary ? summary.textContent.trim() : 'Details';
          const detailsContent = content.replace(summaryText, '').trim();

          return `\n\n<details>\n<summary>${summaryText}</summary>\n\n${detailsContent}\n\n</details>\n\n`;
        }
      });

      // マーク（ハイライト）
      service.addRule('highlightedText', {
        filter: 'mark',
        replacement: content => `==${content}==`
      });

      // 取り消し線
      service.addRule('strikethrough', {
        filter: ['del', 's', 'strike'],
        replacement: content => `~~${content}~~`
      });

      // 上付き・下付き文字
      service.addRule('subscript', {
        filter: 'sub',
        replacement: content => `~${content}~`
      });

      service.addRule('superscript', {
        filter: 'sup',
        replacement: content => `^${content}^`
      });

      // キーボード入力
      service.addRule('keyboard', {
        filter: 'kbd',
        replacement: content => `<kbd>${content}</kbd>`
      });

      // 略語
      service.addRule('abbreviation', {
        filter: 'abbr',
        replacement: function (content, node) {
          const title = node.getAttribute('title');
          if (title) {
            return `${content} (${title})`;
          }
          return content;
        }
      });

      // 図表とキャプション
      service.addRule('figure', {
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

      // 住所
      service.addRule('address', {
        filter: 'address',
        replacement: content => `\n\n*${content.trim()}*\n\n`
      });

      // 時間要素
      service.addRule('time', {
        filter: 'time',
        replacement: function (content, node) {
          const datetime = node.getAttribute('datetime');
          if (datetime && datetime !== content.trim()) {
            return `${content} (${datetime})`;
          }
          return content;
        }
      });

      // プログレス・メーター
      service.addRule('progress', {
        filter: 'progress',
        replacement: function (content, node) {
          const value = node.getAttribute('value') || '0';
          const max = node.getAttribute('max') || '100';
          const percentage = Math.round((parseFloat(value) / parseFloat(max)) * 100);
          return `Progress: ${percentage}% (${value}/${max})`;
        }
      });

      service.addRule('meter', {
        filter: 'meter',
        replacement: function (content, node) {
          const value = node.getAttribute('value') || '0';
          const min = node.getAttribute('min') || '0';
          const max = node.getAttribute('max') || '1';
          return `Meter: ${value} (range: ${min}-${max})`;
        }
      });

      // 拡張機能UI要素を除去
      service.addRule('removeExtensionUI', {
        filter: function (node) {
          return node.nodeType === 1 &&
            (node.className === 'html-to-markdown-extension-ui' ||
              node.classList?.contains('html-to-markdown-extension-ui'));
        },
        replacement: () => ''
      });

      // 非コンテンツ要素を除去
      service.addRule('removeNonContent', {
        filter: ['script', 'style', 'noscript', 'meta', 'link', 'head', 'title'],
        replacement: () => ''
      });

      // 隠し要素を除去
      service.addRule('removeHidden', {
        filter: function (node) {
          if (node.nodeType === 1) {
            const style = window.getComputedStyle(node);
            return style.display === 'none' || style.visibility === 'hidden';
          }
          return node.nodeType === 8; // コメントノード
        },
        replacement: () => ''
      });

      // フォーム要素の処理
      service.addRule('formElements', {
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
              return content;

            default:
              return `[${tagName.toUpperCase()}]`;
          }
        }
      });

      // HTML要素を保持
      service.addRule('preserveHtml', {
        filter: ['video', 'audio', 'iframe', 'embed', 'object', 'canvas', 'svg'],
        replacement: function (content, node) {
          return node.outerHTML;
        }
      });
    }
  }

  // グローバルに公開
  window.TurndownConfig = TurndownConfig;
}