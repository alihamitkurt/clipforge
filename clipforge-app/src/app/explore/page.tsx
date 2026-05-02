"use client";

import { useStore } from "@/store/useStore";
import VideoCard from "@/components/VideoCard";
import { Film, Upload } from "lucide-react";
import Link from "next/link";

export default function ExplorePage() {
  const { videos } = useStore();

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Film className="w-8 h-8 text-primary" />
            Explore Raw Content
          </h1>
          <p className="text-white/60 text-lg">Browse all available videos waiting for your creative touch.</p>
        </div>
        <Link 
          href="/upload" 
          className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-full font-medium hover:bg-white/10 transition-colors flex items-center gap-2 w-fit shrink-0"
        >
          <Upload className="w-4 h-4" />
          Host a Contest
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
          <Upload className="w-16 h-16 text-white/20 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No videos available</h3>
          <p className="text-white/60 mb-6 max-w-md">The platform is currently empty. Be the first to upload a raw clip and start a remix contest!</p>
          <Link 
            href="/upload" 
            className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(138,43,226,0.3)]"
          >
            Upload Video
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
