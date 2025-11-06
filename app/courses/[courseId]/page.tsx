import CourseExperience from '@/components/CourseExperience';

interface PageProps {
  params: { courseId: string };
}

export default function CoursePage({ params }: PageProps) {
  return (
    <div className="container">
      <CourseExperience courseId={params.courseId} />
    </div>
  );
}
