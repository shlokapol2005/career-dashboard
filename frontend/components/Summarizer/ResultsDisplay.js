'use client';
import { useState } from 'react';
import { BookOpen, Lightbulb, ListChecks, ChevronRight } from 'lucide-react';

export default function ResultsDisplay({ data, onReset }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!data) return null;

  return (
    <div className="results-container animate-fade-in delay-2">
      <div className="results-header glass-panel">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <BookOpen size={18} />
            Summary
          </button>
          <button 
            className={`tab-btn ${activeTab === 'concepts' ? 'active' : ''}`}
            onClick={() => setActiveTab('concepts')}
          >
            <Lightbulb size={18} />
            Key Concepts
          </button>
          <button 
            className={`tab-btn ${activeTab === 'revision' ? 'active' : ''}`}
            onClick={() => setActiveTab('revision')}
          >
            <ListChecks size={18} />
            Revision Notes
          </button>
        </div>
      </div>

      <div className="results-content glass-panel">
        {activeTab === 'summary' && (
          <div className="tab-pane animate-fade-in">
            <h2>Executive Summary</h2>
            <div className="prose">
              <p>{data.summary}</p>
            </div>
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="tab-pane animate-fade-in">
            <h2>Core Concepts Extracted</h2>
            <div className="concepts-grid">
              {data.concepts?.map((concept, index) => (
                <div key={index} className="concept-card">
                  <div className="concept-icon">
                    <Lightbulb size={24} className="text-gradient" />
                  </div>
                  <div className="concept-text">
                    <h3>{concept.title}</h3>
                    <p>{concept.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'revision' && (
          <div className="tab-pane animate-fade-in">
            <h2>Quick Revision Points</h2>
            <ul className="revision-list">
              {data.revisionNotes?.map((note, index) => (
                <li key={index} className="revision-item">
                  <div className="bullet"><ChevronRight size={16} /></div>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="actions">
        <button className="btn-outline" onClick={onReset}>Summarize Another File</button>
      </div>

      <style jsx>{`
        .results-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .tabs {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }
        .tab-btn.active {
          color: #ffffff;
          background: var(--accent-gradient);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
        }
        .theme-mono .tab-btn.active {
          color: #000000;
          background: #ffffff;
          box-shadow: none;
        }
        .results-content {
          padding: 2.5rem;
          min-height: 400px;
        }
        h2 {
          font-size: 1.8rem;
          font-weight: 800;
          margin-top: 0;
          margin-bottom: 1.5rem;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .prose p {
          font-size: 1.1rem;
          line-height: 1.8;
          color: var(--text-primary);
        }
        
        .concepts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .concept-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .concept-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--accent-color);
        }
        .concept-icon {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          padding: 12px;
          border-radius: 14px;
          height: fit-content;
        }
        .concept-text h3 {
          margin: 0 0 8px 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .concept-text p {
          margin: 0;
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
 
        .revision-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .revision-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: rgba(255, 255, 255, 0.02);
          padding: 18px 24px;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .revision-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--accent-color);
        }
        .bullet {
          color: var(--accent-color);
          margin-top: 3px;
        }
        .revision-item span {
          font-size: 1.05rem;
          line-height: 1.6;
        }
 
        .actions {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}
