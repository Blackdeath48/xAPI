import { notFound } from "next/navigation";
import { ModuleExperience } from "./ModuleExperience";
import { getModule } from "@/lib/course-data";

export default function ModuleDetailPage({ params }: { params: { slug: string } }) {
  const module = getModule(params.slug);

  if (!module) {
    notFound();
  }

  return <ModuleExperience module={module} />;
}
