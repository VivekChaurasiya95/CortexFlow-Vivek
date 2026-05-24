'use client';

import { useState } from 'react';
import styles from './ResultsDisplay.module.css';

const SECTION_CONFIG = {
  research: {
    icon: '🔬',
    title: 'Research Insights',
    subtitle: 'Similar products, patterns, and key references',
    color: 'purple'
  },
  market: {
    icon: '📊',
    title: 'Market Opportunities',
    subtitle: 'Gaps, demand signals, and competitive advantages',
    color: 'cyan'
  },
  risk: {
    icon: '⚠️',
    title: 'Risk Assessment',
    subtitle: 'Weaknesses, blind spots, and failure patterns',
    color: 'amber'
  },
  strategy: {
    icon: '🎯',
    title: 'Strategy Plan',
    subtitle: 'MVP scope, roadmap, and differentiation',
    color: 'green'
  }
};

function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Simple markdown-to-HTML converter for agent outputs
  const lines = content.split('\n');
  const elements = [];
  let listItems = [];
  let listType = null;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className={styles.markdownList}>
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const formatInline = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={i} className={styles.markdownH4}
          dangerouslySetInnerHTML={{ __html: formatInline(line.substring(4)) }}
        />
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={i} className={styles.markdownH3}
          dangerouslySetInnerHTML={{ __html: formatInline(line.substring(3)) }}
        />
      );
    }
    // List items
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.substring(2));
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s/, ''));
    }
    // Regular paragraph
    else {
      flushList();
      elements.push(
        <p key={i} className={styles.markdownParagraph}
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
  }

  flushList();
  return <div className={styles.markdownContent}>{elements}</div>;
}

function SourcesList({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className={styles.sourcesCard}>
      <h3 className={styles.sourcesTitle}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        Sources Used
      </h3>
      <div className={styles.sourcesTags}>
        {sources.map((source, i) => (
          <div key={i} className={styles.sourceTag}>
            <span className={styles.sourceTitle}>{source.title}</span>
            <span className={styles.sourceRelevance}>
              {Math.round(source.relevance * 100)}% match
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaInfo({ meta }) {
  if (!meta) return null;

  return (
    <div className={styles.metaCard}>
      <div className={styles.metaGrid}>
        <div className={styles.metaStat}>
          <span className={styles.metaLabel}>Total Time</span>
          <span className={styles.metaValue}>
            {(meta.totalDuration / 1000).toFixed(1)}s
          </span>
        </div>
        {meta.ewmaLatency != null && (
          <div className={styles.metaStat}>
            <span className={styles.metaLabel}>Avg Latency (EWMA)</span>
            <span className={styles.metaValue}>
              {(meta.ewmaLatency / 1000).toFixed(1)}s
            </span>
          </div>
        )}
        <div className={styles.metaStat}>
          <span className={styles.metaLabel}>Cache Hits</span>
          <span className={styles.metaValue}>
            {meta.cacheHits?.length || 0}
          </span>
        </div>
        <div className={styles.metaStat}>
          <span className={styles.metaLabel}>Cache Backend</span>
          <span className={styles.metaValue}>
            {meta.cacheStats?.backend || 'memory'}
          </span>
        </div>
        {meta.stages?.map((stage, i) => (
          <div key={i} className={styles.metaStat}>
            <span className={styles.metaLabel}>{stage.name}</span>
            <span className={styles.metaValue}>
              {(stage.duration / 1000).toFixed(1)}s
              {stage.cached && ' ⚡'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsDisplay({ results, onNewAnalysis, onRefineIdea, sessionId, apiBase }) {
  const [activeTab, setActiveTab] = useState('research');
  const [showMeta, setShowMeta] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [isAsking, setIsAsking] = useState(false);

  const handleAskQuestion = async () => {
    if (!followUpQuestion.trim() || isAsking) return;
    const q = followUpQuestion.trim();
    setFollowUpQuestion('');
    setIsAsking(true);
    
    setFollowUpHistory(prev => [...prev, { role: 'user', content: q }]);

    try {
      const res = await fetch(`${apiBase}/api/analyze/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question: q })
      });
      const data = await res.json();
      if (res.ok) {
        setFollowUpHistory(prev => [...prev, { role: 'agent', content: data.answer }]);
      } else {
        setFollowUpHistory(prev => [...prev, { role: 'agent', content: 'Error: ' + (data.error || 'Failed to get answer') }]);
      }
    } catch (err) {
      setFollowUpHistory(prev => [...prev, { role: 'agent', content: 'Network error occurred.' }]);
    } finally {
      setIsAsking(false);
    }
  };

  if (!results) return null;

  const sections = ['research', 'market', 'risk', 'strategy'];

  return (
    <section className={`${styles.section} animate-fade-in-up`} id="results-section">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.successBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Analysis Complete
          </div>
          <h2 className={styles.title}>Your Strategy Report</h2>
          <p className={styles.subtitle}>
            Here's what our AI agents discovered about your idea.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          {sections.map((key) => {
            const config = SECTION_CONFIG[key];
            return (
              <button
                key={key}
                id={`tab-${key}`}
                className={`${styles.tab} ${activeTab === key ? styles.activeTab : ''} ${styles[`tab_${config.color}`]}`}
                onClick={() => setActiveTab(key)}
              >
                <span className={styles.tabIcon}>{config.icon}</span>
                <span className={styles.tabLabel}>{config.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Content */}
        <div className={styles.contentCard}>
          <div className={styles.contentHeader}>
            <span className={styles.contentIcon}>
              {SECTION_CONFIG[activeTab].icon}
            </span>
            <div>
              <h3 className={styles.contentTitle}>
                {SECTION_CONFIG[activeTab].title}
              </h3>
              <p className={styles.contentSubtitle}>
                {SECTION_CONFIG[activeTab].subtitle}
              </p>
            </div>
          </div>
          <div className={styles.contentBody}>
            <MarkdownRenderer content={results[activeTab]} />
          </div>
        </div>

        {/* Sources */}
        <SourcesList sources={results.sources} />

        {/* Meta Toggle */}
        <div className={styles.metaToggle}>
          <button
            className={styles.metaToggleBtn}
            onClick={() => setShowMeta(!showMeta)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {showMeta ? 'Hide' : 'Show'} Reasoning Summary
          </button>
        </div>

        {showMeta && <MetaInfo meta={results.meta} />}

        {/* Actions */}
        <div className={styles.actions} style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            id="refine-idea-button"
            className={styles.newAnalysisBtn}
            onClick={onRefineIdea}
            style={{ background: '#facc15', color: '#000' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Refine Idea
          </button>
          
          <button
            id="new-analysis-button"
            className={styles.newAnalysisBtn}
            onClick={onNewAnalysis}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Analyze New Idea
          </button>
        </div>

        {/* Follow-up Questions Chat */}
        <div style={{ marginTop: '3rem', padding: '2rem', borderTop: '4px solid #000' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', marginBottom: '1rem' }}>Ask a Follow-up Question</h3>
          <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>Want to tweak the strategy or ask for more details? The refinement agent is ready.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {followUpHistory.map((msg, i) => (
              <div key={i} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? '#facc15' : '#f3f4f6',
                border: '3px solid #000',
                borderRadius: '8px',
                padding: '1rem',
                maxWidth: '80%',
                boxShadow: '4px 4px 0px 0px #000'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  {msg.role === 'user' ? 'You' : 'Refinement Agent'}
                </div>
                {msg.role === 'user' ? msg.content : <MarkdownRenderer content={msg.content} />}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              placeholder="e.g. How does this change if I target enterprise users?"
              style={{ flex: 1, padding: '1rem', border: '3px solid #000', borderRadius: '8px', fontSize: '1rem', fontFamily: 'Inter' }}
              disabled={isAsking}
            />
            <button 
              onClick={handleAskQuestion}
              disabled={isAsking || !followUpQuestion.trim()}
              style={{
                padding: '0 2rem',
                background: '#8b5cf6',
                color: '#fff',
                border: '3px solid #000',
                borderRadius: '8px',
                fontFamily: 'Space Grotesk',
                fontWeight: 'bold',
                cursor: isAsking || !followUpQuestion.trim() ? 'not-allowed' : 'pointer',
                opacity: isAsking || !followUpQuestion.trim() ? 0.7 : 1,
                boxShadow: '4px 4px 0px 0px #000'
              }}
            >
              {isAsking ? 'Thinking...' : 'Ask'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
