"use client";

import { useStore } from "@/store/useStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import VideoCard from "@/components/VideoCard";
import { Video, Sparkles, Heart, Play, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MyVideosPage() {
  const { currentUser, videos, edits } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  // Get videos uploaded by the user
  const myUploadedVideos = videos.filter(v => v.creatorId === currentUser.username);

  // Get edits created by the user
  const myEdits = Object.entries(edits).flatMap(([videoId, editList]) => 
    editList
      .filter(edit => edit.creator === currentUser.username || (currentUser.walletAddress && edit.creator.includes(currentUser.walletAddress.slice(0, 5))))
      .map(edit => ({ ...edit, videoId }))
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="mb-12 border-b border-white/10 pb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Video className="w-8 h-8 text-primary" />
            My Library
          </h1>
          <p className="text-white/60 text-lg">Manage your hosted contests and uploaded remixes.</p>
        </div>
      </div>

      <div className="space-y-16">
        {/* Contests I Host */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Contests I Host
            </h2>
            <Link 
              href="/upload" 
              className="text-sm font-bold text-primary hover:text-white transition-colors"
            >
              + Host New Contest
            </Link>
          </div>

          {myUploadedVideos.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
              <Video className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/60 mb-4">You haven't uploaded any raw videos for the community to edit yet.</p>
              <Link 
                href="/upload" 
                className="px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full font-medium hover:bg-primary/30 transition-colors"
              >
                Upload a Video
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {myUploadedVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </section>

        {/* My Remixes */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              My Remixes
            </h2>
            <Link 
              href="/explore" 
              className="text-sm font-bold text-primary hover:text-white transition-colors"
            >
              Find More to Edit
            </Link>
          </div>

          {myEdits.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
              <Sparkles className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/60 mb-4">You haven't submitted any remixes to contests yet.</p>
              <Link 
                href="/explore" 
                className="px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full font-medium hover:bg-primary/30 transition-colors"
              >
                Explore Contests
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {myEdits.map((edit) => (
                <div key={edit.id} className="glass-card overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer border border-white/5 hover:border-primary/50" onClick={() => router.push(`/video/${edit.videoId}`)}>
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {(edit.thumbnail.endsWith('.mp4') || edit.thumbnail.endsWith('.webm') || edit.thumbnail.startsWith('http')) ? (
                      <video src={edit.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none" muted loop onMouseEnter={(e) => e.currentTarget.play().catch(()=>{})} onMouseLeave={(e) => {e.currentTarget.pause(); e.currentTarget.currentTime = 0;}} />
                    ) : (
                      <img src={edit.thumbnail} alt={edit.title || "Edit"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-xs font-bold text-white flex items-center gap-1 border border-white/10">
                      <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> {edit.likes}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-1 truncate group-hover:text-primary transition-colors">{edit.title || "Untitled Remix"}</h3>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-white/50 truncate">{edit.prompt}</span>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-white/40">Contest: <span className="text-white/80 truncate block w-24">#{edit.videoId}</span></span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                          <Play className="w-2.5 h-2.5" /> View
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
