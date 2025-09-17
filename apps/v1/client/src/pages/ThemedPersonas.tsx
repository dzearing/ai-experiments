import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLayout } from '../contexts/LayoutContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import type { PersonaType, Persona } from '../types';
import { Link } from 'react-router-dom';
import { StockPhotoAvatar } from '../components/StockPhotoAvatar';
import { ConfirmDialog } from '../components/ConfirmDialog';

const personaTypeLabels: Record<PersonaType, string> = {
  'usability-expert': 'Usability Expert',
  'developer': 'Developer',
  'tester': 'Tester',
  'data-scientist': 'Data Scientist',
  'devops': 'DevOps',
  'project-manager': 'Project Manager',
  'designer': 'Designer',
  'motion-designer': 'Motion Designer',
};

export function ThemedPersonas() {
  const { personas, deletePersona } = useApp();
  const { setHeaderContent } = useLayout();
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; persona: Persona | null }>({
    isOpen: false,
    persona: null
  });
  
  // Clear header content on mount
  useEffect(() => {
    setHeaderContent(null);
  }, [setHeaderContent]);
  
  return (
    <div>
      {personas.length > 0 && (
        <div className="flex justify-end mb-6">
          <Button
            as={Link}
            to="/agents/new"
            variant="primary"
          >
            Create new agent
          </Button>
        </div>
      )}
      
      {/* Personas Table */}
      <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} overflow-hidden`}>
        <table className="min-w-full">
          <thead className={`${styles.contentBg} ${styles.contentBorder} border-b`}>
            <tr>
              <th scope="col" className={`px-6 py-3 text-left text-sm font-semibold ${styles.headingColor} w-64`}>
                Agent
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-sm font-semibold ${styles.headingColor}`}>
                Role
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-sm font-semibold ${styles.headingColor} w-28`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${styles.contentBorder}`}>
            {personas.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <svg className={`mx-auto h-12 w-12 ${styles.mutedText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className={`mt-4 text-lg font-medium ${styles.headingColor}`}>No agents yet</h3>
                  <p className={`mt-2 ${styles.mutedText}`}>Get started by creating your first agent.</p>
                  <div className="mt-6">
                    <Button
                      as={Link}
                      to="/agents/new"
                      variant="primary"
                    >
                      Create new agent
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              personas.map((persona) => {
                return (
                  <tr key={persona.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <StockPhotoAvatar
                          seed={persona.avatarSeed || persona.id}
                          size={40}
                          gender={persona.avatarGender}
                        />
                        <div>
                          <div className={`text-sm font-medium ${styles.headingColor} whitespace-nowrap`}>
                            {persona.name}
                          </div>
                          <div className={`text-xs ${styles.mutedText} mt-0.5 whitespace-nowrap`}>
                            {persona.jobTitle || personaTypeLabels[persona.type]}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${styles.textColor}`}>
                      {persona.roleSummary || persona.personality || 'No role description available'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <IconButton
                          aria-label="Chat with agent"
                          variant="ghost"
                          size="sm"
                          className="hover:bg-black/5 dark:hover:bg-white/5"
                          as={Link}
                          to={`/agents/chat/${persona.id}`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </IconButton>
                        <IconButton
                          aria-label="Edit agent"
                          variant="ghost"
                          size="sm"
                          className="hover:bg-black/5 dark:hover:bg-white/5"
                          as={Link}
                          to={`/agents/edit/${persona.id}/2`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </IconButton>
                        <IconButton
                          aria-label="Delete agent"
                          variant="ghost"
                          size="sm"
                          className="hover:bg-black/5 dark:hover:bg-white/5"
                          onClick={() => {
                            setDeleteConfirm({ isOpen: true, persona });
                          }}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete agent"
        message={`Are you sure you want to delete ${deleteConfirm.persona?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (deleteConfirm.persona) {
            deletePersona(deleteConfirm.persona.id);
          }
          setDeleteConfirm({ isOpen: false, persona: null });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, persona: null })}
        variant="danger"
      />
    </div>
  );
}