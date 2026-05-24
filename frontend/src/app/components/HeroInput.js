'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIdea(initialValue);
    setCharCount(initialValue.length);
  }, [initialValue]);

  const handleChange = (e) => {
    setIdea(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (idea.trim().length >= 10 || file) {
      // In a real implementation you might want to pass the file to the parent container
      // If passing just text for now:
      onSubmit(idea.trim(), file);
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
            {file && (
              <div className={styles.filePill}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                  <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <span className={styles.fileName}>{file.name}</span>
                <button className={styles.fileRemoveBtn} onClick={handleRemoveFile}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}
            <div className={styles.inputFooter}>
              <div className={styles.footerLeft}>
                <button 
                  className={styles.attachBtn} 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  title="Attach document or image"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <span className={styles.charCount}>
                  {charCount}/500
                </span>
              </div>
              <button
                id="analyze-button"
                className={styles.analyzeBtn}
                onClick={handleSubmit}
                disabled={(idea.trim().length < 10 && !file) || isLoading}
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
