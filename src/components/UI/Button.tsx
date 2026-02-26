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
          "inline-flex items-center justify-center font-medium rounded-none transition-colors focus-visible:outline-1 focus-visible:outline-dotted focus-visible:-outline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-accent text-white shadow-win-button active:shadow-win-button-pressed":
              variant === "primary",
            "bg-win-button-face text-hub-text shadow-win-button active:shadow-win-button-pressed":
              variant === "secondary",
            "bg-win-button-face text-status-error shadow-win-button active:shadow-win-button-pressed":
              variant === "danger",
            "text-hub-text hover:shadow-win-button active:shadow-win-button-pressed":
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
