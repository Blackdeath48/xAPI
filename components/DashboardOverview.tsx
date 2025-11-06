'use client';

import { useEffect, useState } from 'react';

interface ProgressItem {
  courseId: string;
  title: string;
  progress: number;
  score: number | null;
  timeSpentMinutes: number;
  status: string;
}

interface DashboardData {
  learnerName: string;
  items: ProgressItem[];
  recentStatements: {
    id: string;
    verb: string;
    object: string;
    timestamp: string;
  }[];
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to view your dashboard.');
      return;
    }
    const res = await fetch('/api/dashboard/summary', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.ok) {
      const response = await res.json();
      setData(response.dashboard);
      setError(null);
    } else {
      setError('Unable to load dashboard.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return <div className="card">{error}</div>;
  }

  if (!data) {
    return <div className="card">Loading progress...</div>;
  }

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <section className="card">
        <h2>Welcome back, {data.learnerName}</h2>
        <p style={{ marginTop: '0.5rem', color: 'rgba(44,44,44,0.7)' }}>
          Track your progress, time on task and completion evidence.
        </p>
      </section>

      <section className="card">
        <h3>Learning Journey</h3>
        <div className="grid" style={{ gap: '1rem' }}>
          {data.items.map((item) => (
            <div key={item.courseId} className="card" style={{ background: 'rgba(0,27,183,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>{item.title}</h4>
                <span className="badge">{item.status}</span>
              </div>
              <div className="progress-bar" style={{ marginTop: '1rem' }}>
                <div className="progress-bar-inner" style={{ width: `${item.progress}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                <span>{item.progress.toFixed(0)}% complete</span>
                <span>Score: {item.score ? `${item.score.toFixed(0)}%` : 'Pending'}</span>
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Time spent: {item.timeSpentMinutes.toFixed(1)} min</p>
            </div>
          ))}
          {!data.items.length && <p>You haven&apos;t started any courses yet.</p>}
        </div>
      </section>

      <section className="card">
        <h3>Recent Activity (xAPI)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Verb</th>
              <th>Object</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {data.recentStatements.map((statement) => (
              <tr key={statement.id}>
                <td>{statement.verb}</td>
                <td>{statement.object}</td>
                <td>{new Date(statement.timestamp).toLocaleString()}</td>
              </tr>
            ))}
            {!data.recentStatements.length && (
              <tr>
                <td colSpan={3}>No xAPI events recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
