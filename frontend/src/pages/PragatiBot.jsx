import { useState, useEffect, useRef } from 'react';
import { FiSend, FiCpu, FiUser, FiTrash2, FiPlus } from 'react-icons/fi';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import './PragatiBot.css';

export default function PragatiBot() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message on mount
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm **Pragati**, your AI learning assistant.\n\nI can help you with:\n- 📚 Explaining concepts in any subject\n- 📝 Creating study plans\n- 💡 Suggesting learning resources\n- 🎯 Placement preparation tips\n- 🧠 Analyzing your performance\n\nHow can I help you today?`
    }]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: userMsg, session_id: sessionId });
      setSessionId(data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      toast.error('Failed to get response');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again!' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const newChat = () => {
    setMessages([{ role: 'assistant', content: 'New conversation started! How can I help you? 🚀' }]);
    setSessionId(null);
  };

  const analyzePerformance = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: '🔍 Analyze my academic performance and suggest improvements' }]);
    try {
      const { data } = await api.post('/ai/analyze');
      const analysis = data.analysis;
      let msg = `## 📊 Performance Analysis\n\n**${analysis.overallAssessment}**\n\n`;
      msg += `### ✅ Strengths\n${analysis.strengths?.map(s => `- ${s}`).join('\n') || 'N/A'}\n\n`;
      msg += `### ⚠️ Areas to Improve\n${analysis.weakAreas?.map(w => `- **${w.subject}** (${w.topic}): ${w.suggestion}`).join('\n') || 'N/A'}\n\n`;
      msg += `### 📅 Study Plan\n**Daily:** ${analysis.studyPlan?.daily?.join(', ') || 'N/A'}\n**Weekly:** ${analysis.studyPlan?.weekly?.join(', ') || 'N/A'}\n\n`;
      msg += `### 💪 ${analysis.motivationalMessage || 'Keep going!'}`;
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
      toast.success('Learning paths updated!');
    } catch (err) {
      toast.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pragati-page animate-fade-in">
      <div className="pragati-container">
        {/* Header */}
        <div className="pragati-header">
          <div className="pragati-title">
            <div className="pragati-avatar"><FiCpu /></div>
            <div>
              <h2>Pragati AI</h2>
              <span className="pragati-status">🟢 Online — Ready to help</span>
            </div>
          </div>
          <div className="pragati-actions">
            <button className="btn btn-sm btn-accent" onClick={analyzePerformance} disabled={loading}>
              🔍 Analyze My Performance
            </button>
            <button className="btn btn-sm btn-secondary" onClick={newChat}>
              <FiPlus /> New Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="pragati-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? <FiCpu /> : <FiUser />}
              </div>
              <div className="message-bubble">
                <div className="message-content" dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/### (.*?)$/gm, '<h4>$1</h4>')
                    .replace(/## (.*?)$/gm, '<h3>$1</h3>')
                    .replace(/- (.*?)$/gm, '<li>$1</li>')
                    .replace(/\n/g, '<br/>')
                }} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-avatar"><FiCpu /></div>
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="pragati-input-area">
          <div className="quick-prompts">
            {['Explain Data Structures', 'Give me a study plan', 'Placement tips', 'Explain SQL Joins'].map((prompt) => (
              <button key={prompt} className="quick-prompt" onClick={() => { setInput(prompt); }}>
                {prompt}
              </button>
            ))}
          </div>
          <div className="input-row">
            <textarea
              className="pragati-input"
              placeholder="Ask Pragati anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
