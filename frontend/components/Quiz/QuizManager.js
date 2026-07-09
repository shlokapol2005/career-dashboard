'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Brain, CheckCircle, XCircle, ChevronRight, Award, Lightbulb, Loader2 } from 'lucide-react';

const MAX_HINTS = 3;

export default function QuizManager() {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState('');
  const [questionCount, setQuestionCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [skillsEarned, setSkillsEarned] = useState([]);
  const [scoreData, setScoreData] = useState(null);

  // Hint state — shared across the whole quiz
  const [hintsUsed, setHintsUsed] = useState(0);           // total hints used in this quiz
  const [hintByQuestion, setHintByQuestion] = useState({}); // { [qIndex]: hintText }
  const [hintLoading, setHintLoading] = useState(false);

  const generateQuiz = async (selectedDifficulty, count) => {
    setDifficulty(selectedDifficulty);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: selectedDifficulty, question_count: count })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to generate quiz');
      setQuizData(data);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setSubjectiveAnswers({});
      setShowResults(false);
      setSkillsEarned([]);
      setScoreData(null);
      setHintsUsed(0);
      setHintByQuestion({});
    } catch (err) {
      alert(err.message);
      setDifficulty('');
      setQuestionCount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option) => {
    if (showResults || answers[currentQuestionIndex]) return;
    setAnswers({ ...answers, [currentQuestionIndex]: option });
  };

  const handleSubjectiveChange = (e) => {
    if (showResults) return;
    setSubjectiveAnswers({ ...subjectiveAnswers, [currentQuestionIndex]: e.target.value });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleGetHint = async () => {
    const q = quizData.questions[currentQuestionIndex];
    if (hintsUsed >= MAX_HINTS || hintByQuestion[currentQuestionIndex] || hintLoading) return;

    setHintLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/quiz/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          options: q.options || [],
          skill: q.skill,
          difficulty: difficulty
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to get hint');
      setHintByQuestion(prev => ({ ...prev, [currentQuestionIndex]: data.hint }));
      setHintsUsed(prev => prev + 1);
    } catch (err) {
      alert('Could not get a hint right now: ' + err.message);
    } finally {
      setHintLoading(false);
    }
  };

  const submitQuiz = async () => {
    setShowResults(true);
    let correctCount = 0;
    const earned = [];

    quizData.questions.forEach((q, index) => {
      let isCorrect = false;
      if (q.type === 'mcq') {
        if (answers[index] === q.answer) isCorrect = true;
      } else if (q.type === 'subjective') {
        if (subjectiveAnswers[index]?.trim().length > 10) isCorrect = true;
      }

      if (isCorrect) {
        correctCount++;
        earned.push(q.skill);
      }
    });

    const totalQuestions = quizData.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = percentage >= 70;
    const uniqueSkills = [...new Set(earned)];

    setScoreData({ correct: correctCount, total: totalQuestions, percentage, passed });

    if (passed) {
      setSkillsEarned(uniqueSkills);
      if (uniqueSkills.length > 0) {
        try {
          await fetch('http://localhost:5001/api/skills/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: user.username,
              topic: quizData.topic || 'General',
              skills: uniqueSkills
            })
          });
        } catch (err) {
          console.error('Failed to update skills:', err);
        }
      }
    } else {
      setSkillsEarned([]);
    }
  };

  const reattemptQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSubjectiveAnswers({});
    setShowResults(false);
    setSkillsEarned([]);
    setScoreData(null);
    setHintsUsed(0);
    setHintByQuestion({});
  };

  // ── Step 1: Choose question count ─────────────────────────────────────────────
  if (!questionCount) {
    return (
      <div className="quiz-setup">
        <Brain size={40} className="setup-icon text-gradient" />
        <h3>Test Your Knowledge</h3>
        <p>First, choose how many questions you want in your quiz.</p>
        <div className="count-options">
          {[10, 20].map(count => (
            <button
              key={count}
              className="count-btn"
              onClick={() => setQuestionCount(count)}
            >
              <span className="count-number">{count}</span>
              <span className="count-label">Questions</span>
            </button>
          ))}
        </div>

        <style jsx>{`
          .quiz-setup {
            text-align: center;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .setup-icon { margin-bottom: 16px; }
          .quiz-setup h3 {
            font-size: 1.5rem;
            margin-bottom: 8px;
            color: var(--text-primary);
            font-weight: 700;
          }
          .quiz-setup p {
            color: var(--text-secondary);
            margin-bottom: 32px;
            font-size: 0.95rem;
          }
          .count-options {
            display: flex;
            gap: 20px;
            justify-content: center;
          }
          .count-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            background: rgba(139, 92, 246, 0.08);
            border: 2px solid rgba(139, 92, 246, 0.3);
            border-radius: 16px;
            padding: 24px 36px;
            cursor: pointer;
            transition: all 0.25s;
            color: var(--text-primary);
          }
          .count-btn:hover {
            background: rgba(139, 92, 246, 0.18);
            border-color: var(--accent-color);
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
          }
          .count-number {
            font-size: 2.5rem;
            font-weight: 800;
            background: var(--accent-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .count-label {
            font-size: 0.85rem;
            color: var(--text-secondary);
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  // ── Step 2: Choose difficulty ──────────────────────────────────────────────────
  if (!quizData && !loading) {
    return (
      <div className="quiz-setup">
        <Brain size={40} className="setup-icon text-gradient" />
        <h3>Choose Difficulty</h3>
        <p>Your quiz will have <strong style={{color:'var(--accent-color)'}}>{questionCount} questions</strong>. Now pick a difficulty level.</p>
        <div className="difficulty-buttons">
          <button className="btn-outline" onClick={() => generateQuiz('medium', questionCount)}>Medium</button>
          <button className="btn-primary" onClick={() => generateQuiz('advanced', questionCount)}>Advanced</button>
        </div>
        <button className="back-link" onClick={() => setQuestionCount(null)}>← Change question count</button>

        <style jsx>{`
          .quiz-setup {
            text-align: center;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .setup-icon { margin-bottom: 16px; }
          .quiz-setup h3 { font-size: 1.5rem; margin-bottom: 8px; color: var(--text-primary); font-weight: 700; }
          .quiz-setup p { color: var(--text-secondary); margin-bottom: 24px; }
          .difficulty-buttons { display: flex; gap: 16px; justify-content: center; margin-bottom: 20px; }
          .btn-outline {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 10px 28px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 0.95rem;
            font-weight: 500;
          }
          .btn-outline:hover { border-color: var(--accent-color); background: rgba(139,92,246,0.08); }
          .btn-primary {
            background: var(--accent-gradient);
            border: none;
            color: white;
            padding: 10px 28px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 600;
            font-size: 0.95rem;
          }
          .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); }
          .back-link {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 0.85rem;
            text-decoration: underline;
            padding: 0;
          }
          .back-link:hover { color: var(--text-primary); }
        `}</style>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="quiz-loading">
        <Brain size={48} className="text-gradient pulse" />
        <p>Generating {questionCount}-question {difficulty} quiz...</p>
        <style jsx>{`
          .quiz-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            gap: 16px;
          }
          .quiz-loading p { color: var(--text-secondary); font-size: 0.95rem; }
          .pulse { animation: pulse 2s infinite; }
          @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.5; transform: scale(0.9); } }
        `}</style>
      </div>
    );
  }

  // ── Active Quiz ────────────────────────────────────────────────────────────────
  const q = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;
  const hasAnswered = q.type === 'mcq' ? !!answers[currentQuestionIndex] : false;
  const currentHint = hintByQuestion[currentQuestionIndex];
  const hintsRemaining = MAX_HINTS - hintsUsed;
  const canUseHint = q.type === 'mcq' && !hasAnswered && !showResults && !currentHint && hintsRemaining > 0;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-header-left">
          <span className="badge">{difficulty.toUpperCase()}</span>
          <span className="progress">Q {currentQuestionIndex + 1}/{quizData.questions.length}</span>
        </div>
        <div className="hints-counter">
          <Lightbulb size={14} className={hintsRemaining > 0 ? 'hint-icon-active' : 'hint-icon-empty'} />
          <span className={hintsRemaining > 0 ? 'hints-text' : 'hints-text-empty'}>
            {hintsRemaining}/{MAX_HINTS} hints left
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
        />
      </div>

      <div className="question-card">
        <div className="question-meta">
          <div className="skill-tag"><Award size={14} /> {q.skill}</div>
          {/* Hint button — only for MCQ, not yet answered */}
          {q.type === 'mcq' && !showResults && (
            <button
              className={`hint-btn ${!canUseHint ? 'hint-btn-disabled' : ''}`}
              onClick={handleGetHint}
              disabled={!canUseHint || hintLoading}
              title={
                currentHint ? 'Hint already used for this question'
                : hintsRemaining === 0 ? 'No hints remaining'
                : hasAnswered ? 'Already answered'
                : 'Get a hint from the AI'
              }
            >
              {hintLoading && currentQuestionIndex === currentQuestionIndex
                ? <Loader2 size={14} className="spin" />
                : <Lightbulb size={14} />
              }
              {currentHint ? 'Hint Used' : hintsRemaining === 0 ? 'No Hints Left' : 'Get Hint'}
            </button>
          )}
        </div>
        <h3 className="question-text">{q.question}</h3>

        {/* Hint callout */}
        {currentHint && (
          <div className="hint-callout">
            <div className="hint-callout-header">
              <Lightbulb size={16} />
              <span>AI Hint</span>
            </div>
            <p>{currentHint}</p>
          </div>
        )}

        {q.type === 'mcq' ? (
          <div className="options-list">
            {q.options.map((opt, i) => {
              const isSelected = answers[currentQuestionIndex] === opt;
              let statusClass = '';
              if (hasAnswered || showResults) {
                if (opt === q.answer) statusClass = 'correct';
                else if (isSelected) statusClass = 'incorrect';
              }
              return (
                <button
                  key={i}
                  className={`option-btn ${statusClass}`}
                  onClick={() => handleOptionSelect(opt)}
                  disabled={hasAnswered || showResults}
                >
                  {opt}
                  {(hasAnswered || showResults) && opt === q.answer && <CheckCircle size={18} className="icon-correct" />}
                  {(hasAnswered || showResults) && isSelected && opt !== q.answer && <XCircle size={18} className="icon-incorrect" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="subjective-input">
            <textarea
              placeholder="Type your answer here..."
              value={subjectiveAnswers[currentQuestionIndex] || ''}
              onChange={handleSubjectiveChange}
              disabled={showResults}
              rows={4}
            />
            {showResults && (
              <div className="subjective-feedback">
                <h4>Expected Answer:</h4>
                <p>{q.answer}</p>
              </div>
            )}
          </div>
        )}

        {(showResults || (q.type === 'mcq' && answers[currentQuestionIndex])) && (
          <div className="explanation">
            <strong>Explanation:</strong> {q.explanation}
          </div>
        )}
      </div>

      <div className="quiz-actions-container">
        {showResults && scoreData && currentQuestionIndex === quizData.questions.length - 1 && (
          <div className={`score-report ${scoreData.passed ? 'passed' : 'failed'}`}>
            <div className="report-content">
              <h4>Quiz Completed</h4>
              <p className="score">Score: {scoreData.percentage}% ({scoreData.correct}/{scoreData.total})</p>
              {hintsUsed > 0 && (
                <p className="hints-summary">
                  <Lightbulb size={14} /> Used {hintsUsed} hint{hintsUsed > 1 ? 's' : ''}
                </p>
              )}
              {scoreData.passed ? (
                <div className="skills-earned">
                  <Award size={20} className="text-gradient" />
                  <span>Skills Earned: {skillsEarned.join(', ')}</span>
                </div>
              ) : (
                <div className="failed-msg">
                  <XCircle size={16} /> Score below 70%. Skills not added.
                </div>
              )}
            </div>
            {!scoreData.passed && (
              <button className="btn-outline" onClick={reattemptQuiz}>Reattempt Quiz</button>
            )}
          </div>
        )}

        <div className="quiz-actions">
          <div className="action-buttons">
            {!showResults && !isLastQuestion && (
              <button className="btn-primary" onClick={nextQuestion}
                disabled={q.type === 'mcq' ? !answers[currentQuestionIndex] : !subjectiveAnswers[currentQuestionIndex]}>
                Next <ChevronRight size={16} />
              </button>
            )}
            {!showResults && isLastQuestion && (
              <button className="btn-primary" onClick={submitQuiz}
                disabled={q.type === 'mcq' ? !answers[currentQuestionIndex] : !subjectiveAnswers[currentQuestionIndex]}>
                Submit Quiz
              </button>
            )}
            {showResults && !isLastQuestion && (
              <button className="btn-primary" onClick={nextQuestion}>
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .quiz-container { padding: 20px 0; }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .quiz-header-left { display: flex; align-items: center; gap: 12px; }
        .badge {
          background: rgba(139, 92, 246, 0.12);
          color: var(--accent-color);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          border: 1px solid rgba(139,92,246,0.25);
        }
        .progress { color: var(--text-secondary); font-size: 0.85rem; }

        .hints-counter {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(251,191,36,0.08);
          border: 1px solid rgba(251,191,36,0.2);
          padding: 5px 12px;
          border-radius: 20px;
        }
        .hint-icon-active { color: #fbbf24; }
        .hint-icon-empty { color: #6b7280; }
        .hints-text { font-size: 0.8rem; color: #fbbf24; font-weight: 600; }
        .hints-text-empty { font-size: 0.8rem; color: #6b7280; font-weight: 600; }

        .progress-bar-track {
          height: 4px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          margin-bottom: 24px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--accent-gradient);
          border-radius: 2px;
          transition: width 0.4s ease;
        }

        .question-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .question-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .skill-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 0.8rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 10px;
          border-radius: 8px;
        }

        /* Hint Button */
        .hint-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.35);
          color: #fbbf24;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
        }
        .hint-btn:hover:not(:disabled) {
          background: rgba(251, 191, 36, 0.2);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(251,191,36,0.2);
        }
        .hint-btn-disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Hint Callout */
        .hint-callout {
          background: rgba(251, 191, 36, 0.07);
          border: 1px solid rgba(251, 191, 36, 0.25);
          border-left: 3px solid #fbbf24;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
          animation: fadeSlideIn 0.3s ease;
        }
        @keyframes fadeSlideIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
        .hint-callout-header {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #fbbf24;
          font-weight: 700;
          font-size: 0.8rem;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .hint-callout p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
        }

        .question-text {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .options-list { display: flex; flex-direction: column; gap: 12px; }
        .option-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 16px;
          border-radius: 12px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .option-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--text-secondary);
        }
        .option-btn.correct { background: rgba(16,185,129,0.1); border-color: #10b981; color: #10b981; }
        .option-btn.incorrect { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }
        .icon-correct { color: #10b981; flex-shrink: 0; }
        .icon-incorrect { color: #ef4444; flex-shrink: 0; }

        .subjective-input textarea {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 16px;
          border-radius: 12px;
          font-family: inherit;
          font-size: 1rem;
          resize: vertical;
        }
        .subjective-input textarea:focus { outline: none; border-color: var(--accent-color); }
        .subjective-feedback {
          margin-top: 16px;
          padding: 16px;
          background: rgba(16,185,129,0.05);
          border-left: 3px solid #10b981;
          border-radius: 0 8px 8px 0;
        }
        .subjective-feedback h4 { margin: 0 0 8px 0; color: #10b981; font-size: 0.85rem; }
        .subjective-feedback p { margin: 0; color: var(--text-secondary); line-height: 1.5; font-size: 0.9rem; }

        .explanation {
          margin-top: 20px;
          padding: 16px;
          background: rgba(255,255,255,0.04);
          border-radius: 12px;
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .quiz-actions-container { display: flex; flex-direction: column; gap: 16px; }
        .score-report {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
        }
        .score-report.passed { border-left: 4px solid #10b981; }
        .score-report.failed { border-left: 4px solid #ef4444; }
        .score-report h4 { margin: 0 0 6px 0; font-size: 1rem; color: var(--text-primary); }
        .score-report .score { font-size: 1.2rem; font-weight: 700; margin: 0 0 8px 0; color: var(--text-primary); }
        .hints-summary {
          display: flex; align-items: center; gap: 5px;
          color: #fbbf24; font-size: 0.8rem; margin: 0 0 10px 0;
        }
        .skills-earned { display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-weight: 600; font-size: 0.9rem; }
        .failed-msg { display: flex; align-items: center; gap: 6px; color: #ef4444; font-weight: 600; font-size: 0.9rem; }
        .quiz-actions { display: flex; justify-content: flex-end; align-items: center; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent-gradient);
          border: none; color: white; padding: 12px 24px;
          border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.3s;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
        .btn-outline {
          background: transparent; border: 1px solid var(--border-color);
          color: var(--text-primary); padding: 10px 20px; border-radius: 8px;
          cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s;
        }
        .btn-outline:hover { border-color: var(--accent-color); }
      `}</style>
    </div>
  );
}
