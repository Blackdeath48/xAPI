"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Module } from "@/lib/course-data";
import { useProgress } from "@/components/course/ProgressProvider";

export function ModuleCard({ module }: { module: Module }) {
  const { viewedModules, assessments } = useProgress();
  const viewed = Boolean(viewedModules[module.slug]);
  const answered = Boolean(assessments[module.assessment.slug]);

  return (
    <Card className="flex h-full flex-col justify-between">
      <div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{module.title}</CardTitle>
            <Badge className="uppercase tracking-wide">{module.duration}</Badge>
          </div>
          <CardDescription>{module.summary}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {module.topics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </CardContent>
      </div>
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          {viewed ? "Viewed" : "Not started"}
          {answered && <span className="ml-2 text-emerald-600">Assessment answered</span>}
        </div>
        <Button asChild>
          <Link href={`/modules/${module.slug}`} className="inline-flex items-center gap-2">
            View module
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
