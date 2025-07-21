# Requirements Document

## Introduction

現在のブラウザ拡張機能は、WebページのHTMLをMarkdownに変換し、基本的なメタデータをYAMLフロントマターとして付与する機能を持っています。しかし、生成AIがコンテキストを理解しやすくするために、メタデータをより説明的で構造化された形式に改善する必要があります。

## Requirements

### Requirement 1

**User Story:** As a user who wants to provide context to AI systems, I want the metadata to include descriptive explanations about the content source, so that AI can better understand the context and origin of the markdown content.

#### Acceptance Criteria

1. WHEN user performs Shift+Click THEN system SHALL generate a contextual description section explaining the source and nature of the content
2. WHEN metadata is generated THEN system SHALL include a clear explanation that this is a partial conversion from a web page
3. WHEN page title exists THEN system SHALL describe the relationship between the title and the extracted content
4. WHEN page URL is available THEN system SHALL explain the source location and its relevance

### Requirement 2

**User Story:** As a user working with AI systems, I want the metadata to be structured in a way that provides clear context about the extraction process, so that AI can understand how this content was obtained and its limitations.

#### Acceptance Criteria

1. WHEN content is extracted THEN system SHALL include information about the extraction method (HTML to Markdown conversion)
2. WHEN specific HTML elements are selected THEN system SHALL describe which part of the page was converted
3. WHEN extraction timestamp is recorded THEN system SHALL explain when the content was captured
4. WHEN canonical URL differs from current URL THEN system SHALL explain the relationship between them

### Requirement 3

**User Story:** As a user who needs to provide comprehensive context to AI, I want the metadata to include relevant SEO and social media information in a descriptive format, so that AI understands the intended audience and purpose of the original content.

#### Acceptance Criteria

1. WHEN Open Graph data exists THEN system SHALL explain the social media context and intended sharing format
2. WHEN Twitter Card data is available THEN system SHALL describe the Twitter-specific presentation intent
3. WHEN keywords are present THEN system SHALL explain the topic focus and SEO intent
4. WHEN author information exists THEN system SHALL describe the content authorship context

### Requirement 4

**User Story:** As a user who wants AI to understand content limitations, I want the metadata to clearly explain what portions of the original page are included and excluded, so that AI doesn't make assumptions about missing context.

#### Acceptance Criteria

1. WHEN partial content is extracted THEN system SHALL clearly state that this is only a portion of the original page
2. WHEN specific HTML elements are converted THEN system SHALL describe the scope and boundaries of the extraction
3. WHEN navigation or sidebar content is excluded THEN system SHALL explain potential missing context
4. WHEN dynamic content might be missing THEN system SHALL note limitations of static HTML extraction