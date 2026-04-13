/**
 * Auth Service - Handles authentication (currently stub)
 */

class AuthService {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Create session
   */
  createSession(userId, username) {
    const token = Math.random().toString(36).substring(7);
    this.sessions.set(token, {
      userId,
      username,
      createdAt: Date.now()
    });
    return token;
  }

  /**
   * Verify session
   */
  verifySession(token) {
    return this.sessions.get(token) || null;
  }

  /**
   * Destroy session
   */
  destroySession(token) {
    this.sessions.delete(token);
  }
}

export default new AuthService();
