"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function AuthGate() {
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Allow login route without token
    if (pathname === "/login") {
      setReady(true);
      return;
    }
    // Check token and session
    api
      .getMe()
      .then(() => setReady(true))
      .catch(() => {
        setReady(false);
        router.replace("/login");
      });
  }, [pathname, router]);

  if (!ready && pathname !== "/login") return null;
  return null;
}

