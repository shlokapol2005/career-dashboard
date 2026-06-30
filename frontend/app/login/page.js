'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Target, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const res = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // Success
      login({ username: data.username });
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
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
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
          max-width: 400px;
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
