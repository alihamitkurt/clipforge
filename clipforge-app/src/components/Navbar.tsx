"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import WalletConnectButton from "./WalletConnectButton";
import { Film, Upload, Trophy, User, LogOut, Sparkles, Zap, Video as VideoIcon } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser } = useStore();

  if (pathname === "/login" || pathname === "/ai-studio") {
    return null;
  }

  const links = [
    { href: "/", label: "Trending", icon: Zap },
    { href: "/explore", label: "Explore", icon: Film },
    { href: "/ai-studio", label: "AI", icon: Sparkles },
    { href: "/upload", label: "Upload", icon: Upload },
    { href: "/leaderboard", label: "Top", icon: Trophy },
  ];

  const navigate = (href: string) => {
    try {
      router.push(href);
    } catch (e) {
      window.location.href = href;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-[100] bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Logo */}
        <div 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
            ClipForge
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <div
                key={href}
                onClick={() => navigate(href)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-white text-black shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:block">{label}</span>
              </div>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-1 mr-1 sm:mr-2 border-r border-white/10 pr-2 sm:pr-3">
              <button 
                onClick={() => navigate("/my-videos")}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white/60 hover:text-primary hover:bg-primary/10 rounded-full transition-all cursor-pointer"
                title="My Videos"
              >
                <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={() => navigate("/profile")}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
                title="Profile"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          <WalletConnectButton />
          
          {currentUser && (
            <button 
              onClick={() => {
                setCurrentUser(null);
                router.push("/login");
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all cursor-pointer border border-transparent hover:border-red-500/20"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
