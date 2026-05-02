import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  rank?: number;
  username?: string;
  score?: number;
  avatar?: string;
  trend?: string;
  totalLikes?: number;
  likes?: number;
  editsCount?: number;
  earnings?: string | number;
}

export default function LeaderboardCard({ user }: { user: LeaderboardUser }) {
  const rank = user.rank ?? 0;
  const isTop3 = rank > 0 && rank <= 3;
  const score = user.score ?? user.totalLikes ?? user.likes ?? 0;
  const username = user.username ?? "Anonymous";
  const avatar = user.avatar ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80";
  const trend = user.trend ?? "up";
  
  return (
    <div className={cn(
      "glass-card p-4 flex items-center gap-4 transition-all hover:bg-white/5",
      rank === 1 && "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]",
      rank === 2 && "border-slate-300/50",
      rank === 3 && "border-amber-700/50"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
        rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
        rank === 2 ? "bg-slate-300/20 text-slate-300" :
        rank === 3 ? "bg-amber-700/20 text-amber-500" :
        "bg-white/5 text-white/40"
      )}>
        {isTop3 ? <Trophy className="w-4 h-4" /> : rank}
      </div>
      
      <img 
        src={avatar} 
        alt={username} 
        className="w-12 h-12 rounded-full border border-white/10"
      />
      
      <div className="flex-1">
        <h3 className="font-semibold text-white">{username}</h3>
        <p className="text-sm text-white/60">Level {Math.floor(score / 1000) || 1} Editor</p>
      </div>
      
      <div className="text-right flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="font-mono text-primary font-bold">{score.toLocaleString()}</span>
          <span className="text-xs text-white/40 uppercase tracking-wider">Points</span>
        </div>
        {trend === "up" ? (
          <TrendingUp className="w-5 h-5 text-green-400" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-400" />
        )}
      </div>
    </div>
  );
}
