"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const publicRoutes = ["/", "/login", "/leaderboard", "/video"];
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith("/video/"));

    if (!currentUser && !isPublicRoute) {
      router.push("/login");
    } else if (currentUser && pathname === "/login") {
      router.push("/");
    }
  }, [currentUser, pathname, router, mounted]);

  // Optionally, return a loading state while mounting to prevent flicker
  if (!mounted) return null;

  return <>{children}</>;
}
