import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContextV2';
import type { JamSession } from '../types';

export function JamSessions() {
  const { jamSessions, personas, workItems, startJamSession } = useApp();
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    workItemId: '',
    participantIds: [] as string[]
  });
  
  const activeSessions = jamSessions.filter(s => s.status === 'active');
  // No planned status for jam sessions - they are either active or completed
  const completedSessions = jamSessions.filter(s => s.status === 'completed');
  
  const getSessionIcon = () => {
    return '💬'; // Default chat icon for all sessions
  };

  const handleCreateSession = () => {
    if (newSessionData.title && newSessionData.workItemId && newSessionData.participantIds.length > 0) {
      startJamSession(
        newSessionData.workItemId,
        newSessionData.participantIds,
        newSessionData.title
      );
      setShowNewSessionForm(false);
      setNewSessionData({ title: '', workItemId: '', participantIds: [] });
    }
  };

  const toggleParticipant = (personaId: string) => {
    setNewSessionData(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(personaId)
        ? prev.participantIds.filter(id => id !== personaId)
        : [...prev.participantIds, personaId]
    }));
  };
  
  const SessionCard = ({ session }: { session: JamSession }) => {
    const isSelected = selectedSession === session.id;
    const participants = personas.filter(p => session.participantIds.includes(p.id));
    const relatedWorkItem = session.workItemId ? { id: session.workItemId } : null;
    
    return (
      <div
        onClick={() => setSelectedSession(isSelected ? null : session.id)}
        className={`
          ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} p-6 cursor-pointer transition-all
          ${isSelected ? 'ring-2 ring-neutral-500' : 'hover:opacity-95'}
        `}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getSessionIcon()}</span>
            <div>
              <h3 className={`text-lg font-semibold ${styles.headingColor}`}>
                {session.title}
              </h3>
              <p className={`text-sm ${styles.mutedText}`}>
                Jam Session
              </p>
            </div>
          </div>
          {session.status === 'active' && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </div>
        
        {session.summary && (
          <p className={`${styles.textColor} mb-4`}>{session.summary}</p>
        )}
        
        {relatedWorkItem && (
          <div className={`text-sm ${styles.mutedText} mb-3`}>
            Work Item ID: {relatedWorkItem.id}
          </div>
        )}
        
        <div className="flex items-center gap-4 text-sm">
          <div className={`flex items-center gap-2 ${styles.mutedText}`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{participants.length} participants</span>
          </div>
          
          {/* Scheduled time - not implemented */}
          
          {/* Duration - not implemented */}
        </div>
        
        {isSelected && (
          <div className={`mt-4 pt-4 border-t ${styles.contentBorder}`}>
            <div className="space-y-3">
              <div>
                <h4 className={`text-sm font-medium ${styles.headingColor} mb-2`}>Participants</h4>
                <div className="flex flex-wrap gap-2">
                  {participants.map(p => (
                    <span
                      key={p.id}
                      className={`
                        px-3 py-1 text-xs ${styles.buttonRadius}
                        ${styles.contentBg} ${styles.contentBorder} border
                        ${styles.textColor}
                      `}
                    >
                      {p.name} ({p.expertise.join(', ')})
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Notes - not implemented */}
              
              {/* Action items - not implemented */}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${styles.headingColor}`}>Jam Sessions</h1>
          <p className={`mt-1 ${styles.mutedText}`}>
            Collaborative sessions for brainstorming, problem-solving, and planning.
          </p>
        </div>
        <button
          onClick={() => setShowNewSessionForm(!showNewSessionForm)}
          className={`
            px-4 py-2 ${styles.buttonRadius}
            ${styles.primaryButton} ${styles.primaryButtonText}
            ${styles.primaryButtonHover} transition-colors
          `}
        >
          Start new session
        </button>
      </div>
      
      {/* New Session Form */}
      {showNewSessionForm && (
        <div className={`${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius} ${styles.cardShadow} p-6 mb-6`}>
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>Start new jam session</h2>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                Session title
              </label>
              <input
                type="text"
                value={newSessionData.title}
                onChange={(e) => setNewSessionData(prev => ({ ...prev, title: e.target.value }))}
                className={`
                  w-full px-3 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                `}
                placeholder="e.g., Review authentication flow"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-1`}>
                Related work item
              </label>
              <select
                value={newSessionData.workItemId}
                onChange={(e) => setNewSessionData(prev => ({ ...prev, workItemId: e.target.value }))}
                className={`
                  w-full px-3 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                `}
              >
                <option value="">Select a work item</option>
                {workItems.filter(w => w.status === 'active').map(item => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${styles.textColor} mb-2`}>
                Participants
              </label>
              <div className="grid grid-cols-2 gap-2">
                {personas.map(persona => (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => toggleParticipant(persona.id)}
                    className={`
                      p-2 text-sm ${styles.buttonRadius} border transition-colors
                      ${newSessionData.participantIds.includes(persona.id)
                        ? `${styles.primaryButton} ${styles.primaryButtonText}`
                        : `${styles.contentBg} ${styles.contentBorder} ${styles.textColor} hover:opacity-80`
                      }
                    `}
                  >
                    {persona.name} ({persona.type})
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateSession}
                disabled={!newSessionData.title || !newSessionData.workItemId || newSessionData.participantIds.length === 0}
                className={`
                  px-4 py-2 ${styles.buttonRadius}
                  ${styles.primaryButton} ${styles.primaryButtonText}
                  ${styles.primaryButtonHover} transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                Start session
              </button>
              <button
                onClick={() => {
                  setShowNewSessionForm(false);
                  setNewSessionData({ title: '', workItemId: '', participantIds: [] });
                }}
                className={`
                  px-4 py-2 ${styles.buttonRadius}
                  ${styles.contentBg} ${styles.contentBorder} border ${styles.textColor}
                  hover:opacity-80 transition-opacity
                `}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className={`
          ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} p-4 text-center
        `}>
          <div className={`text-3xl font-bold ${styles.headingColor}`}>
            {activeSessions.length}
          </div>
          <div className={`text-sm ${styles.mutedText}`}>Active Sessions</div>
        </div>
        <div className={`
          ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} p-4 text-center
        `}>
          <div className={`text-3xl font-bold ${styles.headingColor}`}>
            {completedSessions.length}
          </div>
          <div className={`text-sm ${styles.mutedText}`}>Completed Sessions</div>
        </div>
      </div>
      
      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="mb-8">
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>
            Active Sessions
          </h2>
          <div className="grid gap-4">
            {activeSessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}
      
      {/* Planned Sessions - not implemented */}
      
      {/* Completed Sessions */}
      {completedSessions.length > 0 && (
        <div className="mb-8">
          <h2 className={`text-lg font-semibold ${styles.headingColor} mb-4`}>
            Past Sessions
          </h2>
          <div className="grid gap-4 opacity-75">
            {completedSessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}
      
      {jamSessions.length === 0 && (
        <div className={`
          ${styles.cardBg} ${styles.cardBorder} border ${styles.borderRadius}
          ${styles.cardShadow} p-12 text-center
        `}>
          <span className="text-6xl mb-4 block">💬</span>
          <h3 className={`text-lg font-medium ${styles.headingColor}`}>No jam sessions yet</h3>
          <p className={`mt-2 ${styles.mutedText}`}>
            Start your first collaborative session to brainstorm ideas and solve problems together.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowNewSessionForm(true)}
              className={`
                inline-flex items-center px-4 py-2 ${styles.buttonRadius}
                ${styles.primaryButton} ${styles.primaryButtonText}
                ${styles.primaryButtonHover} transition-colors
              `}
            >
              Start new session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}