import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Avatar,
  Button,
  Checkbox,
  Chip,
  Divider,
  Dropdown,
  Heading,
  Input,
  Panel,
  Radio,
  Slider,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
} from '../index';

/**
 * # Settings Page
 *
 * A comprehensive settings page demonstrating form components and patterns.
 *
 * ## Components Used
 * - **Input**: Text fields for names, emails
 * - **Dropdown**: Searchable selections (language, timezone, visibility)
 * - **Switch**: Toggle settings (notifications, features)
 * - **Checkbox**: Multi-select options
 * - **Radio**: Single-select option groups
 * - **Slider**: Numeric range selections
 * - **Tabs**: Section navigation
 * - **Panel**: Content sections
 * - **Button**: Save/cancel actions
 */

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
  });
  const [theme, setTheme] = useState('system');
  const [fontSize, setFontSize] = useState(16);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', minHeight: '100vh' }}>
      <Stack direction="row" justify="between" align="center">
        <Heading level={1}>Settings</Heading>
        <Chip variant="info" size="sm">Pro Plan</Chip>
      </Stack>

      <div style={{ marginTop: '1.5rem' }}>
        <Tabs
          items={[
            { value: 'profile', label: 'Profile', content: null },
            { value: 'account', label: 'Account', content: null },
            { value: 'appearance', label: 'Appearance', content: null },
            { value: 'notifications', label: 'Notifications', content: null },
            { value: 'privacy', label: 'Privacy', content: null },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {activeTab === 'profile' && (
          <Stack gap="lg">
            <Panel padding="lg">
              <Heading level={3}>Profile Information</Heading>
              <Text color="soft" style={{ marginTop: '0.25rem' }}>
                Update your personal information and profile picture.
              </Text>

              <Divider style={{ margin: '1.5rem 0' }} />

              <Stack direction="row" gap="lg" align="start">
                <div style={{ textAlign: 'center' }}>
                  <Avatar size="xl" fallback="JD" />
                  <Button variant="ghost" size="sm" style={{ marginTop: '0.75rem' }}>
                    Change Photo
                  </Button>
                </div>

                <Stack gap="md" style={{ flex: 1 }}>
                  <Stack direction="row" gap="md">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Text size="sm" weight="medium">First Name</Text>
                      <Input placeholder="John" defaultValue="John" />
                    </Stack>
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Text size="sm" weight="medium">Last Name</Text>
                      <Input placeholder="Doe" defaultValue="Doe" />
                    </Stack>
                  </Stack>

                  <Stack gap="xs">
                    <Text size="sm" weight="medium">Email</Text>
                    <Input type="email" placeholder="john@example.com" defaultValue="john.doe@example.com" />
                  </Stack>

                  <Stack gap="xs">
                    <Text size="sm" weight="medium">Bio</Text>
                    <Textarea placeholder="Tell us about yourself" rows={3} />
                    <Text size="xs" color="softer">
                      Brief description for your profile. Max 160 characters.
                    </Text>
                  </Stack>
                </Stack>
              </Stack>
            </Panel>

            <Panel padding="lg">
              <Heading level={3}>Location & Language</Heading>
              <Text color="soft" style={{ marginTop: '0.25rem' }}>
                Set your preferred language and timezone.
              </Text>

              <Divider style={{ margin: '1.5rem 0' }} />

              <Stack gap="md">
                <Stack gap="xs">
                  <Text size="sm" weight="medium">Language</Text>
                  <Dropdown
                    options={[
                      { value: 'en', label: 'English (US)' },
                      { value: 'en-gb', label: 'English (UK)' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                      { value: 'de', label: 'German' },
                      { value: 'ja', label: 'Japanese' },
                      { value: 'zh', label: 'Chinese' },
                      { value: 'ko', label: 'Korean' },
                    ]}
                    defaultValue="en"
                    searchable
                    placeholder="Select language"
                  />
                </Stack>

                <Stack gap="xs">
                  <Text size="sm" weight="medium">Timezone</Text>
                  <Dropdown
                    options={[
                      { value: 'pst', label: 'Pacific Time (PT)' },
                      { value: 'mst', label: 'Mountain Time (MT)' },
                      { value: 'cst', label: 'Central Time (CT)' },
                      { value: 'est', label: 'Eastern Time (ET)' },
                      { value: 'utc', label: 'UTC' },
                      { value: 'gmt', label: 'GMT' },
                      { value: 'cet', label: 'Central European Time' },
                    ]}
                    defaultValue="pst"
                    searchable
                    placeholder="Select timezone"
                  />
                </Stack>
              </Stack>
            </Panel>

            <Stack direction="row" justify="end" gap="sm">
              <Button variant="default">Cancel</Button>
              <Button variant="primary">Save Changes</Button>
            </Stack>
          </Stack>
        )}

        {activeTab === 'appearance' && (
          <Stack gap="lg">
            <Panel padding="lg">
              <Heading level={3}>Theme</Heading>
              <Text color="soft" style={{ marginTop: '0.25rem' }}>
                Choose how the application looks to you.
              </Text>

              <Divider style={{ margin: '1.5rem 0' }} />

              <Stack gap="md">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <Radio
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={() => setTheme('light')}
                  />
                  <Stack gap="xs">
                    <Text weight="medium">Light</Text>
                    <Text size="sm" color="soft">Use light theme</Text>
                  </Stack>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <Radio
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={() => setTheme('dark')}
                  />
                  <Stack gap="xs">
                    <Text weight="medium">Dark</Text>
                    <Text size="sm" color="soft">Use dark theme</Text>
                  </Stack>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <Radio
                    name="theme"
                    value="system"
                    checked={theme === 'system'}
                    onChange={() => setTheme('system')}
                  />
                  <Stack gap="xs">
                    <Text weight="medium">System</Text>
                    <Text size="sm" color="soft">Follow system settings</Text>
                  </Stack>
                </label>
              </Stack>
            </Panel>

            <Panel padding="lg">
              <Heading level={3}>Display</Heading>
              <Text color="soft" style={{ marginTop: '0.25rem' }}>
                Customize the visual appearance.
              </Text>

              <Divider style={{ margin: '1.5rem 0' }} />

              <Stack gap="lg">
                <Stack gap="xs">
                  <Stack direction="row" justify="between" align="center">
                    <Text weight="medium">Font Size</Text>
                    <Text color="soft">{fontSize}px</Text>
                  </Stack>
                  <Slider
                    value={fontSize}
                    onChange={setFontSize}
                    min={12}
                    max={24}
                    step={1}
                  />
                </Stack>

                <Stack direction="row" justify="between" align="center">
                  <Stack gap="xs">
                    <Text weight="medium">Auto-save</Text>
                    <Text size="sm" color="soft">Automatically save changes as you type</Text>
                  </Stack>
                  <Switch checked={autoSave} onChange={setAutoSave} />
                </Stack>

                <Stack direction="row" justify="between" align="center">
                  <Stack gap="xs">
                    <Text weight="medium">Compact Mode</Text>
                    <Text size="sm" color="soft">Reduce spacing between elements</Text>
                  </Stack>
                  <Switch />
                </Stack>
              </Stack>
            </Panel>
          </Stack>
        )}

        {activeTab === 'notifications' && (
          <Stack gap="lg">
            <Panel padding="lg">
              <Heading level={3}>Email Notifications</Heading>
              <Text color="soft" style={{ marginTop: '0.25rem' }}>
                Manage what emails you receive.
              </Text>

              <Divider style={{ margin: '1.5rem 0' }} />

              <Stack gap="md">
                <Stack direction="row" justify="between" align="center">
                  <Stack gap="xs">
                    <Text weight="medium">Activity Updates</Text>
                    <Text size="sm" color="soft">Get notified about activity on your projects</Text>
                  </Stack>
                  <Switch
                    checked={notifications.email}
                    onChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </Stack>

                <Stack direction="row" justify="between" align="center">
                  <Stack gap="xs">
                    <Text weight="medium">Weekly Digest</Text>
                    <Text size="sm" color="soft">Summary of your weekly activity</Text>
                  </Stack>
                  <Switch defaultChecked />
                </Stack>

                <Stack direction="row" justify="between" align="center">
                  <Stack gap="xs">
                    <Text weight="medium">Marketing Emails</Text>
                    <Text size="sm" color="soft">News, promotions, and product updates</Text>
                  </Stack>
                  <Switch
                    checked={notifications.marketing}
                    onChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                  />
                </Stack>
              </Stack>
            </Panel>

            <Panel padding="lg">
              <Heading level={3}>Push Notifications</Heading>
              <Text color="soft" style={{ marginTop: '0.25rem' }}>
                Control browser push notifications.
              </Text>

              <Divider style={{ margin: '1.5rem 0' }} />

              <Stack gap="md">
                <Stack direction="row" justify="between" align="center">
                  <Stack gap="xs">
                    <Text weight="medium">Enable Push Notifications</Text>
                    <Text size="sm" color="soft">Receive notifications in your browser</Text>
                  </Stack>
                  <Switch
                    checked={notifications.push}
                    onChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </Stack>

                {notifications.push && (
                  <Stack gap="sm" style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--page-border)' }}>
                    <Checkbox label="Direct messages" defaultChecked />
                    <Checkbox label="Mentions" defaultChecked />
                    <Checkbox label="Comments on your posts" />
                    <Checkbox label="New followers" />
                  </Stack>
                )}
              </Stack>
            </Panel>
          </Stack>
        )}

        {activeTab === 'account' && (
          <Stack gap="lg">
            <Panel padding="lg">
              <Heading level={3}>Change Password</Heading>
              <Text color="soft" style={{ marginTop: '0.25rem' }}>
                Update your password to keep your account secure.
              </Text>

              <Divider style={{ margin: '1.5rem 0' }} />

              <Stack gap="md" style={{ maxWidth: 400 }}>
                <Stack gap="xs">
                  <Text size="sm" weight="medium">Current Password</Text>
                  <Input type="password" placeholder="Enter current password" />
                </Stack>

                <Stack gap="xs">
                  <Text size="sm" weight="medium">New Password</Text>
                  <Input type="password" placeholder="Enter new password" />
                </Stack>

                <Stack gap="xs">
                  <Text size="sm" weight="medium">Confirm New Password</Text>
                  <Input type="password" placeholder="Confirm new password" />
                </Stack>

                <Button variant="primary" style={{ alignSelf: 'flex-start' }}>
                  Update Password
                </Button>
              </Stack>
            </Panel>

            <Panel padding="lg" style={{ borderColor: 'var(--danger-border)' }}>
              <Heading level={3}>Danger Zone</Heading>
              <Text color="soft" style={{ marginTop: '0.25rem' }}>
                Irreversible actions that affect your account.
              </Text>

              <Divider style={{ margin: '1.5rem 0' }} />

              <Stack gap="md">
                <Stack direction="row" justify="between" align="center">
                  <Stack gap="xs">
                    <Text weight="medium">Export Data</Text>
                    <Text size="sm" color="soft">Download all your data in JSON format</Text>
                  </Stack>
                  <Button variant="default">Export</Button>
                </Stack>

                <Stack direction="row" justify="between" align="center">
                  <Stack gap="xs">
                    <Text weight="medium">Delete Account</Text>
                    <Text size="sm" color="soft">Permanently delete your account and all data</Text>
                  </Stack>
                  <Button variant="danger">Delete Account</Button>
                </Stack>
              </Stack>
            </Panel>
          </Stack>
        )}

        {activeTab === 'privacy' && (
          <Panel padding="lg">
            <Heading level={3}>Privacy Settings</Heading>
            <Text color="soft" style={{ marginTop: '0.25rem' }}>
              Control who can see your information.
            </Text>

            <Divider style={{ margin: '1.5rem 0' }} />

            <Stack gap="lg">
              <Stack gap="xs">
                <Text size="sm" weight="medium">Profile Visibility</Text>
                <Dropdown
                  options={[
                    { value: 'public', label: 'Public - Anyone can see your profile' },
                    { value: 'private', label: 'Private - Only you can see your profile' },
                    { value: 'connections', label: 'Connections - Only your connections' },
                  ]}
                  defaultValue="public"
                  placeholder="Select visibility"
                />
              </Stack>

              <Stack direction="row" justify="between" align="center">
                <Stack gap="xs">
                  <Text weight="medium">Show Online Status</Text>
                  <Text size="sm" color="soft">Let others see when you're online</Text>
                </Stack>
                <Switch defaultChecked />
              </Stack>

              <Stack direction="row" justify="between" align="center">
                <Stack gap="xs">
                  <Text weight="medium">Show Activity Status</Text>
                  <Text size="sm" color="soft">Share what you're working on</Text>
                </Stack>
                <Switch />
              </Stack>

              <Stack direction="row" justify="between" align="center">
                <Stack gap="xs">
                  <Text weight="medium">Allow Search Engines</Text>
                  <Text size="sm" color="soft">Let search engines index your profile</Text>
                </Stack>
                <Switch defaultChecked />
              </Stack>
            </Stack>
          </Panel>
        )}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Example Pages/Settings Page',
  component: SettingsPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Building a Settings Page

This example demonstrates how to build a comprehensive settings page with multiple sections.

### Form Component Patterns

#### Input Fields
- Always add a label using **Text** with \`weight="medium"\`
- Add helper text below with \`size="xs" color="softer"\`
- Group related inputs in rows using **Stack** with \`direction="row"\`

#### Dropdown Selections
- Use for selecting from a list of options
- Enable \`searchable\` for longer lists (languages, timezones)
- Provide clear, descriptive option labels
- Consider grouping options if there are many

#### Switches vs Checkboxes
- **Switch**: For binary on/off settings with immediate effect
- **Checkbox**: For options that need to be saved together

#### Radio Groups
- Use when only one option can be selected
- Group with descriptive labels
- Consider adding descriptions below each option

#### Sliders
- Use for numeric ranges (font size, volume, etc.)
- Always show the current value
- Set appropriate min/max/step values

### Layout Patterns

#### Tab Navigation
- Use **Tabs** to organize settings into logical groups
- Keep tab count manageable (5-7 max)
- Use clear, concise tab labels

#### Panels
- Group related settings in **Panel** components
- Add section headings and descriptions
- Use **Divider** to separate header from content

#### Danger Zone
- Style dangerous actions with warning borders
- Place at the bottom of settings
- Require confirmation for destructive actions

### Components Used

| Component | Purpose |
|-----------|---------|
| Input | Text fields, emails, passwords |
| Dropdown | Language, timezone, visibility (with search) |
| Switch | Toggle settings |
| Checkbox | Multi-select options |
| Radio | Single-select groups |
| Slider | Numeric ranges |
| Tabs | Section navigation |
| Panel | Content sections |
| Button | Save/cancel/danger actions |
| Avatar | Profile picture |
| Chip | Plan indicator |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};
