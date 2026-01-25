import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Button,
  Chip,
  IconButton,
  Input,
  Select,
  Stack,
  Stepper,
  Switch,
  Text,
  Textarea,
} from '@ui-kit/react';
import { DeleteIcon } from '@ui-kit/icons/DeleteIcon';
import styles from './ProjectSetupWizard.module.css';

/**
 * # Project Setup Wizard
 *
 * A project creation wizard demonstrating the Stepper component
 * in a vertical sidebar layout, common in project management tools.
 *
 * ## Components Used
 * - **Stepper**: Vertical progress indicator in sidebar
 * - **Input/Textarea**: Project details form
 * - **Select**: Dropdown selections
 * - **Switch**: Toggle settings
 * - **Chip**: Tags and labels
 * - **IconButton**: Action buttons
 *
 * ## Stepper Features Demonstrated
 * - Vertical orientation for sidebar navigation
 * - Clickable steps with descriptions
 * - Large size for prominent visibility
 * - Smooth navigation between steps
 */

const projectSteps = [
  { label: 'Template', description: 'Choose a starting point' },
  { label: 'Details', description: 'Name and configure' },
  { label: 'Team', description: 'Add collaborators' },
  { label: 'Integrations', description: 'Connect services' },
  { label: 'Review', description: 'Confirm and create' },
];

const templates = [
  { id: 'blank', icon: '📄', name: 'Blank Project', description: 'Start from scratch with a clean slate' },
  { id: 'agile', icon: '🏃', name: 'Agile Board', description: 'Kanban board with sprints and backlog' },
  { id: 'roadmap', icon: '🗺️', name: 'Product Roadmap', description: 'Timeline view with milestones' },
  { id: 'tracker', icon: '🐛', name: 'Bug Tracker', description: 'Issue tracking with priorities' },
];

const integrations = [
  { id: 'github', icon: '🐙', name: 'GitHub', description: 'Link commits and PRs', enabled: true },
  { id: 'slack', icon: '💬', name: 'Slack', description: 'Post updates to channels', enabled: false },
  { id: 'figma', icon: '🎨', name: 'Figma', description: 'Embed design files', enabled: false },
  { id: 'jira', icon: '📊', name: 'Jira', description: 'Sync issues and epics', enabled: false },
];

interface TeamMember {
  id: string;
  name: string;
  email: string;
  initials: string;
}

const initialTeam: TeamMember[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', initials: 'JD' },
];

function ProjectSetupWizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [template, setTemplate] = useState('agile');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [visibility, setVisibility] = useState('team');
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [enabledIntegrations, setEnabledIntegrations] = useState<Record<string, boolean>>({
    github: true,
    slack: false,
    figma: false,
    jira: false,
  });

  const handleNext = () => {
    if (currentStep < projectSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (index <= currentStep) {
      setCurrentStep(index);
    }
  };

  const addTeamMember = () => {
    if (newMemberEmail) {
      const name = newMemberEmail.split('@')[0];
      const initials = name.slice(0, 2).toUpperCase();

      setTeam([
        ...team,
        {
          id: Date.now().toString(),
          name: name.charAt(0).toUpperCase() + name.slice(1),
          email: newMemberEmail,
          initials,
        },
      ]);
      setNewMemberEmail('');
    }
  };

  const removeMember = (id: string) => {
    setTeam(team.filter((m) => m.id !== id));
  };

  const toggleIntegration = (id: string) => {
    setEnabledIntegrations({
      ...enabledIntegrations,
      [id]: !enabledIntegrations[id],
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Choose a Template</h1>
              <p className={styles.stepDescription}>
                Select a template to get started quickly, or start with a blank project.
              </p>
            </div>

            <div className={styles.templateGrid}>
              {templates.map((t) => (
                <div
                  key={t.id}
                  className={`${styles.templateCard} ${template === t.id ? styles.templateCardSelected : ''}`}
                  onClick={() => setTemplate(t.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setTemplate(t.id);
                    }
                  }}
                >
                  <span className={styles.templateIcon}>{t.icon}</span>
                  <span className={styles.templateName}>{t.name}</span>
                  <span className={styles.templateDescription}>{t.description}</span>
                </div>
              ))}
            </div>
          </>
        );

      case 1:
        return (
          <>
            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Project Details</h1>
              <p className={styles.stepDescription}>
                Give your project a name and configure basic settings.
              </p>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Basic Information</h3>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Project Name</label>
                <Input
                  placeholder="My Awesome Project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <Textarea
                  placeholder="Describe what this project is about..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                />
                <p className={styles.formHint}>Optional but recommended for team clarity.</p>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Settings</h3>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Visibility</label>
                <Select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  options={[
                    { value: 'private', label: 'Private - Only invited members' },
                    { value: 'team', label: 'Team - All team members' },
                    { value: 'public', label: 'Public - Anyone with link' },
                  ]}
                />
              </div>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Add Team Members</h1>
              <p className={styles.stepDescription}>
                Invite collaborators to work on this project with you.
              </p>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Team Members ({team.length})</h3>
              <div className={styles.memberList}>
                {team.map((member) => (
                  <div key={member.id} className={styles.memberItem}>
                    <div className={styles.memberAvatar}>{member.initials}</div>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>{member.name}</div>
                      <div className={styles.memberEmail}>{member.email}</div>
                    </div>
                    {team.length > 1 && (
                      <IconButton
                        variant="ghost"
                        size="sm"
                        icon={<DeleteIcon />}
                        onClick={() => removeMember(member.id)}
                        aria-label={`Remove ${member.name}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.addMemberRow}>
                <Input
                  className={styles.addMemberInput}
                  placeholder="email@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addTeamMember();
                    }
                  }}
                />
                <Button variant="default" onClick={addTeamMember}>
                  Add
                </Button>
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Connect Integrations</h1>
              <p className={styles.stepDescription}>
                Link your favorite tools to streamline your workflow.
              </p>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Available Integrations</h3>
              <div className={styles.integrationList}>
                {integrations.map((integration) => (
                  <div key={integration.id} className={styles.integrationItem}>
                    <div className={styles.integrationIcon}>{integration.icon}</div>
                    <div className={styles.integrationInfo}>
                      <div className={styles.integrationName}>{integration.name}</div>
                      <div className={styles.integrationDescription}>
                        {integration.description}
                      </div>
                    </div>
                    <Switch
                      checked={enabledIntegrations[integration.id]}
                      onChange={() => toggleIntegration(integration.id)}
                      aria-label={`Enable ${integration.name}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 4:
        const selectedTemplate = templates.find((t) => t.id === template);
        const enabledIntegrationsList = integrations.filter(
          (i) => enabledIntegrations[i.id]
        );

        return (
          <>
            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Review & Create</h1>
              <p className={styles.stepDescription}>
                Review your project settings before creating.
              </p>
            </div>

            <div className={styles.formSection}>
              <div className={styles.reviewCard}>
                <div className={styles.reviewLabel}>Project Name</div>
                <div className={styles.reviewValueLarge}>
                  {projectName || 'Untitled Project'}
                </div>
              </div>

              <div className={styles.reviewCard}>
                <div className={styles.reviewLabel}>Template</div>
                <div className={styles.reviewValue}>
                  {selectedTemplate?.icon} {selectedTemplate?.name}
                </div>
              </div>

              <div className={styles.reviewCard}>
                <div className={styles.reviewLabel}>Team Members</div>
                <div className={styles.reviewTags}>
                  {team.map((member) => (
                    <Chip key={member.id} size="sm" variant="default">
                      {member.name}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className={styles.reviewCard}>
                <div className={styles.reviewLabel}>Integrations</div>
                {enabledIntegrationsList.length > 0 ? (
                  <div className={styles.reviewTags}>
                    {enabledIntegrationsList.map((i) => (
                      <Chip key={i.id} size="sm" variant="info">
                        {i.icon} {i.name}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <div className={styles.reviewValue}>
                    <Text color="soft">None enabled</Text>
                  </div>
                )}
              </div>

              <div className={styles.progressSummary}>
                <span className={styles.progressIcon}>✓</span>
                <span className={styles.progressText}>
                  All required fields completed. Ready to create!
                </span>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const isLastStep = currentStep === projectSteps.length - 1;

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>New Project</h2>
          <p className={styles.sidebarSubtitle}>Create a new workspace</p>
        </div>

        <div className={styles.stepperContainer}>
          <Stepper
            steps={projectSteps}
            current={currentStep}
            orientation="vertical"
            size="md"
            clickable
            onStepClick={handleStepClick}
          />
        </div>

        <div className={styles.sidebarFooter}>
          <a href="#" className={styles.helpLink}>
            <span>❓</span>
            <span>Need help?</span>
          </a>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.contentContainer}>
          {renderStepContent()}

          <div className={styles.navigation}>
            <Button
              variant="default"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            <div className={styles.navigationInfo}>
              Step {currentStep + 1} of {projectSteps.length}
            </div>

            <Button variant="primary" onClick={handleNext}>
              {isLastStep ? 'Create Project' : 'Continue'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/Stepper/Project Setup Wizard',
  component: ProjectSetupWizardPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Building a Project Setup Wizard

This example demonstrates how to use the Stepper component in a vertical sidebar layout, commonly seen in project management and SaaS applications.

### Key Patterns

#### Vertical Sidebar Navigation
- Stepper in vertical orientation serves as primary navigation
- Descriptions provide context for each step
- Clickable steps allow revisiting completed sections
- Sidebar stays visible throughout the flow

#### Form Sections
- Group related fields in cards/sections
- Use section titles to organize content
- Provide hints for optional fields

#### Team Member Management
- List existing members with avatars
- Inline add functionality
- Remove option for all except first member

#### Integration Toggles
- Switch component for enable/disable
- Icon + name + description pattern
- Clear visual hierarchy

#### Review Step
- Card-based summary layout
- Chip components for lists
- Completion indicator

### Stepper Props Used

| Prop | Value | Purpose |
|------|-------|---------|
| orientation | vertical | Sidebar navigation pattern |
| size | md | Balanced visibility |
| clickable | true | Navigate to completed steps |
| onStepClick | handler | Step navigation |

### Layout Structure

\`\`\`
+------------------+------------------------+
|                  |                        |
|    Sidebar       |    Main Content        |
|   (280px)        |    (flexible)          |
|                  |                        |
|   [Stepper]      |   [Step Content]       |
|                  |                        |
|                  |   [Navigation]         |
|                  |                        |
+------------------+------------------------+
\`\`\`

### Components Used

| Component | Purpose |
|-----------|---------|
| Stepper | Sidebar navigation |
| Input/Textarea | Form fields |
| Select | Dropdown options |
| Switch | Integration toggles |
| Chip | Tags and badges |
| IconButton | Remove actions |
| Button | Navigation |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};

/**
 * Vertical stepper at team step
 */
export const AtTeamStep: Story = {
  render: () => {
    const [current, setCurrent] = useState(2);

    return (
      <div style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
        <div style={{ width: 260 }}>
          <Stepper
            steps={projectSteps}
            current={current}
            orientation="vertical"
            size="md"
            clickable
            onStepClick={setCurrent}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Text size="lg" weight="semibold">
            {projectSteps[current].label}
          </Text>
          <Text color="soft" style={{ marginTop: '0.5rem' }}>
            {projectSteps[current].description}
          </Text>
        </div>
      </div>
    );
  },
};

/**
 * Compact stepper for narrow sidebars
 */
export const CompactSidebar: Story = {
  render: () => {
    const [current, setCurrent] = useState(1);
    const shortSteps = [
      { label: 'Template' },
      { label: 'Details' },
      { label: 'Team' },
      { label: 'Create' },
    ];

    return (
      <div
        style={{
          display: 'flex',
          width: 800,
          margin: '0 auto',
          border: '1px solid var(--base-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 200,
            background: 'var(--soft-bg)',
            padding: 'var(--space-4)',
            borderRight: '1px solid var(--soft-border)',
          }}
        >
          <Text weight="semibold" style={{ marginBottom: 'var(--space-4)' }}>
            New Project
          </Text>
          <Stepper
            steps={shortSteps}
            current={current}
            orientation="vertical"
            size="sm"
            clickable
            onStepClick={setCurrent}
          />
        </div>
        <div style={{ flex: 1, padding: 'var(--space-6)' }}>
          <Text size="lg" weight="semibold">
            {shortSteps[current].label}
          </Text>
          <Stack direction="horizontal" gap="sm" style={{ marginTop: 'var(--space-6)' }}>
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
              onClick={() => setCurrent((c) => Math.min(3, c + 1))}
            >
              {current === 3 ? 'Create' : 'Next'}
            </Button>
          </Stack>
        </div>
      </div>
    );
  },
};

/**
 * Large size for prominent display
 */
export const LargeStepper: Story = {
  render: () => {
    const [current, setCurrent] = useState(0);

    return (
      <div style={{ padding: '2rem', maxWidth: 400 }}>
        <Text weight="semibold" style={{ marginBottom: 'var(--space-4)' }}>
          Large Size Stepper
        </Text>
        <Stepper
          steps={projectSteps}
          current={current}
          orientation="vertical"
          size="lg"
          clickable
          onStepClick={setCurrent}
        />
      </div>
    );
  },
};
