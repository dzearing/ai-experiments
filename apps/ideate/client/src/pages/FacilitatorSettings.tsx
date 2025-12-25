import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@ui-kit/router';
import { Card, Button, IconButton, Input, Avatar, Dialog } from '@ui-kit/react';
import { ArrowLeftIcon } from '@ui-kit/icons/ArrowLeftIcon';
import { UserIcon } from '@ui-kit/icons/UserIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { CheckIcon } from '@ui-kit/icons/CheckIcon';
import { API_URL } from '../config';
import { useFacilitator } from '../contexts/FacilitatorContext';
import { AVATAR_OPTIONS, AVATAR_IMAGES } from '../constants/avatarImages';
import styles from './FacilitatorSettings.module.css';

const CUSTOM_PRESET_ID = '__custom__';

interface PresetInfo {
  id: string;
  name: string;
  description: string;
  example: string;
}

interface FacilitatorSettingsData {
  name: string;
  avatar: string;
  selectedPreset: string | null;
}

interface CurrentPersona {
  name: string;
  source: 'user' | 'default';
  hasUserOverride: boolean;
}

export function FacilitatorSettings() {
  const navigate = useNavigate();
  const { requestPersonaChange } = useFacilitator();
  const [presets, setPresets] = useState<PresetInfo[]>([]);
  const [settings, setSettings] = useState<FacilitatorSettingsData>({ name: 'Facilitator', avatar: 'robot', selectedPreset: null });
  const [currentPersona, setCurrentPersona] = useState<CurrentPersona | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; targetPresetId: string | null }>({
    open: false,
    targetPresetId: null,
  });

  // Fetch presets and current persona on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [presetsRes, settingsRes, currentRes] = await Promise.all([
          fetch(`${API_URL}/api/personas/presets`),
          fetch(`${API_URL}/api/personas/settings`),
          fetch(`${API_URL}/api/personas/current`),
        ]);

        let presetsData: PresetInfo[] = [];
        if (presetsRes.ok) {
          presetsData = await presetsRes.json();
          // Sort presets: professional first, then alphabetically
          presetsData.sort((a, b) => {
            if (a.id === 'professional') return -1;
            if (b.id === 'professional') return 1;
            return a.name.localeCompare(b.name);
          });
          setPresets(presetsData);
        }

        let savedPreset: string | null = null;
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
          savedPreset = settingsData.selectedPreset;
        }

        let hasCustom = false;
        if (currentRes.ok) {
          const currentData = await currentRes.json();
          setCurrentPersona(currentData);
          hasCustom = currentData.hasUserOverride;
        }

        // Determine which preset to select
        if (savedPreset) {
          setSelectedPreset(savedPreset);
        } else if (hasCustom) {
          // User has custom persona but no saved selection - select Custom
          setSelectedPreset(CUSTOM_PRESET_ID);
        } else {
          // Default to Professional
          setSelectedPreset('professional');
        }
      } catch (error) {
        console.error('[FacilitatorSettings] Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update settings on server
  const updateSettings = async (newSettings: Partial<FacilitatorSettingsData>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    setIsSaving(true);

    try {
      await fetch(`${API_URL}/api/personas/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (error) {
      console.error('[FacilitatorSettings] Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle customizing based on a preset (or edit existing)
  const handleCustomize = async () => {
    // If Custom is already selected, just edit
    if (selectedPreset === CUSTOM_PRESET_ID) {
      navigate('/facilitator-persona');
      return;
    }

    // If no preset selected but user has custom, edit existing
    if (!selectedPreset && currentPersona?.hasUserOverride) {
      navigate('/facilitator-persona');
      return;
    }

    // Create new custom from selected preset
    if (!selectedPreset) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/personas/customize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: selectedPreset }),
      });

      if (response.ok) {
        // Mark that we need to reload persona when facilitator opens
        await fetch(`${API_URL}/api/personas/mark-reload`, { method: 'POST' });
        // Save Custom as the selected preset on the server
        await fetch(`${API_URL}/api/personas/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedPreset: CUSTOM_PRESET_ID }),
        });
        setCurrentPersona((prev) => prev ? { ...prev, hasUserOverride: true } : null);
        setSelectedPreset(CUSTOM_PRESET_ID);
        navigate('/facilitator-persona');
      }
    } catch (error) {
      console.error('[FacilitatorSettings] Failed to customize persona:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle selecting a preset (with confirmation when switching from Custom)
  const handleSelectPreset = useCallback(async (presetId: string) => {
    // If switching away from Custom, show confirmation
    if (selectedPreset === CUSTOM_PRESET_ID && presetId !== CUSTOM_PRESET_ID && currentPersona?.hasUserOverride) {
      setConfirmDialog({ open: true, targetPresetId: presetId });
      return;
    }
    setSelectedPreset(presetId);

    // Trigger persona change via WebSocket (clears chat and generates greeting)
    requestPersonaChange(presetId);

    // Save selection to server
    try {
      await fetch(`${API_URL}/api/personas/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedPreset: presetId }),
      });
    } catch (error) {
      console.error('[FacilitatorSettings] Failed to save preset selection:', error);
    }
  }, [selectedPreset, currentPersona?.hasUserOverride, requestPersonaChange]);

  // Confirm switching away from Custom (deletes customization)
  const handleConfirmSwitch = async () => {
    const targetPresetId = confirmDialog.targetPresetId;
    setConfirmDialog({ open: false, targetPresetId: null });

    if (!targetPresetId) return;

    // Delete user customization and select the new preset
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/personas/user`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Mark that we need to reload persona when facilitator opens
        await fetch(`${API_URL}/api/personas/mark-reload`, { method: 'POST' });
        setCurrentPersona((prev) => prev ? { ...prev, hasUserOverride: false } : null);
        setSelectedPreset(targetPresetId);

        // Trigger persona change via WebSocket
        requestPersonaChange(targetPresetId);
      }
    } catch (error) {
      console.error('[FacilitatorSettings] Failed to delete custom persona:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel switching away from Custom
  const handleCancelSwitch = () => {
    setConfirmDialog({ open: false, targetPresetId: null });
  };

  if (isLoading) {
    return (
      <div className={styles.facilitatorSettings}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.facilitatorSettings}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <IconButton
            icon={<ArrowLeftIcon />}
            variant="ghost"
            onClick={() => navigate(-1)}
            aria-label="Back"
          />
          <h1>Facilitator Settings</h1>
        </header>

        {/* Identity Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <UserIcon />
            Identity
          </h2>
          <Card className={styles.sectionContent}>
            <div className={styles.settingsRow}>
              <div className={styles.settingsRowInfo}>
                <span className={styles.settingsRowLabel}>Name</span>
                <span className={styles.settingsRowDescription}>
                  What the facilitator calls itself
                </span>
              </div>
              <div className={styles.settingsRowControl}>
                <Input
                  value={settings.name}
                  onChange={(e) => updateSettings({ name: e.target.value })}
                  placeholder="Facilitator"
                  style={{ width: '200px' }}
                />
              </div>
            </div>

            <div className={styles.settingsRow}>
              <div className={styles.settingsRowInfo}>
                <span className={styles.settingsRowLabel}>Avatar</span>
                <span className={styles.settingsRowDescription}>
                  Visual representation in chat
                </span>
              </div>
              <div className={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    className={`${styles.avatarOption} ${settings.avatar === avatar.id ? styles.avatarSelected : ''}`}
                    onClick={() => updateSettings({ avatar: avatar.id })}
                    title={`${avatar.label} - ${avatar.description}`}
                  >
                    <Avatar
                      type="bot"
                      size="lg"
                      src={AVATAR_IMAGES[avatar.id]}
                      alt={avatar.label}
                    />
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* Personality Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <EditIcon />
              Personality
            </h2>
            <Button
              variant="primary"
              onClick={handleCustomize}
              disabled={isSaving || (!selectedPreset && !currentPersona?.hasUserOverride)}
            >
              {selectedPreset === CUSTOM_PRESET_ID || currentPersona?.hasUserOverride
                ? 'Edit Custom...'
                : selectedPreset
                  ? `Customize "${presets.find((p) => p.id === selectedPreset)?.name}"...`
                  : 'Customize...'}
            </Button>
          </div>

          <p className={styles.sectionDescription}>
            Choose a personality preset, or customize your own.
          </p>

          <div className={styles.presetGrid}>
            {/* Custom option - always show first */}
            <Card
              className={styles.presetCard}
              selected={selectedPreset === CUSTOM_PRESET_ID}
              onClick={() => handleSelectPreset(CUSTOM_PRESET_ID)}
            >
              <div className={styles.presetHeader}>
                <h3 className={styles.presetName}>Custom</h3>
                {selectedPreset === CUSTOM_PRESET_ID && (
                  <CheckIcon className={styles.presetCheck} />
                )}
              </div>
              <p className={styles.presetDescription}>
                {currentPersona?.hasUserOverride
                  ? 'Your customized facilitator persona with personalized prompts and behavior.'
                  : 'Create your own custom persona with personalized prompts and behavior.'}
              </p>
            </Card>

            {/* Preset options */}
            {presets.map((preset) => (
              <Card
                key={preset.id}
                className={styles.presetCard}
                selected={selectedPreset === preset.id}
                onClick={() => handleSelectPreset(preset.id)}
              >
                <div className={styles.presetHeader}>
                  <h3 className={styles.presetName}>{preset.name}</h3>
                  {selectedPreset === preset.id && (
                    <CheckIcon className={styles.presetCheck} />
                  )}
                </div>
                <p className={styles.presetDescription}>{preset.description}</p>
                {preset.example && (
                  <div className={styles.presetExample}>
                    <span className={styles.presetExampleLabel}>Example:</span>
                    <p className={styles.presetExampleText}>
                      {preset.example.slice(0, 150)}
                      {preset.example.length > 150 ? '...' : ''}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onClose={handleCancelSwitch}
          title="Remove customizations?"
          size="sm"
          footer={
            <div className={styles.dialogFooter}>
              <Button variant="ghost" onClick={handleCancelSwitch}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleConfirmSwitch} disabled={isSaving}>
                Remove & Switch
              </Button>
            </div>
          }
        >
          <p>
            Switching to a preset will remove your custom persona. This action cannot be undone.
          </p>
        </Dialog>
      </div>
    </div>
  );
}

export default FacilitatorSettings;
