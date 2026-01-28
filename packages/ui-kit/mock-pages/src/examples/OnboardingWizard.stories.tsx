import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Chip,
  Input,
  Stack,
  Stepper,
  Switch,
  Text,
} from '@ui-kit/react';
import styles from './OnboardingWizard.module.css';

/**
 * # Onboarding Wizard
 *
 * A multi-step onboarding flow demonstrating the Stepper component
 * in a user account setup context.
 *
 * ## Components Used
 * - **Stepper**: Progress indicator for multi-step flow
 * - **Input**: Form fields for account info
 * - **Switch**: Preference toggles
 * - **Chip**: Role selection and review tags
 * - **Button**: Navigation actions
 *
 * ## Stepper Features Demonstrated
 * - Horizontal orientation for wizard header
 * - Step descriptions for additional context
 * - Clickable steps for navigation
 * - Visual states: pending, current, complete
 */

const onboardingSteps = [
  { label: 'Account', description: 'Create your account' },
  { label: 'Role', description: 'Select your role' },
  { label: 'Preferences', description: 'Set your preferences' },
  { label: 'Review', description: 'Confirm details' },
  { label: 'Complete', description: 'All done!' },
];

const roles = [
  { id: 'developer', icon: '💻', name: 'Developer', description: 'Build and ship code' },
  { id: 'designer', icon: '🎨', name: 'Designer', description: 'Create beautiful interfaces' },
  { id: 'manager', icon: '📊', name: 'Manager', description: 'Lead and coordinate teams' },
  { id: 'analyst', icon: '📈', name: 'Analyst', description: 'Analyze data and insights' },
];

const preferences = [
  { id: 'notifications', name: 'Email Notifications', description: 'Receive updates about your projects' },
  { id: 'newsletter', name: 'Weekly Newsletter', description: 'Tips and best practices' },
  { id: 'analytics', name: 'Usage Analytics', description: 'Help us improve the product' },
];

interface FormData {
  name: string;
  email: string;
  role: string;
  preferences: Record<string, boolean>;
}

function OnboardingWizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: '',
    preferences: {
      notifications: true,
      newsletter: false,
      analytics: true,
    },
  });

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    // Only allow navigating to completed steps or current step
    if (index <= currentStep) {
      setCurrentStep(index);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <h2 className={styles.stepTitle}>Create your account</h2>
            <p className={styles.stepDescription}>
              Enter your details to get started with your new workspace.
            </p>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Name</label>
              <Input
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <p className={styles.formHint}>We'll send a confirmation email to this address.</p>
            </div>
          </>
        );

      case 1:
        return (
          <>
            <h2 className={styles.stepTitle}>What's your role?</h2>
            <p className={styles.stepDescription}>
              This helps us personalize your experience and show relevant features.
            </p>
            <div className={styles.roleGrid}>
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`${styles.roleCard} ${formData.role === role.id ? styles.roleCardSelected : ''}`}
                  onClick={() => setFormData({ ...formData, role: role.id })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setFormData({ ...formData, role: role.id });
                    }
                  }}
                >
                  <span className={styles.roleIcon}>{role.icon}</span>
                  <span className={styles.roleName}>{role.name}</span>
                  <span className={styles.roleDescription}>{role.description}</span>
                </div>
              ))}
            </div>
          </>
        );

      case 2:
        return (
          <>
            <h2 className={styles.stepTitle}>Set your preferences</h2>
            <p className={styles.stepDescription}>
              Customize how you want to interact with the platform.
            </p>
            {preferences.map((pref) => (
              <div key={pref.id} className={styles.preferenceItem}>
                <Switch
                  checked={formData.preferences[pref.id]}
                  onChange={(checked) =>
                    setFormData({
                      ...formData,
                      preferences: { ...formData.preferences, [pref.id]: checked },
                    })
                  }
                  aria-label={pref.name}
                />
                <div className={styles.preferenceContent}>
                  <div className={styles.preferenceName}>{pref.name}</div>
                  <div className={styles.preferenceDescription}>{pref.description}</div>
                </div>
              </div>
            ))}
          </>
        );

      case 3:
        const selectedRole = roles.find((r) => r.id === formData.role);
        const enabledPrefs = preferences.filter((p) => formData.preferences[p.id]);

        return (
          <>
            <h2 className={styles.stepTitle}>Review your details</h2>
            <p className={styles.stepDescription}>
              Please review your information before completing setup.
            </p>

            <div className={styles.reviewSection}>
              <div className={styles.reviewLabel}>Account</div>
              <div className={styles.reviewValue}>
                {formData.name || 'Not provided'}<br />
                <Text size="sm" color="soft">{formData.email || 'Not provided'}</Text>
              </div>
            </div>

            <div className={styles.reviewSection}>
              <div className={styles.reviewLabel}>Role</div>
              <div className={styles.reviewValue}>
                {selectedRole ? (
                  <Stack direction="horizontal" gap="sm" align="center">
                    <span>{selectedRole.icon}</span>
                    <span>{selectedRole.name}</span>
                  </Stack>
                ) : (
                  'Not selected'
                )}
              </div>
            </div>

            <div className={styles.reviewSection}>
              <div className={styles.reviewLabel}>Preferences</div>
              <div className={styles.reviewList}>
                {enabledPrefs.length > 0 ? (
                  enabledPrefs.map((pref) => (
                    <Chip key={pref.id} size="sm" variant="info">
                      {pref.name}
                    </Chip>
                  ))
                ) : (
                  <Text size="sm" color="soft">None selected</Text>
                )}
              </div>
            </div>
          </>
        );

      case 4:
        return (
          <div className={styles.successContent}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successTitle}>You're all set!</div>
            <div className={styles.successDescription}>
              Your account has been created and you're ready to start using the platform.
            </div>
            <Button variant="primary" size="lg">
              Go to Dashboard
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>C</div>
          <span>Claude Flow</span>
        </div>
        <a href="#" className={styles.helpLink}>Need help?</a>
      </header>

      <main className={styles.main}>
        <div className={styles.stepperContainer}>
          <Stepper
            steps={onboardingSteps}
            current={currentStep}
            orientation="horizontal"
            size="md"
            clickable
            onStepClick={handleStepClick}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.contentCard}>
            {renderStepContent()}

            {!isLastStep && (
              <div className={styles.navigation}>
                {isFirstStep ? (
                  <div className={styles.navigationSpacer} />
                ) : (
                  <Button variant="default" onClick={handleBack}>
                    Back
                  </Button>
                )}
                <Button variant="primary" onClick={handleNext}>
                  {currentStep === onboardingSteps.length - 2 ? 'Complete Setup' : 'Continue'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </footer>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/Stepper/Onboarding Wizard',
  component: OnboardingWizardPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Building an Onboarding Wizard

This example demonstrates how to build a multi-step onboarding flow using the Stepper component.

### Key Patterns

#### Stepper as Progress Indicator
- Horizontal orientation works well for wizard headers
- Step descriptions provide context about each stage
- Clickable steps allow users to navigate back to completed steps

#### Step Content Structure
Each step follows a consistent structure:
- **Title**: Clear heading describing the step
- **Description**: Brief explanation of what's needed
- **Content**: Form fields or interactive elements
- **Navigation**: Back and Continue buttons

#### Form State Management
- Single state object holds all form data
- Each step updates relevant portions
- Review step displays all collected data

#### Navigation Rules
- Back button hidden on first step
- Continue button text changes for final step
- Clicking completed steps navigates back

### Stepper Props Used

| Prop | Value | Purpose |
|------|-------|---------|
| orientation | horizontal | Fits wizard header layout |
| size | md | Standard size for main content |
| clickable | true | Allows navigating to completed steps |
| onStepClick | handler | Validates navigation rules |

### Components Used

| Component | Purpose |
|-----------|---------|
| Stepper | Progress indicator |
| Input | Account form fields |
| Switch | Preference toggles |
| Chip | Review tags |
| Button | Navigation actions |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};

/**
 * Starting at the role selection step
 */
export const AtRoleStep: Story = {
  render: () => {
    const [current, setCurrent] = useState(1);

    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
        <Stepper
          steps={onboardingSteps}
          current={current}
          clickable
          onStepClick={setCurrent}
        />
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Text color="soft">
            Step {current + 1}: {onboardingSteps[current].label}
          </Text>
        </div>
      </div>
    );
  },
};

/**
 * Vertical orientation for sidebar layout
 */
export const VerticalSidebar: Story = {
  render: () => {
    const [current, setCurrent] = useState(2);

    return (
      <div style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
        <div style={{ width: 240 }}>
          <Stepper
            steps={onboardingSteps}
            current={current}
            orientation="vertical"
            clickable
            onStepClick={setCurrent}
          />
        </div>
        <div
          style={{
            flex: 1,
            padding: '2rem',
            background: 'var(--soft-bg)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <h2 style={{ margin: '0 0 1rem 0' }}>{onboardingSteps[current].label}</h2>
          <p style={{ margin: 0, color: 'var(--soft-fg-soft)' }}>
            {onboardingSteps[current].description}
          </p>
        </div>
      </div>
    );
  },
};

/**
 * Compact size for embedded wizards
 */
export const CompactSize: Story = {
  render: () => {
    const [current, setCurrent] = useState(1);

    return (
      <div
        style={{
          padding: '1rem',
          background: 'var(--soft-bg)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 500,
          margin: '2rem auto',
        }}
      >
        <Stepper
          steps={[
            { label: 'Details' },
            { label: 'Options' },
            { label: 'Confirm' },
          ]}
          current={current}
          size="sm"
          clickable
          onStepClick={setCurrent}
        />
        <div style={{ marginTop: '1rem' }}>
          <Stack direction="horizontal" gap="sm" justify="end">
            <Button
              variant="default"
              size="sm"
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={current === 2}
              onClick={() => setCurrent((c) => c + 1)}
            >
              Next
            </Button>
          </Stack>
        </div>
      </div>
    );
  },
};
