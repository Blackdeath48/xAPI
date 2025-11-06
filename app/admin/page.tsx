'use client';

import { useEffect } from 'react';
import AdminCourseManager from '@/components/AdminCourseManager';
import AdminUserManager from '@/components/AdminUserManager';
import AnalyticsPanel from '@/components/AnalyticsPanel';

export default function AdminPage() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    if (!token || !userRaw) {
      window.location.href = '/login';
      return;
    }
    const user = JSON.parse(userRaw);
    if (user.role !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, []);

  return (
    <div className="container">
      <section className="card">
        <h1>Compliance Program Studio</h1>
        <p style={{ marginTop: '0.5rem', color: 'rgba(44,44,44,0.7)' }}>
          Design ethics courses, curate learner cohorts and export audit-ready completion data.
        </p>
      </section>
      <AdminCourseManager />
      <AdminUserManager />
      <AnalyticsPanel />
    </div>
  );
}
