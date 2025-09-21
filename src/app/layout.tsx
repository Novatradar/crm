"use client";
import "./globals.css";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { AuthGate } from "@/components/auth-gate";
import { Work_Sans } from "next/font/google";
import { Toaster } from "sonner";

const workSans = Work_Sans({ subsets: ["latin"], weight: ["300","400","500","600","700"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  return (
    <html lang="en" className={workSans.className}>
      <body className="min-h-screen bg-gray-50 text-gray-900 text-sm">
        <AuthGate />
        <Toaster richColors position="top-right" />
        {isLogin ? (
          <main className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-white">{children}</main>
        ) : (
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="ml-[var(--sidebar-width)] flex-1">
              <Topbar />
              <main className="p-6">
                <div className="mx-auto max-w-6xl">{children}</div>
              </main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
