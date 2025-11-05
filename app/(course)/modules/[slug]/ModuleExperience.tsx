"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssessmentPrompt } from "@/components/course/AssessmentPrompt";
import type { Module } from "@/lib/course-data";
import { useProgress } from "@/components/course/ProgressProvider";

export function ModuleExperience({ module }: { module: Module }) {
  const { markModuleViewed } = useProgress();

  useEffect(() => {
    markModuleViewed(module.slug).catch((error) => {
      console.error("Failed to record module view", error);
    });
  }, [markModuleViewed, module.slug]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Button asChild variant="outline" className="w-fit">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to overview
          </Link>
        </Button>
        <Card className="border-slate-200">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              <Badge>{module.duration}</Badge>
            </div>
            <CardTitle className="text-3xl font-semibold">{module.title}</CardTitle>
            <CardDescription>{module.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">What you'll cover</h2>
            <ul className="space-y-2 text-sm text-slate-700">
              {module.topics.map((topic) => (
                <li key={topic} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <AssessmentPrompt module={module} />
    </div>
  );
}
