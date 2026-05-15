# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2] - 2026-05-16

### Added
- Documented `mdview` CLI tool usage in `README.md`.

## [1.1.1] - 2026-05-16

### Fixed
- Fixed internal `package.json` formatting (`bin` path) to prevent npm registry warnings.

## [1.1.0] - 2026-05-16

### Added
- New `mdview` global CLI tool for rendering Markdown files directly from the terminal (`npx render-markdown-ansi` or `mdview`).
- Added `-v` and `--version` flags to the CLI.

## [1.0.0] - 2026-05-16

### Added

- Core Markdown to ANSI rendering engine with zero runtime dependencies
- Full CommonMark block structure support:
  - ATX headings (H1–H6) with color-coded hierarchy and H1 underline decoration
  - Paragraphs with ANSI-aware word wrapping
  - Fenced code blocks (backtick and tilde) with language labels
  - Indented code blocks
  - Blockquotes with Unicode left-border
  - Horizontal rules
- GFM (GitHub Flavored Markdown) extensions:
  - Tables with Unicode box-drawing characters and column alignment
  - Task lists with checkbox rendering (☑/☐)
  - Strikethrough text
  - GitHub-style callouts ([!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION])
- Inline formatting:
  - Bold, italic, bold+italic
  - Inline code with reverse-video styling
  - Links with optional URL display
  - Images with alt text display
  - Autolinks
  - Backslash escapes
  - Hard and soft line breaks
- Configurable options:
  - `width` — terminal width for word wrapping
  - `colors` — enable/disable ANSI colors
  - `unicode` — toggle Unicode vs ASCII characters
  - `showLinks` — show/hide URLs after link text
  - `indent` — base indentation
- Dual ESM/CJS package output with TypeScript declarations
- Advanced API: `parse()`, `render()`, `parseInlineContent()` for two-step processing
- Full TypeScript type exports for all AST nodes
