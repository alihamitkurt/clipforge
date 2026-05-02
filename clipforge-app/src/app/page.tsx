"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Upload, Sparkles, Trophy, Coins, Zap, Play, CheckCircle2, X, Heart, User } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import LeaderboardCard from "@/components/LeaderboardCard";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";

export default function Home() {
  const { videos, edits, registeredUsers, toastMessage, setToastMessage } = useStore();

  // Calculate stats for all creators
  const creatorStats: Record<string, { totalEdits: number; totalLikes: number; avatar: string }> = {};

  registeredUsers.forEach(user => {
    creatorStats[user.username] = {
      totalEdits: 0,
      totalLikes: 0,
      avatar: user.avatar
    };
  });

  Object.values(edits).forEach((editList) => {
    editList.forEach((edit) => {
      const creatorName = edit.creator;
      if (!creatorStats[creatorName]) {
        const registeredUser = registeredUsers.find(u => u.username === creatorName);
        creatorStats[creatorName] = {
          totalEdits: 0,
          totalLikes: 0,
          avatar: registeredUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80"
        };
      }
      creatorStats[creatorName].totalEdits += 1;
      creatorStats[creatorName].totalLikes += (edit.likes || 0);
    });
  });

  const topEditors = Object.entries(creatorStats)
    .map(([username, stats]) => ({
      username,
      avatar: stats.avatar,
      editsCount: stats.totalEdits,
      totalLikes: stats.totalLikes,
      earnings: stats.totalLikes * 1.5
    }))
    .sort((a, b) => b.totalLikes - a.totalLikes)
    .slice(0, 4)
    .map((editor, idx) => ({
      rank: idx + 1,
      username: editor.username,
      avatar: editor.avatar,
      earnings: editor.earnings.toFixed(1),
      editsCount: editor.editsCount
    }));

  // Get global trending edits
  const allTrendingEdits = Object.entries(edits).flatMap(([videoId, editList]) => 
    editList.map(edit => ({ ...edit, videoId }))
  ).sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 8);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, setToastMessage]);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="glass-card bg-green-500/20 border-green-500/50 flex items-center gap-3 px-6 py-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)}
              className="ml-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -z-10" />
        
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-primary mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>The premier Web3 video marketplace</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Forge Viral Edits <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">with AI</span>
          </h1>
          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            Host contests, create viral remixes, and earn XLM rewards.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link 
              href="/upload" 
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black rounded-full font-bold hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <Upload className="w-4 h-4" /> Start a Contest
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Edits Section */}
      <section id="trending" className="pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              Trending Edits
            </h2>
            <Link href="/explore" className="text-sm font-bold text-primary hover:text-white transition-colors flex items-center gap-1">
              Explore All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {allTrendingEdits.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
              <Upload className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No edits yet</h3>
              <p className="text-white/60 mb-6">Be the first to create a viral remix!</p>
              <Link 
                href="/explore" 
                className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                Find a Video to Edit
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allTrendingEdits.map((edit) => (
                <div key={edit.id} className="relative group cursor-pointer rounded-xl overflow-hidden border border-white/10 bg-black/40 hover:bg-black/60 transition-colors shadow-lg hover:shadow-primary/10" onClick={() => router.push(`/video/${edit.videoId}`)}>
                  {/* Cinematic Widescreen Container */}
                  <div className="relative aspect-video bg-black overflow-hidden border-b border-white/5">
                    {(edit.thumbnail.endsWith('.mp4') || edit.thumbnail.endsWith('.webm') || edit.thumbnail.startsWith('http')) ? (
                      <video src={edit.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 pointer-events-none" muted loop onMouseEnter={(e) => e.currentTarget.play().catch(()=>{})} onMouseLeave={(e) => {e.currentTarget.pause(); e.currentTarget.currentTime = 0;}} />
                    ) : (
                      <img src={edit.thumbnail} alt={edit.title || "Edit"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                    )}
                    
                    {/* Top Right Badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1.5 text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                      <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                      {edit.likes}
                    </div>
                    
                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-primary group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(138,43,226,0.6)] transition-all duration-300 scale-90 group-hover:scale-100">
                          <Play className="w-5 h-5 text-white ml-1" />
                       </div>
                    </div>
                  </div>

                  {/* Clean Info Bar */}
                  <div className="p-4 flex flex-col gap-1 relative z-10">
                    <h3 className="font-bold text-white truncate text-base group-hover:text-primary transition-colors">{edit.title || "Untitled Remix"}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-white/50">
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                           <User className="w-3 h-3 text-white/70" />
                        </div>
                        <span className="truncate max-w-[100px]">{edit.creator}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 group-hover:text-primary transition-colors flex items-center gap-1">
                        Watch <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
