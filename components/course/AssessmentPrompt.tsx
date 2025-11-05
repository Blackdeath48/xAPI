"use client";

import { useMemo, useState } from "react";
import { Check, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useProgress } from "@/components/course/ProgressProvider";
import type { Module } from "@/lib/course-data";
import { Separator } from "@/components/ui/separator";

export function AssessmentPrompt({ module }: { module: Module }) {
  const { assessments, recordAssessment } = useProgress();
  const [selected, setSelected] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const existing = assessments[module.assessment.slug];

  const feedback = useMemo(() => {
    if (!existing) return null;
    return existing.correct
      ? {
          title: "Well done!",
          description: module.assessment.rationale
        }
      : {
          title: "Let's review",
          description: module.assessment.rationale
        };
  }, [existing, module.assessment.rationale]);

  const handleSubmit = async () => {
    if (!selected) return;
    const option = module.assessment.options.find((choice) => choice.value === selected);
    if (!option) return;

    const correct = Boolean(option.correct);
    setSubmitting(true);
    try {
      await recordAssessment(module.assessment.slug, {
        response: selected,
        correct,
        timestamp: new Date().toISOString()
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CircleHelp className="h-5 w-5" />
          Knowledge check
        </CardTitle>
        <CardDescription>{module.assessment.question}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {module.assessment.options.map((option) => {
          const isSelected = existing ? existing.response === option.value : selected === option.value;
          const correct = option.correct;
          return (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300"
            >
              <input
                type="radio"
                name={module.assessment.slug}
                value={option.value}
                disabled={Boolean(existing)}
                checked={isSelected}
                onChange={(event) => setSelected(event.target.value)}
                className="mt-1 h-4 w-4"
              />
              <div className="space-y-1">
                <span className="font-medium text-slate-900">{option.label}</span>
                {existing && isSelected && (
                  <p className="text-sm text-slate-600">
                    {correct ? "You chose the compliant response." : "This choice misses a key policy requirement."}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </CardContent>
      <Separator className="my-4" />
      <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={handleSubmit} disabled={Boolean(existing) || !selected || submitting}>
          Submit answer
        </Button>
        {feedback && (
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
            <div>
              <p className="font-medium">{feedback.title}</p>
              <p>{feedback.description}</p>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
