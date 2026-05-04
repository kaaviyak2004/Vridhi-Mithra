import { useState, useEffect, useRef } from 'react';
import { FiUpload, FiChevronRight, FiChevronLeft, FiCheck, FiAward, FiTarget, FiTrendingUp, FiStar, FiMic, FiType, FiVolume2, FiSquare } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STEPS = ['upload', 'interview', 'evaluating', 'results'];

export default function MockInterview() {
  const [step, setStep] = useState('upload');
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [interviewMode, setInterviewMode] = useState('text'); // 'text' or 'voice'

  // Interview state
  const [interviewData, setInterviewData] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});

  // Voice Mode state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  // Results
  const [evaluation, setEvaluation] = useState(null);

  // Setup Speech Recognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setAnswers(prev => ({
            ...prev, 
            [currentQ]: (prev[currentQ] || '') + ' ' + finalTranscript.trim()
          }));
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
          toast.error('Microphone error. Please try again.');
          setIsRecording(false);
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [currentQ]);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Upload resume & start
  const handleStartInterview = async () => {
    if (!resumeFile) return toast.error('Please select a resume PDF.');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      const { data } = await api.post('/ai/mock-interview/start', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setInterviewData(data);
      setStep('interview');
      setCurrentQ(0);
      setAnswers({});
      toast.success('Interview questions generated! Let\'s begin.');
      
      // Auto-speak first question if in voice mode
      if (interviewMode === 'voice') {
        speakQuestion(data.questions[0].question);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process resume.');
    } finally { setLoading(false); }
  };

  // Speak a question using Text-to-Speech
  const speakQuestion = (text) => {
    window.speechSynthesis.cancel(); // Stop any current speech
    if (isRecording && recognitionRef.current) recognitionRef.current.stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('en')) || voices.find(v => v.lang.includes('en'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  // Toggle Microphone recording
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      return toast.error('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      window.speechSynthesis.cancel(); // Stop AI speaking if user interrupts
      setIsSpeaking(false);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle navigating between questions
  const changeQuestion = (newIndex) => {
    window.speechSynthesis.cancel();
    if (isRecording && recognitionRef.current) recognitionRef.current.stop();
    setIsSpeaking(false);
    setIsRecording(false);
    
    setCurrentQ(newIndex);
    
    if (interviewMode === 'voice' && interviewData?.questions[newIndex]) {
      speakQuestion(interviewData.questions[newIndex].question);
    }
  };

  // Submit all answers for evaluation
  const handleSubmitInterview = async () => {
    window.speechSynthesis.cancel();
    if (isRecording && recognitionRef.current) recognitionRef.current.stop();
    
    setStep('evaluating');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/mock-interview/evaluate', {
        questions: interviewData.questions,
        answers: interviewData.questions.map((_, i) => answers[i] || ''),
        resumeText: interviewData.resumeText
      });
      setEvaluation(data.evaluation);
      setStep('results');
    } catch (err) {
      toast.error('Failed to evaluate. Please try again.');
      setStep('interview');
    } finally { setLoading(false); }
  };

  const questions = interviewData?.questions || [];
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;

  const getTypeColor = (type) => {
    switch (type) {
      case 'technical': return '#6c5ce7';
      case 'behavioral': return '#00b894';
      case 'problem-solving': return '#e17055';
      case 'career': return '#0984e3';
      default: return '#636e72';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#00b894';
    if (score >= 60) return '#fdcb6e';
    return '#e17055';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🎤 AI Mock Interview</h1>
        <p>Upload your resume, answer interview questions, and get AI-powered feedback</p>
      </div>

      {/* Progress Steps */}
      <div style={{display:'flex', gap:0, marginBottom:32, background:'var(--bg-card)', borderRadius:12, overflow:'hidden', border:'1px solid var(--border)'}}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            flex:1, padding:'14px 16px', textAlign:'center', fontSize:13, fontWeight:600,
            background: STEPS.indexOf(step) >= i ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'transparent',
            color: STEPS.indexOf(step) >= i ? 'white' : 'var(--text-muted)',
            transition: 'all 0.3s ease'
          }}>
            {i+1}. {s === 'upload' ? 'Setup' : s === 'interview' ? 'Interview' : s === 'evaluating' ? 'Evaluating' : 'Results'}
          </div>
        ))}
      </div>

      {/* ===== STEP 1: UPLOAD & SETUP ===== */}
      {step === 'upload' && (
        <div className="card" style={{maxWidth:700, margin:'0 auto', textAlign:'center', padding:40}}>
          <div style={{fontSize:56, marginBottom:16}}>⚙️</div>
          <h2 style={{marginBottom:8, color:'var(--text-primary)'}}>Setup Your Interview</h2>
          <p style={{color:'var(--text-muted)', marginBottom:32, fontSize:14}}>
            Choose your interview style and upload your resume. Our AI will generate personalized questions tailored to your profile.
          </p>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:32}}>
            <div 
              onClick={() => setInterviewMode('text')}
              style={{
                padding:24, borderRadius:16, cursor:'pointer', border:'2px solid',
                borderColor: interviewMode === 'text' ? 'var(--primary)' : 'var(--border)',
                background: interviewMode === 'text' ? 'rgba(108,92,231,0.05)' : 'var(--bg-input)',
                transition:'all 0.2s'
              }}
            >
              <FiType style={{fontSize:32, color: interviewMode === 'text' ? 'var(--primary)' : 'var(--text-muted)', marginBottom:12}} />
              <h3 style={{fontSize:16, marginBottom:4, color:'var(--text-primary)'}}>Text Mode</h3>
              <p style={{fontSize:13, color:'var(--text-muted)', margin:0}}>Type your answers. Great for practicing written communication.</p>
            </div>
            
            <div 
              onClick={() => setInterviewMode('voice')}
              style={{
                padding:24, borderRadius:16, cursor:'pointer', border:'2px solid',
                borderColor: interviewMode === 'voice' ? 'var(--primary)' : 'var(--border)',
                background: interviewMode === 'voice' ? 'rgba(108,92,231,0.05)' : 'var(--bg-input)',
                transition:'all 0.2s'
              }}
            >
              <FiMic style={{fontSize:32, color: interviewMode === 'voice' ? 'var(--primary)' : 'var(--text-muted)', marginBottom:12}} />
              <h3 style={{fontSize:16, marginBottom:4, color:'var(--text-primary)'}}>Voice Mode</h3>
              <p style={{fontSize:13, color:'var(--text-muted)', margin:0}}>AI speaks questions, you reply with your microphone. Highly realistic.</p>
            </div>
          </div>

          <div style={{
            border: '2px dashed var(--border)', borderRadius:16, padding:40, marginBottom:24,
            background: resumeFile ? 'rgba(0,184,148,0.05)' : 'rgba(108,92,231,0.03)',
            transition: 'all 0.3s'
          }}>
            <input type="file" accept=".pdf" id="resume-upload"
              style={{display:'none'}}
              onChange={e => setResumeFile(e.target.files[0])} />
            <label htmlFor="resume-upload" style={{cursor:'pointer', display:'block'}}>
              {resumeFile ? (
                <div>
                  <FiCheck style={{fontSize:40, color:'var(--success)', marginBottom:8}} />
                  <p style={{fontSize:16, fontWeight:600, color:'var(--text-primary)'}}>{resumeFile.name}</p>
                  <p style={{fontSize:13, color:'var(--text-muted)'}}>({(resumeFile.size / 1024).toFixed(1)} KB) — Click to change</p>
                </div>
              ) : (
                <div>
                  <FiUpload style={{fontSize:40, color:'var(--primary)', marginBottom:8}} />
                  <p style={{fontSize:16, fontWeight:600, color:'var(--text-primary)'}}>Click to select PDF Resume</p>
                  <p style={{fontSize:13, color:'var(--text-muted)'}}>Maximum 5MB • PDF format only</p>
                </div>
              )}
            </label>
          </div>

          <button className="btn btn-primary" style={{padding:'12px 40px', fontSize:16, width:'100%'}}
            onClick={handleStartInterview} disabled={loading || !resumeFile}>
            {loading ? '⏳ Analyzing Resume...' : '🚀 Start Mock Interview'}
          </button>
        </div>
      )}

      {/* ===== STEP 2: INTERVIEW ===== */}
      {step === 'interview' && interviewData && (
        <div>
          {/* Candidate Summary */}
          {interviewData.candidateSummary && (
            <div className="card" style={{marginBottom:16, padding:'16px 24px', borderLeft:'4px solid var(--primary)'}}>
              <p style={{fontSize:13, color:'var(--text-muted)', margin:0}}>
                <strong style={{color:'var(--primary)'}}>AI Summary:</strong> {interviewData.candidateSummary}
              </p>
            </div>
          )}

          {/* Progress bar */}
          <div style={{marginBottom:24}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
              <span style={{fontSize:13, color:'var(--text-muted)'}}>Question {currentQ+1} of {questions.length}</span>
              <span style={{fontSize:13, color:'var(--text-muted)'}}>{Math.round(progress)}% complete</span>
            </div>
            <div style={{height:6, background:'var(--bg-input)', borderRadius:3, overflow:'hidden'}}>
              <div style={{height:'100%', width:`${progress}%`, background:'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius:3, transition:'width 0.4s ease'}} />
            </div>
          </div>

          {/* Question Card */}
          <div className="card" style={{marginBottom:24, position:'relative'}}>
            {interviewMode === 'voice' && (
               <div style={{position:'absolute', top:24, right:24, display:'flex', gap:10}}>
                  {isSpeaking && (
                    <span style={{display:'flex', alignItems:'center', gap:6, color:'var(--primary)', fontSize:12, fontWeight:600, background:'rgba(108,92,231,0.1)', padding:'4px 10px', borderRadius:20}}>
                      <FiVolume2 className="animate-pulse" /> AI Speaking
                    </span>
                  )}
                  <button 
                    onClick={() => speakQuestion(questions[currentQ]?.question)}
                    style={{background:'var(--bg-input)', border:'1px solid var(--border)', width:32, height:32, borderRadius:'50%', color:'var(--text-primary)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}
                    title="Repeat Question"
                  >
                    <FiVolume2 size={14} />
                  </button>
               </div>
            )}

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
              <span className="badge" style={{background: getTypeColor(questions[currentQ]?.type) + '22', color: getTypeColor(questions[currentQ]?.type), border: `1px solid ${getTypeColor(questions[currentQ]?.type)}44`, padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600}}>
                {questions[currentQ]?.type?.toUpperCase()} • {questions[currentQ]?.difficulty}
              </span>
              {interviewMode !== 'voice' && <span style={{fontSize:12, color:'var(--text-muted)', fontStyle:'italic'}}>{questions[currentQ]?.context}</span>}
            </div>

            <h3 style={{fontSize:20, lineHeight:1.5, marginBottom:24, color:'var(--text-primary)', paddingRight: interviewMode === 'voice' ? 80 : 0}}>
              {questions[currentQ]?.question}
            </h3>

            {interviewMode === 'voice' ? (
              <div style={{background:'var(--bg-input)', borderRadius:16, padding:24, border:'1px solid var(--border)'}}>
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginBottom:20}}>
                  <button 
                    onClick={toggleRecording}
                    className={`btn-icon ${isRecording ? 'animate-pulse' : ''}`}
                    style={{
                      width:80, height:80, borderRadius:'50%', fontSize:32, display:'flex', alignItems:'center', justifyContent:'center',
                      background: isRecording ? 'rgba(225,112,85,0.1)' : 'linear-gradient(135deg, var(--primary), var(--accent))',
                      color: isRecording ? 'var(--danger)' : 'white',
                      border: isRecording ? '2px solid var(--danger)' : 'none',
                      boxShadow: isRecording ? '0 0 20px rgba(225,112,85,0.4)' : '0 10px 20px rgba(108,92,231,0.3)',
                      transition:'all 0.3s ease'
                    }}
                  >
                    {isRecording ? <FiSquare /> : <FiMic />}
                  </button>
                  <span style={{marginTop:12, fontSize:14, fontWeight:600, color: isRecording ? 'var(--danger)' : 'var(--text-primary)'}}>
                    {isRecording ? 'Listening... Tap to stop' : 'Tap to start speaking'}
                  </span>
                </div>
                
                <textarea
                  className="form-input"
                  placeholder="Your transcribed answer will appear here. You can also type to edit it."
                  value={answers[currentQ] || ''}
                  onChange={e => setAnswers(prev => ({...prev, [currentQ]: e.target.value}))}
                  style={{minHeight:120, fontSize:15, lineHeight:1.6, resize:'vertical', background:'var(--bg-card)'}}
                />
              </div>
            ) : (
              <textarea
                className="form-input"
                placeholder="Type your answer here... Be thorough and specific. Use examples from your experience."
                value={answers[currentQ] || ''}
                onChange={e => setAnswers(prev => ({...prev, [currentQ]: e.target.value}))}
                style={{minHeight:180, fontSize:15, lineHeight:1.6, resize:'vertical'}}
              />
            )}

            <div style={{display:'flex', justifyContent:'space-between', marginTop:20}}>
              <button className="btn btn-secondary" disabled={currentQ === 0}
                onClick={() => changeQuestion(currentQ - 1)}>
                <FiChevronLeft /> Previous
              </button>

              {currentQ < questions.length - 1 ? (
                <button className="btn btn-primary" onClick={() => changeQuestion(currentQ + 1)}>
                  Next <FiChevronRight />
                </button>
              ) : (
                <button className="btn btn-success" style={{padding:'10px 32px'}} onClick={handleSubmitInterview}>
                  <FiCheck /> Submit Interview
                </button>
              )}
            </div>
          </div>

          {/* Question Navigation Dots */}
          <div style={{display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap'}}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => changeQuestion(i)} style={{
                width:40, height:40, borderRadius:'50%', border:'2px solid',
                borderColor: i === currentQ ? 'var(--primary)' : answers[i] ? 'var(--success)' : 'var(--border)',
                background: i === currentQ ? 'var(--primary)' : answers[i] ? 'rgba(0,184,148,0.15)' : 'transparent',
                color: i === currentQ ? 'white' : answers[i] ? 'var(--success)' : 'var(--text-muted)',
                fontWeight:600, fontSize:14, cursor:'pointer', transition:'all 0.2s'
              }}>
                {answers[i] ? '✓' : i+1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== STEP 3: EVALUATING ===== */}
      {step === 'evaluating' && (
        <div className="card" style={{textAlign:'center', padding:60}}>
          <div style={{fontSize:64, marginBottom:16, animation:'pulse 1.5s infinite'}}>🤖</div>
          <h2 style={{marginBottom:8, color:'var(--text-primary)'}}>AI is Evaluating Your Answers...</h2>
          <p style={{color:'var(--text-muted)'}}>Our AI is analyzing your responses and preparing detailed feedback. This may take a moment.</p>
          <div style={{marginTop:24}}>
            <div className="skeleton" style={{height:8, width:200, margin:'0 auto', borderRadius:4}} />
          </div>
        </div>
      )}

      {/* ===== STEP 4: RESULTS ===== */}
      {step === 'results' && evaluation && (
        <div>
          {/* Overall Score Card */}
          <div className="card" style={{
            textAlign:'center', padding:40, marginBottom:24,
            background: `linear-gradient(135deg, ${getScoreColor(evaluation.overallScore)}11, ${getScoreColor(evaluation.overallScore)}05)`,
            border: `2px solid ${getScoreColor(evaluation.overallScore)}33`
          }}>
            <div style={{fontSize:64, fontWeight:800, color: getScoreColor(evaluation.overallScore), lineHeight:1}}>
              {evaluation.overallScore}%
            </div>
            <div style={{fontSize:24, fontWeight:700, marginTop:8, color:'var(--text-primary)'}}>
              Grade: {evaluation.overallGrade}
            </div>
            <p style={{color:'var(--text-secondary)', marginTop:12, maxWidth:600, margin:'12px auto 0', lineHeight:1.6}}>
              {evaluation.overallFeedback}
            </p>
          </div>

          {/* Communication Skills Radar */}
          {evaluation.communicationFeedback && (
            <div className="card" style={{marginBottom:24}}>
              <h3 style={{marginBottom:20, color:'var(--text-primary)'}}><FiTarget style={{marginRight:8}} /> Communication Skills</h3>
              <div className="grid grid-2" style={{gap:16}}>
                {Object.entries(evaluation.communicationFeedback).map(([skill, score]) => (
                  <div key={skill} style={{padding:16, background:'rgba(108,92,231,0.05)', borderRadius:12, border:'1px solid var(--border)'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                      <span style={{fontWeight:600, textTransform:'capitalize', color:'var(--text-primary)'}}>{skill}</span>
                      <span style={{fontWeight:700, color: getScoreColor(score)}}>{score}%</span>
                    </div>
                    <div style={{height:8, background:'var(--bg-input)', borderRadius:4, overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${score}%`, background: getScoreColor(score), borderRadius:4, transition:'width 0.6s ease'}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-Question Feedback */}
          <div className="card" style={{marginBottom:24}}>
            <h3 style={{marginBottom:20, color:'var(--text-primary)'}}><FiStar style={{marginRight:8}} /> Question-by-Question Feedback</h3>
            {(evaluation.questionEvaluations || []).map((qe, i) => (
              <div key={i} style={{
                padding:20, marginBottom:16, borderRadius:12,
                background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)'
              }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                  <strong style={{color:'var(--text-primary)'}}>Q{qe.questionNumber}: {questions[i]?.question?.substring(0, 80)}...</strong>
                  <span style={{
                    padding:'4px 14px', borderRadius:20, fontWeight:700, fontSize:14,
                    background: getScoreColor(qe.score) + '22', color: getScoreColor(qe.score)
                  }}>{qe.score}%</span>
                </div>
                <p style={{color:'var(--text-secondary)', fontSize:14, lineHeight:1.6, marginBottom:12}}>{qe.feedback}</p>
                {qe.strengths?.length > 0 && (
                  <div style={{marginBottom:8}}>
                    <span style={{fontSize:12, color:'var(--success)', fontWeight:600}}>✅ Strengths: </span>
                    <span style={{fontSize:13, color:'var(--text-muted)'}}>{qe.strengths.join(' • ')}</span>
                  </div>
                )}
                {qe.improvements?.length > 0 && (
                  <div>
                    <span style={{fontSize:12, color:'var(--warning)', fontWeight:600}}>💡 Improve: </span>
                    <span style={{fontSize:13, color:'var(--text-muted)'}}>{qe.improvements.join(' • ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Key Strengths & Areas to Improve */}
          <div className="grid grid-2" style={{gap:16, marginBottom:24}}>
            <div className="card" style={{borderTop:'3px solid var(--success)'}}>
              <h3 style={{marginBottom:16, color:'var(--success)'}}><FiAward style={{marginRight:8}} /> Key Strengths</h3>
              {(evaluation.keyStrengths || []).map((s, i) => (
                <div key={i} style={{padding:'10px 14px', background:'rgba(0,184,148,0.06)', borderRadius:8, marginBottom:8, fontSize:14, color:'var(--text-primary)'}}>
                  ✅ {s}
                </div>
              ))}
            </div>
            <div className="card" style={{borderTop:'3px solid var(--warning)'}}>
              <h3 style={{marginBottom:16, color:'var(--warning)'}}><FiTrendingUp style={{marginRight:8}} /> Areas to Improve</h3>
              {(evaluation.areasToImprove || []).map((a, i) => (
                <div key={i} style={{padding:12, background:'rgba(253,203,110,0.06)', borderRadius:8, marginBottom:8}}>
                  <strong style={{fontSize:14, color:'var(--text-primary)'}}>{a.area}</strong>
                  <p style={{fontSize:13, color:'var(--text-muted)', margin:'4px 0'}}>{a.suggestion}</p>
                  {a.resources?.length > 0 && (
                    <p style={{fontSize:12, color:'var(--primary)'}}>📚 {a.resources.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          {evaluation.nextSteps && (
            <div className="card" style={{marginBottom:24, borderTop:'3px solid var(--primary)'}}>
              <h3 style={{marginBottom:16, color:'var(--text-primary)'}}>🎯 Recommended Next Steps</h3>
              {evaluation.nextSteps.map((s, i) => (
                <div key={i} style={{display:'flex', gap:12, alignItems:'flex-start', padding:'10px 0', borderBottom: i < evaluation.nextSteps.length - 1 ? '1px solid var(--border)' : 'none'}}>
                  <span style={{background:'var(--primary)', color:'white', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0}}>{i+1}</span>
                  <span style={{fontSize:14, color:'var(--text-primary)', lineHeight:1.6}}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Motivational Message */}
          {evaluation.motivationalMessage && (
            <div className="card" style={{textAlign:'center', padding:32, background:'linear-gradient(135deg, rgba(108,92,231,0.08), rgba(0,206,201,0.08))'}}>
              <p style={{fontSize:18, fontWeight:600, color:'var(--text-primary)', lineHeight:1.6}}>
                💪 {evaluation.motivationalMessage}
              </p>
            </div>
          )}

          {/* Retry Button */}
          <div style={{textAlign:'center', marginTop:32}}>
            <button className="btn btn-primary" style={{padding:'12px 40px', fontSize:16}}
              onClick={() => { setStep('upload'); setResumeFile(null); setInterviewData(null); setEvaluation(null); setAnswers({}); setInterviewMode('text'); }}>
              🔄 Take Another Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
