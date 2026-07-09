'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Sparkles, UploadCloud, FileText, Loader2,
  AlertCircle, CheckCircle2, Target, Layers, Hammer,
  ChevronRight, Lightbulb, BookMarked, Rocket, Building2,
  TrendingUp, Brain, BookOpen, Award, Map, AlertTriangle,
  GraduationCap, Zap, Star, ExternalLink, RotateCcw
} from 'lucide-react';

// ── Level config for Projects tab ─────────────────────────────────────────────
const LEVEL_CONFIG = {
  beginner: {
    label: 'Beginner', icon: <Layers size={16} />,
    color: '#10b981', bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)', glow: 'rgba(16,185,129,0.15)',
  },
  intermediate: {
    label: 'Intermediate', icon: <Hammer size={16} />,
    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)', glow: 'rgba(245,158,11,0.15)',
  },
  advanced: {
    label: 'Advanced', icon: <Rocket size={16} />,
    color: '#ec4899', bg: 'rgba(236,72,153,0.12)',
    border: 'rgba(236,72,153,0.3)', glow: 'rgba(236,72,153,0.15)',
  },
};

const TARGET_COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Apple'];
const ROLE_SUGGESTIONS = ['ML Engineer', 'Data Engineer', 'AI Engineer', 'SDE', 'Data Scientist', 'DevOps Engineer'];

// ── Score Ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const R = 72, SW = 10, r = R - SW / 2, C = 2 * Math.PI * r;
  const offset = C - (score / 100) * C;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Moderate' : 'Developing';
  return (
    <div className="ring-wrap">
      <svg width={R * 2 + SW} height={R * 2 + SW}>
        <circle cx={R + SW / 2} cy={R + SW / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
        <circle cx={R + SW / 2} cy={R + SW / 2} r={r} fill="none" stroke={color} strokeWidth={SW}
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1)',
            filter: `drop-shadow(0 0 10px ${color}80)` }} />
        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize="28" fontWeight="800" fontFamily="Inter,sans-serif">{score}</text>
        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="central"
          fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="Inter,sans-serif">/ 100</text>
      </svg>
      <span style={{ color, fontSize: '.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CareerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [resumeFile, setResumeFile] = useState(null);
  const [desiredRole, setDesiredRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeLevel, setActiveLevel] = useState('beginner');

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFileChange = (file) => {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.txt'].includes(ext)) {
      setError('Please upload a PDF or TXT resume file.');
      return;
    }
    setResumeFile(file);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!resumeFile || !desiredRole.trim()) {
      setError('Please upload a resume and enter your desired role.');
      return;
    }
    setIsProcessing(true); setError(null); setResults(null);
    try {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      fd.append('desired_role', desiredRole.trim());
      fd.append('target_company', targetCompany.trim());
      fd.append('username', user?.username || '');

      const res = await fetch('http://localhost:5001/api/career/full-analysis', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analysis failed');
      setResults(data);
      setActiveTab('overview');
      setActiveLevel('beginner');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResults(null); setResumeFile(null);
    setDesiredRole(''); setTargetCompany(''); setError(null);
  };

  const projectsByLevel = results
    ? (results.projects || []).reduce((acc, p) => {
        if (!acc[p.level]) acc[p.level] = [];
        acc[p.level].push(p);
        return acc;
      }, {})
    : {};

  const TABS = [
    { id: 'overview',  label: 'Overview',       icon: <Brain size={15} /> },
    { id: 'skills',    label: 'Skills Gap',      icon: <TrendingUp size={15} /> },
    { id: 'projects',  label: 'Projects',        icon: <Lightbulb size={15} /> },
    { id: 'courses',   label: 'Courses & Certs', icon: <BookOpen size={15} /> },
    { id: 'roadmap',   label: 'Roadmap',         icon: <Map size={15} /> },
  ];

  return (
    <main className="container animate-fade-in">
      {/* Navbar */}
      <nav className="career-nav">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </nav>

      {/* Hero */}
      <header className="career-hero">
        <div className="badge">
          <Target size={16} className="text-gradient" />
          <span>Career Intelligence</span>
        </div>
        <h1 className="career-title">
          Your Complete <span className="text-gradient">Career Roadmap</span>
        </h1>
        <p className="career-subtitle">
          Upload your resume, set your dream role and target company. Get a readiness score,
          skill gap analysis, project recommendations, curated courses, and a personalised roadmap — all in one shot.
        </p>
      </header>

      {/* ── Upload Form ────────────────────────────────────────────────────── */}
      {!results && (
        <section className="upload-section animate-fade-in delay-1">
          {/* Resume Drop Zone */}
          <div
            className={`upload-zone glass-panel ${isDragging ? 'dragging' : ''} ${resumeFile ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input type="file" id="resume-upload" className="hidden-input"
              accept=".pdf,.txt"
              onChange={(e) => e.target.files[0] && handleFileChange(e.target.files[0])}
              disabled={isProcessing} />
            <label htmlFor="resume-upload" className="upload-label">
              {resumeFile ? (
                <div className="upload-content">
                  <FileText size={44} className="text-gradient" />
                  <span className="file-name">{resumeFile.name}</span>
                  <span className="file-size">{(resumeFile.size / 1024).toFixed(1)} KB · Click to change</span>
                </div>
              ) : (
                <div className="upload-content">
                  <div className="upload-icon-circle"><UploadCloud size={36} className="text-gradient" /></div>
                  <h3>Drop your resume here</h3>
                  <p>PDF or TXT — drag & drop or click to browse</p>
                </div>
              )}
            </label>
          </div>

          {/* Role + Company Inputs */}
          <div className="inputs-row">
            {/* Desired Role */}
            <div className="input-panel glass-panel">
              <label htmlFor="desired-role" className="input-label">
                <Target size={17} className="text-gradient" /> Your Dream Role <span className="req">*</span>
              </label>
              <div className="chips-row">
                {ROLE_SUGGESTIONS.map(r => (
                  <button key={r}
                    className={`chip ${desiredRole === r ? 'chip-on' : ''}`}
                    onClick={() => setDesiredRole(prev => prev === r ? '' : r)}>
                    {r}
                  </button>
                ))}
              </div>
              <input id="desired-role" type="text" className="text-input"
                placeholder="Or type a custom role…"
                value={desiredRole}
                onChange={(e) => setDesiredRole(e.target.value)}
                disabled={isProcessing}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()} />
            </div>

            {/* Target Company */}
            <div className="input-panel glass-panel">
              <label className="input-label">
                <Building2 size={17} className="text-gradient" /> Dream Company <em className="optional">(optional)</em>
              </label>
              <div className="chips-row">
                {TARGET_COMPANIES.map(c => (
                  <button key={c}
                    className={`chip ${targetCompany === c ? 'chip-on' : ''}`}
                    onClick={() => setTargetCompany(prev => prev === c ? '' : c)}>
                    {c}
                  </button>
                ))}
              </div>
              <input id="target-company" type="text" className="text-input"
                placeholder="Or type a company name…"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                disabled={isProcessing} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box glass-panel">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button className="btn-primary analyze-btn" id="analyze-career-btn"
            onClick={handleAnalyze}
            disabled={isProcessing || !resumeFile || !desiredRole.trim()}>
            {isProcessing ? (
              <><Loader2 size={20} className="spinner" /> Analysing your career path…</>
            ) : (
              <><Sparkles size={20} /> Analyse My Career Path</>
            )}
          </button>
        </section>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {results && (
        <section className="results-section animate-fade-in">
          {/* Results header bar */}
          <div className="results-hero glass-panel">
            <div className="results-hero-text">
              <CheckCircle2 size={26} style={{ color: '#10b981' }} />
              <div>
                <h2>Analysis Complete</h2>
                <p>
                  Role: <strong>{results.desiredRole}</strong>
                  {results.targetCompany && <> · <strong>{results.targetCompany}</strong></>}
                </p>
              </div>
            </div>
            <button className="btn-outline reset-btn" onClick={handleReset} id="career-reset-btn">
              <RotateCcw size={15} /> New Analysis
            </button>
          </div>

          {/* Tab bar */}
          <div className="tab-bar glass-panel">
            {TABS.map(t => (
              <button key={t.id} id={`career-tab-${t.id}`}
                className={`tab-btn ${activeTab === t.id ? 'tab-on' : ''}`}
                onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: Overview ─────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="pane animate-fade-in">
              <div className="overview-grid">
                {/* Score card */}
                <div className="glass-panel score-card">
                  <div className="score-card-hdr">
                    <TrendingUp size={18} className="text-gradient" />
                    <h3>Readiness Score</h3>
                  </div>
                  <ScoreRing score={results.readiness_score} />
                  <p className="score-expl">{results.score_explanation}</p>
                </div>
                {/* Stat cards */}
                <div className="stats-grid">
                  {[
                    { icon: <CheckCircle2 size={20} />, num: results.strong_skills?.length || 0, label: 'Strong Skills', col: '#10b981', bg: 'rgba(16,185,129,.1)' },
                    { icon: <AlertTriangle size={20} />, num: results.missing_skills?.length || 0, label: 'Missing Skills', col: '#ef4444', bg: 'rgba(239,68,68,.1)' },
                    { icon: <Lightbulb size={20} />, num: results.projects?.length || 0, label: 'Projects', col: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
                    { icon: <GraduationCap size={20} />, num: results.recommended_courses?.length || 0, label: 'Courses', col: '#818cf8', bg: 'rgba(99,102,241,.1)' },
                  ].map(({ icon, num, label, col, bg }, i) => (
                    <div key={i} className="stat-card glass-panel">
                      <div className="stat-icon" style={{ background: bg, color: col }}>{icon}</div>
                      <div>
                        <div className="stat-num" style={{ color: col }}>{num}</div>
                        <div className="stat-lbl">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Quick preview */}
              <div className="preview-row">
                {results.strong_skills?.length > 0 && (
                  <div className="glass-panel preview-panel">
                    <div className="preview-hdr" style={{ color: '#10b981' }}>
                      <CheckCircle2 size={14} /> You have
                    </div>
                    <div className="chip-group">
                      {results.strong_skills.slice(0, 8).map((s, i) => (
                        <span key={i} className="skill-chip skill-strong">{s}</span>
                      ))}
                      {results.strong_skills.length > 8 && <span className="chip-more">+{results.strong_skills.length - 8}</span>}
                    </div>
                  </div>
                )}
                {results.missing_skills?.length > 0 && (
                  <div className="glass-panel preview-panel">
                    <div className="preview-hdr" style={{ color: '#ef4444' }}>
                      <AlertTriangle size={14} /> You need
                    </div>
                    <div className="chip-group">
                      {results.missing_skills.slice(0, 8).map((s, i) => (
                        <span key={i} className="skill-chip skill-missing">{s}</span>
                      ))}
                      {results.missing_skills.length > 8 && <span className="chip-more">+{results.missing_skills.length - 8}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Skills Gap ───────────────────────────────────────────── */}
          {activeTab === 'skills' && (
            <div className="pane animate-fade-in">
              <div className="two-col">
                <div className="glass-panel pad-panel">
                  <div className="sec-hdr">
                    <CheckCircle2 size={21} style={{ color: '#10b981' }} />
                    <div>
                      <h3 className="sec-title">Current Skills</h3>
                      <p className="sec-sub">Extracted from your resume</p>
                    </div>
                    <span className="sec-badge green-badge">{results.currentSkills?.length || 0}</span>
                  </div>
                  <div className="chip-group">
                    {(results.currentSkills || []).map((s, i) => <span key={i} className="skill-chip skill-current">{s}</span>)}
                  </div>
                </div>
                <div className="glass-panel pad-panel">
                  <div className="sec-hdr">
                    <BookMarked size={21} style={{ color: '#f59e0b' }} />
                    <div>
                      <h3 className="sec-title">Skills to Learn</h3>
                      <p className="sec-sub">Needed for {results.desiredRole}</p>
                    </div>
                    <span className="sec-badge yellow-badge">{results.skillsToLearn?.length || 0}</span>
                  </div>
                  <div className="chip-group">
                    {(results.skillsToLearn || []).map((s, i) => <span key={i} className="skill-chip skill-learn">{s}</span>)}
                  </div>
                </div>
              </div>
              {/* Strong vs Missing from readiness engine */}
              <div className="two-col">
                <div className="glass-panel pad-panel">
                  <div className="sec-hdr">
                    <Zap size={21} style={{ color: '#10b981' }} />
                    <div>
                      <h3 className="sec-title">Strong Skills</h3>
                      <p className="sec-sub">Role-specific skills you already have</p>
                    </div>
                    <span className="sec-badge green-badge">{results.strong_skills?.length || 0}</span>
                  </div>
                  <div className="chip-group">
                    {(results.strong_skills || []).length > 0
                      ? results.strong_skills.map((s, i) => <span key={i} className="skill-chip skill-strong">{s}</span>)
                      : <p className="empty-note">No role-specific matches found.</p>}
                  </div>
                </div>
                <div className="glass-panel pad-panel">
                  <div className="sec-hdr">
                    <AlertTriangle size={21} style={{ color: '#ef4444' }} />
                    <div>
                      <h3 className="sec-title">Missing Skills</h3>
                      <p className="sec-sub">Core gaps to close for this role</p>
                    </div>
                    <span className="sec-badge red-badge">{results.missing_skills?.length || 0}</span>
                  </div>
                  <div className="chip-group">
                    {(results.missing_skills || []).length > 0
                      ? results.missing_skills.map((s, i) => <span key={i} className="skill-chip skill-missing">{s}</span>)
                      : <p className="empty-note">You have all required skills! 🎉</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Projects ─────────────────────────────────────────────── */}
          {activeTab === 'projects' && (
            <div className="pane animate-fade-in">
              <div className="projects-panel glass-panel">
                <div className="projects-header">
                  <Lightbulb size={24} className="text-gradient" />
                  <div>
                    <h2>Recommended Projects</h2>
                    <p>Build these to close your skill gaps and supercharge your resume</p>
                  </div>
                </div>
                {/* Level Tabs */}
                <div className="level-tabs">
                  {['beginner', 'intermediate', 'advanced'].map((level) => {
                    const cfg = LEVEL_CONFIG[level];
                    return (
                      <button key={level} id={`tab-${level}`}
                        className={`level-tab ${activeLevel === level ? 'level-tab-on' : ''}`}
                        style={activeLevel === level ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
                        onClick={() => setActiveLevel(level)}>
                        {cfg.icon} {cfg.label}
                        <span className="tab-count">{projectsByLevel[level]?.length || 0}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Project Cards */}
                <div className="project-cards">
                  {(projectsByLevel[activeLevel] || []).map((project, i) => {
                    const cfg = LEVEL_CONFIG[activeLevel];
                    return (
                      <div key={i} className="project-card"
                        style={{ '--card-glow': cfg.glow, '--card-border': cfg.border, '--card-color': cfg.color }}>
                        <div className="project-level-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                          {cfg.icon} {cfg.label}
                        </div>
                        <h4 className="project-title">{project.title}</h4>
                        <p className="project-desc">{project.description}</p>
                        <div className="project-skills">
                          <span className="project-skills-label">Skills you'll build:</span>
                          <div className="project-skills-tags">
                            {project.skillsBuilt?.map((s, si) => (
                              <span key={si} className="project-skill-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="how-to-build" style={{ borderColor: cfg.border, background: 'rgba(255,255,255,0.03)' }}>
                          <div className="how-to-label" style={{ color: cfg.color }}>
                            <ChevronRight size={14} /> How to build it
                          </div>
                          <p>{project.howToBuild}</p>
                        </div>
                        {project.githubRepo && (
                          <a href={project.githubRepo} target="_blank" rel="noopener noreferrer"
                            className="github-link" style={{ borderColor: cfg.border, color: cfg.color }}>
                            <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                            </svg>
                            Reference on GitHub
                          </a>
                        )}
                      </div>
                    );
                  })}
                  {(projectsByLevel[activeLevel] || []).length === 0 && (
                    <div className="empty-state">
                      <Lightbulb size={40} style={{ opacity: 0.3 }} />
                      <p>No {activeLevel} projects generated.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Courses & Certs ──────────────────────────────────────── */}
          {activeTab === 'courses' && (
            <div className="pane animate-fade-in">
              <div className="two-col">
                {/* Courses */}
                <div className="glass-panel pad-panel">
                  <div className="sec-hdr">
                    <BookOpen size={21} className="text-gradient" />
                    <div>
                      <h3 className="sec-title">Recommended Courses</h3>
                      <p className="sec-sub">Curated to fill your exact skill gaps</p>
                    </div>
                    <span className="sec-badge indigo-badge">{results.recommended_courses?.length || 0}</span>
                  </div>
                  <div className="resource-list">
                    {(results.recommended_courses || []).map((c, i) => {
                      const name = typeof c === 'string' ? c : c.name;
                      const url  = typeof c === 'string' ? null : c.url;
                      const [title, ...rest] = name.split(' — ');
                      return (
                        <a key={i}
                          href={url || '#'} target="_blank" rel="noopener noreferrer"
                          className={`resource-row ${!url || url === '#' ? 'no-link' : ''}`}
                          style={{ animationDelay: `${i * 0.07}s` }}>
                          <div className="res-num">{i + 1}</div>
                          <div className="res-body">
                            <span className="res-name">{title}</span>
                            {rest.length > 0 && <span className="res-platform">{rest.join(' — ')}</span>}
                          </div>
                          {url && url !== '#' && <ExternalLink size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />}
                        </a>
                      );
                    })}
                  </div>
                </div>
                {/* Certifications */}
                <div className="glass-panel pad-panel">
                  <div className="sec-hdr">
                    <Award size={21} style={{ color: '#f59e0b' }} />
                    <div>
                      <h3 className="sec-title">Certifications</h3>
                      <p className="sec-sub">Industry credentials that validate your skills</p>
                    </div>
                    <span className="sec-badge yellow-badge">{results.recommended_certifications?.length || 0}</span>
                  </div>
                  <div className="cert-list">
                    {(results.recommended_certifications || []).map((c, i) => {
                      const name = typeof c === 'string' ? c : c.name;
                      const url  = typeof c === 'string' ? null : c.url;
                      return (
                        <a key={i}
                          href={url || '#'} target="_blank" rel="noopener noreferrer"
                          className={`cert-row ${!url || url === '#' ? 'no-link' : ''}`}
                          style={{ animationDelay: `${i * 0.09}s` }}>
                          <Star size={17} style={{ color: '#f59e0b', flexShrink: 0 }} />
                          <span className="cert-name">{name}</span>
                          {url && url !== '#' && <ExternalLink size={14} style={{ color: '#f59e0b', flexShrink: 0, marginLeft: 'auto' }} />}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Roadmap ──────────────────────────────────────────────── */}
          {activeTab === 'roadmap' && (
            <div className="pane animate-fade-in">
              <div className="glass-panel pad-panel">
                <div className="sec-hdr">
                  <Map size={21} className="text-gradient" />
                  <div>
                    <h3 className="sec-title">Learning Roadmap</h3>
                    <p className="sec-sub">Follow these steps in order to close your knowledge gaps</p>
                  </div>
                </div>
                <div className="roadmap">
                  {(results.learning_roadmap || []).map((step, i) => {
                    const clean = step.replace(/^\d+\.\s*/, '');
                    return (
                      <div key={i} className="rm-item">
                        <div className="rm-connector">
                          <div className="rm-dot"><span>{i + 1}</span></div>
                          {i < (results.learning_roadmap?.length || 0) - 1 && <div className="rm-line" />}
                        </div>
                        <div className="rm-card glass-panel">
                          <p className="rm-text">{clean}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── Styles ───────────────────────────────────────────────────────── */}
      <style jsx>{`
        /* Nav */
        .career-nav { margin-bottom: 2.5rem; }
        .back-link {
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--text-secondary); text-decoration: none;
          font-weight: 500; transition: color .2s;
        }
        .back-link:hover { color: var(--text-primary); }

        /* Hero */
        .career-hero { text-align: center; margin-bottom: 3rem; }
        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(139,92,246,.1); border: 1px solid rgba(139,92,246,.2);
          padding: 8px 18px; border-radius: 999px;
          font-weight: 600; font-size: .85rem; color: var(--accent-color);
          margin-bottom: 20px;
        }
        .career-title {
          font-size: clamp(2.2rem,5vw,3.5rem); font-weight: 800;
          letter-spacing: -.02em; margin: 0 0 16px; line-height: 1.1;
        }
        .career-subtitle {
          font-size: 1.05rem; color: var(--text-secondary);
          max-width: 660px; margin: 0 auto; line-height: 1.6;
        }

        /* Upload Section */
        .upload-section {
          max-width: 760px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 20px;
        }
        .upload-zone { cursor: pointer; transition: all .3s; padding: 0; }
        .upload-zone.dragging { border-color: var(--accent-color); box-shadow: 0 0 24px rgba(139,92,246,.3); transform: scale(1.01); }
        .upload-zone.has-file { border-color: rgba(16,185,129,.4); }
        .hidden-input { display: none; }
        .upload-label {
          display: block; padding: 2.5rem 2rem;
          border: 2px dashed rgba(255,255,255,.15); border-radius: 22px;
          cursor: pointer; transition: all .3s;
        }
        .upload-label:hover { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.02); }
        .upload-content { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
        .upload-icon-circle {
          width: 80px; height: 80px; border-radius: 50%;
          background: rgba(139,92,246,.1);
          display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
        }
        .upload-content h3 { font-size: 1.25rem; font-weight: 600; margin: 0; }
        .upload-content p  { color: var(--text-secondary); font-size: .9rem; margin: 0; }
        .file-name { font-size: 1.05rem; font-weight: 600; color: #10b981; }
        .file-size { font-size: .82rem; color: var(--text-secondary); }

        /* Inputs Row */
        .inputs-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 680px) { .inputs-row { grid-template-columns: 1fr; } }

        .input-panel { padding: 22px; display: flex; flex-direction: column; gap: 12px; }
        .input-label {
          display: flex; align-items: center; gap: 8px;
          font-weight: 600; font-size: .95rem; color: var(--text-primary);
        }
        .req { color: #ef4444; }
        .optional { font-weight: 400; color: var(--text-secondary); font-style: normal; margin-left: 4px; font-size: .85rem; }

        /* Chips */
        .chips-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          padding: 6px 14px; border-radius: 999px;
          border: 1px solid var(--border-color);
          background: rgba(255,255,255,.03);
          color: var(--text-secondary); font-size: .82rem; font-weight: 500;
          cursor: pointer; transition: all .2s; font-family: inherit;
        }
        .chip:hover { border-color: var(--accent-color); color: var(--text-primary); background: rgba(139,92,246,.08); }
        .chip-on  { background: rgba(139,92,246,.15); border-color: var(--accent-color); color: var(--accent-color); font-weight: 700; }

        /* Text inputs */
        .text-input {
          background: rgba(255,255,255,.04); border: 1px solid var(--border-color);
          border-radius: 13px; padding: 12px 15px; font-size: .92rem;
          color: var(--text-primary); width: 100%; font-family: inherit; transition: border-color .3s;
        }
        .text-input::placeholder { color: var(--text-secondary); }
        .text-input:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(139,92,246,.12); }
        .text-input:disabled { opacity: .5; }

        /* Error */
        .error-box {
          display: flex; align-items: center; gap: 12px; padding: 16px;
          border-color: rgba(239,68,68,.4); background: rgba(239,68,68,.08); color: #ef4444;
        }
        .error-box p { margin: 0; }

        /* Analyze button */
        .analyze-btn { width: 100%; padding: 16px 24px; font-size: 1.05rem; border-radius: 16px; justify-content: center; }
        .spinner { animation: spin 1.5s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* Results section */
        .results-section { display: flex; flex-direction: column; gap: 20px; }
        .results-hero {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 28px; flex-wrap: wrap; gap: 14px;
        }
        .results-hero-text { display: flex; align-items: center; gap: 14px; }
        .results-hero-text h2 { margin: 0; font-size: 1.35rem; font-weight: 700; }
        .results-hero-text p  { margin: 4px 0 0; font-size: .87rem; color: var(--text-secondary); }
        .results-hero-text p strong { color: var(--accent-color); }
        .reset-btn { display: flex; align-items: center; gap: 6px; padding: 9px 18px; font-size: .85rem; }

        /* Tab bar */
        .tab-bar { display: flex; gap: 4px; padding: 7px; border-radius: 20px; flex-wrap: wrap; }
        .tab-btn {
          flex: 1; background: transparent; border: none; color: var(--text-secondary);
          padding: 9px 14px; border-radius: 13px; font-size: .85rem; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: all .25s; font-family: inherit; white-space: nowrap;
        }
        .tab-btn:hover { color: var(--text-primary); background: rgba(255,255,255,.04); }
        .tab-on { color: #fff; background: linear-gradient(135deg,#6366f1,#8b5cf6); box-shadow: 0 4px 14px rgba(99,102,241,.3); }

        /* Pane */
        .pane { display: flex; flex-direction: column; gap: 18px; }

        /* Overview */
        .ring-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .overview-grid { display: grid; grid-template-columns: auto 1fr; gap: 18px; align-items: start; }
        @media(max-width:720px){ .overview-grid { grid-template-columns: 1fr; } }
        .score-card { padding: 28px; display: flex; flex-direction: column; align-items: center; gap: 18px; min-width: 210px; }
        .score-card-hdr { display: flex; align-items: center; gap: 9px; font-size: .95rem; font-weight: 700; align-self: flex-start; }
        .score-card-hdr h3 { margin: 0; }
        .score-expl { font-size: .76rem; color: var(--text-secondary); line-height: 1.5; text-align: center; margin: 0; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .stat-card { padding: 16px 18px; display: flex; align-items: center; gap: 12px; border-radius: 16px; }
        .stat-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-num  { font-size: 1.5rem; font-weight: 800; line-height: 1; }
        .stat-lbl  { font-size: .75rem; color: var(--text-secondary); font-weight: 500; }
        .preview-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media(max-width:600px){ .preview-row { grid-template-columns: 1fr; } }
        .preview-panel { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
        .preview-hdr { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; }

        /* Skills */
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        @media(max-width:680px){ .two-col { grid-template-columns: 1fr; } }
        .pad-panel { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .sec-hdr { display: flex; align-items: flex-start; gap: 12px; }
        .sec-hdr > div { flex: 1; }
        .sec-title { font-size: 1.05rem; font-weight: 700; margin: 0 0 3px; }
        .sec-sub   { font-size: .8rem; color: var(--text-secondary); margin: 0; }
        .sec-badge {
          padding: 3px 12px; border-radius: 999px; font-size: .76rem; font-weight: 700;
          white-space: nowrap; border: 1px solid;
        }
        .green-badge  { background: rgba(16,185,129,.1);  color: #10b981; border-color: rgba(16,185,129,.25); }
        .yellow-badge { background: rgba(245,158,11,.1);  color: #f59e0b; border-color: rgba(245,158,11,.25); }
        .red-badge    { background: rgba(239,68,68,.1);   color: #ef4444; border-color: rgba(239,68,68,.25); }
        .indigo-badge { background: rgba(99,102,241,.12); color: #818cf8; border-color: rgba(99,102,241,.28); }
        .chip-group { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-chip {
          padding: 5px 13px; border-radius: 999px; font-size: .82rem;
          font-weight: 500; border: 1px solid; transition: transform .2s;
        }
        .skill-chip:hover { transform: translateY(-2px); }
        .skill-current { background: rgba(139,92,246,.1);  color: var(--accent-color); border-color: rgba(139,92,246,.25); }
        .skill-learn   { background: rgba(245,158,11,.1);  color: #f59e0b; border-color: rgba(245,158,11,.25); }
        .skill-strong  { background: rgba(16,185,129,.1);  color: #10b981; border-color: rgba(16,185,129,.25); }
        .skill-missing { background: rgba(239,68,68,.1);   color: #ef4444; border-color: rgba(239,68,68,.25); }
        .chip-more {
          padding: 5px 12px; border-radius: 999px; font-size: .76rem; font-weight: 600;
          color: var(--text-secondary); border: 1px solid var(--border-color);
          background: rgba(255,255,255,.03);
        }
        .empty-note { color: var(--text-secondary); font-size: .88rem; margin: 0; font-style: italic; }

        /* Projects */
        .projects-panel { padding: 28px; display: flex; flex-direction: column; gap: 22px; }
        .projects-header { display: flex; align-items: flex-start; gap: 14px; }
        .projects-header div h2 { font-size: 1.5rem; font-weight: 800; margin: 0 0 4px; }
        .projects-header div p  { color: var(--text-secondary); font-size: .88rem; margin: 0; }
        .level-tabs { display: flex; gap: 10px; flex-wrap: wrap; }
        .level-tab {
          display: flex; align-items: center; gap: 8px; padding: 10px 20px;
          border-radius: 12px; border: 1px solid var(--border-color);
          background: rgba(255,255,255,.03); color: var(--text-secondary);
          cursor: pointer; font-size: .88rem; font-weight: 600; transition: all .25s; font-family: inherit;
        }
        .level-tab:hover { background: rgba(255,255,255,.06); color: var(--text-primary); }
        .tab-count { background: rgba(255,255,255,.08); padding: 1px 8px; border-radius: 999px; font-size: .74rem; }
        .project-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
        .project-card {
          background: rgba(255,255,255,.02); border: 1px solid var(--card-border, var(--border-color));
          border-radius: 18px; padding: 22px; display: flex; flex-direction: column; gap: 14px;
          transition: all .3s;
        }
        .project-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px var(--card-glow, rgba(0,0,0,.3)); background: rgba(255,255,255,.04); }
        .project-level-badge {
          display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px;
          border-radius: 999px; border: 1px solid; font-size: .72rem; font-weight: 700;
          width: fit-content; text-transform: uppercase; letter-spacing: .05em;
        }
        .project-title { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0; line-height: 1.3; }
        .project-desc  { font-size: .88rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }
        .project-skills { display: flex; flex-direction: column; gap: 8px; }
        .project-skills-label { font-size: .76rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .05em; }
        .project-skills-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .project-skill-badge { font-size: .78rem; font-weight: 500; padding: 3px 10px; border-radius: 999px; border: 1px solid; }
        .how-to-build { border: 1px solid; border-radius: 12px; padding: 13px; }
        .how-to-label { display: flex; align-items: center; gap: 4px; font-size: .76rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; }
        .how-to-build p { font-size: .86rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }
        .github-link {
          display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px;
          border-radius: 10px; border: 1px solid; font-size: .84rem; font-weight: 600;
          text-decoration: none; background: rgba(255,255,255,.03);
          transition: all .25s; width: 100%; justify-content: center;
        }
        .github-link:hover { background: rgba(255,255,255,.08); transform: translateY(-2px); }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; gap: 12px; color: var(--text-secondary); grid-column: 1/-1; }

        /* Courses & Certs */
        .resource-list { display: flex; flex-direction: column; gap: 9px; }
        .resource-row {
          display: flex; align-items: center; gap: 14px; padding: 14px 18px;
          background: rgba(255,255,255,.02); border: 1px solid var(--border-color);
          border-radius: 13px; transition: all .25s; animation: fadeUp .4s ease both;
          text-decoration: none; color: inherit;
        }
        .resource-row:not(.no-link):hover { background: rgba(255,255,255,.05); border-color: #818cf8; transform: translateX(4px); }
        .no-link { cursor: default; }
        .res-num {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: .76rem; font-weight: 800; color: #fff;
        }
        .res-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .res-name     { font-size: .9rem; font-weight: 600; color: var(--text-primary); }
        .res-platform { font-size: .76rem; color: var(--text-secondary); }
        .cert-list { display: flex; flex-direction: column; gap: 10px; }
        .cert-row {
          display: flex; align-items: center; gap: 12px; padding: 15px 18px;
          background: rgba(245,158,11,.04); border: 1px solid rgba(245,158,11,.2);
          border-radius: 13px; transition: all .25s; animation: fadeUp .4s ease both;
          text-decoration: none; color: inherit;
        }
        .cert-row:not(.no-link):hover { background: rgba(245,158,11,.09); border-color: rgba(245,158,11,.4); transform: translateX(4px); }
        .cert-name { font-size: .9rem; font-weight: 600; color: var(--text-primary); flex: 1; }

        /* Roadmap */
        .roadmap { display: flex; flex-direction: column; }
        .rm-item { display: flex; gap: 14px; align-items: flex-start; }
        .rm-connector { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; padding-top: 3px; }
        .rm-dot {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: .76rem; font-weight: 800; color: #fff;
          box-shadow: 0 0 10px rgba(99,102,241,.4); flex-shrink: 0;
        }
        .rm-line { width: 2px; flex: 1; min-height: 18px; background: linear-gradient(to bottom,rgba(99,102,241,.5),rgba(99,102,241,.1)); margin: 5px 0; }
        .rm-card { flex: 1; padding: 13px 16px; margin-bottom: 10px; border-radius: 13px; }
        .rm-text { font-size: .9rem; color: var(--text-primary); margin: 0; line-height: 1.5; font-weight: 500; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media(max-width:640px) {
          .career-title { font-size: 2rem; }
          .tab-btn { padding: 8px 10px; font-size: .78rem; }
        }
      `}</style>
    </main>
  );
}
