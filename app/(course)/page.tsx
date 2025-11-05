import { CourseHero } from "@/components/course/CourseHero";
import { ModuleCard } from "@/components/course/ModuleCard";
import { modules } from "@/lib/course-data";

export default function CourseOverviewPage() {
  return (
    <div className="space-y-10">
      <CourseHero />
      <section className="grid gap-6 sm:grid-cols-2">
        {modules.map((module) => (
          <ModuleCard key={module.slug} module={module} />
        ))}
      </section>
    </div>
  );
}
