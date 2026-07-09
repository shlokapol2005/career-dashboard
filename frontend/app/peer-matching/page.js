'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Users, Loader2, Target, Code, Search, 
  CheckCircle2, Plus, ArrowRight, UserPlus, BrainCircuit,
  MessageSquare
} from 'lucide-react';
import Navbar from '../../components/Navbar';

export default function PeerMatchingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [hackathonName, setHackathonName] = useState('');
  const [domain, setDomain] = useState('');
  const [teamSize, setTeamSize] = useState(4);
  
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Connection states
  const [connectingTo, setConnectingTo] = useState(null);
  const [connectMsg, setConnectMsg] = useState("Hey! Let's team up for this hackathon.");
  const [connectedUsers, setConnectedUsers] = useState({});

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  const handleSearch = async () => {
    if (!hackathonName.trim() || !domain.trim() || teamSize < 2) {
      setError("Please fill out all fields correctly.");
      return;
    }
    
    setIsSearching(true);
    setError(null);
    setResults(null);
    
    try {
      const res = await fetch('http://localhost:5001/api/matchmaking/find-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          hackathon_name: hackathonName,
          domain: domain,
          team_size: parseInt(teamSize)
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Search failed');
      
      setResults(data.team);
    } catch (err) {
      setError(err.message || "Failed to find peers.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnect = async (targetUsername) => {
    try {
      const res = await fetch('http://localhost:5001/api/matchmaking/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_username: user.username,
          target_username: targetUsername,
          message: connectMsg
        })
      });
      
      if (!res.ok) throw new Error("Failed to send request");
      
      setConnectedUsers(prev => ({ ...prev, [targetUsername]: true }));
      setConnectingTo(null);
    } catch (err) {
      alert("Error sending connection request: " + err.message);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="container animate-fade-in">

      {/* Hero */}
      <header className="pm-hero">
        <div className="badge">
          <Users size={16} className="text-gradient" />
          <span>AI Matchmaker</span>
        </div>
        <h1 className="pm-title">
          Build Your <span className="text-gradient">Dream Team</span>
        </h1>
        <p className="pm-subtitle">
          Enter hackathon details and let our AI analyze resumes across the network to find the perfect teammates with skills that complement yours.
        </p>
      </header>

      {/* Main Content Area */}
      {!results ? (
        <section className="search-section animate-fade-in delay-1">
          <div className="glass-panel form-panel">
            <div className="form-group">
              <label><Target size={16} /> Hackathon Name</label>
              <input 
                type="text" 
                placeholder="e.g. ETHGlobal, NASA SpaceApps..."
                value={hackathonName}
                onChange={e => setHackathonName(e.target.value)}
                disabled={isSearching}
              />
            </div>
            
            <div className="form-group">
              <label><Code size={16} /> Project Domain</label>
              <input 
                type="text" 
                placeholder="e.g. Web3, Healthcare, FinTech, AI..."
                value={domain}
                onChange={e => setDomain(e.target.value)}
                disabled={isSearching}
              />
            </div>
            
            <div className="form-group">
              <label><Users size={16} /> Desired Team Size</label>
              <div className="size-selector">
                {[2, 3, 4, 5].map(size => (
                  <button 
                    key={size}
                    className={`size-btn ${teamSize === size ? 'active' : ''}`}
                    onClick={() => setTeamSize(size)}
                    disabled={isSearching}
                  >
                    {size} Members
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="error-box">
                <p>{error}</p>
                {error.includes("Career Intelligence") && (
                  <Link href="/career" className="fix-link">Run Career Intelligence Now</Link>
                )}
              </div>
            )}

            <button 
              className="btn-primary search-btn"
              onClick={handleSearch}
              disabled={isSearching || !hackathonName || !domain}
            >
              {isSearching ? (
                <><Loader2 size={20} className="spinner" /> AI is scouting the network...</>
              ) : (
                <><Search size={20} /> Find Teammates</>
              )}
            </button>
          </div>
        </section>
      ) : (
        <section className="results-section animate-fade-in">
          <div className="results-header glass-panel">
            <div>
              <h2>Perfect Matches Found</h2>
              <p>For <strong>{hackathonName}</strong> ({domain})</p>
            </div>
            <button className="btn-outline reset-btn" onClick={() => setResults(null)}>
              <Search size={15} /> New Search
            </button>
          </div>

          <div className="team-grid">
            {results.map((member, idx) => (
              <div key={idx} className="team-card glass-panel" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="card-header">
                  <div className="avatar">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h3>@{member.username}</h3>
                    <p className="role-tag">{member.role}</p>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="ai-reasoning">
                    <BrainCircuit size={16} className="text-gradient" />
                    <p>{member.reason}</p>
                  </div>
                  
                  <div className="skills-section">
                    <h4>Top Skills</h4>
                    <div className="skills-wrap">
                      {member.skills?.slice(0, 5).map((s, i) => (
                        <span key={i} className="skill-chip">{s}</span>
                      ))}
                      {member.skills?.length > 5 && (
                        <span className="skill-more">+{member.skills.length - 5}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="card-footer">
                  {connectedUsers[member.username] ? (
                    <button className="btn-success w-full" disabled>
                      <CheckCircle2 size={16} /> Request Sent
                    </button>
                  ) : connectingTo === member.username ? (
                    <div className="connect-form">
                      <input 
                        type="text" 
                        value={connectMsg}
                        onChange={e => setConnectMsg(e.target.value)}
                        placeholder="Add a note..."
                        autoFocus
                      />
                      <div className="connect-actions">
                        <button className="btn-cancel" onClick={() => setConnectingTo(null)}>Cancel</button>
                        <button className="btn-primary" onClick={() => handleConnect(member.username)}>Send</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-primary w-full connect-btn" onClick={() => setConnectingTo(member.username)}>
                      <UserPlus size={16} /> Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Styles */}
      <style jsx>{`
        .pm-nav { margin-bottom: 2.5rem; }
        .back-link {
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--text-secondary); text-decoration: none;
          font-weight: 500; transition: color .2s;
        }
        .back-link:hover { color: var(--text-primary); }

        .pm-hero { text-align: center; margin-bottom: 3rem; }
        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(139,92,246,.1); border: 1px solid rgba(139,92,246,.2);
          padding: 8px 18px; border-radius: 999px;
          font-weight: 600; font-size: .85rem; color: var(--accent-color);
          margin-bottom: 20px;
        }
        .pm-title {
          font-size: clamp(2.2rem,5vw,3.5rem); font-weight: 800;
          letter-spacing: -.02em; margin: 0 0 16px; line-height: 1.1;
        }
        .pm-subtitle {
          font-size: 1.05rem; color: var(--text-secondary);
          max-width: 660px; margin: 0 auto; line-height: 1.6;
        }

        .search-section { max-width: 580px; margin: 0 auto; }
        .form-panel { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 10px; }
        .form-group label {
          display: flex; align-items: center; gap: 8px;
          font-weight: 600; font-size: .95rem; color: var(--text-primary);
        }
        .form-group input {
          background: rgba(255,255,255,.04); border: 1px solid var(--border-color);
          border-radius: 12px; padding: 14px 16px; font-size: 1rem;
          color: var(--text-primary); width: 100%; transition: all .3s;
        }
        .form-group input:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(139,92,246,.12); }
        
        .size-selector { display: flex; gap: 10px; }
        .size-btn {
          flex: 1; padding: 12px 0; border-radius: 12px;
          border: 1px solid var(--border-color); background: rgba(255,255,255,.03);
          color: var(--text-secondary); font-weight: 600; cursor: pointer; transition: all .2s;
        }
        .size-btn:hover { background: rgba(255,255,255,.06); color: var(--text-primary); }
        .size-btn.active { background: rgba(139,92,246,.15); border-color: var(--accent-color); color: var(--accent-color); }

        .search-btn { width: 100%; padding: 16px; font-size: 1.05rem; border-radius: 14px; justify-content: center; margin-top: 8px; }
        .spinner { animation: spin 1.5s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .error-box { padding: 14px 18px; border-radius: 12px; background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); }
        .error-box p { color: #f87171; margin: 0; font-size: .95rem; font-weight: 500; }
        .fix-link { display: inline-block; margin-top: 10px; color: #fff; font-size: .85rem; font-weight: 600; text-decoration: underline; }

        /* Results */
        .results-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 24px 32px; margin-bottom: 24px;
        }
        .results-header h2 { margin: 0 0 4px; font-size: 1.5rem; font-weight: 800; }
        .results-header p { margin: 0; color: var(--text-secondary); }
        .reset-btn { display: flex; align-items: center; gap: 6px; padding: 10px 18px; font-size: .9rem; }

        .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
        .team-card { padding: 24px; display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.5s ease both; }
        
        .card-header { display: flex; align-items: center; gap: 14px; }
        .avatar {
          width: 48px; height: 48px; border-radius: 50%;
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; font-weight: 800; color: #fff;
        }
        .user-info h3 { margin: 0 0 4px; font-size: 1.1rem; }
        .role-tag {
          margin: 0; font-size: .75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: .05em; color: var(--accent-color);
        }

        .ai-reasoning {
          background: rgba(139,92,246,.06); border: 1px solid rgba(139,92,246,.2);
          border-radius: 12px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;
        }
        .ai-reasoning p { margin: 0; font-size: .9rem; line-height: 1.5; color: var(--text-primary); }
        .ai-reasoning svg { flex-shrink: 0; margin-top: 2px; }

        .skills-section h4 { margin: 0 0 10px; font-size: .85rem; color: var(--text-secondary); text-transform: uppercase; }
        .skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
        .skill-chip {
          padding: 4px 10px; border-radius: 6px; font-size: .75rem; font-weight: 500;
          background: rgba(255,255,255,.05); border: 1px solid var(--border-color); color: var(--text-secondary);
        }
        .skill-more { font-size: .75rem; font-weight: 600; color: var(--text-secondary); padding: 4px; }

        .card-footer { margin-top: auto; padding-top: 10px; }
        .w-full { width: 100%; justify-content: center; padding: 12px; border-radius: 12px; display: flex; align-items: center; gap: 8px; font-size: .95rem; }
        
        .btn-success {
          background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.4);
          color: #10b981; font-weight: 600; cursor: default;
        }

        .connect-form { display: flex; flex-direction: column; gap: 10px; animation: fadeIn 0.2s ease; }
        .connect-form input {
          background: rgba(255,255,255,.05); border: 1px solid var(--accent-color);
          border-radius: 8px; padding: 10px; font-size: .9rem; color: #fff; width: 100%;
        }
        .connect-actions { display: flex; gap: 8px; }
        .connect-actions button { flex: 1; padding: 8px; border-radius: 8px; font-size: .9rem; }
        .btn-cancel { background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); cursor: pointer; }
        .btn-cancel:hover { background: rgba(255,255,255,.05); }

        @keyframes fadeIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:translateY(0); } }

        @media(max-width:640px) {
          .pm-title { font-size: 2rem; }
        }
      `}</style>
    </main>
    </div>
  );
}
