"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-brand-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-3 bg-brand-100 border rounded-xl text-brand-950 placeholder:text-brand-400 transition-all duration-200 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-brand-950/10",
            error
              ? "border-red-500 focus:border-red-500"
              : "border-brand-200 focus:border-brand-950",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {hint && !error && <p className="text-sm text-brand-500">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };