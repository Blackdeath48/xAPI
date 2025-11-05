export type Module = {
  slug: string;
  title: string;
  summary: string;
  duration: string;
  topics: string[];
  assessment: {
    slug: string;
    question: string;
    options: Array<{ value: string; label: string; correct?: boolean }>;
    rationale: string;
  };
};

export const modules: Module[] = [
  {
    slug: "code-of-conduct",
    title: "Understanding Our Code of Conduct",
    summary:
      "Explore the guiding principles that keep our organisation compliant and worthy of stakeholder trust.",
    duration: "12 min",
    topics: ["Values & principles", "Reporting misconduct", "Decision frameworks"],
    assessment: {
      slug: "code-of-conduct",
      question: "Which action best aligns with our Code of Conduct?",
      options: [
        { value: "a", label: "Reporting a suspected violation even if proof is limited", correct: true },
        { value: "b", label: "Ignoring conflicts of interest that appear minor" },
        { value: "c", label: "Sharing confidential data with trusted partners without approval" }
      ],
      rationale: "Speaking up promptly allows the compliance team to investigate issues before they escalate."
    }
  },
  {
    slug: "data-privacy",
    title: "Safeguarding Personal Data",
    summary: "Understand privacy obligations and how to handle sensitive information responsibly.",
    duration: "15 min",
    topics: ["Data classification", "Handling requests", "Incident response"],
    assessment: {
      slug: "data-privacy",
      question: "What is the first step after discovering a potential data breach?",
      options: [
        { value: "a", label: "Post about the incident on social media" },
        { value: "b", label: "Notify the privacy team using the incident hotline", correct: true },
        { value: "c", label: "Attempt to quietly fix the issue without escalation" }
      ],
      rationale: "Prompt escalation enables the privacy office to meet regulatory timelines." 
    }
  },
  {
    slug: "anti-bribery",
    title: "Preventing Bribery & Corruption",
    summary: "Learn how to identify risky interactions and apply adequate due diligence.",
    duration: "10 min",
    topics: ["Gifts & hospitality", "Third-party due diligence", "Red flags"],
    assessment: {
      slug: "anti-bribery",
      question: "A vendor offers an expensive gift before a contract renewal. What should you do?",
      options: [
        { value: "a", label: "Accept it to preserve the relationship" },
        { value: "b", label: "Politely decline and document the interaction", correct: true },
        { value: "c", label: "Accept but disclose it after the deal is signed" }
      ],
      rationale: "Declining and documenting keeps interactions transparent and compliant with policy."
    }
  }
];

export function getModule(slug: string) {
  return modules.find((module) => module.slug === slug);
}
