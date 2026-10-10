"use client";

import { Loader2 } from "lucide-react";
import { forwardRef, ButtonHTMLAttributes, useState } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[--color-accent] text-black hover:bg-[--color-accent-hover] font-medium",
  secondary:
    "bg-[--color-surface-2] text-[--color-text-primary] hover:bg-[--color-surface-3] border border-[--color-border]",
  ghost:
    "bg-transparent text-[--color-text-primary] hover:bg-[--color-surface-1] border border-transparent hover:border-[--color-border]",
  danger:
    "bg-[--color-danger-soft] text-[--color-danger] hover:bg-[--color-danger] hover:text-white border border-[--color-danger]/20",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-[--radius-sm]",
  md: "h-10 px-4 text-sm rounded-[--radius-md]",
  lg: "h-12 px-6 text-base rounded-[--radius-lg]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "secondary", size = "md", loading, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-200",
          "active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent]/40",
          variants[variant],
          sizes[size],
          className
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

function cn(...inputs: any[]) {
  // Minimal clsx replacement
  let classNames: string[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (!input) continue;
    if (typeof input === "string") {
      classNames.push(input);
    } else if (Array.isArray(input)) {
      for (const c of input) {
        if (c && typeof c === "string") {
          classNames.push(c);
        }
      }
    } else if (typeof input === "object") {
      for (const key of Object.keys(input)) {
        if (input[key]) {
          classNames.push(key);
        }
      }
    }
  }
  return classNames.join(" ");
}