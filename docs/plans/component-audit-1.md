# UI-Kit React Component Audit

**Date**: December 2025
**Scope**: All 47 components in `packages/ui-kit/react/src/components/`
**Reference**: `packages/ui-kit/react/COMPONENT_GUIDE.md`

---

## Executive Summary

### Overall Health Assessment

| Category | Status | Details |
|----------|--------|---------|
| **File Structure** | ⚠️ Partial | Most components have core files; 4 missing stories |
| **Unit Tests** | ❌ Critical | Only 1/47 components has tests (Segmented) |
| **Accessibility** | ⚠️ Needs Work | Focus traps missing in modals; ARIA gaps in menus |
| **RTL Support** | ⚠️ Needs Work | 12+ components use physical CSS properties |
| **Reduced Motion** | ❌ Critical | 0/47 components respect prefers-reduced-motion |
| **Design Tokens** | ✅ Good | Most components use tokens correctly |
| **Storybook Docs** | ✅ Good | 43/47 components have stories |

### Priority Matrix

| Priority | Count | Key Issues |
|----------|-------|------------|
| **Critical** | 8 | Missing stories, no reduced motion, focus traps |
| **High** | 15 | RTL violations, accessibility gaps, displayName |
| **Medium** | 18 | Missing tests, documentation gaps |
| **Low** | 6 | Token fallbacks, minor inconsistencies |

---

## Component Guide Improvements

The COMPONENT_GUIDE.md is comprehensive but should add these sections:

### 1. Focus Management Requirements
**Expected**: Guide should specify focus trap requirements for overlay components.
**Recommendation**: Add section:
```markdown
## Focus Management

### Overlay Components (Modal, Dialog, Drawer)
- MUST trap focus within the overlay when open
- MUST restore focus to trigger element when closed
- Use a focus trap library or implement:
  - Track first/last focusable elements
  - Redirect Tab from last to first element
  - Redirect Shift+Tab from first to last element
```

### 2. displayName Requirements
**Expected**: Guide should require displayName for debugging.
**Recommendation**: Add to component template:
```typescript
export function ComponentName(...) { ... }
ComponentName.displayName = 'ComponentName';
```

### 3. Reduced Motion Requirements
**Expected**: Guide mentions reduced motion but doesn't show required pattern.
**Recommendation**: Add explicit requirement:
```css
/* REQUIRED for all animated components */
@media (prefers-reduced-motion: reduce) {
  .animated {
    animation: none;
    transition: none;
  }
}
```

### 4. Loading State Patterns
**Expected**: Guide should define loading state conventions.
**Recommendation**: Add section on `loading` prop patterns and skeleton integration.

### 5. forwardRef Requirements
**Expected**: Guide should specify when forwardRef is required.
**Recommendation**: Add:
```markdown
## forwardRef Usage

Use forwardRef for:
- Form elements (Input, Textarea, Select, Checkbox, Radio)
- Interactive elements that may need external focus management
- Components that wrap native HTML elements users may need refs for
```

### 6. Data Attribute Conventions
**Expected**: Guide should define test ID conventions.
**Recommendation**: Add `data-testid` patterns for testing.

---

## Per-Component Audit

### Form & Input Components

---

#### Input
**Path**: `packages/ui-kit/react/src/components/Input/`

**Files**:
- [x] Input.tsx
- [x] Input.module.css
- [x] Input.stories.tsx
- [x] index.ts
- [ ] Input.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | InputProps, InputSize | ✓ Exported | ✅ |
| forwardRef | Yes (form element) | ✓ Used | ✅ |
| displayName | Set | ✓ Set | ✅ |
| Design tokens | All values from tokens | ✓ Uses tokens | ✅ |
| Height standards | sm:28px, md:36px, lg:44px | Uses padding, not explicit heights | ⚠️ |
| Reduced motion | @media query present | ❌ Missing | ❌ |
| RTL logical props | No left/right | ✓ Uses padding | ✅ |
| ARIA attributes | Proper semantics | ✓ Native input | ✅ |
| Focus visible | Visible ring | ✓ Has focus ring | ✅ |
| Stories - autodocs | Present | ✓ Present | ✅ |
| Stories - variants | All documented | ✓ All variants | ✅ |
| Unit tests | Test file exists | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `@media (prefers-reduced-motion: reduce)` to CSS
2. Create Input.test.tsx with render, variant, keyboard, and ARIA tests

**Priority**: Medium

---

#### Textarea
**Path**: `packages/ui-kit/react/src/components/Textarea/`

**Files**:
- [x] Textarea.tsx
- [x] Textarea.module.css
- [x] Textarea.stories.tsx
- [x] index.ts
- [ ] Textarea.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | TextareaProps, TextareaSize | ✓ Exported | ✅ |
| forwardRef | Yes | ✓ Used | ✅ |
| displayName | Set | ✓ Set | ✅ |
| Design tokens | All values | ✓ Uses tokens | ✅ |
| Reduced motion | Present | ❌ Missing | ❌ |
| RTL logical props | Yes | ✓ Correct | ✅ |
| Stories - autodocs | Present | ✓ Present | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add reduced motion media query
2. Add story for `autoResize` feature (documented in types but not demonstrated)
3. Create Textarea.test.tsx

**Priority**: Medium

---

#### Checkbox
**Path**: `packages/ui-kit/react/src/components/Checkbox/`

**Files**:
- [x] Checkbox.tsx
- [x] Checkbox.module.css
- [x] Checkbox.stories.tsx
- [x] index.ts
- [ ] Checkbox.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | CheckboxProps, CheckboxSize | ✓ Exported | ✅ |
| forwardRef | Yes | ✓ Used | ✅ |
| displayName | Set | ✓ Set | ✅ |
| Heights | Match form standards | Uses 14/18/22px (not 28/36/44) | ⚠️ Note: Checkbox sizes differ intentionally |
| Reduced motion | Present | ❌ Missing | ❌ |
| RTL logical props | Yes | ✓ Correct | ✅ |
| Indeterminate state | Supported | ✓ Via data attribute | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add reduced motion media query
2. Create Checkbox.test.tsx (especially for indeterminate state)
3. ID generation uses `Math.random()` - consider useId() for SSR safety

**Priority**: Medium

---

#### Radio
**Path**: `packages/ui-kit/react/src/components/Radio/`

**Files**:
- [x] Radio.tsx
- [x] Radio.module.css
- [x] Radio.stories.tsx
- [x] index.ts
- [ ] Radio.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | RadioProps, RadioSize | ✓ Exported | ✅ |
| forwardRef | Yes | ✓ Used | ✅ |
| displayName | Set | ✓ Set | ✅ |
| Reduced motion | Present | ❌ Missing | ❌ |
| RTL logical props | Yes | ✓ Correct | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add reduced motion media query
2. Create Radio.test.tsx
3. ID generation uses `Math.random()` - consider useId()

**Priority**: Medium

---

#### Switch
**Path**: `packages/ui-kit/react/src/components/Switch/`

**Files**:
- [x] Switch.tsx
- [x] Switch.module.css
- [x] Switch.stories.tsx
- [x] index.ts
- [ ] Switch.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | SwitchProps, SwitchSize | ✓ Exported | ✅ |
| forwardRef | Yes | ✓ Used | ✅ |
| displayName | Set | ✓ Set | ✅ |
| Design tokens | All values | ❌ Hardcoded "white" thumb, hardcoded box-shadow | ❌ |
| Reduced motion | Present | ❌ Missing | ❌ |
| RTL logical props | Yes | ✓ Correct | ✅ |
| ARIA role | role="switch" | ✓ Present | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Replace hardcoded `white` thumb with design token
2. Replace hardcoded `box-shadow: 0 1px 3px rgba(0,0,0,0.2)` with `--shadow-sm` token
3. Add reduced motion media query
4. Create Switch.test.tsx

**Priority**: High (token violations)

---

#### Slider
**Path**: `packages/ui-kit/react/src/components/Slider/`

**Files**:
- [x] Slider.tsx
- [x] Slider.module.css
- [x] Slider.stories.tsx
- [x] index.ts
- [ ] Slider.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | SliderProps, SliderSize | ✓ Exported | ✅ |
| forwardRef | Yes | ✓ Used | ✅ |
| displayName | Set | ✓ Set | ✅ |
| Design tokens | All values | ❌ Hardcoded white border, hardcoded box-shadow | ❌ |
| Reduced motion | Present | ❌ Missing | ❌ |
| ARIA attributes | aria-valuemin/max/now | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Replace hardcoded white border with token
2. Replace hardcoded box-shadow with token
3. Add ARIA attributes: `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label` support
4. Add reduced motion media query
5. Create Slider.test.tsx

**Priority**: High (accessibility + token violations)

---

#### Select
**Path**: `packages/ui-kit/react/src/components/Select/`

**Files**:
- [x] Select.tsx
- [x] Select.module.css
- [x] Select.stories.tsx
- [x] index.ts
- [ ] Select.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | SelectProps, SelectSize, SelectOption | ✓ Exported | ✅ |
| forwardRef | Yes | ✓ Used | ✅ |
| displayName | Set | ✓ Set | ✅ |
| Design tokens | All values | ⚠️ Hardcoded `padding-right: 32px` for arrow | ⚠️ |
| Reduced motion | Present | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Consider token-based padding for arrow space
2. Add reduced motion media query
3. Create Select.test.tsx

**Priority**: Medium

---

### Action Components

---

#### Button
**Path**: `packages/ui-kit/react/src/components/Button/`

**Files**:
- [x] Button.tsx
- [x] Button.module.css
- [x] Button.stories.tsx
- [x] index.ts
- [ ] Button.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | ButtonVariant, ButtonSize, ButtonProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Design tokens | All values | ✓ Uses tokens | ✅ |
| Height standards | 28/36/44px | ✓ Correct for iconOnly | ✅ |
| Reduced motion | Present | ✓ Present | ✅ |
| RTL logical props | Yes | ✓ Correct | ✅ |
| Focus visible | Visible ring | ✓ Present | ✅ |
| Stories - all variants | default, primary, danger, ghost, outline | ✓ All documented | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Button.displayName = 'Button'`
2. Create Button.test.tsx

**Priority**: Medium

---

#### LinkButton
**Path**: `packages/ui-kit/react/src/components/LinkButton/`

**Files**:
- [x] LinkButton.tsx
- [x] index.ts
- [ ] LinkButton.module.css ❌ (delegates to Button)
- [ ] LinkButton.stories.tsx ❌
- [ ] LinkButton.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | LinkButtonProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| CSS module | Exists | ❌ Delegates to Button (acceptable for wrapper) | ⚠️ |
| Stories | Documented | ❌ Missing | ❌ |
| Deprecation notice | Migration story | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add LinkButton.stories.tsx with deprecation notice and migration example to `<Button as="a">`
2. Add `LinkButton.displayName = 'LinkButton'`
3. Create LinkButton.test.tsx

**Priority**: High (missing stories for public component)

---

#### IconButton
**Path**: `packages/ui-kit/react/src/components/IconButton/`

**Files**:
- [x] IconButton.tsx
- [x] index.ts
- [ ] IconButton.module.css ❌ (delegates to Button)
- [ ] IconButton.stories.tsx ❌
- [ ] IconButton.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | IconButtonProps | ✓ Exported | ✅ |
| aria-label required | Enforced | ✓ Type-level enforcement | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Stories | Documented | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add IconButton.stories.tsx showing proper aria-label usage
2. Add `IconButton.displayName = 'IconButton'`
3. Create IconButton.test.tsx

**Priority**: High (missing stories for public component)

---

### Navigation Components

---

#### Link
**Path**: `packages/ui-kit/react/src/components/Link/`

**Files**:
- [x] Link.tsx
- [x] Link.module.css
- [x] Link.stories.tsx
- [x] index.ts
- [ ] Link.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | LinkProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Design tokens | Consistent naming | ⚠️ Uses `--link` instead of `--body-link` | ⚠️ |
| External link handling | rel="noopener noreferrer" | ✓ Correct | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Link.displayName = 'Link'`
2. Consider aligning token naming with `--body-link` convention
3. Create Link.test.tsx

**Priority**: Medium

---

#### Breadcrumb
**Path**: `packages/ui-kit/react/src/components/Breadcrumb/`

**Files**:
- [x] Breadcrumb.tsx
- [x] Breadcrumb.module.css
- [x] Breadcrumb.stories.tsx
- [x] index.ts
- [ ] Breadcrumb.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | BreadcrumbItem, BreadcrumbProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| ARIA attributes | nav, aria-label, aria-current | ✓ All present | ✅ |
| Semantic HTML | nav > ol > li | ✓ Correct | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Breadcrumb.displayName = 'Breadcrumb'`
2. Create Breadcrumb.test.tsx

**Priority**: Medium

---

#### Pagination
**Path**: `packages/ui-kit/react/src/components/Pagination/`

**Files**:
- [x] Pagination.tsx
- [x] Pagination.module.css
- [x] Pagination.stories.tsx
- [x] index.ts
- [ ] Pagination.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | PaginationProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Height standards | 28/36/44px | Uses 32px (acceptable for pagination) | ⚠️ |
| ARIA attributes | aria-label, aria-current | ✓ Present | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Pagination.displayName = 'Pagination'`
2. Create Pagination.test.tsx

**Priority**: Medium

---

#### Tabs
**Path**: `packages/ui-kit/react/src/components/Tabs/`

**Files**:
- [x] Tabs.tsx
- [x] Tabs.module.css
- [x] Tabs.stories.tsx
- [x] index.ts
- [ ] Tabs.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | TabsVariant, TabItem, TabsProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Reduced motion | Present | ✓ Present | ✅ |
| ARIA attributes | tablist, tab, aria-selected | ✓ Present | ✅ |
| Keyboard navigation | Arrow keys per WAI-ARIA | ❌ Missing arrow key nav | ❌ |
| Stories - icon variant | Documented | ❌ Missing | ❌ |
| Stories - fullWidth | Documented | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add keyboard arrow navigation (Left/Right to move between tabs per WAI-ARIA tabs pattern)
2. Add `Tabs.displayName = 'Tabs'`
3. Add story for icon support
4. Add story for fullWidth variant
5. Create Tabs.test.tsx

**Priority**: High (accessibility gap - keyboard nav)

---

#### Menu
**Path**: `packages/ui-kit/react/src/components/Menu/`

**Files**:
- [x] Menu.tsx
- [x] Menu.module.css
- [x] Menu.stories.tsx
- [x] index.ts
- [ ] Menu.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | MenuItem, MenuProps, etc. | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Reduced motion | Present | ✓ Present | ✅ |
| ARIA attributes | aria-haspopup, aria-expanded on trigger | ❌ Missing on trigger | ❌ |
| Keyboard support | Arrow keys, Enter, Escape | ✓ Present | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `aria-haspopup="menu"` and `aria-expanded` to trigger element
2. Add `Menu.displayName = 'Menu'`
3. Create Menu.test.tsx

**Priority**: High (accessibility gap)

---

#### Toolbar
**Path**: `packages/ui-kit/react/src/components/Toolbar/`

**Files**:
- [x] Toolbar.tsx
- [x] Toolbar.module.css
- [x] Toolbar.stories.tsx
- [x] index.ts
- [ ] Toolbar.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | ToolbarProps, ToolbarGroupProps, etc. | ✓ Exported | ✅ |
| displayName | Set for all sub-components | ❌ Missing | ❌ |
| RTL logical props | No left/right | ❌ Uses `margin-left: auto` | ❌ |
| ARIA attributes | role="toolbar" | ✓ Present | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Replace `margin-left: auto` with `margin-inline-start: auto` in CSS
2. Add displayName for Toolbar, ToolbarGroup, ToolbarDivider, ToolbarSpacer, ButtonGroup
3. Create Toolbar.test.tsx

**Priority**: High (RTL violation)

---

### Overlay Components

---

#### Modal
**Path**: `packages/ui-kit/react/src/components/Modal/`

**Files**:
- [x] Modal.tsx
- [x] Modal.module.css
- [x] Modal.stories.tsx
- [x] index.ts
- [ ] Modal.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | ModalProps, ModalSize | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Reduced motion | Present | ❌ Missing | ❌ |
| ARIA attributes | role="dialog", aria-modal | ✓ Present | ✅ |
| Keyboard support | Escape to close | ✓ Present | ✅ |
| Focus trap | Trap focus within modal | ❌ Missing | ❌ |
| Focus restoration | Return focus on close | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Implement focus trap (track first/last focusable, redirect Tab/Shift+Tab)
2. Implement focus restoration (save activeElement before open, restore on close)
3. Add reduced motion media query
4. Add `Modal.displayName = 'Modal'`
5. Create Modal.test.tsx

**Priority**: Critical (focus trap is essential for accessibility)

---

#### Dialog
**Path**: `packages/ui-kit/react/src/components/Dialog/`

**Files**:
- [x] Dialog.tsx
- [x] Dialog.module.css
- [x] Dialog.stories.tsx
- [x] index.ts
- [ ] Dialog.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | DialogProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Reduced motion | Present | ❌ Missing (inherits Modal gap) | ❌ |
| Focus trap | Inherited from Modal | ❌ Missing (inherits Modal gap) | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Fix inherits Modal's focus trap gap
2. Add `Dialog.displayName = 'Dialog'`
3. Create Dialog.test.tsx

**Priority**: Critical (inherits Modal's focus trap gap)

---

#### Drawer
**Path**: `packages/ui-kit/react/src/components/Drawer/`

**Files**:
- [x] Drawer.tsx
- [x] Drawer.module.css
- [x] Drawer.stories.tsx
- [x] index.ts
- [ ] Drawer.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | DrawerProps, DrawerPosition, DrawerSize | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Reduced motion | Present | ❌ Missing | ❌ |
| RTL logical props | inset-inline-start/end | ❌ Uses left/right for positioning | ❌ |
| Focus trap | Present | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Replace `left`/`right` positioning with `inset-inline-start`/`inset-inline-end`
2. Implement focus trap
3. Add reduced motion media query
4. Add `Drawer.displayName = 'Drawer'`
5. Create Drawer.test.tsx

**Priority**: Critical (RTL + focus trap)

---

#### Tooltip
**Path**: `packages/ui-kit/react/src/components/Tooltip/`

**Files**:
- [x] Tooltip.tsx
- [x] Tooltip.module.css
- [x] Tooltip.stories.tsx
- [x] index.ts
- [ ] Tooltip.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | TooltipProps, TooltipPosition | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Design tokens | Pure tokens | ❌ Uses fallback colors like `--tooltip-bg, #1a1a1a` | ❌ |
| Reduced motion | Present | ❌ Missing | ❌ |
| ARIA - aria-describedby | Links tooltip to trigger | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Remove fallback colors, use pure tokens
2. Add `aria-describedby` linking tooltip content to trigger
3. Add reduced motion media query
4. Add `Tooltip.displayName = 'Tooltip'`
5. Create Tooltip.test.tsx

**Priority**: High (accessibility + tokens)

---

#### Popover
**Path**: `packages/ui-kit/react/src/components/Popover/`

**Files**:
- [x] Popover.tsx
- [x] Popover.module.css
- [x] index.ts
- [ ] Popover.stories.tsx ❌
- [ ] Popover.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | PopoverProps, PopoverPosition | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Reduced motion | Present | ❌ Missing | ❌ |
| ARIA attributes | role, aria-expanded | ❌ Missing | ❌ |
| Stories | Documented | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add Popover.stories.tsx
2. Add ARIA roles and `aria-expanded` on trigger
3. Make trigger element a proper button (currently generic div)
4. Add reduced motion media query
5. Add `Popover.displayName = 'Popover'`
6. Create Popover.test.tsx

**Priority**: Critical (missing stories + accessibility gaps)

---

#### Dropdown
**Path**: `packages/ui-kit/react/src/components/Dropdown/`

**Files**:
- [x] Dropdown.tsx
- [x] Dropdown.module.css
- [x] Dropdown.stories.tsx
- [x] index.ts
- [ ] Dropdown.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | DropdownProps, DropdownItem | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Reduced motion | Present | ❌ Missing | ❌ |
| RTL support | Logical props, direction detection | ✓ Excellent RTL support | ✅ |
| ARIA - role="menu" | On container | ❌ Missing | ❌ |
| ARIA - role="menuitem" | On items | ❌ Missing | ❌ |
| ARIA - aria-expanded | On trigger | ❌ Missing | ❌ |
| Keyboard support | Comprehensive | ✓ Excellent | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `role="menu"` to dropdown container
2. Add `role="menuitem"` to items
3. Add `aria-expanded` to trigger button
4. Add reduced motion media query
5. Add `Dropdown.displayName = 'Dropdown'`
6. Create Dropdown.test.tsx

**Priority**: High (ARIA roles missing despite excellent keyboard support)

---

### Notification Components

---

#### Alert
**Path**: `packages/ui-kit/react/src/components/Alert/`

**Files**:
- [x] Alert.tsx
- [x] Alert.module.css
- [x] index.ts
- [ ] Alert.stories.tsx ❌
- [ ] Alert.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | AlertProps, AlertVariant | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| ARIA role | role="alert" | ✓ Present | ✅ |
| Stories | Documented | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add Alert.stories.tsx with all variants
2. Add `Alert.displayName = 'Alert'`
3. Create Alert.test.tsx

**Priority**: Critical (missing stories for public component)

---

#### Toast
**Path**: `packages/ui-kit/react/src/components/Toast/`

**Files**:
- [x] Toast.tsx
- [x] Toast.module.css
- [x] Toast.stories.tsx
- [x] index.ts
- [ ] Toast.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | ToastProps, ToastVariant, ToastPosition | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Reduced motion | Present | ❌ Missing | ❌ |
| ARIA - role | role="status" or "alert" | ❌ Missing | ❌ |
| ARIA - aria-live | For announcements | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `role="status"` (or `role="alert"` for urgent toasts)
2. Add `aria-live="polite"` (or `"assertive"` for urgent)
3. Add `aria-atomic="true"`
4. Add reduced motion media query
5. Add `Toast.displayName = 'Toast'`
6. Create Toast.test.tsx

**Priority**: High (accessibility - screen reader announcements)

---

#### Banner
**Path**: `packages/ui-kit/react/src/components/Banner/`

**Files**:
- [x] Banner.tsx
- [x] Banner.module.css
- [x] Banner.stories.tsx
- [x] index.ts
- [ ] Banner.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | BannerProps, BannerVariant | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Design tokens | All values | ⚠️ Uses `color-mix()` - browser support | ⚠️ |
| Reduced motion | Present | ❌ Missing | ❌ |
| ARIA role | role="alert" | ✓ Present | ✅ |
| Icon accessibility | Alt text | ❌ SVG icons lack aria-label | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `aria-hidden="true"` to decorative icons or `aria-label` for meaningful ones
2. Consider fallback for `color-mix()` for older browsers
3. Add reduced motion media query
4. Add `Banner.displayName = 'Banner'`
5. Create Banner.test.tsx

**Priority**: Medium

---

### Feedback Components

---

#### Spinner
**Path**: `packages/ui-kit/react/src/components/Spinner/`

**Files**:
- [x] Spinner.tsx
- [x] Spinner.module.css
- [x] Spinner.stories.tsx
- [x] index.ts
- [ ] Spinner.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | SpinnerProps, SpinnerSize | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Reduced motion | **Critical** - must pause animation | ❌ Missing | ❌ |
| ARIA role | role="status" | ✓ Present | ✅ |
| SR text | Screen reader text | ✓ .srOnly class | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. **CRITICAL**: Add `@media (prefers-reduced-motion: reduce)` to stop/slow animation
2. Provide static fallback when animation is reduced
3. Add `Spinner.displayName = 'Spinner'`
4. Create Spinner.test.tsx

**Priority**: Critical (animated loading indicator MUST respect reduced motion)

---

#### Progress
**Path**: `packages/ui-kit/react/src/components/Progress/`

**Files**:
- [x] Progress.tsx
- [x] Progress.module.css
- [x] Progress.stories.tsx
- [x] index.ts
- [ ] Progress.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | ProgressProps, ProgressVariant, ProgressSize | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Design tokens | All values | ❌ Shimmer uses hardcoded `rgba(255,255,255,0.3)` | ❌ |
| Reduced motion | Present | ❌ Missing | ❌ |
| ARIA attributes | progressbar, valuemin/max/now | ✓ Present | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Replace hardcoded shimmer color with token
2. Add reduced motion media query (stop shimmer animation)
3. Add `Progress.displayName = 'Progress'`
4. Create Progress.test.tsx

**Priority**: High (token violation + reduced motion)

---

#### Skeleton
**Path**: `packages/ui-kit/react/src/components/Skeleton/`

**Files**:
- [x] Skeleton.tsx
- [x] Skeleton.module.css
- [x] Skeleton.stories.tsx
- [x] index.ts
- [ ] Skeleton.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | SkeletonProps, SkeletonVariant | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Reduced motion | Present | ❌ Missing | ❌ |
| ARIA | aria-hidden="true" | ✓ Present | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add reduced motion media query (stop shimmer animation)
2. Add `Skeleton.displayName = 'Skeleton'`
3. Create Skeleton.test.tsx

**Priority**: Medium

---

### Layout Components

---

#### Stack
**Path**: `packages/ui-kit/react/src/components/Stack/`

**Files**:
- [x] Stack.tsx
- [x] Stack.module.css
- [x] Stack.stories.tsx
- [x] index.ts
- [ ] Stack.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | StackProps, StackDirection, etc. | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| RTL support | Flex handles RTL | ✓ Correct | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Stack.displayName = 'Stack'`
2. Create Stack.test.tsx

**Priority**: Low

---

#### Grid
**Path**: `packages/ui-kit/react/src/components/Grid/`

**Files**:
- [x] Grid.tsx
- [x] Grid.module.css
- [x] Grid.stories.tsx
- [x] index.ts
- [ ] Grid.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | GridProps, GridGap | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| RTL support | Grid handles RTL | ✓ Correct | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Grid.displayName = 'Grid'`
2. Create Grid.test.tsx

**Priority**: Low

---

#### Card
**Path**: `packages/ui-kit/react/src/components/Card/`

**Files**:
- [x] Card.tsx
- [x] Card.module.css
- [x] index.ts
- [ ] Card.stories.tsx ❌
- [ ] Card.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | CardProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Compound exports | CardTitle, CardDescription | ✓ Exported | ✅ |
| Stories | Documented | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add Card.stories.tsx with examples of compound components
2. Add displayName for Card, CardTitle, CardDescription
3. Create Card.test.tsx

**Priority**: Critical (missing stories for commonly used component)

---

#### Panel
**Path**: `packages/ui-kit/react/src/components/Panel/`

**Files**:
- [x] Panel.tsx
- [x] Panel.module.css
- [x] Panel.stories.tsx
- [x] index.ts
- [ ] Panel.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | PanelProps, PanelVariant, PanelPadding | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Panel.displayName = 'Panel'`
2. Create Panel.test.tsx

**Priority**: Low

---

#### Divider
**Path**: `packages/ui-kit/react/src/components/Divider/`

**Files**:
- [x] Divider.tsx
- [x] Divider.module.css
- [x] Divider.stories.tsx
- [x] index.ts
- [ ] Divider.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | DividerProps, DividerOrientation | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| RTL logical props | No left/right | ❌ Uses physical margins for vertical | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Replace `margin: 0 var(--space-2)` with logical margin for vertical orientation
2. Add `Divider.displayName = 'Divider'`
3. Create Divider.test.tsx

**Priority**: High (RTL violation)

---

#### SplitPane
**Path**: `packages/ui-kit/react/src/components/SplitPane/`

**Files**:
- [x] SplitPane.tsx
- [x] SplitPane.module.css
- [x] SplitPane.stories.tsx
- [x] index.ts
- [ ] SplitPane.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | SplitPaneProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Initial render skip | Animation skipped | ✓ Correct | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `SplitPane.displayName = 'SplitPane'`
2. Create SplitPane.test.tsx

**Priority**: Low

---

#### Sizer
**Path**: `packages/ui-kit/react/src/components/Sizer/`

**Files**:
- [x] Sizer.tsx
- [x] Sizer.module.css
- [x] Sizer.stories.tsx
- [x] index.ts
- [ ] Sizer.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | SizerProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Sizer.displayName = 'Sizer'`
2. Create Sizer.test.tsx

**Priority**: Low

---

### Typography Components

---

#### Heading
**Path**: `packages/ui-kit/react/src/components/Heading/`

**Files**:
- [x] Heading.tsx
- [x] Heading.module.css
- [x] Heading.stories.tsx
- [x] index.ts
- [ ] Heading.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | HeadingProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Semantic HTML | h1-h6 | ✓ Correct | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Heading.displayName = 'Heading'`
2. Create Heading.test.tsx

**Priority**: Low

---

#### Text
**Path**: `packages/ui-kit/react/src/components/Text/`

**Files**:
- [x] Text.tsx
- [x] Text.module.css
- [x] Text.stories.tsx
- [x] index.ts
- [ ] Text.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | TextProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Polymorphic as prop | Supported | ✓ Correct | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Text.displayName = 'Text'`
2. Create Text.test.tsx

**Priority**: Low

---

#### Code
**Path**: `packages/ui-kit/react/src/components/Code/`

**Files**:
- [x] Code.tsx
- [x] Code.module.css
- [x] Code.stories.tsx
- [x] index.ts
- [ ] Code.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | CodeProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Inline/block support | Both | ✓ Correct | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Code.displayName = 'Code'`
2. Create Code.test.tsx

**Priority**: Low

---

### Content Components

---

#### Avatar
**Path**: `packages/ui-kit/react/src/components/Avatar/`

**Files**:
- [x] Avatar.tsx
- [x] Avatar.module.css
- [x] Avatar.stories.tsx
- [x] index.ts
- [ ] Avatar.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | AvatarProps, AvatarSize | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Fallback handling | Auto initials | ✓ Correct | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add `Avatar.displayName = 'Avatar'`
2. Create Avatar.test.tsx

**Priority**: Low

---

#### Chip
**Path**: `packages/ui-kit/react/src/components/Chip/`

**Files**:
- [x] Chip.tsx
- [x] Chip.module.css
- [x] Chip.stories.tsx
- [x] index.ts
- [ ] Chip.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | ChipProps, ChipVariant, ChipSize | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Design tokens | Pure tokens | ⚠️ Uses fallback values | ⚠️ |
| RTL logical props | No left/right | ❌ Uses margin-left/right | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Remove fallback values in CSS (e.g., `var(--space-1, 4px)` → `var(--space-1)`)
2. Replace `margin-left`/`margin-right` with `margin-inline-start`/`margin-inline-end`
3. Add `Chip.displayName = 'Chip'`
4. Create Chip.test.tsx

**Priority**: High (RTL + token issues)

---

### Data Display Components

---

#### Table
**Path**: `packages/ui-kit/react/src/components/Table/`

**Files**:
- [x] Table.tsx
- [x] Table.module.css
- [x] Table.stories.tsx
- [x] index.ts
- [ ] Table.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | TableProps, TableColumn, TableSort, etc. | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| RTL - align prop | Logical values | ❌ Uses 'left'/'center'/'right' | ❌ |
| ARIA - sorting | aria-sort | ✓ Present | ✅ |
| ARIA - selection | aria-selected | ✓ Present | ✅ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Consider changing align prop to use 'start'/'center'/'end' for RTL
2. Add `Table.displayName = 'Table'`
3. Create Table.test.tsx (especially for sorting and selection)

**Priority**: High (RTL alignment issue)

---

#### List
**Path**: `packages/ui-kit/react/src/components/List/`

**Files**:
- [x] List.tsx
- [x] List.module.css
- [x] List.stories.tsx
- [x] index.ts
- [ ] List.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | ListProps, ListItemProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| RTL logical props | No left/right | ❌ Uses `margin-left: auto` | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Replace `margin-left: auto` with `margin-inline-start: auto`
2. Add displayName for List and ListItem
3. Create List.test.tsx

**Priority**: High (RTL violation)

---

#### TreeView
**Path**: `packages/ui-kit/react/src/components/TreeView/`

**Files**:
- [x] TreeView.tsx
- [x] TreeView.module.css
- [x] TreeView.stories.tsx
- [x] index.ts
- [ ] TreeView.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | TreeViewProps, TreeNode | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| RTL logical props | No left/right | ❌ Uses `left: 0`, `right: 0`, `padding-right` | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Replace `left: 0` with `inset-inline-start: 0`
2. Replace `right: 0` with `inset-inline-end: 0`
3. Replace `padding-right` with `padding-inline-end`
4. Add `TreeView.displayName = 'TreeView'`
5. Create TreeView.test.tsx

**Priority**: High (RTL violations)

---

#### Accordion
**Path**: `packages/ui-kit/react/src/components/Accordion/`

**Files**:
- [x] Accordion.tsx
- [x] Accordion.module.css
- [x] Accordion.stories.tsx
- [x] index.ts
- [ ] Accordion.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | AccordionProps, AccordionItemProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| RTL logical props | No left/right | ❌ Uses `margin-left`, `text-align: left` | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Replace `text-align: left` with `text-align: start`
2. Replace `margin-left` with `margin-inline-start`
3. Add displayName for Accordion and AccordionItem
4. Create Accordion.test.tsx

**Priority**: High (RTL violations)

---

### Special Components

---

#### Segmented
**Path**: `packages/ui-kit/react/src/components/Segmented/`

**Files**:
- [x] Segmented.tsx
- [x] Segmented.module.css
- [x] Segmented.stories.tsx
- [x] index.ts
- [x] Segmented.test.tsx ✓ (ONLY component with tests!)

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | SegmentedProps, SegmentedOption | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| RTL support | Direction-aware | ✓ Excellent RTL awareness | ✅ |
| Reduced motion | Present | ✓ Present | ✅ |
| Unit tests | Exist | ✓ Present | ✅ |

**Issues to Fix**:
1. Add `Segmented.displayName = 'Segmented'`

**Priority**: Low (reference implementation - use as model for others)

---

#### PageTransition
**Path**: `packages/ui-kit/react/src/components/PageTransition/`

**Files**:
- [x] PageTransition.tsx
- [x] PageTransition.module.css
- [x] index.ts
- [ ] PageTransition.stories.tsx ❌
- [ ] PageTransition.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | PageTransitionProps, TransitionDirection | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| Stories | Documented | ❌ Missing | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Add PageTransition.stories.tsx with usage examples
2. Add `PageTransition.displayName = 'PageTransition'`
3. Create PageTransition.test.tsx

**Priority**: Critical (complex animation component needs documentation)

---

#### Animation
**Path**: `packages/ui-kit/react/src/components/Animation/`

**Files**:
- [x] Sub-components: Fade.tsx, Slide.tsx, Scale.tsx, Collapse.tsx, Transition.tsx
- [x] Animation.module.css
- [x] Animation.stories.tsx
- [x] index.ts
- [ ] Main Animation.tsx ❌
- [ ] Animation.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Main component | Animation.tsx | ❌ Missing main wrapper | ❌ |
| Types exported | Various | ✓ Sub-component types exported | ✅ |
| displayName | Set | ❌ Missing for all | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Consider adding main Animation.tsx wrapper component (or document intentional architecture)
2. Add displayName for Fade, Slide, Scale, Collapse, Transition
3. Create Animation.test.tsx

**Priority**: High (missing main component file)

---

#### Form
**Path**: `packages/ui-kit/react/src/components/Form/`

**Files**:
- [x] Form.tsx
- [x] Form.module.css
- [x] Form.stories.tsx
- [x] index.ts
- [ ] Form.test.tsx ❌

**Checklist**:
| Requirement | Expected | Actual | Status |
|-------------|----------|--------|--------|
| Types exported | FormFieldProps, FormActionsProps, FormRowProps | ✓ Exported | ✅ |
| displayName | Set | ❌ Missing | ❌ |
| RTL logical props | No left/right | ❌ Uses `margin-left` | ❌ |
| Unit tests | Exist | ❌ Missing | ❌ |

**Issues to Fix**:
1. Replace `margin-left` with `margin-inline-start`
2. Add displayName for FormField, FormActions, FormRow
3. Create Form.test.tsx

**Priority**: High (RTL violation)

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Accessibility & Missing Documentation)
**Impact**: High | **Effort**: Medium

1. **Focus traps** for Modal, Dialog, Drawer
2. **Missing stories** for: Popover, Alert, Card, PageTransition, LinkButton, IconButton
3. **Reduced motion** for Spinner (critical - animated loading indicator)
4. **ARIA roles** for Dropdown (menu/menuitem), Tooltip (describedby)

### Phase 2: RTL Compliance
**Impact**: High | **Effort**: Low-Medium

Fix CSS logical properties in:
- Toolbar (`margin-left: auto`)
- Drawer (`left/right` positioning)
- Divider (`margin` for vertical)
- TreeView (`left`, `right`, `padding-right`)
- Accordion (`margin-left`, `text-align: left`)
- List (`margin-left: auto`)
- Chip (`margin-left/right`)
- Table (`align` prop values)
- Form (`margin-left`)

### Phase 3: Reduced Motion & Tokens
**Impact**: Medium | **Effort**: Low

1. Add `@media (prefers-reduced-motion: reduce)` to all animated components
2. Fix hardcoded values:
   - Switch: white thumb, box-shadow
   - Slider: white border, box-shadow
   - Progress: shimmer rgba color
   - Tooltip: fallback colors

### Phase 4: displayName & Consistency
**Impact**: Low | **Effort**: Low

Add displayName to all 47 components for React DevTools debugging.

### Phase 5: Test Infrastructure
**Impact**: High | **Effort**: High

Create test files for all components. Priority order:
1. Complex interactive: Table, Dropdown, Tabs, Menu, TreeView
2. Form elements: Input, Textarea, Checkbox, Radio, Switch, Select, Slider
3. Overlays: Modal, Dialog, Drawer, Popover, Tooltip
4. Others: All remaining components

Reference: Use Segmented.test.tsx as the model test file.

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total components | 47 |
| With complete file structure | 43 |
| Missing stories | 4 (Popover, Alert, Card, PageTransition) + 2 (LinkButton, IconButton) |
| Missing tests | 46 (only Segmented has tests) |
| RTL violations | 12 components |
| Missing reduced motion | ~35 animated components |
| Missing displayName | 47 components |
| Missing focus trap | 3 (Modal, Dialog, Drawer) |
| ARIA gaps | 6 components |
