'use client';

import { useState, useEffect } from 'react';
import styles from './HeroInput.module.css';

const EXAMPLE_IDEAS = [
  "An AI tool that helps freelancers write better project proposals",
  "A marketplace connecting local farmers directly with restaurants",
  "A browser extension that summarizes long email threads",
  "A platform for indie game developers to find playtesters",
];

export default function HeroInput({ onSubmit, isLoading, initialValue = '' }) {
  const [idea, setIdea] = useState(initialValue);
  const [charCount, setCharCount] = useState(initialValue.length);

  useEffect(() => {
    setIdea(initialValue);
    setCharCount(initialValue.length);
  }, [initialValue]);

  const handleChange = (e) => {
    setIdea(e.target.value);
    setCharCount(e.target.value.length);
  };


  const handleSubmit = () => {
    if (idea.trim().length >= 10) {
      onSubmit(idea.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleExampleClick = (example) => {
    setIdea(example);
    setCharCount(example.length);
  };

  return (
    <section className={styles.hero} id="hero-section">
      <div className={styles.heroContent}>
        {/* Decorative orbs */}
        <div className={styles.orbLeft} />
        <div className={styles.orbRight} />

        {/* Badge */}
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Context-to-Strategy Intelligence
        </div>

        {/* Title */}
        <h1 className={styles.title}>
          Transform your <span className="gradient-text">idea</span> into
          <br />a winning <span className="gradient-text">strategy</span>
        </h1>

        {/* Subtitle */}
        <p className={styles.subtitle}>
          CortexFlow uses AI agents to analyze your product idea — finding similar products,
          uncovering risks, identifying market gaps, and building an actionable MVP roadmap.
        </p>

        {/* Input area */}
        <div className={styles.inputWrapper}>
          <div className={styles.inputCard}>
            <textarea
              id="idea-input"
              className={styles.textarea}
              placeholder="Describe your product idea..."
              value={idea}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              rows={4}
              maxLength={500}
              disabled={isLoading}
            />
            <div className={styles.inputFooter}>
              <span className={styles.charCount}>
                {charCount}/500
              </span>
              <button
                id="analyze-button"
                className={styles.analyzeBtn}
                onClick={handleSubmit}
                disabled={idea.trim().length < 10 || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    Analyze Idea
                  </>
                )}
              </button>
            </div>
          </div>

          <p className={styles.hint}>
            ⌘ + Enter to analyze • Minimum 10 characters
          </p>
        </div>

        {/* Example ideas */}
        <div className={styles.examples}>
          <span className={styles.examplesLabel}>Try an example:</span>
          <div className={styles.exampleChips}>
            {EXAMPLE_IDEAS.map((example, i) => (
              <button
                key={i}
                className={styles.chip}
                onClick={() => handleExampleClick(example)}
                disabled={isLoading}
              >
                {example.length > 50 ? example.substring(0, 50) + '...' : example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
