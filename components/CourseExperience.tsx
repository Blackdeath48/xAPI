'use client';

import { useEffect, useState } from 'react';

interface ModuleDto {
  id: string;
  title: string;
  content: string;
  objective?: string;
  orderIndex: number;
  estimatedMinutes: number;
}

interface CourseDto {
  id: string;
  title: string;
  description: string;
  modules: ModuleDto[];
}

export default function CourseExperience({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleDto | null>(null);

  const fetchCourse = async () => {
    const res = await fetch(`/api/courses/${courseId}`);
    if (res.ok) {
      const data = await res.json();
      setCourse(data.course);
      if (data.course.modules.length) {
        setActiveModule(data.course.modules[0]);
      }
    }
  };

  useEffect(() => {
    fetchCourse();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const recordStatement = async (verb: string, module: ModuleDto, extra?: Record<string, unknown>) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('Login required to track progress.');
      return;
    }
    const res = await fetch('/api/xapi/statements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        verb,
        courseId,
        moduleId: module.id,
        moduleTitle: module.title,
        result: extra?.result,
        durationSeconds: extra?.durationSeconds,
        score: extra?.score
      })
    });
    if (res.ok) {
      setStatus(`xAPI statement sent: ${verb}`);
    } else {
      setStatus('Failed to send xAPI statement.');
    }
  };

  if (!course) {
    return <div className="card">Loading course...</div>;
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1.1fr', gap: '2rem' }}>
      <div className="card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <h2>{course.title}</h2>
        <p style={{ marginTop: '0.5rem', color: 'rgba(44,44,44,0.7)' }}>{course.description}</p>
        <h3 style={{ marginTop: '1.5rem' }}>Modules</h3>
        <ul style={{ listStyle: 'none', marginTop: '1rem' }}>
          {course.modules.map((module) => (
            <li key={module.id} className="card" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.8)' }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left'
                }}
                onClick={() => setActiveModule(module)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4>{module.title}</h4>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{module.objective}</p>
                  </div>
                  <span className="badge">{module.estimatedMinutes} min</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ minHeight: '60vh' }}>
        {activeModule ? (
          <div>
            <h2>{activeModule.title}</h2>
            <p style={{ marginTop: '0.5rem', color: 'rgba(44,44,44,0.7)' }}>{activeModule.objective}</p>
            <div style={{ marginTop: '1.5rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: activeModule.content }} />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" onClick={() => recordStatement('experienced', activeModule)}>
                Mark as experienced
              </button>
              <button
                className="btn-secondary"
                onClick={() => recordStatement('completed', activeModule, { result: 'passed', score: 95, durationSeconds: 300 })}
              >
                Mark as completed
              </button>
              <button
                className="btn-secondary"
                onClick={() => recordStatement('answered', activeModule, { result: 'attempted', durationSeconds: 180 })}
              >
                Log assessment attempt
              </button>
            </div>
            {status && <p style={{ marginTop: '1rem', color: 'var(--color-secondary)' }}>{status}</p>}
          </div>
        ) : (
          <p>Select a module to begin.</p>
        )}
      </div>
    </div>
  );
}
