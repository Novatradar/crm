import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default'|'secondary'|'success'|'warning'|'danger' }) {
  const variants: Record<string,string> = {
    default: "bg-gray-900 text-white",
    secondary: "bg-gray-100 text-gray-900",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  };
  return <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs", variants[variant], className)} {...props} />;
}

