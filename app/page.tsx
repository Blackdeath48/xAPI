import CourseCard, { CourseSummary } from '@/components/CourseCard';
import Link from 'next/link';

async function getCourses(): Promise<CourseSummary[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/courses`, {
      next: { revalidate: 0 }
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.courses;
  } catch (error) {
    console.error('Failed to fetch courses', error);
    return [];
  }
}

export default async function HomePage() {
  const courses = await getCourses();

  return (
    <div className="container">
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(0,70,255,0.9), rgba(0,27,183,0.9))', color: '#fff' }}>
          <div className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>Corporate Training</div>
          <h1 style={{ fontSize: '2.5rem', marginTop: '1rem' }}>Ethics & Compliance Learning</h1>
          <p style={{ marginTop: '1rem', lineHeight: 1.6 }}>
            Deliver immersive, xAPI-compliant training experiences with real-time visibility into completion,
            assessment outcomes and compliance readiness.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <Link className="btn-secondary" href="/register">
              Start learning
            </Link>
            <Link className="btn-primary" href="/admin">
              Manage programs
            </Link>
          </div>
        </div>
        <div className="card">
          <h2>Why organisations choose EthosLearn</h2>
          <ul style={{ marginTop: '1rem', lineHeight: 1.6, paddingLeft: '1rem' }}>
            <li>Full xAPI statement tracking for every learning activity</li>
            <li>Real-time dashboards with completion and scoring insights</li>
            <li>Compliance-grade evidence with CSV/PDF export</li>
            <li>Flexible admin tools to design modern training pathways</li>
            <li>Secure Neon serverless Postgres storage for learning records</li>
          </ul>
        </div>
      </section>

      <section style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Available Programs</h2>
          <Link href="/login" className="btn-primary">
            Launch dashboard
          </Link>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {!courses.length && <p>No courses yet. Admins can create the first compliance journey.</p>}
        </div>
      </section>
    </div>
  );
}
