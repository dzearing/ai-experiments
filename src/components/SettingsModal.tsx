import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContextV2';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { Toggle } from './ui/Toggle';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { currentStyles, isDarkMode, toggleDarkMode, backgroundEffectEnabled, toggleBackgroundEffect } = useTheme();
  const { workspace, setWorkspacePath } = useWorkspace();
  const styles = currentStyles;
  const [activeTab, setActiveTab] = useState<'workspace' | 'appearance' | 'features'>('workspace');
  const [mockMode, setMockMode] = useState(() => {
    const saved = localStorage.getItem('mockMode');
    return saved ? JSON.parse(saved) : true;
  });
  const [tempWorkspacePath, setTempWorkspacePath] = useState(workspace.config?.path || '');

  useEffect(() => {
    const handleMockModeChange = (event: CustomEvent) => {
      setMockMode(event.detail);
    };

    window.addEventListener('mockModeChanged', handleMockModeChange as EventListener);
    return () => {
      window.removeEventListener('mockModeChanged', handleMockModeChange as EventListener);
    };
  }, []);

  // Update temp workspace path when modal opens or workspace changes
  useEffect(() => {
    if (isOpen && workspace.config?.path) {
      setTempWorkspacePath(workspace.config.path);
    }
  }, [isOpen, workspace.config?.path]);

  if (!isOpen) return null;

  const handleMockModeChange = (newValue: boolean) => {
    setMockMode(newValue);
    localStorage.setItem('mockMode', JSON.stringify(newValue));
    window.dispatchEvent(new CustomEvent('mockModeChanged', { detail: newValue }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`
          relative w-full max-w-3xl
          ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} 
        `}>
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${styles.contentBorder}`}>
            <h2 className={`text-xl font-semibold ${styles.headingColor}`}>Settings</h2>
            <IconButton
              onClick={onClose}
              aria-label="Close settings"
              variant="ghost"
              size="lg"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          </div>

          {/* Tabs */}
          <div className={`flex border-b ${styles.contentBorder}`}>
            {[
              { id: 'workspace', label: 'Workspace' },
              { id: 'appearance', label: 'Appearance' },
              { id: 'features', label: 'Features' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-6 py-3 text-sm font-medium transition-colors
                  ${activeTab === tab.id 
                    ? `${styles.primaryButton} ${styles.primaryButtonText} border-b-2 border-current` 
                    : `${styles.textColor} hover:opacity-70`
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'workspace' && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-medium ${styles.headingColor} mb-4`}>Workspace settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                        Workspace path
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tempWorkspacePath}
                          onChange={(e) => setTempWorkspacePath(e.target.value)}
                          placeholder="/path/to/workspace"
                          className={`
                            flex-1 px-3 py-2 ${styles.buttonRadius}
                            ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                            focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                          `}
                        />
                        <IconButton
                          aria-label="Browse for folder"
                          variant="secondary"
                          disabled
                          title="Folder selection not available in browser"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </IconButton>
                      </div>
                      <p className={`mt-2 text-sm ${styles.mutedText}`}>
                        {workspace.config ? `Current: ${workspace.config.path}` : 'No workspace configured'}
                      </p>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                        Default project template
                      </label>
                      <select className={`
                        w-full px-3 py-2 ${styles.buttonRadius}
                        ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                        focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                      `}>
                        <option>Agile sprint</option>
                        <option>Kanban board</option>
                        <option>Waterfall</option>
                        <option>Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                        Auto-save interval
                      </label>
                      <select className={`
                        w-full px-3 py-2 ${styles.buttonRadius}
                        ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                        focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                      `}>
                        <option>Every 30 seconds</option>
                        <option>Every minute</option>
                        <option>Every 5 minutes</option>
                        <option>Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-medium ${styles.headingColor} mb-4`}>Appearance settings</h3>
                  
                  <div className="space-y-4">
                    <Toggle
                      checked={isDarkMode}
                      onChange={toggleDarkMode}
                      label="Dark mode"
                      className="justify-between"
                    />

                    <Toggle
                      checked={backgroundEffectEnabled}
                      onChange={toggleBackgroundEffect}
                      label="Animated background"
                      className="justify-between"
                    />

                    <div>
                      <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
                        Theme preset
                      </label>
                      <p className={`text-sm ${styles.mutedText} mb-3`}>
                        Use the theme switcher in the bottom right to change themes
                      </p>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                        Font size
                      </label>
                      <select className={`
                        w-full px-3 py-2 ${styles.buttonRadius}
                        ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                        focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                      `}>
                        <option>Small</option>
                        <option>Default</option>
                        <option>Large</option>
                        <option>Extra large</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                        Sidebar position
                      </label>
                      <select className={`
                        w-full px-3 py-2 ${styles.buttonRadius}
                        ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                        focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                      `}>
                        <option>Left (default)</option>
                        <option>Right</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-medium ${styles.headingColor} mb-4`}>Feature settings</h3>
                  
                  <div className="space-y-4">
                    <Toggle
                      checked={mockMode}
                      onChange={handleMockModeChange}
                      label="Mock mode (use simulated AI responses)"
                      className="justify-between"
                    />

                    <div className={`p-3 ${styles.contentBg} ${styles.borderRadius} border ${styles.contentBorder}`}>
                      <p className={`text-sm ${styles.mutedText}`}>
                        {mockMode 
                          ? "Mock mode is enabled. AI features will use simulated responses." 
                          : "Mock mode is disabled. AI features will use Claude API."}
                      </p>
                    </div>

                    <div className="pt-4">
                      <h4 className={`text-sm font-medium ${styles.textColor} mb-3`}>AI assistant features</h4>
                      
                      <div className="space-y-3">
                        <Toggle
                          checked={true}
                          onChange={() => {}}
                          label="Smart task breakdown"
                          className="justify-between"
                        />
                        
                        <Toggle
                          checked={true}
                          onChange={() => {}}
                          label="Persona suggestions"
                          className="justify-between"
                        />
                        
                        <Toggle
                          checked={true}
                          onChange={() => {}}
                          label="Auto-generate descriptions"
                          className="justify-between"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <h4 className={`text-sm font-medium ${styles.textColor} mb-3`}>Notifications</h4>
                      
                      <div className="space-y-3">
                        <Toggle
                          checked={true}
                          onChange={() => {}}
                          label="Desktop notifications"
                          className="justify-between"
                        />
                        
                        <Toggle
                          checked={false}
                          onChange={() => {}}
                          label="Email notifications"
                          className="justify-between"
                        />
                        
                        <Toggle
                          checked={true}
                          onChange={() => {}}
                          label="Sound effects"
                          className="justify-between"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${styles.contentBorder}`}>
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (tempWorkspacePath && tempWorkspacePath !== workspace.config?.path) {
                  await setWorkspacePath(tempWorkspacePath);
                }
                onClose();
              }}
              variant="primary"
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}