"use client";

import { modules } from "@/lib/course-data";
import { useProgress } from "@/components/course/ProgressProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CourseHero() {
  const { actor, viewedModules, markCompleted, completed } = useProgress();
  const completedModules = Object.keys(viewedModules).length;
  const totalModules = modules.length;

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Welcome back, {actor.name.split(" ")[0]}!</CardTitle>
        <CardDescription>
          Track your journey through essential ethics and compliance topics. Complete each module to unlock the
          certification.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-slate-500">Course progress</p>
          <p className="text-lg font-semibold text-slate-900">
            {completedModules} of {totalModules} modules viewed
          </p>
        </div>
        <Button onClick={markCompleted} disabled={completedModules < totalModules || completed}>
          {completed ? "Course completed" : "Mark course complete"}
        </Button>
      </CardContent>
    </Card>
  );
}
