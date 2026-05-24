'use client';

import { useState, useEffect } from 'react';
import styles from './AnalysisLoader.module.css';

const STAGES = [
  {
    id: 'research_risk',
    icon: '🔬',
    label: 'Research Agent',
    sublabel: 'Finding similar products & patterns...',
    secondIcon: '⚠️',
    secondLabel: 'Risk Agent',
    secondSublabel: 'Identifying weaknesses & failure modes...',
    parallel: true
  },
  {
    id: 'market',
    icon: '📊',
    label: 'Market Agent',
    sublabel: 'Discovering gaps & opportunities...',
    parallel: false
  },
  {
    id: 'strategy',
    icon: '🎯',
    label: 'Strategy Agent',
    sublabel: 'Building MVP scope & roadmap...',
    parallel: false
  }
];

export default function AnalysisLoader({ currentStage, progress }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const getStageStatus = (stageId) => {
    const stageOrder = ['research_risk', 'market', 'strategy'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const thisIndex = stageOrder.indexOf(stageId);

    if (thisIndex < currentIndex) return 'complete';
    if (thisIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <section className={styles.section} id="loader-section">
      <div className={styles.container}>
        {/* Spinning brain */}
        <div className={styles.brainWrapper}>
          <div className={styles.brainOrb} />
          <span className={styles.brainEmoji}>🧠</span>
        </div>

        <h2 className={styles.title}>
          CortexFlow is thinking{dots}
        </h2>
        <p className={styles.subtitle}>
          Our AI agents are analyzing your idea in parallel
        </p>

        {/* Stage progress */}
        <div className={styles.stages}>
          {STAGES.map((stage, i) => {
            const status = getStageStatus(stage.id);
            return (
              <div
                key={stage.id}
                className={`${styles.stageCard} ${styles[status]}`}
              >
                {/* Status indicator */}
                <div className={styles.statusDot}>
                  {status === 'complete' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {status === 'active' && <span className={styles.pulsingDot} />}
                </div>

                <div className={styles.stageContent}>
                  <div className={styles.stageRow}>
                    <span className={styles.stageIcon}>{stage.icon}</span>
                    <div>
                      <div className={styles.stageLabel}>{stage.label}</div>
                      <div className={styles.stageSublabel}>
                        {status === 'active' ? stage.sublabel : status === 'complete' ? 'Complete' : 'Waiting...'}
                      </div>
                    </div>
                  </div>

                  {stage.parallel && (
                    <div className={`${styles.stageRow} ${styles.parallelRow}`}>
                      <span className={styles.stageIcon}>{stage.secondIcon}</span>
                      <div>
                        <div className={styles.stageLabel}>{stage.secondLabel}</div>
                        <div className={styles.stageSublabel}>
                          {status === 'active' ? stage.secondSublabel : status === 'complete' ? 'Complete' : 'Waiting...'}
                        </div>
                      </div>
                      {stage.parallel && (
                        <span className={styles.parallelBadge}>Parallel</span>
                      )}
                    </div>
                  )}
                </div>

                {status === 'active' && (
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
