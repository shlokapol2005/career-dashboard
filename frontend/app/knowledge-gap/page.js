'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, BrainCircuit, UploadCloud, FileText, Loader2,
  AlertCircle, CheckCircle2, Target, Building2, RotateCcw,
  Sparkles, X, TrendingUp
} from 'lucide-react';
import ReadinessReport from '../../components/KnowledgeGap/ReadinessReport';

// ─── Constants ────────────────────────────────────────────────────────────────
const CAREER_GOALS = [
  'ML Engineer', 'Data Engineer', 'AI Engineer',
  'SDE', 'Data Scientist', 'DevOps Engineer',
];

const TARGET_COMPANIES = [
  'Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Apple',
];

const STEPS = [
  { id: 1, label: 'Upload Resume' },
  { id: 2, label: 'Set Goal' },
  { id: 3, label: 'View Report' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KnowledgeGapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // UI state
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Form state
  const [resumeFile, setResumeFile] = useState(null);
  const [careerGoal, setCareerGoal] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  // Data state
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [gapResults, setGapResults] = useState(null);
  const [savedReport, setSavedReport] = useState(null);

  // Loading / error
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // Load previous saved report
  useEffect(() => {
    if (!user) return;
    fetch(`http://localhost:5001/api/career/readiness?username=${user.username}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.status === 'success' && d.data) setSavedReport(d.data); })
      .catch(() => { });
  }, [user]);

  if (loading || !user) return null;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleFileChange = (file) => {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.txt'].includes(ext)) {
      setError('Please upload a PDF or TXT file.');
      return;
    }
    setResumeFile(file);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  // Step 1 → 2: Extract skills via POST /api/career/analyze
  const handleExtractSkills = async () => {
    if (!resumeFile) { setError('Please upload your resume first.'); return; }
    setIsExtracting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      fd.append('desired_role', careerGoal || 'Software Engineer');

      const res = await fetch('http://localhost:5001/api/career/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Skill extraction failed.');

      const skills = data.currentSkills || [];
      if (skills.length === 0) throw new Error('No skills found. Make sure your resume has readable text, not scanned images.');
      setExtractedSkills(skills);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Step 2 → 3: Run Knowledge Gap analysis via POST /api/career/readiness
  const handleAnalyzeGap = async () => {
    if (!careerGoal.trim()) { setError('Please select or enter a career goal.'); return; }
    if (extractedSkills.length === 0) { setError('No skills to analyse. Go back and re-upload your resume.'); return; }
    setIsAnalyzing(true);
    setError(null);
    try {
      const payload = {
        username: user.username,
        current_skills: extractedSkills,
        career_goal: careerGoal.trim(),
        target_company: targetCompany.trim() || null,
      };
      const res = await fetch('http://localhost:5001/api/career/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Knowledge gap analysis failed.');
      setGapResults(data);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeSkill = (s) => setExtractedSkills(prev => prev.filter(x => x !== s));
  const addSkill = () => {
    const t = customSkill.trim();
    if (t && !extractedSkills.includes(t)) setExtractedSkills(prev => [...prev, t]);
    setCustomSkill('');
  };
  const handleReset = () => {
    setStep(1); setResumeFile(null); setCareerGoal(''); setTargetCompany('');
    setExtractedSkills([]); setGapResults(null); setError(null); setCustomSkill('');
  };
  const loadSaved = () => {
    if (!savedReport) return;
    setGapResults({ status: 'success', ...savedReport.analysis });
    setStep(3);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="container animate-fade-in">

      {/* Navbar */}
      <nav className="kg-nav">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </nav>

      {/* Hero */}
      <header className="kg-hero">
        <div className="hero-badge">
          <TrendingUp size={16} />
          <span>Knowledge Gap Analysis</span>
        </div>
        <h1 className="kg-title">
          Measure Your <span className="text-gradient">Career Readiness</span>
        </h1>
        <p className="kg-subtitle">
          Upload your resume — AI extracts your skills automatically, then maps them
          against your target role to generate a precise readiness score and learning roadmap.
        </p>
      </header>

      {/* Step Indicator */}
      {step < 3 && (
        <div className="step-row animate-fade-in">
          {STEPS.map((s, i) => (
            <div key={s.id} className="step-item">
              <div className={`step-dot ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`}>
                {step > s.id ? <CheckCircle2 size={14} /> : s.id}
              </div>
              <span className={`step-label ${step === s.id ? 'label-active' : ''}`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className={`step-line ${step > s.id ? 'line-done' : ''}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Saved report banner */}
      {savedReport && step === 1 && (
        <div className="saved-banner glass-panel">
          <div className="saved-left">
            <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <span>
              Previous report: <strong>{savedReport.career_goal}</strong>
              {savedReport.target_company && <> @ <strong>{savedReport.target_company}</strong></>}
              {' '}· Score: <strong style={{ color: 'var(--accent-color)' }}>{savedReport.analysis?.readiness_score}/100</strong>
            </span>
          </div>
          <button className="btn-outline sm-btn" onClick={loadSaved}>Load Report</button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* STEP 1: Upload Resume                                                  */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <section className="step-section animate-fade-in">
          <h2 className="step-heading">Upload Your Resume</h2>
          <p className="step-sub">AI will read your resume and automatically extract all your technical skills.</p>

          {/* Drop zone */}
          <div
            className={`drop-zone glass-panel ${isDragging ? 'dragging' : ''} ${resumeFile ? 'file-ready' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.txt"
              className="file-input-hidden"
              onChange={(e) => handleFileChange(e.target.files[0])}
              disabled={isExtracting}
            />
            <label htmlFor="resume-upload" className="drop-label">
              {resumeFile ? (
                <div className="drop-content">
                  <FileText size={44} style={{ color: '#10b981' }} />
                  <span className="file-name-text">{resumeFile.name}</span>
                  <span className="file-meta-text">{(resumeFile.size / 1024).toFixed(1)} KB · Click to change</span>
                </div>
              ) : (
                <div className="drop-content">
                  <div className="upload-circle">
                    <UploadCloud size={34} className="text-gradient" />
                  </div>
                  <h3>Drop your resume here</h3>
                  <p>PDF or TXT · drag & drop or click to browse</p>
                </div>
              )}
            </label>
          </div>

          {/* Hint */}
          <div className="hint-box glass-panel">
            <Target size={15} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
            <p>Optionally pre-select a career goal — it helps the AI extract role-specific skills more precisely.</p>
          </div>

          {/* Career goal chips */}
          <div className="chips-row">
            {CAREER_GOALS.map(g => (
              <button key={g}
                className={`chip ${careerGoal === g ? 'chip-on' : ''}`}
                onClick={() => setCareerGoal(prev => prev === g ? '' : g)}>
                {g}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="error-row glass-panel">
              <AlertCircle size={17} /> <p>{error}</p>
            </div>
          )}

          <button id="kg-extract-btn" className="btn-primary full-btn"
            onClick={handleExtractSkills}
            disabled={isExtracting || !resumeFile}>
            {isExtracting
              ? <><Loader2 size={20} className="spin" /> Extracting Skills…</>
              : <><Sparkles size={20} /> Extract Skills & Continue</>}
          </button>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* STEP 2: Review Skills + Set Career Goal                                */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <section className="step-section animate-fade-in">
          <h2 className="step-heading">Review Extracted Skills</h2>
          <p className="step-sub">Skills extracted from your resume by AI. Remove incorrect ones or add any missing skills.</p>

          {/* Extracted skills */}
          <div className="skills-panel glass-panel">
            <div className="skills-panel-hdr">
              <CheckCircle2 size={20} style={{ color: '#10b981' }} />
              <h3>{extractedSkills.length} Skills Extracted</h3>
            </div>
            <div className="tags-grid">
              {extractedSkills.map((s, i) => (
                <span key={i} className="removable-tag">
                  {s}
                  <button className="tag-remove" onClick={() => removeSkill(s)}><X size={12} /></button>
                </span>
              ))}
              {extractedSkills.length === 0 && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No skills remaining — add some below.</span>
              )}
            </div>
            <div className="add-row">
              <input
                className="add-input"
                placeholder="Add a skill…"
                value={customSkill}
                onChange={e => setCustomSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
              />
              <button className="btn-outline sm-btn" onClick={addSkill}>Add</button>
            </div>
          </div>

          {/* Career Goal */}
          <div className="goal-panel glass-panel">
            <div className="goal-hdr">
              <Target size={20} className="text-gradient" />
              <h3>Career Goal <span className="req-label">*</span></h3>
            </div>
            <div className="chips-row">
              {CAREER_GOALS.map(g => (
                <button key={g}
                  className={`chip ${careerGoal === g ? 'chip-on' : ''}`}
                  onClick={() => setCareerGoal(prev => prev === g ? '' : g)}>
                  {g}
                </button>
              ))}
            </div>
            <input
              id="kg-career-goal"
              className="text-input"
              placeholder="Or type a custom role: e.g. Full Stack Developer…"
              value={careerGoal}
              onChange={e => setCareerGoal(e.target.value)}
            />

            {/* Target company */}
            <div className="company-label">
              <Building2 size={15} className="text-gradient" />
              <span>Target Company <em>(optional)</em></span>
            </div>
            <div className="chips-row">
              {TARGET_COMPANIES.map(c => (
                <button key={c}
                  className={`chip ${targetCompany === c ? 'chip-on' : ''}`}
                  onClick={() => setTargetCompany(prev => prev === c ? '' : c)}>
                  {c}
                </button>
              ))}
            </div>
            <input
              id="kg-target-company"
              className="text-input"
              placeholder="Or type a company name…"
              value={targetCompany}
              onChange={e => setTargetCompany(e.target.value)}
            />
          </div>

          {error && (
            <div className="error-row glass-panel">
              <AlertCircle size={17} /> <p>{error}</p>
            </div>
          )}

          <div className="action-row">
            <button className="btn-outline" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button id="kg-analyze-btn" className="btn-primary flex-btn"
              onClick={handleAnalyzeGap}
              disabled={isAnalyzing || !careerGoal.trim() || extractedSkills.length === 0}>
              {isAnalyzing
                ? <><Loader2 size={20} className="spin" /> Analysing…</>
                : <><BrainCircuit size={20} /> Analyse Knowledge Gap</>}
            </button>
          </div>
        </section>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* STEP 3: Results Report                                                 */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {step === 3 && gapResults && (
        <section className="results-section animate-fade-in">
          <div className="results-bar glass-panel">
            <div className="results-bar-left">
              <CheckCircle2 size={26} style={{ color: '#10b981' }} />
              <div>
                <h2>Analysis Complete</h2>
                <p>
                  Goal: <strong>{gapResults.career_goal}</strong>
                  {gapResults.target_company && <> · <strong>{gapResults.target_company}</strong></>}
                </p>
              </div>
            </div>
            <button id="kg-reset-btn" className="btn-outline sm-btn" onClick={handleReset}>
              <RotateCcw size={14} /> New Analysis
            </button>
          </div>

          <ReadinessReport data={gapResults} />
        </section>
      )}

      {/* ─── Styles ─────────────────────────────────────────────────────────── */}
      <style jsx>{`
        /* Nav */
        .kg-nav { margin-bottom: 2.5rem; }
        .back-link {
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--text-secondary); text-decoration: none;
          font-weight: 500; transition: color .2s;
        }
        .back-link:hover { color: var(--text-primary); }

        /* Hero */
        .kg-hero { text-align: center; margin-bottom: 3rem; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(99,102,241,.1); border: 1px solid rgba(99,102,241,.25);
          padding: 8px 18px; border-radius: 999px;
          color: #818cf8; font-weight: 600; font-size: .85rem; margin-bottom: 20px;
        }
        .kg-title {
          font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800;
          letter-spacing: -.02em; margin: 0 0 16px; line-height: 1.1;
        }
        .kg-subtitle {
          font-size: 1.05rem; color: var(--text-secondary);
          max-width: 620px; margin: 0 auto; line-height: 1.6;
        }

        /* Step indicator */
        .step-row {
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 2.5rem; flex-wrap: wrap; gap: 4px;
        }
        .step-item { display: flex; align-items: center; gap: 10px; }
        .step-dot {
          width: 34px; height: 34px; border-radius: 50%;
          border: 2px solid var(--border-color);
          display: flex; align-items: center; justify-content: center;
          font-size: .8rem; font-weight: 700; color: var(--text-secondary);
          background: rgba(255,255,255,.03); transition: all .3s; flex-shrink: 0;
        }
        .step-dot.active { border-color: #818cf8; color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
        .step-dot.done   { background: linear-gradient(135deg,#6366f1,#8b5cf6); border-color: transparent; color: #fff; }
        .step-label { font-size: .85rem; font-weight: 500; color: var(--text-secondary); white-space: nowrap; }
        .label-active { color: var(--text-primary); font-weight: 700; }
        .step-line { width: 56px; height: 2px; background: var(--border-color); margin: 0 8px; transition: background .3s; }
        .line-done { background: #6366f1; }

        /* Saved banner */
        .saved-banner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 22px; margin-bottom: 1.8rem; gap: 16px; flex-wrap: wrap;
        }
        .saved-left { display: flex; align-items: center; gap: 10px; font-size: .88rem; color: var(--text-secondary); }
        .saved-left strong { color: var(--text-primary); }

        /* Step sections */
        .step-section {
          max-width: 680px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 18px;
        }
        .step-heading { font-size: 1.8rem; font-weight: 800; margin: 0; }
        .step-sub { color: var(--text-secondary); font-size: .95rem; line-height: 1.6; margin: 0; }

        /* Drop zone */
        .drop-zone { cursor: pointer; padding: 0; transition: all .3s; }
        .drop-zone.dragging { border-color: #818cf8; box-shadow: 0 0 28px rgba(99,102,241,.3); transform: scale(1.01); }
        .drop-zone.file-ready { border-color: rgba(16,185,129,.4); }
        .file-input-hidden { display: none; }
        .drop-label {
          display: block; padding: 3rem 2rem;
          border: 2px dashed rgba(255,255,255,.12);
          border-radius: 22px; cursor: pointer; transition: all .3s;
        }
        .drop-label:hover { border-color: rgba(255,255,255,.28); background: rgba(255,255,255,.02); }
        .drop-content { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
        .upload-circle {
          width: 78px; height: 78px; border-radius: 50%;
          background: rgba(99,102,241,.1);
          display: flex; align-items: center; justify-content: center; margin-bottom: 6px;
        }
        .drop-content h3 { font-size: 1.25rem; font-weight: 600; margin: 0; }
        .drop-content p   { color: var(--text-secondary); font-size: .9rem; margin: 0; }
        .file-name-text  { font-size: 1.05rem; font-weight: 600; color: #10b981; }
        .file-meta-text  { font-size: .82rem; color: var(--text-secondary); }

        /* Hint box */
        .hint-box {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 16px; border-radius: 12px;
        }
        .hint-box p { font-size: .86rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }

        /* Chips */
        .chips-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          padding: 7px 16px; border-radius: 999px;
          border: 1px solid var(--border-color);
          background: rgba(255,255,255,.03);
          color: var(--text-secondary); font-size: .85rem; font-weight: 500;
          cursor: pointer; transition: all .2s; font-family: inherit;
        }
        .chip:hover { border-color: #818cf8; color: var(--text-primary); background: rgba(99,102,241,.08); }
        .chip-on  { background: rgba(99,102,241,.15); border-color: #818cf8; color: #818cf8; font-weight: 700; }

        /* Error */
        .error-row {
          display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          border-color: rgba(239,68,68,.4); background: rgba(239,68,68,.07);
          color: #ef4444; font-size: .88rem; border-radius: 12px;
        }
        .error-row p { margin: 0; }

        /* Action buttons */
        .full-btn { width: 100%; justify-content: center; padding: 15px 24px; font-size: 1rem; }
        .sm-btn   { padding: 8px 16px; font-size: .82rem; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .flex-btn { flex: 1; justify-content: center; }
        .action-row { display: flex; gap: 12px; align-items: center; }
        .spin { animation: spin 1.4s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* Skills panel */
        .skills-panel { padding: 22px; display: flex; flex-direction: column; gap: 14px; }
        .skills-panel-hdr { display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 700; }
        .skills-panel-hdr h3 { margin: 0; }
        .tags-grid { display: flex; flex-wrap: wrap; gap: 8px; min-height: 38px; }
        .removable-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(99,102,241,.12); border: 1px solid rgba(99,102,241,.28);
          color: #818cf8; padding: 5px 12px; border-radius: 999px;
          font-size: .83rem; font-weight: 500; transition: background .2s;
        }
        .removable-tag:hover { background: rgba(99,102,241,.22); }
        .tag-remove {
          background: transparent; border: none; color: currentColor;
          cursor: pointer; display: flex; padding: 0; opacity: .65; transition: opacity .2s;
        }
        .tag-remove:hover { opacity: 1; }
        .add-row { display: flex; gap: 10px; align-items: center; }
        .add-input {
          flex: 1; background: rgba(255,255,255,.04); border: 1px solid var(--border-color);
          border-radius: 12px; padding: 10px 14px; font-size: .9rem;
          color: var(--text-primary); font-family: inherit; transition: border-color .3s;
        }
        .add-input::placeholder { color: var(--text-secondary); }
        .add-input:focus { outline: none; border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }

        /* Goal panel */
        .goal-panel  { padding: 22px; display: flex; flex-direction: column; gap: 12px; }
        .goal-hdr    { display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 700; }
        .goal-hdr h3 { margin: 0; }
        .req-label   { color: #ef4444; font-weight: 700; }
        .text-input {
          background: rgba(255,255,255,.04); border: 1px solid var(--border-color);
          border-radius: 13px; padding: 12px 15px; font-size: .92rem;
          color: var(--text-primary); width: 100%; font-family: inherit; transition: border-color .3s;
        }
        .text-input::placeholder { color: var(--text-secondary); }
        .text-input:focus { outline: none; border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
        .company-label {
          display: flex; align-items: center; gap: 7px;
          font-size: .88rem; font-weight: 600; color: var(--text-primary); margin-top: 6px;
        }
        .company-label em { font-weight: 400; color: var(--text-secondary); font-style: normal; margin-left: 4px; }

        /* Results section */
        .results-section { display: flex; flex-direction: column; gap: 24px; }
        .results-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 26px; flex-wrap: wrap; gap: 14px;
        }
        .results-bar-left { display: flex; align-items: center; gap: 14px; }
        .results-bar-left h2 { font-size: 1.35rem; font-weight: 700; margin: 0; }
        .results-bar-left p  { margin: 4px 0 0; font-size: .85rem; color: var(--text-secondary); }
        .results-bar-left strong { color: #818cf8; }

        @media (max-width: 640px) {
          .step-line { width: 28px; }
          .step-label { display: none; }
        }
      `}</style>
    </main>
  );
}
