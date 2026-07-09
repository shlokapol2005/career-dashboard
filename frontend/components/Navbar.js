'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Target, Users, LogOut, Zap } from 'lucide-react';

const NAV_LINKS = [
  { href: '/summarizer', label: 'Neural Notes', icon: <BookOpen size={16} /> },
  { href: '/career', label: 'Career Matrix', icon: <Target size={16} /> },
  { href: '/peer-matching', label: 'AI Matchmaker', icon: <Users size={16} /> },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="app-navbar">
      <Link href="/dashboard" className="navbar-brand">
        <div className="brand-icon">
          <Zap size={18} />
        </div>
        <span className="brand-name">NEXUS<span className="brand-hq"> HQ</span></span>
      </Link>

      <div className="nav-links">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="nav-right">
        {user && (
          <>
            <span className="nav-username">@{user.username}</span>
            <button className="nav-logout" onClick={logout} title="Logout">
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .app-navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0 2rem;
          height: 60px;
          background: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          width: 100%;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          margin-right: 32px;
          flex-shrink: 0;
        }
        .brand-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--accent-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 0 12px rgba(139,92,246,0.4);
        }
        .brand-name {
          font-size: 1rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          color: #fff;
          text-transform: uppercase;
        }
        .brand-hq {
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
        }
        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .nav-link:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.05);
        }
        .nav-link.active {
          color: var(--accent-color);
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.2);
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .nav-username {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-family: monospace;
        }
        .nav-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-logout:hover {
          color: #ef4444;
          border-color: rgba(239,68,68,0.3);
          background: rgba(239,68,68,0.08);
        }

        @media (max-width: 768px) {
          .nav-link span { display: none; }
          .nav-username { display: none; }
        }
      `}</style>
    </nav>
  );
}
