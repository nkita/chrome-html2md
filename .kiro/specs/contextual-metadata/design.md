# Design Document

## Overview

This design transforms the current basic YAML frontmatter metadata into a comprehensive, AI-friendly contextual description that explains the source, extraction process, and limitations of the converted markdown content. The new format will provide rich context that helps AI systems understand the nature and origin of the content.

## Architecture

The design maintains the existing browser extension architecture but enhances the `extractPageMetadata()` function to generate descriptive, contextual metadata instead of simple key-value pairs.

### Current Flow
1. User performs Shift+Click on HTML element
2. System extracts basic metadata as YAML frontmatter
3. System converts HTML to Markdown
4. System combines metadata + markdown and copies to clipboard

### Enhanced Flow
1. User performs Shift+Click on HTML element
2. System extracts comprehensive page metadata
3. System generates contextual description explaining the content source and extraction
4. System converts HTML to Markdown
5. System combines contextual metadata + markdown and copies to clipboard

## Components and Interfaces

### Enhanced Metadata Extraction Function

The `extractPageMetadata()` function will be redesigned to return a structured contextual description instead of raw YAML data.

#### Input
- Current DOM state
- Selected HTML element information
- Page metadata (title, description, URLs, etc.)

#### Output
- Contextual description in markdown format explaining:
  - Content source and origin
  - Extraction method and scope
  - Temporal context (when extracted)
  - Content limitations and boundaries
  - SEO and social media context

### Metadata Structure

The new metadata format will consist of:

1. **Content Source Context**
   - Explanation of the original web page
   - Relationship between page title and extracted content
   - URL and canonical URL context

2. **Extraction Context**
   - Description of the HTML-to-Markdown conversion process
   - Scope of content extraction (which elements were included)
   - Timestamp and extraction method

3. **Content Limitations**
   - Clear statement about partial content extraction
   - Missing context warnings (navigation, dynamic content, etc.)
   - Boundaries of the extracted content

4. **SEO and Social Context** (when available)
   - Open Graph data explanation for social media context
   - Twitter Card information for platform-specific presentation
   - Keywords and author information for topic understanding

## Data Models

### Contextual Metadata Object
```javascript
{
  sourceContext: {
    pageTitle: string,
    sourceUrl: string,
    canonicalUrl: string,
    description: string,
    language: string,
    extractedAt: string
  },
  extractionContext: {
    method: string,
    selectedElement: string,
    scope: string
  },
  contentLimitations: {
    isPartialContent: boolean,
    missingElements: string[],
    dynamicContentWarning: boolean
  },
  seoSocialContext: {
    openGraph: object,
    twitterCard: object,
    keywords: string,
    author: string
  }
}
```

### Output Format
The output will be a markdown document with a descriptive header section followed by the converted content:

```markdown
# Content Context

This markdown document contains a converted portion of a web page. The content was extracted from [Page Title] (URL) on [Date].

## Source Information
- **Original Page**: [Title] - [Description]
- **Source URL**: [URL]
- **Canonical URL**: [Canonical URL if different]
- **Language**: [Language]
- **Extracted**: [Timestamp]

## Extraction Details
This content was converted from HTML to Markdown using a browser extension. The conversion focused on [specific element description] and may not include the complete page context such as navigation menus, sidebars, or dynamic content that loads after the initial page render.

## Content Scope and Limitations
- This represents only a portion of the original web page
- Dynamic content, interactive elements, and JavaScript-generated content may be missing
- Navigation, header, footer, and sidebar content are typically excluded
- The conversion preserves the semantic structure but may lose some visual formatting

[Additional sections for SEO/Social context when available]

---

[Converted Markdown Content]
```

## Error Handling

### Missing Metadata
- When essential metadata (title, URL) is missing, provide generic descriptions
- Gracefully handle missing optional metadata without breaking the format
- Provide fallback descriptions for unknown or empty fields

### Extraction Errors
- Handle cases where DOM queries fail
- Provide meaningful error messages in the context description
- Ensure the function never throws exceptions that break the extension

### Content Limitations Detection
- Automatically detect common missing elements (nav, aside, footer)
- Identify potential dynamic content areas
- Warn about JavaScript-dependent content that may be missing

## Testing Strategy

### Unit Testing Approach
1. **Metadata Extraction Testing**
   - Test with various page types (articles, landing pages, documentation)
   - Test with missing metadata scenarios
   - Test with different HTML structures

2. **Context Generation Testing**
   - Verify descriptive text generation for different content types
   - Test limitation detection accuracy
   - Validate output format consistency

3. **Integration Testing**
   - Test complete flow from element selection to clipboard copy
   - Verify compatibility with existing Markdown conversion
   - Test with real-world websites

### Manual Testing Scenarios
1. Test on news articles with rich metadata
2. Test on documentation pages with minimal metadata
3. Test on e-commerce pages with Open Graph data
4. Test on social media posts with Twitter Card data
5. Test on pages with missing or incomplete metadata

### Edge Cases
- Pages with no title or description
- Pages with very long metadata values
- Pages with special characters in metadata
- Pages with multiple canonical URLs
- Single-page applications with dynamic content