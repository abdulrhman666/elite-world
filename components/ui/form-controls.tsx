import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const controlClass =
  "min-h-12 w-full rounded-xl border border-brand-border bg-white px-4 text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-cyan focus:ring-3 focus:ring-brand-cyan/15 disabled:cursor-not-allowed disabled:bg-slate-100";

type FieldProps = { label: string; error?: string };

export function FormInput({
  label,
  error,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  const inputId = id ?? props.name;
  return (
    <label
      htmlFor={inputId}
      className="text-brand-ink block text-sm font-medium"
    >
      <span className="mb-2 block">{label}</span>
      <input
        id={inputId}
        className={cn(controlClass, className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && (
        <span className="mt-1.5 block text-xs text-red-700">{error}</span>
      )}
    </label>
  );
}

export function Textarea({
  label,
  error,
  id,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const inputId = id ?? props.name;
  return (
    <label
      htmlFor={inputId}
      className="text-brand-ink block text-sm font-medium"
    >
      <span className="mb-2 block">{label}</span>
      <textarea
        id={inputId}
        className={cn(controlClass, "min-h-32 py-3", className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && (
        <span className="mt-1.5 block text-xs text-red-700">{error}</span>
      )}
    </label>
  );
}

export function Select({
  label,
  error,
  id,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  const inputId = id ?? props.name;
  return (
    <label
      htmlFor={inputId}
      className="text-brand-ink block text-sm font-medium"
    >
      <span className="mb-2 block">{label}</span>
      <select
        id={inputId}
        className={cn(controlClass, className)}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span className="mt-1.5 block text-xs text-red-700">{error}</span>
      )}
    </label>
  );
}
