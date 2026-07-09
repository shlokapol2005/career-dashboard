'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Target, Users, Award, ChevronDown, ChevronRight, FolderTree, Bell, Check, X, Send, User, MessageSquare } from 'lucide-react';
import Navbar from '../../components/Navbar';

// 3D Interactive Card Component
function TiltCard({ children, href }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;
    card.style.setProperty('--glow-x', `${glowX}%`);
    card.style.setProperty('--glow-y', `${glowY}%`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  const CardContent = (
    <div
      ref={cardRef}
      className="tilt-card glass-panel"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="glow-overlay"></div>
      <div className="tilt-content">{children}</div>
    </div>
  );

  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{CardContent}</Link> : CardContent;
}

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
    <div className="page-wrapper">
      <Navbar />
      <main className="container dashboard-3d animate-fade-in">
        <div className="bg-grid"></div>

        <header className="dashboard-header">
          <div className="header-text">
            <h1 className="title neon-text">NEXUS <span className="text-gradient">HQ</span></h1>
            <p className="subtitle">Welcome back, <strong style={{color:'var(--accent-color)'}}>{user.username}</strong>. Ready to level up?</p>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="main-column">
            <div className="modules-grid">
              <TiltCard href="/summarizer">
                <div className="icon-wrapper bg-cyan"><BookOpen size={32} /></div>
                <div className="module-content">
                  <h3>Neural Notes Engine</h3>
                  <p>Upload raw data. Our RAG engine extracts concepts and injects revision knowledge into your brain.</p>
                  <span className="status-badge live">ONLINE</span>
                </div>
              </TiltCard>

              <TiltCard href="/career">
                <div className="icon-wrapper bg-pink"><Target size={32} /></div>
                <div className="module-content">
                  <h3>Career Matrix</h3>
                  <p>Target your dream role. Let the AI build a complete readiness score, gap analysis, and roadmap.</p>
                  <span className="status-badge live">ONLINE</span>
                </div>
              </TiltCard>

              <TiltCard href="/peer-matching">
                <div className="icon-wrapper bg-neon-green"><Users size={32} /></div>
                <div className="module-content">
                  <h3>AI Matchmaker</h3>
                  <p>Scout the network. Find the perfect teammates with complementary skills for your next Hackathon.</p>
                  <span className="status-badge live">ONLINE</span>
                </div>
              </TiltCard>
            </div>

            {/* Profile Settings & Hackathons */}
            <div className="dashboard-sections-grid">
              <section className="profile-section glass-panel">
                <div className="section-head">
                  <User size={20} className="text-gradient" />
                  <h2>Profile Settings</h2>
                </div>
                <div className="profile-content">
                  <div className="input-group">
                    <label>Discord User ID</label>
                    <div className="input-row">
                      <input 
                        type="text" 
                        value={discordInput} 
                        onChange={(e) => setDiscordInput(e.target.value)} 
                        placeholder="e.g. 123456789012345678"
                        className="discord-input"
                      />
                      <button 
                        className="btn-update" 
                        onClick={handleUpdateDiscord}
                        disabled={isUpdatingDiscord}
                      >
                        {isUpdatingDiscord ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    <p className="help-text">Your numeric Discord ID is required to be added to private hackathon channels.</p>
                  </div>
                </div>
              </section>

              <section className="hackathons-section glass-panel">
                <div className="section-head">
                  <Target size={20} className="text-gradient" />
                  <h2>Applied Hackathons</h2>
                </div>
                <div className="teams-list">
                  {teams.length === 0 ? (
                    <p className="no-data">You haven't joined any hackathon teams yet. Use the AI Matchmaker to find teammates!</p>
                  ) : (
                    teams.map(team => (
                      <div key={team.id} className="team-card">
                        <div className="team-header">
                          <h3>{team.hackathon_name}</h3>
                          {team.discord_channel_url ? (
                            <a href={team.discord_channel_url} target="_blank" rel="noopener noreferrer" className="btn-discord-join">
                              <MessageSquare size={14} /> Open Channel
                            </a>
                          ) : (
                            <button 
                              className="btn-discord-create" 
                              onClick={() => handleCreateTeamChannel(team.id)}
                              disabled={creatingChannelId === team.id}
                            >
                              <MessageSquare size={14} /> {creatingChannelId === team.id ? 'Creating...' : 'Create Server Channel'}
                            </button>
                          )}
                        </div>
                        <div className="team-members">
                          <span className="members-label">Team Members:</span>
                          <div className="members-tags">
                            {team.members.map((m, i) => (
                              <span key={i} className="member-tag" title={m.discord_user_id ? "Discord linked" : "No Discord ID"}>
                                @{m.username} {m.discord_user_id && <span className="discord-linked">✓</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>

          <aside className="sidebar">
            {/* Notifications Panel */}
            <section className="notifications-section glass-panel">
              <div className="skills-header">
                <Bell size={20} className="text-gradient" />
                <h2>COMMS LINK</h2>
                {unreadIncoming.length > 0 && (
                  <span className="pulse-badge">{unreadIncoming.length}</span>
                )}
              </div>

              <div className="notif-list">
                <h4 className="list-title">INCOMING</h4>
                {incomingNotifs.length === 0 ? (
                  <p className="no-skills">Secure line quiet.</p>
                ) : (
                  incomingNotifs.map(n => (
                    <div key={n.id} className={`notif-card ${!n.is_read ? 'unread' : ''}`}>
                      <div className="notif-head">
                        <strong>@{n.sender_username}</strong>
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <p>{n.message}</p>
                      {n.type === 'match_request' && n.status === 'pending' ? (
                        <div className="action-buttons">
                          <button className="btn-accept" onClick={() => handleRespond(n.id, 'accept')}>
                            <Check size={13} /> ACCEPT
                          </button>
                          <button className="btn-decline" onClick={() => handleRespond(n.id, 'decline')}>
                            <X size={13} /> DENY
                          </button>
                        </div>
                      ) : n.status === 'accepted' ? (
                        <div className="status-text success">✓ Connected</div>
                      ) : n.status === 'rejected' ? (
                        <div className="status-text error">✕ Denied</div>
                      ) : (
                        <button className="btn-dismiss" onClick={() => markNotificationRead(n.id)}>Acknowledge</button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="notif-list mt-4">
                <h4 className="list-title">OUTGOING</h4>
                {outgoingNotifs.length === 0 ? (
                  <p className="no-skills">No active scouting requests.</p>
                ) : (
                  outgoingNotifs.map(n => (
                    <div key={n.id} className="notif-card outgoing">
                      <div className="notif-head">
                        <strong><Send size={11} /> To @{n.target_username}</strong>
                      </div>
                      <div className="status-indicator">
                        {n.status === 'pending' ? <span className="text-warning">⏳ Awaiting</span>
                          : n.status === 'accepted' ? <span className="text-success">✓ Accepted!</span>
                          : <span className="text-error">✕ Declined</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Resume Skills Panel */}
            <section className="skills-section glass-panel">
              <div className="skills-header">
                <Award size={20} className="text-gradient" />
                <h2>RESUME SKILLS</h2>
              </div>
              {skills.length > 0 ? (
                <div className="skills-flat-list">
                  {skills.map((skill, i) => (
                    <span key={i} className="skill-badge">{skill}</span>
                  ))}
                </div>
              ) : (
                <div className="no-skills-wrap">
                  <p className="no-skills">No resume skills yet.</p>
                  <Link href="/career" className="skills-cta">
                    Analyse your resume in Career Matrix →
                  </Link>
                </div>
              )}
            </section>
          </aside>
        </div>

        <style jsx>{`
          .page-wrapper { min-height: 100vh; }
          .dashboard-3d { position: relative; z-index: 1; }
          .bg-grid {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background-image: linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px);
            background-size: 40px 40px;
            z-index: -1;
            animation: gridMove 20s linear infinite;
          }
          @keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } }

          .dashboard-header {
            margin-bottom: 2.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
          .title { font-size: 3rem; font-weight: 900; letter-spacing: -0.04em; margin: 0 0 6px 0; text-transform: uppercase; }
          .neon-text { color: #fff; text-shadow: 0 0 10px rgba(139,92,246,0.7), 0 0 20px rgba(139,92,246,0.4); }
          .subtitle { font-family: monospace; color: var(--text-secondary); font-size: 0.95rem; margin: 0; }

          .dashboard-content { display: grid; grid-template-columns: 1fr 360px; gap: 36px; }

          .modules-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
            perspective: 1000px;
          }
          .tilt-card {
            position: relative; height: 100%; border-radius: 18px; padding: 24px;
            background: rgba(17,24,39,0.7); border: 1px solid rgba(255,255,255,0.05);
            transition: transform 0.1s ease-out; transform-style: preserve-3d;
            cursor: pointer; overflow: hidden;
          }
          .glow-overlay {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(255,255,255,0.08), transparent 55%);
            opacity: 0; transition: opacity 0.3s; pointer-events: none;
          }
          .tilt-card:hover .glow-overlay { opacity: 1; }
          .tilt-card:hover { border-color: rgba(139,92,246,0.4); box-shadow: 0 15px 35px rgba(0,0,0,0.5), 0 0 20px rgba(139,92,246,0.15); }
          .tilt-content { transform: translateZ(30px); transform-style: preserve-3d; }
          .icon-wrapper {
            width: 60px; height: 60px; border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 18px; color: #fff; box-shadow: 0 8px 16px rgba(0,0,0,0.3);
          }
          .bg-cyan { background: linear-gradient(135deg, #06b6d4, #3b82f6); box-shadow: 0 0 16px rgba(6,182,212,0.35); }
          .bg-pink { background: linear-gradient(135deg, #ec4899, #8b5cf6); box-shadow: 0 0 16px rgba(236,72,153,0.35); }
          .bg-neon-green { background: linear-gradient(135deg, #10b981, #34d399); box-shadow: 0 0 16px rgba(16,185,129,0.35); }
          .bg-violet { background: linear-gradient(135deg, #8b5cf6, #6366f1); box-shadow: 0 0 16px rgba(139,92,246,0.35); }
          .module-content h3 { font-size: 1.2rem; font-weight: 800; margin-bottom: 8px; }
          .module-content p { color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; font-size: 0.9rem; }
          .status-badge.live {
            background: rgba(16,185,129,0.12); color: #34d399;
            border: 1px solid rgba(16,185,129,0.25); box-shadow: 0 0 8px rgba(16,185,129,0.15);
            padding: 4px 10px; border-radius: 4px; font-family: monospace; font-weight: 700; font-size: 0.72rem;
          }

          .sidebar { display: flex; flex-direction: column; gap: 24px; }
          .skills-section, .notifications-section {
            padding: 20px; border-radius: 18px;
            background: rgba(17,24,39,0.8); border: 1px solid rgba(139,92,246,0.15);
            box-shadow: inset 0 0 20px rgba(0,0,0,0.4);
          }
          .skills-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
          .skills-header h2 { font-size: 0.9rem; font-weight: 800; letter-spacing: 0.08em; font-family: monospace; flex: 1; }
          .pulse-badge { background: #ef4444; color: #fff; padding: 2px 7px; border-radius: 10px; font-size: 0.72rem; font-weight: bold; animation: pulse 2s infinite; margin-left: auto; }
          @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); } 70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
          .list-title { font-family: monospace; color: var(--text-secondary); font-size: 0.72rem; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; letter-spacing: 0.08em; }
          .mt-4 { margin-top: 20px; }
          .notif-card {
            background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04);
            border-left: 3px solid #3b82f6; padding: 12px; border-radius: 8px; margin-bottom: 8px;
          }
          .notif-card.unread { border-left-color: var(--accent-color); background: rgba(139,92,246,0.04); }
          .notif-card.outgoing { border-left-color: #64748b; }
          .notif-head { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 6px; color: var(--text-secondary); }
          .notif-head strong { color: var(--text-primary); }
          .notif-card p { font-size: 0.85rem; line-height: 1.4; margin-bottom: 10px; }
          .action-buttons { display: flex; gap: 6px; }
          .action-buttons button { flex: 1; padding: 6px; border-radius: 4px; font-weight: bold; font-family: monospace; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 4px; border: none; font-size: 0.75rem; }
          .btn-accept { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3) !important; }
          .btn-accept:hover { background: #10b981; color: #000; }
          .btn-decline { background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.25) !important; }
          .btn-decline:hover { background: #ef4444; color: #000; }
          .btn-dismiss { width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.08); color: var(--text-secondary); padding: 6px; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 0.8rem; }
          .btn-dismiss:hover { background: rgba(255,255,255,0.04); color: #fff; }
          .status-text { font-family: monospace; font-size: 0.8rem; padding: 5px; border-radius: 4px; text-align: center; font-weight: bold; }
          .status-text.success { background: rgba(16,185,129,0.08); color: #10b981; }
          .status-text.error { background: rgba(239,68,68,0.08); color: #ef4444; }
          .status-indicator { font-family: monospace; font-size: 0.78rem; margin-top: 6px; }
          .text-warning { color: #f59e0b; }
          .text-success { color: #10b981; }
          .text-error { color: #ef4444; }
          .no-skills { color: var(--text-secondary); font-size: 0.85rem; font-style: italic; }
          .accordion-header {
            display: flex; justify-content: space-between; padding: 10px 12px;
            background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04);
            border-radius: 8px; color: #fff; cursor: pointer; font-family: monospace; font-size: 0.8rem;
            width: 100%; margin-bottom: 4px;
          }
          .topic-title { display: flex; align-items: center; gap: 8px; }
          .skills-flat-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 0; }
          .skill-badge {
            background: transparent; color: var(--accent-color);
            border: 1px solid rgba(139,92,246,0.4); box-shadow: inset 0 0 5px rgba(139,92,246,0.2);
            padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 0.8rem;
          }
          .no-skills-wrap { text-align: center; padding: 20px 10px; }
          .skills-cta { 
            display: inline-block; margin-top: 10px; color: var(--accent-color); 
            font-size: 0.85rem; font-weight: 600; text-decoration: none; 
          }
          .skills-cta:hover { text-decoration: underline; }

          @media (max-width: 1000px) { .dashboard-content { grid-template-columns: 1fr; } }
        `}</style>
      </main>
    </div>
  );
}
