import Link from "next/link";
import { ArrowRightCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { modules } from "@/lib/course-data";

export default function AssessmentsOverviewPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">Assessments</h2>
        <p className="text-sm text-slate-600">
          Reinforce your understanding with scenario-based questions aligned to policy expectations.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <Card key={module.assessment.slug} className="border-slate-200">
            <CardHeader>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.assessment.question}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={`/assessments/${module.assessment.slug}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Open assessment
                <ArrowRightCircle className="h-4 w-4" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
