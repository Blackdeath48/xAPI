import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AssessmentPrompt } from "@/components/course/AssessmentPrompt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getModule } from "@/lib/course-data";
import { Button } from "@/components/ui/button";

export default function AssessmentDetailPage({ params }: { params: { slug: string } }) {
  const module = getModule(params.slug);

  if (!module) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" className="w-fit">
        <Link href="/assessments">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to assessments
        </Link>
      </Button>
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>{module.title}</CardTitle>
          <CardDescription>{module.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-slate-700">
            Complete this assessment to validate your understanding of the module. Your response is tracked with xAPI to
            demonstrate compliance readiness.
          </p>
          <AssessmentPrompt module={module} />
        </CardContent>
      </Card>
    </div>
  );
}
