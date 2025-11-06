"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

const variants: Record<string, string> = {
  default: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-400",
  outline: "border border-slate-200 bg-white hover:bg-slate-100 focus-visible:ring-slate-300 text-slate-900"
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  asChild?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, variants[variant] ?? variants.default, className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
