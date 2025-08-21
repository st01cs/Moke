# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm i` - Install dependencies
- `pnpm dev` - Start development server for Chrome
- `pnpm dev:firefox` - Start development server for Firefox  
- `pnpm build` - Create production build for Chrome
- `pnpm build:firefox` - Create production build for Firefox
- `pnpm zip` - Package Chrome extension for distribution
- `pnpm zip:firefox` - Package Firefox extension for distribution
- `pnpm compile` - Type check without emitting files

### Extension Loading
- Chrome/Edge: Load from `./output/chrome-mv3-dev` (dev) or `./output/chrome-mv3-prod` (prod)
- Firefox: Load from `./output/firefox-mv2-dev` (dev) or `./output/firefox-mv2-prod` (prod)

### Component Management
- `pnpm dlx shadcn@latest add <component>` - Add new shadcn UI components

## Architecture Overview

### Browser Extension Structure
This is a WXT-based browser extension that manages bookmarks by creating GitHub issues. The extension has three main entrypoints:

1. **Background Script** (`src/entrypoints/background.ts`): Handles tRPC communication and cross-extension messaging
2. **Popup** (`src/entrypoints/popup/`): Main UI for saving bookmarks, auto-populates current tab data
3. **Options Page** (`src/entrypoints/options/`): GitHub configuration and connection setup

### Key Components

#### GitHub Integration
- Uses Octokit library for GitHub API communication
- Stores configuration in `chrome.storage.sync`: `githubToken`, `githubOwner`, `githubRepo`, `githubConnected`
- Creates issues with page title as issue title, URL as body
- Optionally adds description as first comment on the issue

#### State Management
- No central state management - uses local React state and Chrome storage
- Configuration persisted across sessions via Chrome storage API
- Form validation and error handling in options page

#### UI Framework
- React 19 with TypeScript
- TailwindCSS for styling with custom configuration
- shadcn/ui component library for consistent UI elements
- Lucide React for icons

### File Structure Patterns
- `@/` alias points to `./src/` directory
- UI components in `src/components/ui/` following shadcn conventions
- Global CSS in `src/entrypoints/global.css`
- Extension manifest configuration in `wxt.config.ts`

### Extension Permissions
- `storage` - For saving GitHub configuration
- `tabs` - For reading current tab URL and title

### Communication Architecture
- Uses tRPC with chrome adapter for type-safe background/content script communication
- Chrome storage API for persistent configuration data
- Standard Chrome extension APIs for tab access and options page management