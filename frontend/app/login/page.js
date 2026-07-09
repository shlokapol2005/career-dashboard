'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Target, Lock, User, Info } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [discordUserId, setDiscordUserId] = useState('');
  const [showDiscordTip, setShowDiscordTip] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    const body = { username, password };
    if (!isLogin && discordUserId.trim()) {
      body.discord_user_id = discordUserId.trim();
    }

    try {
      const res = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // Success
      login({ username: data.username, discord_user_id: data.discord_user_id || null });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header">
          <div className="icon-wrapper">
            <Target size={32} className="text-gradient" />
          </div>
          <h2>Welcome to Career Dashboard</h2>
          <p>{isLogin ? 'Log in to continue your learning journey' : 'Create an account to start tracking your skills'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <User size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Discord User ID — only shown on signup */}
          {!isLogin && (
            <div className="discord-field">
              <div className="discord-label-row">
                <label className="discord-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" style={{flexShrink:0}}>
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                  Discord User ID
                  <span className="optional-tag">Optional</span>
                </label>
                <button
                  type="button"
                  className="tip-btn"
                  onClick={() => setShowDiscordTip(!showDiscordTip)}
                  aria-label="Help"
                >
                  <Info size={15} />
                </button>
              </div>

              {showDiscordTip && (
                <div className="discord-tip">
                  <strong>How to find your Discord User ID:</strong>
                  <ol>
                    <li>Open Discord → Settings → Advanced</li>
                    <li>Enable <strong>Developer Mode</strong></li>
                    <li>Right-click your own profile → <strong>Copy User ID</strong></li>
                  </ol>
                  <p>This is a numeric ID like <code>123456789012345678</code></p>
                  <p className="tip-why">Used to automatically create a private Discord channel when you get matched with a hackathon teammate. 🎉</p>
                </div>
              )}

              <div className="input-group">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" style={{position:'absolute',left:'16px',zIndex:1,flexShrink:0}}>
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                <input
                  type="text"
                  placeholder="e.g. 123456789012345678"
                  value={discordUserId}
                  onChange={(e) => setDiscordUserId(e.target.value)}
                  pattern="[0-9]*"
                  inputMode="numeric"
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="toggle-btn">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 40px;
          text-align: center;
        }
        .icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 50%;
          margin-bottom: 16px;
        }
        .auth-header h2 {
          font-size: 1.5rem;
          margin-bottom: 8px;
        }
        .auth-header p {
          color: var(--text-secondary);
          margin-bottom: 32px;
          font-size: 0.95rem;
        }
        .auth-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 16px;
          color: var(--text-secondary);
        }
        .input-group input {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          padding: 14px 14px 14px 44px;
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 1rem;
          transition: all 0.3s;
        }
        .input-group input:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }

        /* Discord field */
        .discord-field {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }
        .discord-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .discord-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .optional-tag {
          font-size: 0.72rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 1px 6px;
        }
        .tip-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
        }
        .tip-btn:hover {
          color: #5865F2;
          background: rgba(88, 101, 242, 0.1);
        }
        .discord-tip {
          background: rgba(88, 101, 242, 0.08);
          border: 1px solid rgba(88, 101, 242, 0.25);
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 0.82rem;
          color: var(--text-secondary);
          text-align: left;
          line-height: 1.6;
        }
        .discord-tip strong { color: var(--text-primary); }
        .discord-tip ol {
          margin: 8px 0 8px 16px;
          padding: 0;
        }
        .discord-tip code {
          background: rgba(255,255,255,0.08);
          padding: 1px 6px;
          border-radius: 4px;
          font-family: monospace;
          color: #a78bfa;
        }
        .tip-why {
          margin-top: 8px;
          color: #a78bfa;
          font-weight: 500;
        }

        .btn-primary {
          background: var(--accent-gradient);
          border: none;
          color: white;
          padding: 14px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 8px;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .auth-toggle {
          margin-top: 24px;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .toggle-btn {
          background: none;
          border: none;
          color: var(--accent-color);
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          font-size: 0.9rem;
        }
        .toggle-btn:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
