"use client";

import { useStore } from "@/store/useStore";
import { Trophy, Heart, Edit3, ArrowUpRight, Medal } from "lucide-react";
import Image from "next/image";

export default function LeaderboardPage() {
  const { edits, registeredUsers, currentUser } = useStore();

  // Calculate stats for all creators
  const creatorStats: Record<string, { totalEdits: number; totalLikes: number; avatar: string }> = {};

  // First, initialize with all registered users just in case they have 0 edits
  registeredUsers.forEach(user => {
    creatorStats[user.username] = {
      totalEdits: 0,
      totalLikes: 0,
      avatar: user.avatar
    };
  });

  // Then process all edits to accumulate stats
  Object.values(edits).forEach((editList) => {
    editList.forEach((edit) => {
      const creatorName = edit.creator;
      if (!creatorStats[creatorName]) {
        // Find if this creator exists in our registered users
        const registeredUser = registeredUsers.find(u => u.username === creatorName);
        creatorStats[creatorName] = {
          totalEdits: 0,
          totalLikes: 0,
          // Use registered user avatar or fallback to a placeholder
          avatar: registeredUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80"
        };
      }
      
      creatorStats[creatorName].totalEdits += 1;
      creatorStats[creatorName].totalLikes += (edit.likes || 0);
    });
  });

  // Convert to array and sort by total likes descending
  const leaderboard = Object.entries(creatorStats)
    .map(([username, stats]) => ({
      username,
      avatar: stats.avatar,
      totalEdits: stats.totalEdits,
      totalLikes: stats.totalLikes,
      earnings: stats.totalLikes * 1.5 // 1.5 XLM per like mock
    }))
    // Optional: filter out users with 0 likes/edits if you want, but showing everyone is fine
    .sort((a, b) => b.totalLikes - a.totalLikes);

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4 border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Creator Leaderboard</h1>
        <p className="text-white/60 max-w-xl text-lg">
          Rankings are based on total likes received across all submitted edits. 
          The top creators earn weekly Stellar (XLM) rewards.
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-6 border-b border-white/10 text-sm font-semibold text-white/50 uppercase tracking-wider hidden md:grid">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5">Creator</div>
          <div className="col-span-2 text-center">Edits</div>
          <div className="col-span-2 text-center">Total Likes</div>
          <div className="col-span-2 text-right">Earnings</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5">
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-white/40">No creators found yet.</div>
          ) : (
            leaderboard.map((creator, index) => {
              const isCurrentUser = currentUser?.username === creator.username;
              const rank = index + 1;
              
              return (
                <div 
                  key={creator.username} 
                  className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-6 items-center transition-colors hover:bg-white/5 ${
                    isCurrentUser ? "bg-primary/10 relative" : ""
                  }`}
                >
                  {isCurrentUser && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                  
                  {/* Rank */}
                  <div className="col-span-1 flex items-center justify-center md:justify-center font-bold text-xl">
                    {rank === 1 ? (
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center border border-yellow-500/30">
                        1
                      </div>
                    ) : rank === 2 ? (
                      <div className="w-10 h-10 rounded-full bg-gray-300/20 text-gray-300 flex items-center justify-center border border-gray-300/30">
                        2
                      </div>
                    ) : rank === 3 ? (
                      <div className="w-10 h-10 rounded-full bg-amber-700/20 text-amber-500 flex items-center justify-center border border-amber-700/30">
                        3
                      </div>
                    ) : (
                      <span className="text-white/40">#{rank}</span>
                    )}
                  </div>

                  {/* Creator */}
                  <div className="col-span-5 flex items-center gap-4">
                    <img 
                      src={creator.avatar} 
                      alt={creator.username}
                      className={`w-12 h-12 rounded-full object-cover border-2 ${
                        rank === 1 ? "border-yellow-500" : "border-white/10"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-lg">{creator.username}</span>
                        {rank === 1 && (
                          <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-sm">
                            <Medal className="w-3 h-3" /> Top Editor
                          </span>
                        )}
                      </div>
                      {isCurrentUser && <span className="text-xs text-primary font-medium">You</span>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="col-span-2 flex items-center md:justify-center gap-2 text-white/80">
                    <Edit3 className="w-4 h-4 text-white/40 md:hidden" />
                    {creator.totalEdits} <span className="md:hidden text-white/40">edits</span>
                  </div>

                  <div className="col-span-2 flex items-center md:justify-center gap-2 font-bold text-white">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500 md:hidden" />
                    {creator.totalLikes} <span className="md:hidden text-white/40 font-normal">likes</span>
                  </div>

                  <div className="col-span-2 flex items-center md:justify-end gap-1 text-green-400 font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    {creator.earnings.toFixed(1)} XLM
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
