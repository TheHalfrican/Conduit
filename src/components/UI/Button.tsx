import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-accent text-hub-bg hover:bg-accent-hover": variant === "primary",
            "bg-hub-surface text-hub-text border border-hub-border hover:bg-hub-border/50":
              variant === "secondary",
            "bg-status-error/10 text-status-error hover:bg-status-error/20":
              variant === "danger",
            "text-hub-text-dim hover:text-hub-text hover:bg-hub-surface":
              variant === "ghost",
          },
          {
            "px-2.5 py-1 text-xs gap-1": size === "sm",
            "px-3.5 py-1.5 text-sm gap-1.5": size === "md",
            "px-5 py-2 text-base gap-2": size === "lg",
          },
        ),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
