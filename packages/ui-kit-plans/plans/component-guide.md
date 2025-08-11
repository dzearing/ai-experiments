# Component Development Guide

This guide provides comprehensive guidance for planning and mocking up components in the ui-kit-plans package.

## 📚 Specialized Guides

Component development is split into two main activities, each with its own detailed guide:

### [Plan Guide](./plan-guide.md)
Comprehensive guide for creating component plan documents that define:
- Component architecture and API design
- Dependencies and relationships
- Performance and accessibility strategies
- Implementation roadmap

### [Mockup Guide](./mockup-guide.md)
Complete guide for creating HTML mockups that demonstrate:
- Visual design and styling
- Interactive states and behaviors
- Responsive layouts
- Theme integration

## 🚀 Quick Start

### Creating a New Component Plan

1. **Create the component directory:**
   ```bash
   mkdir -p plans/[category]-components/[component-name]
   ```

2. **Create the plan document:**
   - Copy the plan template from below
   - Save as `plans/[category]-components/[component-name]/plan.md`
   - Follow the [Plan Guide](./plan-guide.md) for detailed instructions

3. **Create mockup files:**
   - Create `mockup.html` for the main demonstration
   - Add additional mockup files as needed (e.g., `mockup-variants.html`)
   - Follow the [Mockup Guide](./mockup-guide.md) for requirements

## 📋 Component Plan Template

```markdown
# [Component Name] Component Plan

## Overview

### Description
[Brief description of what the component does and its primary use cases]

### Visual Design Mockups
- [Default State](./mockup.html)
- [All Variants](./mockup-variants.html) (if applicable)
- [Interactive Demo](./mockup-interactive.html) (if applicable)

### Key Features
- [Feature 1]
- [Feature 2]
- [Feature 3]

### Use Cases
- [Primary use case]
- [Secondary use case]
- [Edge case considerations]

## API Design

### Props Interface

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **Required Props** |
| [propName] | `type` | ✓ | - | [Description] |
| **Optional Props** |
| variant | `'primary' \| 'secondary'` | - | `'primary'` | Visual variant |
| size | `'small' \| 'medium' \| 'large'` | - | `'medium'` | Component size |
| **Event Handlers** |
| onClick | `() => void` | - | - | Click handler |
| **Slots** |
| children | `ReactNode` | - | - | Component content |

### CSS Classes & Theming
- Component classes: `.[component]`, `.[component]--[variant]`
- State classes: `.disabled`, `.loading`, `.error`
- Element classes: `.[component]__[element]`
- Token usage: See mockup files for token implementation

## Dependencies

### External Dependencies
- [ ] None required

### Internal Dependencies
- [ ] Design tokens from `@claude-flow/ui-kit`
- [ ] [List other component dependencies]

## Implementation Checklist

### Phase 1: Foundation
- [ ] Component structure and basic props
- [ ] CSS modules with design tokens
- [ ] Basic unit tests
- [ ] Default Storybook story

### Phase 2: Features
- [ ] Full props implementation
- [ ] Event handlers
- [ ] Accessibility features
- [ ] Complete test coverage

### Phase 3: Polish
- [ ] Performance optimizations
- [ ] All Storybook stories
- [ ] Documentation
- [ ] Visual regression tests

## Notes
[Any additional implementation notes or considerations]
```

## 📁 Directory Structure

```
plans/
├── component-guide.md          # This file
├── plan-guide.md               # Detailed plan guidance
├── mockup-guide.md             # Detailed mockup guidance
├── [category]-components/      # Component categories
│   └── [component-name]/       # Individual component
│       ├── plan.md            # Component plan
│       ├── mockup.html        # Main mockup
│       └── mockup-*.html      # Additional mockups
└── shared/                     # Shared resources
    ├── styles.css             # UI Kit styles
    ├── theme.js               # Theme engine
    └── theme-switcher.js      # Theme UI

```

## 🎯 Component Categories

Components are organized into logical categories:

- **chat-components/** - Chat and messaging UI
- **form-components/** - Form inputs and controls
- **data-components/** - Tables, lists, data display
- **navigation-components/** - Navigation and menus
- **feedback-components/** - Alerts, toasts, loading states
- **layout-components/** - Layout and structure
- **overlay-components/** - Modals, popovers, tooltips

## ✅ Best Practices

### For Plans
- Start with clear use cases
- Design minimal but complete APIs
- Consider accessibility from the start
- Plan for performance
- Research prior art

### For Mockups
- Always use design tokens
- Test in light and dark modes
- Ensure responsive behavior
- Use semantic HTML
- Document missing tokens

## 🔗 Resources

- [UI Kit README](../../ui-kit/README.md) - Complete token documentation
- [TOKEN_CHEATSHEET](../../../docs/guides/TOKEN_CHEATSHEET.md) - Quick token reference
- [Storybook](http://localhost:6006) - Live component examples (run `pnpm dev:storybook`)

## 🤝 Contributing

When creating new component plans:
1. Follow the appropriate guide (Plan or Mockup)
2. Use the provided templates
3. Ensure all tokens are from ui-kit
4. Test mockups in multiple themes
5. Document any missing tokens needed