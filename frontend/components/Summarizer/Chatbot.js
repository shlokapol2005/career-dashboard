'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Loader2, X } from 'lucide-react';

export default function Chatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I have indexed your notes. Ask me any questions about them to understand the topics better.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to get answer');
      }

      setMessages((prev) => [...prev, { role: 'bot', text: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'Sorry, I encountered an error trying to process that question. Make sure the backend is running.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div className={`chat-backdrop ${isOpen ? 'show' : ''}`} onClick={onClose} />

      {/* Drawer Panel */}
      <div className={`chatbot-drawer ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="header-title">
            <MessageSquare className="chat-icon text-gradient" size={20} />
            <h3>Study Assistant</h3>
          </div>
          <div className="header-actions">
            <span className="status-indicator">Active Note Index</span>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.role}`}>
              <div className="avatar">
                {msg.role === 'bot' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="message-bubble">
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message-wrapper bot loading">
              <div className="avatar">
                <Bot size={16} />
              </div>
              <div className="message-bubble loading-bubble">
                <Loader2 className="spinner" size={16} />
                <span>Analyzing notes...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-area">
          <input
            type="text"
            placeholder="Ask a question about these notes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={!input.trim() || isLoading}>
            <Send size={18} />
          </button>
        </form>
      </div>

      <style jsx>{`
        .chat-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 998;
        }

        .chat-backdrop.show {
          opacity: 1;
          pointer-events: auto;
        }

        .chatbot-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: 460px;
          height: 100vh;
          background: var(--bg-card);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border-left: 1px solid var(--border-color);
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 999;
        }

        .chatbot-drawer.open {
          transform: translateX(0);
        }

        @media (max-width: 500px) {
          .chatbot-drawer {
            width: 100%;
          }
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.01);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-title h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .status-indicator {
          font-size: 0.75rem;
          color: var(--success-color);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 4px 10px;
          border-radius: 99px;
          font-weight: 500;
        }

        .theme-mono .status-indicator {
          color: white;
          background: transparent;
          border: 1px solid white;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Custom Scrollbar */
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 99px;
        }

        .message-wrapper {
          display: flex;
          gap: 12px;
          max-width: 85%;
        }

        .message-wrapper.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-wrapper.bot {
          align-self: flex-start;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .user .avatar {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.2);
          color: var(--accent-color);
        }

        .message-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .user .message-bubble {
          background: var(--accent-gradient);
          color: white;
          border-top-right-radius: 4px;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
        }

        .bot .message-bubble {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-top-left-radius: 4px;
        }

        .message-bubble p {
          margin: 0;
          white-space: pre-wrap;
        }

        .loading-bubble {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .spinner {
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .chat-input-area {
          display: flex;
          padding: 20px 24px;
          border-top: 1px solid var(--border-color);
          background: rgba(0, 0, 0, 0.2);
          gap: 12px;
        }

        .chat-input-area input {
          flex: 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          padding: 14px 18px;
          border-radius: 16px;
          color: white;
          outline: none;
          transition: all 0.3s;
          font-size: 0.95rem;
        }

        .chat-input-area input:focus {
          border-color: var(--accent-color);
          background: rgba(255, 255, 255, 0.05);
        }

        .chat-input-area button {
          background: var(--accent-gradient);
          border: none;
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-smooth);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
        }

        .chat-input-area button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(139, 92, 246, 0.3);
        }

        .chat-input-area button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>
    </>
  );
}
