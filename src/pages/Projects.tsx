import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContextV2';

export function Projects() {
  const { projects, personas } = useApp();
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return styles.successText;
      case 'planned': return styles.textColor;
      case 'completed': return styles.mutedText;
      case 'on-hold': return styles.warningText;
      default: return styles.textColor;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${styles.headingColor}`}>Projects</h1>
          <p className={`mt-1 ${styles.mutedText}`}>
            Manage and track all your projects in one place.
          </p>
        </div>
        <Link
          to="/projects/new"
          className={`
            px-4 py-2 ${styles.borderRadius}
            ${styles.primaryButton} ${styles.primaryButtonText}
            ${styles.primaryButtonHover} transition-colors
          `}
        >
          Create project
        </Link>
      </div>
      
      {projects.length === 0 ? (
        <div className={`
          ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} p-12 text-center
        `}>
          <svg className={`mx-auto h-12 w-12 ${styles.mutedText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className={`mt-4 text-lg font-medium ${styles.headingColor}`}>No projects yet</h3>
          <p className={`mt-2 ${styles.mutedText}`}>Get started by creating your first project.</p>
          <div className="mt-6">
            <Link
              to="/projects/new"
              className={`
                inline-flex items-center px-4 py-2 ${styles.borderRadius}
                ${styles.primaryButton} ${styles.primaryButtonText}
                ${styles.primaryButtonHover} transition-colors
              `}
            >
              Create project
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => {
            const leadPersona = personas.find(p => p.id === project.leadPersonaId);
            const teamMembers = personas.filter(p => project.teamPersonaIds?.includes(p.id));
            
            return (
              <div
                key={project.id}
                className={`
                  ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
                  ${styles.cardShadow} p-6 hover:opacity-95 transition-opacity
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-lg font-semibold ${styles.headingColor}`}>
                        {project.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(project.priority)}`}>
                        {project.priority}
                      </span>
                      <span className={`text-sm font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    
                    <p className={`mt-2 ${styles.textColor}`}>{project.description}</p>
                    
                    {project.tags && project.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.tags.map(tag => (
                          <span
                            key={tag}
                            className={`px-2 py-1 text-xs ${styles.borderRadius} ${styles.contentBg} ${styles.contentBorder} border ${styles.mutedText}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center gap-6 text-sm">
                      {leadPersona && (
                        <div className={`flex items-center gap-2 ${styles.mutedText}`}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Lead: {leadPersona.name}</span>
                        </div>
                      )}
                      
                      {teamMembers.length > 0 && (
                        <div className={`flex items-center gap-2 ${styles.mutedText}`}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>Team: {teamMembers.length}</span>
                        </div>
                      )}
                      
                      {project.deadline && (
                        <div className={`flex items-center gap-2 ${styles.mutedText}`}>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {project.progress > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className={styles.mutedText}>Progress</span>
                          <span className={styles.textColor}>{project.progress}%</span>
                        </div>
                        <div className={`w-full ${styles.contentBg} rounded-full h-2`}>
                          <div
                            className={`${styles.primaryButton} h-2 rounded-full transition-all`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button className={`p-2 ${styles.contentBg} ${styles.borderRadius} ${styles.textColor} hover:opacity-80`}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className={`p-2 ${styles.contentBg} ${styles.borderRadius} ${styles.textColor} hover:opacity-80`}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}