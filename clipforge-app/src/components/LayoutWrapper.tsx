"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noPaddingRoutes = ["/ai-studio", "/login"];
  const shouldRemovePadding = noPaddingRoutes.includes(pathname);

  return (
    <main className={cn("min-h-screen", !shouldRemovePadding && "pt-16")}>
      {children}
    </main>
  );
}
