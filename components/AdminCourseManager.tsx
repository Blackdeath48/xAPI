'use client';

import { useEffect, useMemo, useState } from 'react';
import { CourseSummary } from './CourseCard';

export interface CourseModule {
  id?: string;
  title: string;
  content: string;
  objective?: string;
  orderIndex?: number;
  estimatedMinutes?: number;
}

export interface CourseDetail extends CourseSummary {
  modules: CourseModule[];
}

const emptyCourse: CourseDetail = {
  id: '',
  title: '',
  description: '',
  category: 'Ethics & Compliance',
  complianceCode: '',
  estimatedMinutes: 30,
  modules: []
};

export default function AdminCourseManager() {
  const [courses, setCourses] = useState<CourseDetail[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail>(emptyCourse);
  const [status, setStatus] = useState<string | null>(null);
  const token = useMemo(() => (typeof window === 'undefined' ? '' : localStorage.getItem('token') || ''), []);

  const fetchCourses = async () => {
    const res = await fetch('/api/admin/courses', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      setCourses(data.courses);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCourses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSelect = (course?: CourseDetail) => {
    if (!course) {
      setSelectedCourse({ ...emptyCourse, id: '' });
      return;
    }
    setSelectedCourse({ ...course, modules: course.modules?.length ? [...course.modules] : [] });
  };

  const updateModule = (index: number, key: keyof CourseModule, value: string | number) => {
    setSelectedCourse((prev) => {
      const modules = [...(prev.modules || [])];
      modules[index] = { ...modules[index], [key]: value };
      return { ...prev, modules };
    });
  };

  const addModule = () => {
    setSelectedCourse((prev) => ({
      ...prev,
      modules: [
        ...(prev.modules || []),
        {
          title: 'New Module',
          content: '',
          objective: '',
          orderIndex: (prev.modules?.length || 0) + 1,
          estimatedMinutes: 10
        }
      ]
    }));
  };

  const removeModule = (index: number) => {
    setSelectedCourse((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index).map((mod, idx) => ({ ...mod, orderIndex: idx + 1 }))
    }));
  };

  const handleChange = (key: keyof CourseDetail, value: string | number) => {
    setSelectedCourse((prev) => ({ ...prev, [key]: value }));
  };

  const submitCourse = async () => {
    setStatus('Saving course...');
    const method = selectedCourse.id ? 'PUT' : 'POST';
    const endpoint = selectedCourse.id
      ? `/api/admin/courses/${selectedCourse.id}`
      : '/api/admin/courses';

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(selectedCourse)
    });

    if (res.ok) {
      setStatus('Course saved successfully.');
      setSelectedCourse(emptyCourse);
      fetchCourses();
    } else {
      const data = await res.json().catch(() => ({ message: 'Failed to save course.' }));
      setStatus(data.message || 'Failed to save course.');
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Delete this course?')) return;
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.ok) {
      setStatus('Course deleted.');
      fetchCourses();
    } else {
      setStatus('Failed to delete course.');
    }
  };

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem' }}>Course Management</h2>
          <p style={{ color: 'rgba(44,44,44,0.7)', marginTop: '0.25rem' }}>
            Create, update and curate ethics & compliance learning tracks.
          </p>
        </div>
        <button className="btn-primary" onClick={() => handleSelect()}>
          New Course
        </button>
      </header>

      {status && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(0,70,255,0.08)' }}>
          {status}
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Course Editor</h3>
          <input
            className="input"
            placeholder="Course title"
            value={selectedCourse.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
          <textarea
            className="input"
            placeholder="Describe the learning outcomes and compliance objectives"
            value={selectedCourse.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
          <input
            className="input"
            placeholder="Category"
            value={selectedCourse.category}
            onChange={(e) => handleChange('category', e.target.value)}
          />
          <input
            className="input"
            placeholder="Compliance Code (e.g., SOX-101)"
            value={selectedCourse.complianceCode}
            onChange={(e) => handleChange('complianceCode', e.target.value)}
          />
          <input
            className="input"
            type="number"
            placeholder="Estimated minutes"
            value={selectedCourse.estimatedMinutes || 0}
            onChange={(e) => handleChange('estimatedMinutes', Number(e.target.value))}
          />

          <div style={{ marginTop: '1.5rem' }}>
            <h4>Modules & Learning Activities</h4>
            <p style={{ fontSize: '0.85rem', color: 'rgba(44,44,44,0.7)' }}>
              Configure interactive lessons, scenarios and assessments.
            </p>
            {(selectedCourse.modules || []).map((module, index) => (
              <div key={index} className="card" style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.7)' }}>
                <input
                  className="input"
                  placeholder="Module title"
                  value={module.title}
                  onChange={(e) => updateModule(index, 'title', e.target.value)}
                />
                <textarea
                  className="input"
                  placeholder="Module content (HTML, Markdown or scenario notes)"
                  value={module.content}
                  onChange={(e) => updateModule(index, 'content', e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Learning objective"
                  value={module.objective || ''}
                  onChange={(e) => updateModule(index, 'objective', e.target.value)}
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    className="input"
                    type="number"
                    placeholder="Order"
                    value={module.orderIndex || index + 1}
                    onChange={(e) => updateModule(index, 'orderIndex', Number(e.target.value))}
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="Estimated minutes"
                    value={module.estimatedMinutes || 10}
                    onChange={(e) => updateModule(index, 'estimatedMinutes', Number(e.target.value))}
                  />
                </div>
                <button className="btn-secondary" onClick={() => removeModule(index)}>
                  Remove module
                </button>
              </div>
            ))}
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={addModule}>
              Add module
            </button>
          </div>

          <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={submitCourse}>
            {selectedCourse.id ? 'Update course' : 'Create course'}
          </button>
        </div>

        <div className="card" style={{ maxHeight: '75vh', overflow: 'auto' }}>
          <h3>Existing Courses</h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(44,44,44,0.7)', marginBottom: '1rem' }}>
            Select a course to edit or remove from the catalog.
          </p>
          <div className="grid" style={{ gap: '1rem' }}>
            {courses.map((course) => (
              <div key={course.id} className="card" style={{ background: 'rgba(0,70,255,0.05)' }}>
                <h4>{course.title}</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{course.description}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button className="btn-primary" onClick={() => handleSelect(course)}>
                    Edit
                  </button>
                  <button className="btn-secondary" onClick={() => deleteCourse(course.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!courses.length && <p>No courses yet. Create the first program.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
