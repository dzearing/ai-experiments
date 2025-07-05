import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContextV2';
import { AnimatedTransition } from './AnimatedTransition';

export function AuthAvatar() {
  const { authState, activeAccount, signInWithGitHub, signOut, switchAccount } = useAuth();
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    try {
      await signInWithGitHub();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to sign in:', error);
    }
  };

  const handleSignOut = async (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await signOut(accountId);
      if (authState.accounts.length === 1) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleSwitchAccount = (accountId: string) => {
    switchAccount(accountId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative h-10 w-10 rounded-full overflow-hidden
          ${styles.cardBorder} border-2
          hover:opacity-80 transition-opacity
          focus:outline-none focus:ring-2 focus:ring-blue-500
        `}
        aria-label={activeAccount ? `Account menu for ${activeAccount.username}` : 'Sign in'}
      >
        {activeAccount ? (
          <img 
            src={activeAccount.avatarUrl} 
            alt={activeAccount.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`h-full w-full ${styles.cardBg} flex items-center justify-center`}>
            <svg className={`h-6 w-6 ${styles.mutedText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <AnimatedTransition transitionKey="auth-dropdown">
          <div className={`
            absolute right-0 mt-2 w-80 
            bg-white dark:bg-neutral-800 ${styles.cardBorder} border ${styles.borderRadius}
            ${styles.cardShadow} overflow-hidden z-50
          `}>
            {/* Header */}
            <div className={`px-4 py-3 ${styles.contentBg} border-b ${styles.contentBorder}`}>
              <h3 className={`font-semibold ${styles.headingColor}`}>GitHub Accounts</h3>
            </div>

            {/* Account List */}
            {authState.accounts.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {authState.accounts.map(account => (
                  <div
                    key={account.id}
                    onClick={() => handleSwitchAccount(account.id)}
                    className={`
                      px-4 py-3 cursor-pointer
                      ${account.id === authState.activeAccountId ? styles.contentBg : ''}
                      hover:${styles.contentBg} transition-colors
                      border-b ${styles.contentBorder} last:border-b-0
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={account.avatarUrl} 
                          alt={account.username}
                          className="h-10 w-10 rounded-full"
                        />
                        <div>
                          <div className={`font-medium ${styles.textColor}`}>
                            {account.username}
                          </div>
                          <div className={`text-sm ${styles.mutedText}`}>
                            {account.accountType === 'enterprise' ? 'GitHub Enterprise' : 'Personal'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {account.id === authState.activeAccountId && (
                          <span className={`text-sm px-2 py-1 ${styles.primaryButton} ${styles.primaryButtonText} rounded`}>
                            Active
                          </span>
                        )}
                        <button
                          onClick={(e) => handleSignOut(account.id, e)}
                          className={`
                            p-1 rounded hover:${styles.contentBg}
                            ${styles.mutedText} hover:${styles.textColor}
                            transition-colors
                          `}
                          aria-label={`Sign out ${account.username}`}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`px-4 py-8 text-center ${styles.mutedText}`}>
                <svg className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p>No GitHub accounts connected</p>
              </div>
            )}

            {/* Add Account Button */}
            <div className={`px-4 py-3 border-t ${styles.contentBorder}`}>
              <button
                onClick={handleSignIn}
                className={`
                  w-full px-4 py-2 
                  ${styles.primaryButton} ${styles.primaryButtonText}
                  ${styles.borderRadius} font-medium
                  hover:opacity-90 transition-opacity
                  flex items-center justify-center gap-2
                `}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                Add GitHub Account
              </button>
            </div>
          </div>
        </AnimatedTransition>
      )}
    </div>
  );
}