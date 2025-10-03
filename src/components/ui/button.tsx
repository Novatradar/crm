import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 py-4 cursor-pointer";
    const variants: Record<string, string> = {
      default: "bg-indigo-600 text-white hover:bg-indigo-700",
      secondary: "bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50",
      destructive: "bg-rose-600 text-white hover:bg-rose-700",
      ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
      outline: "bg-transparent border border-gray-300 text-gray-900 hover:bg-gray-50",
    };
    const sizes: Record<string, string> = {
      sm: "px-3",
      md: "px-4",
      lg: "px-6",
    };
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
    );
  }
);
Button.displayName = "Button";
