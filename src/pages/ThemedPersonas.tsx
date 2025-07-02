import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContextV2';
import type { PersonaType } from '../types';
import { Link } from 'react-router-dom';

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

const personaTypeColors: Record<PersonaType, string> = {
  'usability-expert': 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/50',
  'developer': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/50',
  'tester': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50',
  'data-scientist': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50',
  'devops': 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/50',
  'project-manager': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/50',
  'designer': 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/50',
  'motion-designer': 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/50',
};

export function ThemedPersonas() {
  const { personas, workItems } = useApp();
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  
  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${styles.headingColor}`}>Personas</h1>
          <p className={`mt-1 ${styles.mutedText}`}>
            Manage your Claude agent personas and their assignments.
          </p>
        </div>
        <Link
          to="/personas/new"
          className={`
            px-4 py-2 ${styles.buttonRadius}
            ${styles.primaryButton} ${styles.primaryButtonText}
            ${styles.primaryButtonHover} transition-colors
          `}
        >
          Spawn new agent
        </Link>
      </div>
      
      {/* Personas Table */}
      <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} overflow-hidden`}>
        <table className="min-w-full">
          <thead className={`${styles.contentBg} ${styles.contentBorder} border-b`}>
            <tr>
              <th scope="col" className={`px-6 py-3 text-left text-sm font-semibold ${styles.headingColor}`}>
                Name
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-sm font-semibold ${styles.headingColor}`}>
                Type
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-sm font-semibold ${styles.headingColor}`}>
                Personality
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-sm font-semibold ${styles.headingColor}`}>
                Status
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-sm font-semibold ${styles.headingColor}`}>
                Current Task
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${styles.contentBorder}`}>
            {personas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <svg className={`mx-auto h-12 w-12 ${styles.mutedText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className={`mt-4 text-lg font-medium ${styles.headingColor}`}>No personas yet</h3>
                  <p className={`mt-2 ${styles.mutedText}`}>Get started by spawning your first agent.</p>
                  <div className="mt-6">
                    <Link
                      to="/personas/new"
                      className={`
                        inline-flex items-center px-4 py-2 ${styles.buttonRadius}
                        ${styles.primaryButton} ${styles.primaryButtonText}
                        ${styles.primaryButtonHover} transition-colors
                      `}
                    >
                      Spawn new agent
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              personas.map((persona) => {
                const currentTask = persona.currentTaskId 
                  ? workItems.find(w => w.id === persona.currentTaskId)
                  : null;
                
                return (
                  <tr key={persona.id}>
                    <td className={`whitespace-nowrap px-6 py-4 text-sm font-medium ${styles.headingColor}`}>
                      {persona.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${personaTypeColors[persona.type]}`}>
                        {personaTypeLabels[persona.type]}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${styles.textColor}`}>
                      {persona.personality || 'Default personality'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`
                        inline-flex rounded-full px-2 py-1 text-xs font-semibold
                        ${persona.status === 'available' 
                          ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/50'
                          : persona.status === 'busy' 
                          ? 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/50'
                          : 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-900/50'
                        }
                      `}>
                        {persona.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${styles.textColor}`}>
                      {currentTask ? (
                        <Link to={`/work-items/${currentTask.id}`} className={`${styles.textColor} hover:opacity-80`}>
                          {currentTask.title}
                        </Link>
                      ) : (
                        <span className={styles.mutedText}>None</span>
                      )}
                    </td>
                    <td className="relative whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button className={`${styles.textColor} hover:opacity-80`}>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Expertise Summary */}
      <div className="mt-8">
        <h3 className={`text-lg font-medium ${styles.headingColor} mb-4`}>Team Expertise</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(personaTypeLabels).map(([type, label]) => {
            const count = personas.filter(p => p.type === type).length;
            const available = personas.filter(p => p.type === type && p.status === 'available').length;
            
            return (
              <div key={type} className={`
                ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
                ${styles.cardShadow} p-5
              `}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${styles.mutedText}`}>{label}</p>
                    <p className={`mt-1 text-3xl font-semibold ${styles.headingColor}`}>{count}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${styles.mutedText}`}>Available</p>
                    <p className={`text-lg font-medium ${available > 0 ? 'text-green-600 dark:text-green-400' : styles.mutedText}`}>
                      {available}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}