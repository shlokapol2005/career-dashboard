'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, User, Check, X, BookOpen, Target, Users, MessageSquare, Send } from 'lucide-react';

export default function DashboardPage() {
  const [skills, setSkills] = useState([]);
  const [incomingNotifs, setIncomingNotifs] = useState([]);
  const [outgoingNotifs, setOutgoingNotifs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [teams, setTeams] = useState([]);
  const [discordInput, setDiscordInput] = useState('');
  const [isUpdatingDiscord, setIsUpdatingDiscord] = useState(false);
  const [creatingChannelId, setCreatingChannelId] = useState(null);
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Tab state for the separate box
  const [activeTab, setActiveTab] = useState('hackathons'); // 'hackathons' or 'settings'

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const fetchDashboardData = () => {
    if (!user) return;
    fetch(`http://localhost:5001/api/skills?username=${user.username}`)
      .then(res => res.json())
      .then(data => {
        const raw = data.skills || [];
        setSkills(Array.isArray(raw) ? raw : []);
      })
      .catch(err => console.error('Failed to fetch skills:', err));

    fetch(`http://localhost:5001/api/notifications?username=${user.username}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setIncomingNotifs(data.incoming || []);
          setOutgoingNotifs(data.outgoing || []);
        }
      })
      .catch(err => console.error('Failed to fetch notifications:', err));

    fetch(`http://localhost:5001/api/user/dashboard?username=${user.username}`)
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setProfile(data.profile);
          if (!discordInput && data.profile.discord_user_id) {
            setDiscordInput(data.profile.discord_user_id);
          }
        }
        if (data.teams) {
          setTeams(data.teams);
        }
      })
      .catch(err => console.error('Failed to fetch dashboard data:', err));
  };

  useEffect(() => { fetchDashboardData(); }, [user]);

  const markNotificationRead = async (id) => {
    try {
      await fetch('http://localhost:5001/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id })
      });
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleRespond = async (id, action) => {
    try {
      await fetch(`http://localhost:5001/api/matchmaking/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id, responder_username: user.username })
      });
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const handleUpdateDiscord = async () => {
    setIsUpdatingDiscord(true);
    try {
      const res = await fetch('http://localhost:5001/api/user/discord', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, discord_user_id: discordInput })
      });
      if (res.ok) {
        fetchDashboardData();
        alert("Discord User ID updated!");
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to update Discord ID.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating Discord ID.");
    } finally {
      setIsUpdatingDiscord(false);
    }
  };

  const handleCreateTeamChannel = async (teamId) => {
    setCreatingChannelId(teamId);
    try {
      const res = await fetch('http://localhost:5001/api/discord/create-team-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId })
      });
      const data = await res.json();
      if (res.ok) {
        fetchDashboardData();
      } else {
        alert(data.detail || "Failed to create channel.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating Discord channel.");
    } finally {
      setCreatingChannelId(null);
    }
  };

  if (loading || !user) return null;

  const unreadIncoming = incomingNotifs.filter(n => !n.is_read);

  return (
    <div className="page-container animate-fade-in">
      
      {/* Top Header */}
      <header className="top-header">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search here..." />
        </div>
        <div className="header-right">
          <button className="icon-btn relative">
            <Bell size={20} />
            {unreadIncoming.length > 0 && <span className="notification-dot"></span>}
          </button>
          <div className="profile-btn">
            <div className="avatar">
              <User size={18} />
            </div>
            <div className="profile-info">
              <span className="profile-name">{user.username}</span>
              <span className="profile-email">Student</span>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      <div className="welcome-banner card">
        <div className="banner-content">
          <h1 className="banner-title">Welcome {user.username} 👋</h1>
          <p className="banner-subtitle">Let's continue your career journey</p>
          <div className="banner-card-inner">
            <div className="banner-text">
              <h2>Upgrade your career with NEXUS AI.</h2>
              <Link href="/career" className="btn-primary" style={{marginTop: '1rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', boxShadow: 'none', textDecoration: 'none'}}>
                Explore Modules
              </Link>
            </div>
            <div className="banner-image">
              <span role="img" aria-label="trophy" style={{fontSize: '5rem'}}>🏆</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Main Column */}
        <div className="main-column">
          
          <div className="section-header">
            <h3>AI Modules</h3>
            <span className="text-muted text-sm">Powered by Gemini</span>
          </div>

          <div className="modules-grid">
            <Link href="/summarizer" style={{ textDecoration: 'none', display: 'block' }}>
              <div className="module-card card">
                <div className="module-icon" style={{background: 'var(--success-light)', color: 'var(--success-color)'}}>
                  <BookOpen size={24} />
                </div>
                <h4>Neural Notes Engine</h4>
                <p>Upload raw data. Our RAG engine extracts concepts and builds revision knowledge.</p>
              </div>
            </Link>

            <Link href="/career" style={{ textDecoration: 'none', display: 'block' }}>
              <div className="module-card card">
                <div className="module-icon" style={{background: 'var(--warning-light)', color: 'var(--warning-color)'}}>
                  <Target size={24} />
                </div>
                <h4>Career Matrix</h4>
                <p>Target your dream role. Get a readiness score, gap analysis, and roadmap.</p>
              </div>
            </Link>

            <Link href="/peer-matching" style={{ textDecoration: 'none', display: 'block' }}>
              <div className="module-card card">
                <div className="module-icon" style={{background: 'var(--accent-light)', color: 'var(--accent-color)'}}>
                  <Users size={24} />
                </div>
                <h4>Hackathon Matchmaker</h4>
                <p>Find the perfect teammates with complementary skills for your next Hackathon.</p>
              </div>
            </Link>
          </div>

          {/* Hackathon & Members Separate Box */}
          <div className="section-header mt-8">
            <h3>Hackathons & Members</h3>
          </div>
          <div className="card hackathon-box">
            <div className="box-tabs">
              <button 
                className={`tab-btn ${activeTab === 'hackathons' ? 'active' : ''}`}
                onClick={() => setActiveTab('hackathons')}
              >
                <Users size={16} /> Applied Hackathons
              </button>
              <button 
                className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <MessageSquare size={16} /> Discord Integration
              </button>
            </div>
            <div className="box-content">
              {activeTab === 'hackathons' && (
                <div className="teams-list">
                  {teams.length === 0 ? (
                    <div className="empty-state">
                      <p>You haven't joined any hackathon teams yet. Head over to the Hackathon Matchmaker to find teammates!</p>
                      <button className="btn-primary mt-4" onClick={() => router.push('/peer-matching')}>Go to Hackathon Matchmaker</button>
                    </div>
                  ) : (
                    teams.map(team => (
                      <div key={team.id} className="team-item">
                        <div className="team-header">
                          <h4>{team.hackathon_name}</h4>
                          {team.discord_channel_url ? (
                            <a href={team.discord_channel_url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                              <MessageSquare size={16} /> Open Server Channel
                            </a>
                          ) : (
                            <button 
                              className="btn-outline btn-sm" 
                              onClick={() => handleCreateTeamChannel(team.id)}
                              disabled={creatingChannelId === team.id}
                            >
                              <MessageSquare size={16} /> {creatingChannelId === team.id ? 'Creating...' : 'Create Server Channel'}
                            </button>
                          )}
                        </div>
                        <div className="team-members">
                          <span className="members-label">Members:</span>
                          <div className="members-tags">
                            {team.members.map((m, i) => (
                              <div key={i} className={`member-tag ${m.discord_user_id ? 'discord-linked' : ''}`}>
                                <User size={14} /> @{m.username}
                                {m.discord_user_id && <span className="linked-badge" title="Discord Linked">✓</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="discord-settings">
                  <p className="help-text">Link your Discord ID to be automatically added to private hackathon channels when a team is formed.</p>
                  <div className="input-group">
                    <label>Discord User ID (Numeric)</label>
                    <div className="input-row" style={{display: 'flex', gap: '10px'}}>
                      <input 
                        type="text" 
                        value={discordInput} 
                        onChange={(e) => setDiscordInput(e.target.value)} 
                        placeholder="e.g. 123456789012345678"
                        className="form-input"
                        style={{flex: 1}}
                      />
                      <button 
                        className="btn-primary" 
                        onClick={handleUpdateDiscord}
                        disabled={isUpdatingDiscord}
                      >
                        {isUpdatingDiscord ? 'Saving...' : 'Save ID'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Side Column */}
        <div className="side-column">
          
          <div className="card side-widget">
            <h3 className="widget-title">Acquired Skills</h3>
            <div className="skills-card-inner">
              <div className="skills-score">
                <span className="score-big">{skills.length}</span>
                <span className="score-total">Skills</span>
              </div>
            </div>
            <div className="skills-list mt-4">
              {skills.length > 0 ? (
                skills.map((skill, i) => (
                  <span key={i} className="skill-badge">{skill}</span>
                ))
              ) : (
                <p className="text-muted text-sm">No skills acquired yet. Use the Career Matrix to analyze your resume.</p>
              )}
            </div>
          </div>

          <div className="card side-widget mt-4">
            <h3 className="widget-title">Comms Link (Requests)</h3>
            <div className="notif-list">
              <h4 className="notif-header">INCOMING</h4>
              {incomingNotifs.length === 0 ? (
                <p className="text-muted text-sm">No incoming requests.</p>
              ) : (
                incomingNotifs.map(n => (
                  <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                    <div className="notif-content">
                      <div className="notif-head">
                        <strong>@{n.sender_username}</strong>
                        <span className="notif-date">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="notif-text">{n.message}</p>
                      {n.type === 'match_request' && n.status === 'pending' && (
                        <div className="notif-actions mt-2" style={{display: 'flex', gap: '8px'}}>
                          <button className="btn-sm accept" onClick={() => handleRespond(n.id, 'accept')} style={{flex:1}}><Check size={14}/> Accept</button>
                          <button className="btn-sm decline" onClick={() => handleRespond(n.id, 'decline')} style={{flex:1}}><X size={14}/> Deny</button>
                        </div>
                      )}
                      {n.status === 'accepted' && <span className="status-badge success">Connected</span>}
                      {n.status === 'rejected' && <span className="status-badge error">Denied</span>}
                      {n.type !== 'match_request' && n.is_read === false && (
                        <button className="btn-outline btn-sm mt-2 w-full" onClick={() => markNotificationRead(n.id)}>Dismiss</button>
                      )}
                    </div>
                  </div>
                ))
              )}
              
              <h4 className="notif-header mt-4">OUTGOING</h4>
              {outgoingNotifs.length === 0 ? (
                <p className="text-muted text-sm">No outgoing requests.</p>
              ) : (
                outgoingNotifs.map(n => (
                  <div key={n.id} className="notif-item outgoing">
                    <div className="notif-content">
                      <div className="notif-head">
                        <strong><Send size={12}/> To @{n.target_username}</strong>
                      </div>
                      {n.status === 'pending' ? <span className="status-badge warning">⏳ Awaiting</span>
                        : n.status === 'accepted' ? <span className="status-badge success">✓ Accepted</span>
                        : <span className="status-badge error">✕ Declined</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        .top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 0.6rem 1.2rem;
          width: 400px;
          gap: 10px;
          box-shadow: var(--shadow-sm);
        }

        .search-icon {
          color: var(--text-muted);
        }

        .search-bar input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .icon-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
          transition: var(--transition-smooth);
        }
        .icon-btn:hover {
          color: var(--accent-color);
          border-color: var(--accent-color);
        }
        
        .notification-dot {
          position: absolute;
          top: 8px;
          right: 10px;
          width: 8px;
          height: 8px;
          background: var(--error-color);
          border-radius: 50%;
          border: 2px solid var(--bg-card);
        }

        .profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--accent-light);
          color: var(--accent-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
        }

        .profile-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .profile-email {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .welcome-banner {
          padding: 2rem;
          margin-bottom: 2rem;
          background: #ffffff;
        }

        .banner-title {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .banner-subtitle {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .banner-card-inner {
          background: linear-gradient(135deg, #7c3aed, #db2777);
          border-radius: var(--radius-lg);
          padding: 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.25);
        }

        .banner-text h2 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          max-width: 400px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .module-card {
          padding: 1.5rem;
          text-decoration: none;
          display: block;
        }

        .module-icon {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .module-card h4 {
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .module-card p {
          color: var(--text-secondary);
          font-size: 0.85rem;
          line-height: 1.5;
        }
        
        /* Hackathon Box */
        .hackathon-box {
          overflow: hidden;
        }
        .box-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-hover);
        }
        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 1rem;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .tab-btn:hover {
          color: var(--text-primary);
        }
        .tab-btn.active {
          color: var(--accent-color);
          border-bottom-color: var(--accent-color);
          background: var(--bg-card);
        }
        .box-content {
          padding: 1.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 2rem 1rem;
          color: var(--text-secondary);
        }

        .teams-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .team-item {
          background: var(--bg-hover);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.25rem;
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .team-header h4 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .team-members {
          margin-top: 0.5rem;
        }

        .members-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 0.5rem;
        }

        .members-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .member-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid var(--border-color);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .member-tag.discord-linked {
          border-color: var(--success-color);
        }

        .linked-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--success-color);
          color: white;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          font-size: 0.55rem;
          margin-left: 2px;
        }
        
        .discord-settings .help-text {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }
        .form-input {
          padding: 10px 14px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 0.95rem;
          color: var(--text-primary);
          background: var(--bg-card);
          outline: none;
          transition: var(--transition-smooth);
        }
        .form-input:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 2px var(--accent-light);
        }
        
        /* Side Column */
        .side-widget {
          padding: 1.5rem;
        }

        .widget-title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .skills-card-inner {
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          color: white;
        }

        .skills-score {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .score-big {
          font-size: 2.5rem;
          font-weight: 800;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skill-badge {
          background: var(--bg-hover);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .notif-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notif-header {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 4px;
          margin-bottom: 4px;
        }

        .notif-item {
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .notif-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .notif-item.unread {
          border-left: 3px solid var(--accent-color);
          padding-left: 10px;
        }
        
        .notif-item.outgoing {
          border-left: 3px solid var(--text-muted);
          padding-left: 10px;
        }

        .notif-head {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 4px;
        }
        .notif-head strong { color: var(--text-primary); }
        .notif-date { color: var(--text-muted); font-size: 0.75rem; }

        .notif-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .btn-sm {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-sm.accept {
          background: var(--success-light);
          color: var(--success-color);
        }

        .btn-sm.decline {
          background: var(--error-light);
          color: var(--error-color);
        }

        .status-badge {
          display: inline-block;
          margin-top: 6px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        
        .status-badge.success { background: var(--success-light); color: var(--success-color); }
        .status-badge.error { background: var(--error-light); color: var(--error-color); }
        .status-badge.warning { background: var(--warning-light); color: var(--warning-color); }

        .mt-8 { margin-top: 2rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-2 { margin-top: 0.5rem; }
        .w-full { width: 100%; }
        .text-muted { color: var(--text-muted); }
        .text-sm { font-size: 0.85rem; }
        .relative { position: relative; }

        @media (max-width: 1200px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .top-header { flex-direction: column; gap: 1rem; align-items: stretch; }
          .search-bar { width: 100%; }
        }
      `}</style>
    </div>
  );
}
