import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ProgressProvider } from "@/components/course/ProgressProvider";

export const metadata: Metadata = {
  title: "Ethics & Compliance Academy",
  description: "Interactive training with xAPI tracking"
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
