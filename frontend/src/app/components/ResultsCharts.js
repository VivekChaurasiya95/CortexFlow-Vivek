'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import styles from './ResultsDisplay.module.css';

const CHART_COLORS = [
  '#facc15',
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f87171',
  '#000000',
  '#0ea5e9'
];

const STAGE_LABELS = {
  research_risk: 'Research + Risk',
  market: 'Market',
  strategy: 'Strategy'
};

function clamp01(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

function toPercent(value) {
  return Math.round(clamp01(value) * 100);
}

function truncateLabel(text, maxLength = 18) {
  if (!text) return 'Source';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function buildRelevanceData(sources) {
  return (sources || [])
    .map(source => ({
      name: truncateLabel(source.title, 18),
      relevance: toPercent(source.relevance)
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 6);
}

function buildTagData(sources) {
  const counts = new Map();
  (sources || []).forEach(source => {
    (source.tags || []).forEach(tag => {
      const key = String(tag);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 6).map(([name, value]) => ({ name, value }));
  const restCount = sorted.slice(6).reduce((sum, [, value]) => sum + value, 0);

  if (restCount > 0) {
    top.push({ name: 'Other', value: restCount });
  }

  return top;
}

function buildStageData(stages) {
  return (stages || [])
    .filter(stage => stage && typeof stage.duration === 'number')
    .map(stage => ({
      name: STAGE_LABELS[stage.name] || stage.name,
      seconds: Math.round(stage.duration) / 1000
    }));
}

export default function ResultsCharts({ results }) {
  const sources = results?.sources || [];
  const stageData = buildStageData(results?.meta?.stages || []);
  const relevanceData = buildRelevanceData(sources);
  const tagData = buildTagData(sources);

  const hasAnyChart = relevanceData.length > 0 || tagData.length > 0 || stageData.length > 0;
  if (!hasAnyChart) return null;

  return (
    <section className={styles.chartsSection} aria-label="Data Visualizations">
      <div className={styles.chartsHeader}>
        <h3 className={styles.chartsTitle}>Data Visualizations</h3>
        <p className={styles.chartsSubtitle}>
          Source relevance, tag distribution, and pipeline timing.
        </p>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <div className={styles.chartTitle}>Source Relevance</div>
            <div className={styles.chartSubtitle}>Top retrieved sources by match score</div>
          </div>
          <div className={styles.chartWrap}>
            {relevanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={relevanceData} margin={{ top: 10, right: 12, left: -8, bottom: 12 }}>
                  <CartesianGrid stroke="#000000" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-10}
                    height={50}
                    tick={{ fontSize: 12, fontFamily: 'Space Grotesk' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fontFamily: 'Space Grotesk' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#e4e4e7' }}
                    contentStyle={{
                      border: '3px solid #000000',
                      borderRadius: '10px',
                      fontFamily: 'Space Grotesk',
                      fontWeight: 700
                    }}
                  />
                  <Bar dataKey="relevance" fill="#facc15" stroke="#000000" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartEmpty}>No source data available.</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <div className={styles.chartTitle}>Tag Distribution</div>
            <div className={styles.chartSubtitle}>Most common tags in retrieved sources</div>
          </div>
          <div className={styles.chartWrap}>
            {tagData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={tagData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={78}
                    innerRadius={40}
                    paddingAngle={2}
                    stroke="#000000"
                    strokeWidth={2}
                  >
                    {tagData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      border: '3px solid #000000',
                      borderRadius: '10px',
                      fontFamily: 'Space Grotesk',
                      fontWeight: 700
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="square"
                    wrapperStyle={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartEmpty}>No tag data available.</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <div className={styles.chartTitle}>Pipeline Timing</div>
            <div className={styles.chartSubtitle}>Stage duration in seconds</div>
          </div>
          <div className={styles.chartWrap}>
            {stageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stageData} margin={{ top: 10, right: 12, left: -6, bottom: 12 }}>
                  <CartesianGrid stroke="#000000" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fontFamily: 'Space Grotesk' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fontFamily: 'Space Grotesk' }}
                  />
                  <Tooltip
                    cursor={{ stroke: '#000000', strokeWidth: 1 }}
                    formatter={(value) => [`${value}s`, 'Duration']}
                    contentStyle={{
                      border: '3px solid #000000',
                      borderRadius: '10px',
                      fontFamily: 'Space Grotesk',
                      fontWeight: 700
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="seconds"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 5, stroke: '#000000', strokeWidth: 2, fill: '#facc15' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.chartEmpty}>No timing data available.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
