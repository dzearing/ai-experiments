import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Select,
  Switch,
  Avatar,
  IconButton,
  useTheme,
} from '@ui-kit/react';
import { ArrowLeftIcon, UserIcon, GearIcon, EditIcon, LinkIcon } from '@ui-kit/icons';
import { useAuth } from '../contexts/AuthContext';
import styles from './Settings.module.css';

const AVAILABLE_THEMES = [
  { value: 'default', label: 'Default' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'high-contrast', label: 'High Contrast' },
  { value: 'github', label: 'GitHub' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'forest', label: 'Forest' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'matrix', label: 'Matrix' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'arctic', label: 'Arctic' },
  { value: 'lavender', label: 'Lavender' },
];

const MODE_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'System' },
];

const DEFAULT_VIEW_OPTIONS = [
  { value: 'edit', label: 'Edit' },
  { value: 'preview', label: 'Preview' },
  { value: 'split', label: 'Split' },
];

export function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, mode, setTheme, setMode } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.settings}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <IconButton
            icon={<ArrowLeftIcon />}
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            aria-label="Back"
          />
          <h1>Settings</h1>
        </header>

        {/* Profile Section */}
        <SettingsSection title="Profile" icon={<UserIcon />}>
          <Card className={styles.profileCard}>
            <Avatar src={user.avatarUrl} fallback={user.name} size="lg" />
            <div className={styles.profileInfo}>
              <h3>{user.name}</h3>
            </div>
          </Card>
          <div className={styles.profileActions}>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="Appearance" icon={<GearIcon />}>
          <SettingsRow label="Theme" description="Choose your preferred theme">
            <Select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              options={AVAILABLE_THEMES}
            />
          </SettingsRow>
          <SettingsRow label="Mode" description="Light, dark, or system preference">
            <Select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'light' | 'dark' | 'auto')}
              options={MODE_OPTIONS}
            />
          </SettingsRow>
        </SettingsSection>

        {/* Editor Section */}
        <SettingsSection title="Editor" icon={<EditIcon />}>
          <SettingsRow
            label="Default View"
            description="Default view mode when opening documents"
          >
            <Select value="edit" onChange={() => {}} options={DEFAULT_VIEW_OPTIONS} />
          </SettingsRow>
          <SettingsRow
            label="Auto-save"
            description="Automatically save documents while editing"
          >
            <Switch checked={true} onChange={() => {}} />
          </SettingsRow>
          <SettingsRow
            label="Spell Check"
            description="Enable spell checking in the editor"
          >
            <Switch checked={true} onChange={() => {}} />
          </SettingsRow>
        </SettingsSection>

        {/* Network Section */}
        <SettingsSection title="Network" icon={<LinkIcon />}>
          <SettingsRow
            label="Enable Discovery"
            description="Allow your documents to be discovered on the local network"
          >
            <Switch checked={true} onChange={() => {}} />
          </SettingsRow>
          <SettingsRow
            label="Default Visibility"
            description="New documents are shared on network by default"
          >
            <Switch checked={false} onChange={() => {}} />
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        {icon}
        {title}
      </h2>
      <Card className={styles.sectionContent}>{children}</Card>
    </section>
  );
}

interface SettingsRowProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

function SettingsRow({ label, description, children }: SettingsRowProps) {
  return (
    <div className={styles.settingsRow}>
      <div className={styles.settingsRowInfo}>
        <span className={styles.settingsRowLabel}>{label}</span>
        <span className={styles.settingsRowDescription}>{description}</span>
      </div>
      <div className={styles.settingsRowControl}>{children}</div>
    </div>
  );
}
