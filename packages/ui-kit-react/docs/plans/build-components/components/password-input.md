# PasswordInput

**Priority**: High

**Description**: Secure password input with strength indication.

**Base Component**: Input (extends all Input props)

**Component Dependencies**:
- Input (base input functionality)
- Button (show/hide toggle, generate button)
- ProgressBar (strength meter)
- Tooltip (requirements display)
- IconButton (visibility toggle)

**API Surface Extension**:
```typescript
interface PasswordInputProps extends InputProps {
  // Visibility toggle
  showToggle?: boolean;
  showLabel?: string;
  hideLabel?: string;
  
  // Strength meter
  showStrength?: boolean;
  strengthRules?: PasswordRule[];
  
  // Password generation
  showGenerator?: boolean;
  generatorOptions?: GeneratorOptions;
  
  // Validation
  confirmPassword?: boolean;
  confirmLabel?: string;
  
  // Security features
  showCapsLockWarning?: boolean;
  disableAutocomplete?: boolean;
  
  // Events
  onStrengthChange?: (strength: PasswordStrength) => void;
  onGenerate?: (password: string) => void;
}
```

**Features**:
- Show/hide toggle
- Strength meter
- Requirements list
- Generate password
- Copy button
- Caps lock warning
- Auto-complete control
- Confirm field
- Policy validation

**Use Cases**:
- Login forms
- Registration
- Password change
- Security settings
- Authentication
