// メタデータ抽出機能
if (typeof window.MetadataExtractor === 'undefined') {
class MetadataExtractor {
  static extractPageMetadata(selectedElement = null, language = 'en') {
    const title = document.title || 'Untitled Page';
    const url = window.location.href;
    const description = document.querySelector('meta[name="description"]')?.content ||
      document.querySelector('meta[property="og:description"]')?.content || '';
    const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
    const pageLang = document.documentElement.lang || 'unknown';
    const extractedAt = new Date().toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // SEOとソーシャルメディアメタデータ
    const keywords = document.querySelector('meta[name="keywords"]')?.content || '';
    const author = document.querySelector('meta[name="author"]')?.content || '';
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
    const ogType = document.querySelector('meta[property="og:type"]')?.content || '';
    const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
    const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.content || '';
    const twitterCard = document.querySelector('meta[name="twitter:card"]')?.content || '';
    const twitterSite = document.querySelector('meta[name="twitter:site"]')?.content || '';

    // 選択された要素のコンテキスト
    const selectedTag = selectedElement ? selectedElement.tagName.toLowerCase() : 'unknown';
    const selectedId = selectedElement?.id ? `#${selectedElement.id}` : '';
    const selectedClasses = selectedElement ? Array.from(selectedElement.classList).map(c => `.${c}`).join('') : '';
    const elementDescription = `${selectedTag}${selectedId}${selectedClasses}` || 'HTML要素';

    return this.generateMetadataMarkdown({
      title, url, description, canonical, pageLang, extractedAt,
      keywords, author, ogTitle, ogType, ogImage, ogSiteName,
      twitterCard, twitterSite, elementDescription, language
    });
  }

  static generateMetadataMarkdown(data) {
    const templates = this.getTemplates();
    const t = templates[data.language] || templates.en;

    let contextualDescription = `# ${t.contentContext}\n\n`;
    contextualDescription += `${t.description} `;
    contextualDescription += `${data.language === 'ja' ? `元のページは「${data.title}」で、${data.extractedAt}に取得されました。` : `The original page is "${data.title}" and was extracted on ${data.extractedAt}.`}\n\n`;

    // ソース情報セクション
    contextualDescription += `## ${t.sourceInfo}\n\n`;
    contextualDescription += `- **${t.originalTitle}**: ${data.title}\n`;
    contextualDescription += `- **${t.sourceUrl}**: ${data.url}\n`;
    if (data.canonical && data.canonical !== data.url) {
      contextualDescription += `- **${t.canonicalUrl}**: ${data.canonical} ${t.canonicalNote}\n`;
    }
    if (data.description) {
      contextualDescription += `- **${t.pageDescription}**: ${data.description}\n`;
    }
    contextualDescription += `- **${t.language}**: ${data.pageLang}\n`;
    contextualDescription += `- **${t.extractedAt}**: ${data.extractedAt}\n\n`;

    // 抽出詳細セクション
    contextualDescription += `## 抽出詳細\n\n`;
    contextualDescription += `このコンテンツは、ブラウザ拡張機能を使用してHTMLからMarkdownに変換されました。`;
    contextualDescription += `変換対象は「${data.elementDescription}」要素で、ページ全体ではなく選択された部分のみが含まれています。\n\n`;

    // コンテンツの範囲と制限セクション
    contextualDescription += `## コンテンツの範囲と制限\n\n`;
    contextualDescription += `- このMarkdownは元のWebページの一部分のみを表現しています\n`;
    contextualDescription += `- ナビゲーションメニュー、サイドバー、フッターなどの周辺コンテンツは含まれていません\n`;
    contextualDescription += `- JavaScriptによって動的に生成されるコンテンツや、インタラクティブな要素は失われている可能性があります\n`;
    contextualDescription += `- 変換時点での静的なHTMLコンテンツのみが保持されています\n\n`;

    // SEO・ソーシャルメディアコンテキスト
    if (data.keywords || data.author || data.ogTitle || data.twitterCard) {
      contextualDescription += `## SEO・ソーシャルメディアコンテキスト\n\n`;

      if (data.keywords) {
        contextualDescription += `**キーワード**: ${data.keywords} - このページの主要トピックやSEO対象キーワードを示しています。\n\n`;
      }

      if (data.author) {
        contextualDescription += `**著者**: ${data.author} - このコンテンツの作成者情報です。\n\n`;
      }

      if (data.ogTitle || data.ogType || data.ogImage || data.ogSiteName) {
        contextualDescription += `**Open Graph情報**: このページはソーシャルメディアでの共有を想定して設計されています。`;
        if (data.ogType) contextualDescription += ` コンテンツタイプは「${data.ogType}」として分類されています。`;
        if (data.ogSiteName) contextualDescription += ` サイト名は「${data.ogSiteName}」です。`;
        contextualDescription += `\n\n`;
      }

      if (data.twitterCard) {
        contextualDescription += `**Twitter Card**: Twitter上での表示形式として「${data.twitterCard}」が設定されています。`;
        if (data.twitterSite) contextualDescription += ` 関連Twitterアカウント: ${data.twitterSite}`;
        contextualDescription += `\n\n`;
      }
    }

    contextualDescription += `---\n\n`;
    return contextualDescription;
  }

  static getTemplates() {
    return {
      en: {
        contentContext: 'Content Context',
        description: 'This Markdown document was extracted from a web page using HTML-to-Markdown conversion.',
        sourceInfo: 'Source Information',
        originalTitle: 'Original Page Title',
        sourceUrl: 'Source URL',
        canonicalUrl: 'Canonical URL',
        canonicalNote: '(Different canonical URL is set)',
        pageDescription: 'Page Description',
        language: 'Language',
        extractedAt: 'Extracted At'
      },
      ja: {
        contentContext: 'コンテンツコンテキスト',
        description: 'このMarkdown文書は、Webページの一部をHTML-to-Markdown変換によって抽出したものです。',
        sourceInfo: 'ソース情報',
        originalTitle: '元ページタイトル',
        sourceUrl: 'ソースURL',
        canonicalUrl: '正規URL',
        canonicalNote: '(元URLとは異なる正規URLが設定されています)',
        pageDescription: 'ページ説明',
        language: '言語',
        extractedAt: '抽出日時'
      }
    };
  }
}

// グローバルに公開
window.MetadataExtractor = MetadataExtractor;
}