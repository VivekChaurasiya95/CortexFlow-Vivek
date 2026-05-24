'use client';

import { useState, useEffect } from 'react';
import HeroInput from './components/HeroInput';
import GuidedQuestions from './components/GuidedQuestions';
import AnalysisLoader from './components/AnalysisLoader';
import ResultsDisplay from './components/ResultsDisplay';

export default function Home() {
  const [step, setStep] = useState('input'); // 'input', 'questions', 'loading', 'results'
  const [idea, setIdea] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentStage, setCurrentStage] = useState('research_risk');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPreviousSession, setHasPreviousSession] = useState(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('cortexflow_session');
    if (savedSession) {
      setHasPreviousSession(savedSession);
    }
  }, []);

  // API base URL - CortexFlow Express server is on port 3001
  const API_BASE = 'http://localhost:3001';

  // Step 1: Submit idea, get initial questions
  const handleIdeaSubmit = async (submittedIdea) => {
    setIdea(submittedIdea);
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: submittedIdea })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit idea');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      localStorage.setItem('cortexflow_session', data.sessionId);
      setQuestions(data.questions || []);
      setStep('questions');
    } catch (err) {
      console.error('Error submitting idea:', err);
      setError(err.message || 'Connecting to CortexFlow API failed. Make sure the backend is running!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Run the full pipeline with given answers
  const runAnalysis = async (answers = {}) => {
    setStep('loading');
    setCurrentStage('research_risk');
    setError('');

    // Fetch the analysis in parallel
    const analysisPromise = fetch(`${API_BASE}/api/analyze/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea,
        answers,
        sessionId
      })
    }).then(async (res) => {
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Analysis pipeline failed');
      }
      return res.json();
    });

    // Simulate beautiful progressive stage transitions for the UI
    try {
      // Stage 1: Research & Risk (2.2s)
      await new Promise(resolve => setTimeout(resolve, 2200));
      setCurrentStage('market');

      // Stage 2: Market Opportunities (2.2s)
      await new Promise(resolve => setTimeout(resolve, 2200));
      setCurrentStage('strategy');

      // Stage 3: Strategy & Roadmap (2.2s)
      await new Promise(resolve => setTimeout(resolve, 2200));

      // Wait for real API promise to resolve
      const data = await analysisPromise;
      setResults(data);
      setStep('results');
    } catch (err) {
      console.error('Error running analysis:', err);
      setError(err.message || 'An error occurred during analysis. Please try again.');
      setStep('input');
    }
  };

  const handleSkipQuestions = () => {
    runAnalysis({});
  };

  const handleQuestionsSubmit = (answers) => {
    runAnalysis(answers);
  };

  const handleNewAnalysis = () => {
    setStep('input');
    setIdea('');
    setSessionId('');
    setQuestions([]);
    setResults(null);
    setError('');
    localStorage.removeItem('cortexflow_session');
    setHasPreviousSession(null);
  };

  const handleRefineIdea = () => {
    setStep('input');
    setResults(null);
    setError('');
  };

  const handleResumeSession = async () => {
    if (!hasPreviousSession) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/session/${hasPreviousSession}`);
      if (!response.ok) throw new Error('Session expired or not found');
      const data = await response.json();
      setIdea(data.context.idea);
      setSessionId(hasPreviousSession);
      setResults(data.result);
      setStep('results');
    } catch (err) {
      console.error(err);
      setError('Could not load previous session.');
      localStorage.removeItem('cortexflow_session');
      setHasPreviousSession(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Premium header rail */}
      <header style={{
        padding: '1.25rem 2rem',
        background: '#ffffff',
        borderBottom: '4px solid #000000',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '1.5rem',
            padding: '4px 10px',
            background: '#facc15',
            border: '3px solid #000000',
            fontWeight: '900',
            transform: 'rotate(-2deg)',
            boxShadow: '3px 3px 0px 0px #000000'
          }}>🧠</span>
          <span style={{
            fontFamily: 'Anybody',
            fontSize: '1.5rem',
            fontWeight: '900',
            letterSpacing: '-0.02em',
            color: '#000000'
          }}>CortexFlow</span>
        </div>
        <div style={{
          fontFamily: 'Space Grotesk',
          fontSize: '0.85rem',
          fontWeight: '700',
          padding: '6px 14px',
          background: '#8b5cf6',
          color: 'white',
          border: '3px solid #000000',
          borderRadius: '9999px',
          boxShadow: '2px 2px 0px 0px #000000'
        }}>
          MVP Orchestrator v1.0
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div style={{
          margin: '2rem auto 0',
          maxWidth: '800px',
          width: 'calc(100% - 4rem)',
          background: '#f87171',
          border: '4px solid #000000',
          borderRadius: '16px',
          padding: '1rem 1.5rem',
          boxShadow: '4px 4px 0px 0px #000000',
          fontFamily: 'Space Grotesk',
          fontWeight: '700',
          color: '#000000',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Active step display */}
      <div style={{ flex: 1 }}>
        {step === 'input' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <HeroInput onSubmit={handleIdeaSubmit} isLoading={isSubmitting} initialValue={idea} />
            {hasPreviousSession && !isSubmitting && (
              <button 
                onClick={handleResumeSession}
                style={{
                  marginTop: '-40px',
                  marginBottom: '40px',
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '2px dashed #000',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'Space Grotesk',
                  fontWeight: '600'
                }}
              >
                Resume Previous Session
              </button>
            )}
          </div>
        )}

        {step === 'questions' && (
          <GuidedQuestions
            questions={questions}
            onSubmit={handleQuestionsSubmit}
            onSkip={handleSkipQuestions}
            isLoading={isSubmitting}
          />
        )}

        {step === 'loading' && (
          <AnalysisLoader currentStage={currentStage} />
        )}

        {step === 'results' && (
          <ResultsDisplay 
            results={results} 
            onNewAnalysis={handleNewAnalysis} 
            onRefineIdea={handleRefineIdea}
            sessionId={sessionId}
            apiBase={API_BASE}
          />
        )}
      </div>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        background: '#ffffff',
        borderTop: '4px solid #000000',
        textAlign: 'center',
        fontFamily: 'Space Grotesk',
        fontSize: '0.9rem',
        fontWeight: '700'
      }}>
        CortexFlow Strategy Interface • Built with ⚡ in Neo-Brutalist Play style
      </footer>
    </main>
  );
}
