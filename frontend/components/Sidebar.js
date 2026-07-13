'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Target, 
  BookOpen, 
  Users, 
  LogOut, 
  Zap, 
  Award, 
  Briefcase, 
  GraduationCap
} from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home size={18} /> },
  { label: 'AI resume builder', href: '/career', icon: <Target size={18} /> },
  { label: 'Neural Notes', href: '/summarizer', icon: <BookOpen size={18} /> },
  { label: 'Hackathon Matchmaker', href: '/peer-matching', icon: <Users size={18} /> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // If user is not logged in, we might not render the sidebar (handled in layout)
  if (!user) return null;

  return (
    <aside className="app-sidebar glass-panel">
      <div className="sidebar-header">
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div className="navbar-brand">
            <div className="brand-icon">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="brand-name">NEXUS<span className="brand-hq">HQ</span></span>
          </div>
        </Link>
      </div>

      <div className="sidebar-section">
        <h4 className="section-title">OVERVIEW</h4>
        <nav className="nav-menu">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                style={{ textDecoration: 'none' }}
              >
                <div className={`nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={logout}>
          <span className="nav-icon"><LogOut size={18} /></span>
          <span className="nav-label">Logout</span>
        </button>
      </div>

      <style jsx>{`
        .app-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 260px;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          z-index: 100;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .sidebar-header {
          margin-bottom: 2.5rem;
          padding: 0 0.5rem;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--accent-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .brand-name {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .brand-hq {
          color: var(--accent-color);
        }

        .sidebar-section {
          flex: 1;
        }

        .section-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 1rem;
          letter-spacing: 0.05em;
          padding-left: 0.5rem;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: var(--transition-smooth);
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .nav-item.active {
          color: var(--accent-color);
          background: var(--bg-active);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-item.active .nav-icon {
          color: var(--accent-color);
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .logout-btn {
          width: 100%;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--error-color);
        }
        
        .logout-btn:hover {
          background: var(--error-light);
          color: var(--error-color);
        }

        @media (max-width: 1024px) {
          .app-sidebar {
            width: 80px;
            padding: 1.5rem 0.5rem;
            align-items: center;
          }
          .brand-name, .section-title, .nav-label {
            display: none;
          }
          .navbar-brand {
            justify-content: center;
          }
          .nav-item {
            justify-content: center;
            padding: 0.75rem;
          }
        }
        @media (max-width: 768px) {
          .app-sidebar {
            display: none; /* In a real app, we'd add a hamburger menu */
          }
        }
      `}</style>
    </aside>
  );
}
