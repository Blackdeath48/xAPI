'use client';

import Link from 'next/link';

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  complianceCode: string;
  estimatedMinutes?: number;
  completion?: number;
}

export default function CourseCard({ course }: { course: CourseSummary }) {
  const progressWidth = course.completion ? `${course.completion}%` : '0%';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <div className="badge">{course.category || 'Ethics & Compliance'}</div>
        <h3 style={{ marginTop: '1rem', fontSize: '1.25rem' }}>{course.title}</h3>
        <p style={{ marginTop: '0.5rem', lineHeight: 1.5 }}>{course.description}</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-secondary)' }}>
          Compliance Ref: {course.complianceCode}
        </p>
        {course.estimatedMinutes && (
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Estimated {course.estimatedMinutes} minutes</p>
        )}
      </div>
      <div>
        <div className="progress-bar">
          <div className="progress-bar-inner" style={{ width: progressWidth }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem' }}>
          <span>Completion</span>
          <span>{course.completion ?? 0}%</span>
        </div>
      </div>
      <Link href={`/courses/${course.id}`} className="btn-primary" style={{ textAlign: 'center' }}>
        View course
      </Link>
    </div>
  );
}
