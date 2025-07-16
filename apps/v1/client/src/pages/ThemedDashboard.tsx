import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { Link } from 'react-router-dom';

export function ThemedDashboard() {
  const { projects, workItems, personas, jamSessions } = useApp();
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const activeWorkItems = workItems.filter(w => w.status === 'active').length;
  const availablePersonas = personas.filter(p => p.status === 'available').length;
  const activeJamSessions = jamSessions.filter(j => j.status === 'active').length;
  
  const stats = [
    { 
      title: 'Active Projects', 
      value: activeProjects, 
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
      link: '/projects'
    },
    { 
      title: 'Active Work Items', 
      value: activeWorkItems, 
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      link: '/work-items'
    },
    { 
      title: 'Available Personas', 
      value: availablePersonas, 
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      link: '/personas'
    },
    { 
      title: 'Active Jam Sessions', 
      value: activeJamSessions, 
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      link: '/jam-sessions'
    }
  ];
  
  const quickActions = [
    { 
      title: 'Create new project', 
      description: 'Start a new project',
      icon: 'M12 4v16m8-8H4',
      link: '/projects/new'
    },
    { 
      title: 'Create work item', 
      description: 'Add a new task',
      icon: 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      link: '/work-items/new'
    },
    { 
      title: 'Spawn new agent', 
      description: 'Create a new persona',
      icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      link: '/personas/new'
    }
  ];
  
  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className={`overflow-hidden ${styles.cardShadow} ${styles.borderRadius} ${styles.cardBg} ${styles.cardBorder} border`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className={`h-6 w-6 ${styles.mutedText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-medium ${styles.mutedText} truncate`}>{stat.title}</dt>
                    <dd className="flex items-baseline">
                      <div className={`text-2xl font-semibold ${styles.headingColor}`}>{stat.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className={`px-5 py-3 ${styles.contentBorder} border-t`}>
              <div className="text-sm">
                <Link to={stat.link} className={`font-medium ${styles.textColor} hover:opacity-80 transition-opacity`}>
                  View all →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <h3 className={`text-lg font-medium ${styles.headingColor} mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className={`
                relative ${styles.borderRadius} ${styles.cardBorder} border ${styles.cardBg} 
                px-6 py-5 ${styles.cardShadow} flex items-center space-x-3 
                hover:opacity-90 transition-opacity
              `}
            >
              <div className="flex-shrink-0">
                <svg className={`h-10 w-10 ${styles.mutedText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className={`text-sm font-medium ${styles.headingColor}`}>{action.title}</p>
                <p className={`text-sm ${styles.mutedText}`}>{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}