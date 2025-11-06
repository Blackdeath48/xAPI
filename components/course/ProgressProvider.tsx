"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { xapiClient } from "@/lib/xapi/client";

export type Actor = {
  name: string;
  mbox: string;
};

type AssessmentRecord = {
  response: string;
  correct: boolean;
  timestamp: string;
};

type ProgressState = {
  actor: Actor;
  viewedModules: Record<string, string>;
  assessments: Record<string, AssessmentRecord>;
  completed: boolean;
};

type ProgressAction =
  | { type: "set-actor"; actor: Actor }
  | { type: "view-module"; slug: string; timestamp: string }
  | {
      type: "answer-assessment";
      slug: string;
      record: AssessmentRecord;
    }
  | { type: "complete"; timestamp: string };

const STORAGE_KEY = "xapi-course-progress";

const defaultActor: Actor = {
  name: "Learner One",
  mbox: "mailto:learner.one@example.com"
};

const defaultState: ProgressState = {
  actor: defaultActor,
  viewedModules: {},
  assessments: {},
  completed: false
};

function reducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case "set-actor":
      return { ...state, actor: action.actor };
    case "view-module":
      if (state.viewedModules[action.slug]) {
        return state;
      }
      return {
        ...state,
        viewedModules: {
          ...state.viewedModules,
          [action.slug]: action.timestamp
        }
      };
    case "answer-assessment":
      return {
        ...state,
        assessments: {
          ...state.assessments,
          [action.slug]: action.record
        }
      };
    case "complete":
      return { ...state, completed: true };
    default:
      return state;
  }
}

type ProgressContextValue = ProgressState & {
  setActor: (actor: Actor) => Promise<void>;
  markModuleViewed: (slug: string) => Promise<void>;
  recordAssessment: (slug: string, record: AssessmentRecord) => Promise<void>;
  markCompleted: () => Promise<void>;
};

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: ProgressState = JSON.parse(stored);
        dispatch({ type: "set-actor", actor: parsed.actor });
        Object.entries(parsed.viewedModules).forEach(([slug, timestamp]) => {
          dispatch({ type: "view-module", slug, timestamp });
        });
        Object.entries(parsed.assessments).forEach(([slug, record]) => {
          dispatch({ type: "answer-assessment", slug, record });
        });
        if (parsed.completed) {
          dispatch({ type: "complete", timestamp: new Date().toISOString() });
        }
      } catch (error) {
        console.error("Failed to parse stored progress", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const serialisable: ProgressState = {
      actor: state.actor,
      viewedModules: state.viewedModules,
      assessments: state.assessments,
      completed: state.completed
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable));
  }, [state.actor, state.assessments, state.completed, state.viewedModules]);

  const setActor = useCallback(async (actor: Actor) => {
    dispatch({ type: "set-actor", actor });
  }, []);

  const markModuleViewed = useCallback(
    async (slug: string) => {
      if (state.viewedModules[slug]) {
        return;
      }
      const timestamp = new Date().toISOString();
      dispatch({ type: "view-module", slug, timestamp });
      await xapiClient.recordStatement({
        actor: state.actor,
        verb: {
          id: "http://adlnet.gov/expapi/verbs/viewed",
          display: { "en-US": "viewed" }
        },
        object: {
          id: `https://example.com/modules/${slug}`,
          definition: {
            name: { "en-US": `Module ${slug}` }
          }
        },
        timestamp
      });
    },
    [state.actor, state.viewedModules]
  );

  const recordAssessment = useCallback(
    async (slug: string, record: AssessmentRecord) => {
      const existing = state.assessments[slug];
      if (existing && existing.response === record.response) {
        return;
      }
      dispatch({ type: "answer-assessment", slug, record });
      await xapiClient.recordStatement({
        actor: state.actor,
        verb: {
          id: "http://adlnet.gov/expapi/verbs/answered",
          display: { "en-US": "answered" }
        },
        object: {
          id: `https://example.com/assessments/${slug}`,
          definition: {
            name: { "en-US": `Assessment ${slug}` }
          }
        },
        result: {
          response: record.response,
          success: record.correct,
          completion: true
        },
        timestamp: record.timestamp
      });
    },
    [state.actor, state.assessments]
  );

  const markCompleted = useCallback(async () => {
    if (state.completed) {
      return;
    }
    const timestamp = new Date().toISOString();
    dispatch({ type: "complete", timestamp });
    await xapiClient.recordStatement({
      actor: state.actor,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/completed",
        display: { "en-US": "completed" }
      },
      object: {
        id: "https://example.com/courses/ethics-compliance",
        definition: {
          name: { "en-US": "Ethics & Compliance Foundations" }
        }
      },
      timestamp
    });
  }, [state.actor, state.completed]);

  const value = useMemo(
    () => ({
      ...state,
      setActor,
      markModuleViewed,
      recordAssessment,
      markCompleted
    }),
    [markCompleted, markModuleViewed, recordAssessment, setActor, state]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}
