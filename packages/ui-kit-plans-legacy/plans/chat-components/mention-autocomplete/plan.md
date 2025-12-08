# MentionAutocomplete Plan

## Overview

### Description
MentionAutocomplete provides @mention functionality with dropdown suggestions for users, AI assistants, and other mentionable entities. It features fuzzy search, keyboard navigation, and customizable suggestion rendering.

### Visual Design Mockups
- [Default State](./mockups/mention-autocomplete-default.html)

### Key Features
- @mention detection and parsing
- Fuzzy search through mentionable entities
- Dropdown suggestion list with keyboard navigation
- Avatar and metadata display for suggestions
- Custom suggestion templates
- Recent mentions prioritization
- Accessibility support for screen readers

### Use Cases
- @mentioning users in chat messages
- @mentioning AI assistants or personas
- @mentioning channels, topics, or projects
- Quick entity selection in text input

## API Design

### Props Interface

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **Required Props** |
| suggestions | `MentionSuggestion[]` | ✓ | - | Available mention suggestions |
| **Optional Props** |
| trigger | `string` | - | `'@'` | Character that triggers mention |
| maxSuggestions | `number` | - | `10` | Maximum suggestions to show |
| searchThreshold | `number` | - | `1` | Minimum characters to trigger search |
| allowSpaces | `boolean` | - | `false` | Allow spaces in mention text |
| caseSensitive | `boolean` | - | `false` | Case sensitive search |
| className | `string` | - | - | Additional CSS classes |
| **Event Handlers** |
| onSearch | `(query: string) => void` | - | - | Handler for search query changes |
| onSelect | `(suggestion: MentionSuggestion) => void` | - | - | Handler for suggestion selection |
| onOpen | `() => void` | - | - | Handler for dropdown open |
| onClose | `() => void` | - | - | Handler for dropdown close |
| **Render Props / Slots** |
| renderSuggestion | `(suggestion: MentionSuggestion) => ReactNode` | - | - | Custom suggestion renderer |
| renderNoResults | `() => ReactNode` | - | - | Custom no results renderer |