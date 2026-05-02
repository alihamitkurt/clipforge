import Link from "next/link";
import { Play, Heart, Eye } from "lucide-react";
import { Video } from "@/lib/mockData";

export default function VideoCard({ video }: { video: Video }) {
  return (
    <Link href={`/video/${video.id}`} className="block group">
      <div className="glass-card flex flex-col h-full">
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-xs font-medium text-white">
            {video.timestamp}
          </div>
        </div>
        
        <div className="p-4 flex gap-3">
          <img 
            src={video.creatorAvatar} 
            alt={video.creator} 
            className="w-10 h-10 rounded-full border border-white/10"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate group-hover:text-primary transition-colors">
              {video.title}
            </h3>
            <p className="text-sm text-white/60 truncate">
              {video.creator}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {video.views}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" /> {video.likes}
              </span>
              {video.rewardXlm && video.rewardXlm > 0 ? (
                <span className="text-yellow-500 font-bold ml-auto">{video.rewardXlm} XLM</span>
              ) : (
                <span className="text-white/20 italic ml-auto">No reward</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
