import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpenCheck, GraduationCap } from "lucide-react";

export default function CourseLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-slate-900">
          <div className="rounded-full bg-slate-900/90 p-3 text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">Ethics & Compliance Academy</p>
            <h1 className="text-2xl font-semibold">Responsible Business Foundations</h1>
          </div>
        </div>
        <nav className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <Link href="/" className="rounded-full px-4 py-2 hover:bg-slate-100">
            Overview
          </Link>
          <Link href="/modules/code-of-conduct" className="rounded-full px-4 py-2 hover:bg-slate-100">
            Modules
          </Link>
          <Link href="/assessments" className="rounded-full px-4 py-2 hover:bg-slate-100">
            Assessments
          </Link>
        </nav>
      </header>
      <main className="flex-1 space-y-10">{children}</main>
      <footer className="flex items-center justify-between border-t border-slate-200 pt-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4" />
          <span>Keep learning ethically</span>
        </div>
        <p>© {new Date().getFullYear()} Compliance Studio</p>
      </footer>
    </div>
  );
}
