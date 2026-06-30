'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Brain, CheckCircle, XCircle, ChevronRight, Award } from 'lucide-react';

export default function QuizManager() {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [skillsEarned, setSkillsEarned] = useState([]);
  const [scoreData, setScoreData] = useState(null);

  const generateQuiz = async (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: selectedDifficulty })
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
    } catch (err) {
      alert(err.message);
      setDifficulty('');
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
    
    setScoreData({
      correct: correctCount,
      total: totalQuestions,
      percentage,
      passed
    });

    if (passed) {
      setSkillsEarned(uniqueSkills);
      if (uniqueSkills.length > 0) {
        try {
          await fetch('http://localhost:5001/api/skills/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              username: user.username, 
              topic: quizData.topic || "General",
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
  };

  if (!quizData && !loading) {
    return (
      <div className="quiz-setup">
        <h3>Test Your Knowledge</h3>
        <p>Select a difficulty to generate a quiz based on your summary.</p>
        <div className="difficulty-buttons">
          <button className="btn-outline" onClick={() => generateQuiz('medium')}>Medium</button>
          <button className="btn-primary" onClick={() => generateQuiz('advanced')}>Advanced</button>
        </div>

        <style jsx>{`
          .quiz-setup {
            text-align: center;
            padding: 40px 20px;
          }
          .quiz-setup h3 {
            font-size: 1.5rem;
            margin-bottom: 12px;
            color: var(--text-primary);
          }
          .quiz-setup p {
            color: var(--text-secondary);
            margin-bottom: 24px;
          }
          .difficulty-buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
          }
          .btn-outline {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 10px 24px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
          }
          .btn-outline:hover {
            border-color: var(--accent-color);
          }
          .btn-primary {
            background: var(--accent-gradient);
            border: none;
            color: white;
            padding: 10px 24px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          }
        `}</style>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="quiz-loading">
        <Brain size={48} className="text-gradient pulse" />
        <p>Generating {difficulty} quiz...</p>
        <style jsx>{`
          .quiz-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            gap: 16px;
          }
          .pulse { animation: pulse 2s infinite; }
          @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.5; transform: scale(0.9); } }
        `}</style>
      </div>
    );
  }

  const q = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span className="badge">{difficulty.toUpperCase()}</span>
        <span className="progress">Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
      </div>

      <div className="question-card">
        <div className="skill-tag"><Award size={14} /> {q.skill}</div>
        <h3 className="question-text">{q.question}</h3>

        {q.type === 'mcq' ? (
          <div className="options-list">
            {q.options.map((opt, i) => {
              const isSelected = answers[currentQuestionIndex] === opt;
              const hasAnswered = !!answers[currentQuestionIndex];
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
              <button className="btn-outline" onClick={reattemptQuiz}>
                Reattempt Quiz
              </button>
            )}
          </div>
        )}

        <div className="quiz-actions">
          <div className="action-buttons">
            {!showResults && !isLastQuestion && (
              <button className="btn-primary" onClick={nextQuestion} disabled={q.type === 'mcq' ? !answers[currentQuestionIndex] : !subjectiveAnswers[currentQuestionIndex]}>
                Next <ChevronRight size={16} />
              </button>
            )}
            {!showResults && isLastQuestion && (
              <button className="btn-primary" onClick={submitQuiz} disabled={q.type === 'mcq' ? !answers[currentQuestionIndex] : !subjectiveAnswers[currentQuestionIndex]}>
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
        .quiz-container {
          padding: 20px 0;
        }
        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .badge {
          background: rgba(139, 92, 246, 0.1);
          color: var(--accent-color);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .progress {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .question-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
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
          margin-bottom: 16px;
        }
        .question-text {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
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
        .option-btn.selected {
          border-color: var(--accent-color);
          background: rgba(139, 92, 246, 0.1);
        }
        .option-btn.correct {
          background: rgba(16, 185, 129, 0.1);
          border-color: #10b981;
          color: #10b981;
        }
        .option-btn.incorrect {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
          color: #ef4444;
        }
        .icon-correct { color: #10b981; }
        .icon-incorrect { color: #ef4444; }
        
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
        .subjective-input textarea:focus {
          outline: none;
          border-color: var(--accent-color);
        }
        .subjective-feedback {
          margin-top: 16px;
          padding: 16px;
          background: rgba(16, 185, 129, 0.05);
          border-left: 4px solid #10b981;
          border-radius: 0 8px 8px 0;
        }
        .subjective-feedback h4 {
          margin: 0 0 8px 0;
          color: #10b981;
        }
        .subjective-feedback p { margin: 0; color: var(--text-secondary); line-height: 1.5; }

        .explanation {
          margin-top: 20px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .quiz-actions-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .score-report {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
        }
        .score-report.passed {
          border-left: 4px solid #10b981;
        }
        .score-report.failed {
          border-left: 4px solid #ef4444;
        }
        .score-report h4 {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
          color: var(--text-primary);
        }
        .score-report .score {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: var(--text-primary);
        }
        .failed-msg {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #ef4444;
          font-weight: 600;
        }
        .quiz-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }
        .skills-earned {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-primary);
          font-weight: 600;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent-gradient);
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-primary:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </div>
  );
}
