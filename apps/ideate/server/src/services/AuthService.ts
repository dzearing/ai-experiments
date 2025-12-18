import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: Date;
}

export interface Session {
  sessionId: string;
  user: User;
  expiresAt: Date;
}

// In-memory session store (replace with Redis/DB in production)
const sessions = new Map<string, Session>();

export class AuthService {
  /**
   * Validate a Google OAuth token and create a session.
   * In production, this would verify the token with Google's servers.
   */
  async validateGoogleToken(token: string): Promise<Session> {
    // TODO: Implement actual Google token validation
    // For now, create a mock session based on the token

    // Mock user data (in production, extract from verified token)
    const user: User = {
      id: `user-${uuidv4().slice(0, 8)}`,
      email: 'user@example.com',
      name: 'Demo User',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${token.slice(0, 8)}`,
      createdAt: new Date(),
    };

    const session: Session = {
      sessionId: uuidv4(),
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    sessions.set(session.sessionId, session);
    return session;
  }

  /**
   * Get a user by session ID.
   */
  async getUser(sessionId: string): Promise<User | null> {
    const session = sessions.get(sessionId);

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      sessions.delete(sessionId);
      return null;
    }

    return session.user;
  }

  /**
   * Invalidate a session (logout).
   */
  async invalidateSession(sessionId: string): Promise<void> {
    sessions.delete(sessionId);
  }

  /**
   * Get or create a user by email (for collaborator lookup).
   */
  async getUserByEmail(email: string): Promise<User | null> {
    for (const session of sessions.values()) {
      if (session.user.email === email) {
        return session.user;
      }
    }
    return null;
  }
}
