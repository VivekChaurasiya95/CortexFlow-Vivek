'use client';

import { useState } from 'react';
import styles from './GuidedQuestions.module.css';

export default function GuidedQuestions({ questions, onSubmit, onSkip, isLoading }) {
  const [answers, setAnswers] = useState({});

  const handleChange = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const filledCount = Object.values(answers).filter(v => v && v.trim()).length;

  return (
    <section className={`${styles.section} animate-fade-in-up`} id="questions-section">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.stepBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Step 2 — Personalize
          </div>
          <h2 className={styles.title}>Help us understand better</h2>
          <p className={styles.subtitle}>
            Answer a few optional questions to get more personalized and relevant insights.
          </p>
        </div>

        {/* Questions */}
        <div className={styles.questionsGrid}>
          {questions.map((q, index) => (
            <div
              key={q.id}
              className={styles.questionCard}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <label className={styles.questionLabel} htmlFor={`q-${q.id}`}>
                <span className={styles.questionNumber}>{index + 1}</span>
                {q.question}
                {!q.required && <span className={styles.optional}>Optional</span>}
              </label>
              <input
                id={`q-${q.id}`}
                type="text"
                className={styles.questionInput}
                placeholder={q.placeholder}
                value={answers[q.id] || ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
                disabled={isLoading}
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.skipBtn}
            onClick={onSkip}
            disabled={isLoading}
          >
            Skip Questions
          </button>
          <button
            id="run-analysis-button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Running Analysis...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Run Full Analysis
                {filledCount > 0 && (
                  <span className={styles.answerCount}>{filledCount} answered</span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
