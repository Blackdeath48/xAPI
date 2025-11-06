'use client';

import { useEffect, useMemo, useState } from 'react';

type AnalyticsSummary = {
  totalLearners: number;
  averageCompletion: number;
  averageScore: number;
  totalStatements: number;
  complianceExports: {
    csv: string;
    pdf: string;
  } | null;
  leaderboard: {
    userId: string;
    name: string;
    completion: number;
    score: number | null;
  }[];
  courseBreakdown: {
    courseId: string;
    title: string;
    completion: number;
    averageScore: number | null;
    timeSpentMinutes: number;
  }[];
};

export default function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [courseId, setCourseId] = useState<string>('');
  const token = useMemo(() => (typeof window === 'undefined' ? '' : localStorage.getItem('token') || ''), []);

  const fetchAnalytics = async () => {
    const res = await fetch(`/api/admin/analytics${courseId ? `?courseId=${courseId}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      setAnalytics(data.analytics);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <section style={{ marginTop: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>xAPI Analytics & Compliance Reporting</h2>
          <p style={{ color: 'rgba(44,44,44,0.7)', marginTop: '0.25rem' }}>
            Monitor learning impact, time spent and audit-ready completion evidence.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="input"
            placeholder="Filter by Course ID"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          />
          <button className="btn-primary" onClick={fetchAnalytics}>
            Refresh
          </button>
          {analytics?.complianceExports?.csv && (
            <a className="btn-secondary" href={analytics.complianceExports.csv}>
              Download CSV
            </a>
          )}
          {analytics?.complianceExports?.pdf && (
            <a className="btn-secondary" href={analytics.complianceExports.pdf}>
              Download PDF
            </a>
          )}
        </div>
      </div>

      {!analytics ? (
        <div className="card">Loading analytics...</div>
      ) : (
        <div className="grid" style={{ gap: '1.5rem' }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <h4>Total Learners</h4>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.totalLearners}</p>
            </div>
            <div className="card">
              <h4>Average Completion</h4>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.averageCompletion.toFixed(1)}%</p>
            </div>
            <div className="card">
              <h4>Average Score</h4>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.averageScore.toFixed(1)}%</p>
            </div>
            <div className="card">
              <h4>xAPI Statements</h4>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.totalStatements}</p>
            </div>
          </div>

          <div className="card">
            <h3>Leaderboard</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Completion</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {analytics.leaderboard.map((entry) => (
                  <tr key={entry.userId}>
                    <td>{entry.name}</td>
                    <td>{entry.completion.toFixed(0)}%</td>
                    <td>{entry.score ? `${entry.score.toFixed(0)}%` : '—'}</td>
                  </tr>
                ))}
                {!analytics.leaderboard.length && (
                  <tr>
                    <td colSpan={3}>No learner activity yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Course Breakdown</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Avg Completion</th>
                  <th>Avg Score</th>
                  <th>Time Spent (min)</th>
                </tr>
              </thead>
              <tbody>
                {analytics.courseBreakdown.map((course) => (
                  <tr key={course.courseId}>
                    <td>{course.title}</td>
                    <td>{course.completion.toFixed(1)}%</td>
                    <td>{course.averageScore ? `${course.averageScore.toFixed(1)}%` : '—'}</td>
                    <td>{course.timeSpentMinutes.toFixed(1)}</td>
                  </tr>
                ))}
                {!analytics.courseBreakdown.length && (
                  <tr>
                    <td colSpan={4}>No tracked modules for this selection.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
