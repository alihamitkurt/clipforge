"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { 
  Sparkles, Play, Pause, Plus, Trash2, Layers, Type, Image as ImageIcon, 
  Video, Music, Settings, Upload as UploadIcon, FileVideo, 
  ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertCircle, 
  MousePointer2, Scissors, Wand2, Eye, EyeOff, Save, Download,
  Maximize2, X, Trash, Timer
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const POPULAR_MEMES = [
  { id: 'm1', name: 'Confused Travolta', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJtZzZycWJ6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/6uGhT1O4sxPi8/giphy.mp4', thumb: 'https://media.giphy.com/media/6uGhT1O4sxPi8/giphy.gif' },
  { id: 'm2', name: 'Pointing Rick', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJtZzZycWJ6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/kd9BlRovbPOykLBMqX/giphy.mp4', thumb: 'https://media.giphy.com/media/kd9BlRovbPOykLBMqX/giphy.gif' },
  { id: 'm3', name: 'Cat Vibing', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJtZzZycWJ6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/GeimqsH0TLDt4tScGw/giphy.mp4', thumb: 'https://media.giphy.com/media/GeimqsH0TLDt4tScGw/giphy.gif' },
  { id: 'm4', name: 'Drake Hotline', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJtZzZycWJ6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l46C6z7vYdR9897q0/giphy.mp4', thumb: 'https://media.giphy.com/media/l46C6z7vYdR9897q0/giphy.gif' },
  { id: 'm5', name: 'Spiderman Point', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJtZzZycWJ6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/VOd5RQ7q8F9g4/giphy.mp4', thumb: 'https://media.giphy.com/media/VOd5RQ7q8F9g4/giphy.gif' },
  { id: 'm6', name: 'Success Kid', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJtZzZycWJ6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/125W9uAsy6T9x6/giphy.mp4', thumb: 'https://media.giphy.com/media/125W9uAsy6T9x6/giphy.gif' },
];

export default function AIStudioPage() {
  const router = useRouter();
  const { 
    videos, walletAddress, currentUser, clips, addClip, updateClip, removeClip, setClips, setToastMessage, 
    registerUser, setCurrentUser, selectedVideoId, setSelectedVideoId, lastUploadedSourceUrl, setLastUploadedSourceUrl
  } = useStore();
  
  // -- State --
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingLayer, setIsUploadingLayer] = useState(false);
  const [showMemeLibrary, setShowMemeLibrary] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [renderResult, setRenderResult] = useState<{ url: string, applied: string[], skipped: string[] } | null>(null);
  
  // -- Refs --
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const layerUploadRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // -- Constants --
  const timelineScale = 60; // 60px per second

  // -- Derived Data --
  const selectedVideo = videos.find(v => v.id === selectedVideoId);
  const videoSrc = useMemo(() => {
    if (newVideoFile) return URL.createObjectURL(newVideoFile);
    if (selectedVideo) return selectedVideo.url;
    return lastUploadedSourceUrl;
  }, [newVideoFile, selectedVideo, lastUploadedSourceUrl]);

  const isImageSource = useMemo(() => {
    if (newVideoFile) return newVideoFile.type.startsWith('image/');
    if (!videoSrc) return false;
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(videoSrc);
  }, [newVideoFile, videoSrc]);

  // -- Effects --
  useEffect(() => {
    return () => {
      if (newVideoFile) {
        URL.revokeObjectURL(videoSrc || "");
      }
    };
  }, [newVideoFile, videoSrc]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && isImageSource) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
           if (prev >= 30) { // Limit image background to 30s
              setIsPlaying(false);
              return 0;
           }
           return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isImageSource]);

  // -- Handlers --
  const handleAddLayer = (type: 'text' | 'meme_overlay' | 'video_segment' | 'audio') => {
    const trackMap = {
      'video_segment': 0,
      'meme_overlay': 1,
      'text': 2,
      'audio': 3
    };

    const newClip: any = {
      id: `clip-${Date.now()}`,
      name: `New ${type.replace('_', ' ')}`,
      type,
      track: trackMap[type],
      start: currentTime,
      duration: 3,
      visible: true,
      x: 50,
      y: 50,
      size: "medium",
      opacity: 100,
      text: type === 'text' ? "Double click to edit" : "",
      fontSize: 48,
      url: "",
    };

    addClip(newClip);
    setSelectedClipId(newClip.id);
  };

  const handleLayerUpload = async (file: File) => {
    setIsUploadingLayer(true);
    setStatusMessage("Studio Engine: Processing local asset...");
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_layer.${fileExt}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('videos')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);
      
      const isAudio = file.type.startsWith('audio/');
      
      const newClip: any = {
        id: `clip-${Date.now()}`,
        name: file.name,
        type: isAudio ? 'audio' : 'video_segment',
        track: isAudio ? 3 : 0,
        start: currentTime,
        duration: isAudio ? 15 : 5, // Longer default for audio
        visible: true,
        x: 50,
        y: 50,
        size: "medium",
        opacity: 100,
        url: publicUrlData.publicUrl,
      };

      addClip(newClip);
      setSelectedClipId(newClip.id);
      
      // Auto-jump to the clip start to ensure it's visible
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
      }
      
      setStatusMessage("Asset added to timeline.");
    } catch (e: any) {
      console.error("Upload Error:", e);
      setToastMessage(`Upload failed: ${e.message}`);
    } finally {
      setIsUploadingLayer(false);
    }
  };

  const handleSourceUpload = async (file: File) => {
    setNewVideoFile(file);
    setSelectedVideoId(""); 
    
    // Upload immediately to ensure persistence survives F5
    setStatusMessage("Studio Engine: Persistent backup in progress...");
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_source.${fileExt}`;
      const { data: uploadData } = await supabase.storage.from('videos').upload(fileName, file);
      const { data: publicUrlData } = supabase.storage.from('videos').getPublicUrl(fileName);
      setLastUploadedSourceUrl(publicUrlData.publicUrl);
      setStatusMessage("Source backed up to cloud.");
    } catch (e) {
      console.warn("Cloud backup failed, using local temporary session.");
    }
  };

  const handleRender = async () => {
    if (!videoSrc) return;
    setIsGenerating(true);
    
    try {
      let finalVideoUrl = videoSrc;

      // 1. If it's a local file, we MUST upload it to Supabase first 
      // because the backend cannot access blob: URLs
      if (newVideoFile) {
        setStatusMessage("Director Engine: Uploading media to pipeline...");
        const fileExt = newVideoFile.name.split('.').pop();
        const fileName = `${Date.now()}_source.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('videos')
          .upload(fileName, newVideoFile);
        
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);
        
        finalVideoUrl = publicUrlData.publicUrl;
      }

      setStatusMessage("Director Engine: Exporting final sequence...");
      
      const response = await fetch("/api/process-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: finalVideoUrl,
          editPlan: {
            timeline: clips.map(c => ({
              start: c.start,           // plain seconds (number)
              end: c.start + c.duration,
              duration: c.duration,
              effect: c.type,
              url: c.url,
              text: c.text,
              position: c.x !== undefined ? "custom" : "center",
              x: c.x,
              y: c.y,
              size: c.size,
              opacity: c.opacity,
              fontSize: (c as any).fontSize,
            }))
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Server timeout or crash" }));
        throw new Error(errorData.error || `Render failed (${response.status})`);
      }
      
      const data = await response.json();
      if (data.url) {
        setRenderResult({
          url: data.url,
          applied: data.appliedActions || [],
          skipped: data.skippedActions || []
        });

        // 2. Register video in Supabase Database for Profile/Leaderboard visibility
        try {
          await supabase
            .from('videos')
            .insert({
              title: `ClipForge_Edit_${Date.now()}`,
              url: data.url,
              user_id: currentUser?.id || "guest",
              thumbnail: videoSrc || data.url,
              views: 0,
              likes: 0
            });
          setToastMessage("Project saved to your library!");
        } catch (dbErr) {
          console.error("DB Save Error:", dbErr);
        }

        setToastMessage("Render complete!");
        setStatusMessage("Sequence exported successfully.");
      } else {
        throw new Error(data.error || "Render failed");
      }
    } catch (e: any) {
      console.error("Render Error:", e);
      setToastMessage(`Error: ${e.message}`);
      setStatusMessage(`Failed: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const activeReplacement = clips.find(c => 
    c.type === 'video_segment' && 
    currentTime >= c.start && 
    currentTime <= (c.start + c.duration)
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-primary/30 overflow-hidden flex flex-col bg-nebula">
      
      {/* 1. Ultra-Modern Header */}
      <header className="sticky top-0 h-16 border-b border-white/5 bg-[#020202] flex items-center justify-between px-8 z-[100]">
        <div className="flex items-center gap-8">
          <div 
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all glow-primary">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-tighter leading-none">ClipForge <span className="text-primary">Studio</span></span>
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">Professional Editor</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {renderResult && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(renderResult.url, '_blank')}
                  className="flex items-center gap-2.5 px-6 py-2.5 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <a 
                  href={renderResult.url} 
                  download={`ClipForge_Edit_${Date.now()}.mp4`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-8 py-3 bg-green-500 text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-[0_0_40px_rgba(34,197,94,0.5)] hover:scale-105 active:scale-95 border-2 border-white/20"
                >
                  <Download className="w-4 h-4 animate-bounce" />
                  Download Video
                </a>
              </div>
            )}
            <button 
              onClick={handleRender}
              disabled={isGenerating || !videoSrc}
              className={cn(
                "flex items-center gap-2.5 px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:scale-105 active:scale-95",
                isGenerating 
                  ? "bg-primary text-white animate-pulse" 
                  : "bg-white text-black hover:bg-primary hover:text-white glow-primary"
              )}
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isGenerating ? "Exporting..." : "Render Edit"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {/* 1.5 Professional Vertical Sidebar */}
        <aside className="w-20 bg-black/40 border-r border-white/5 flex flex-col items-center py-6 gap-6 z-50">
          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => handleAddLayer('text')}>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all group-hover:bg-blue-500/20 group-hover:border-blue-500/50 group-hover:scale-110">
              <Type className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">Text</span>
          </div>

          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => handleAddLayer('meme_overlay')}>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all group-hover:bg-purple-500/20 group-hover:border-purple-500/50 group-hover:scale-110">
              <ImageIcon className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">Image</span>
          </div>

          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setShowMemeLibrary(true)}>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all group-hover:bg-pink-500/20 group-hover:border-pink-500/50 group-hover:scale-110">
              <Video className="w-5 h-5 text-pink-400" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">Meme</span>
          </div>

          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => handleAddLayer('audio')}>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all group-hover:bg-yellow-500/20 group-hover:border-yellow-500/50 group-hover:scale-110">
              <Music className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">Audio</span>
          </div>

          <div className="h-px w-8 bg-white/5" />

          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all group-hover:bg-primary/20 group-hover:border-primary/50 group-hover:scale-110">
              <FileVideo className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors text-center">Swap<br/>Source</span>
            <input type="file" ref={fileInputRef} className="hidden" accept="video/*,image/*" onChange={(e) => { if (e.target.files?.[0]) handleSourceUpload(e.target.files[0]); }} />
          </div>

          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => layerUploadRef.current?.click()}>
            <div className={cn(
              "w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all group-hover:bg-green-500/20 group-hover:border-green-500/50 group-hover:scale-110",
              isUploadingLayer && "animate-pulse bg-green-500/20 border-green-500"
            )}>
              {isUploadingLayer ? <Loader2 className="w-5 h-5 text-green-400 animate-spin" /> : <Plus className="w-5 h-5 text-green-400" />}
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors text-center">Add<br/>Layer</span>
            <input 
              type="file" 
              ref={layerUploadRef} 
              className="hidden" 
              accept="video/*,image/*,audio/*" 
              onChange={(e) => {
                if (e.target.files?.[0]) handleLayerUpload(e.target.files[0]);
              }} 
            />
          </div>

          <div className="mt-auto flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setSelectedClipId(null)}>
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all group-hover:bg-white/10 group-hover:border-white/20 group-hover:scale-110">
              <Settings className="w-5 h-5 text-white/40" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">Global</span>
          </div>
        </aside>

        {/* 2. Professional Preview Stage */}
        <div className="flex-1 bg-black/40 relative flex flex-col p-10 overflow-hidden">
          <div className="flex-1 relative flex items-center justify-center">
            <div 
              ref={canvasContainerRef}
              className="relative aspect-video max-h-full bg-black rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 group ring-1 ring-white/10"
            >
              {videoSrc ? (
                <>
                  {isImageSource ? (
                    <img 
                      src={videoSrc}
                      className={cn(
                        "w-full h-full object-contain transition-opacity duration-500",
                        activeReplacement ? "opacity-0" : "opacity-100"
                      )}
                    />
                  ) : (
                    <video 
                      ref={videoRef}
                      src={videoSrc}
                      preload="metadata"
                      className={cn(
                        "w-full h-full object-contain transition-opacity duration-500",
                        activeReplacement ? "opacity-0" : "opacity-100"
                      )}
                      onTimeUpdate={(e) => {
                        const nt = e.currentTarget.currentTime;
                        if (Math.abs(nt - currentTime) > 0.05) {
                          setCurrentTime(nt);
                        }
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                  )}
                  
                  {activeReplacement && (
                    <div className="absolute inset-0 bg-black z-0">
                      <video 
                        src={activeReplacement.url}
                        className="w-full h-full object-contain"
                        autoPlay
                        muted
                        onLoadedData={(e) => {
                          e.currentTarget.currentTime = currentTime - activeReplacement.start;
                        }}
                      />
                    </div>
                  )}

                  {/* Audio Preview Sync Engine */}
                  <div className="hidden">
                    {clips.filter(c => c.type === 'audio' && c.url).map(audio => (
                      <audio 
                        key={audio.id}
                        src={audio.url}
                        ref={(el) => {
                          if (el) {
                            const isVisible = isPlaying && currentTime >= audio.start && currentTime <= (audio.start + audio.duration);
                            if (isVisible) {
                               const targetTime = currentTime - audio.start;
                               if (Math.abs(el.currentTime - targetTime) > 0.3) {
                                 el.currentTime = targetTime;
                               }
                               el.play().catch(() => {});
                            } else {
                               el.pause();
                            }
                          }
                        }}
                      />
                    ))}
                  </div>

                  {/* Overlays Container */}
                  <div ref={canvasContainerRef} className="absolute inset-0 z-40 pointer-events-none">
                    {clips.filter(c => c.visible && currentTime >= c.start && currentTime <= (c.start + c.duration)).map(clip => (
                      <div 
                        key={clip.id}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                          const rect = canvasContainerRef.current?.getBoundingClientRect();
                          if (!rect) return;
                          const onMove = (me: MouseEvent) => {
                            const x = ((me.clientX - rect.left) / rect.width) * 100;
                            const y = ((me.clientY - rect.top) / rect.height) * 100;
                            updateClip(clip.id, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                          };
                          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                          window.addEventListener('mousemove', onMove);
                          window.addEventListener('mouseup', onUp);
                        }}
                        className={cn(
                          "absolute pointer-events-auto cursor-move select-none",
                          selectedClipId === clip.id && "ring-2 ring-primary ring-offset-2 ring-offset-black rounded-lg"
                        )}
                        style={{ 
                          left: `${clip.x}%`, 
                          top: `${clip.y}%`, 
                          transform: `translate(-50%, -50%)`,
                          opacity: (clip.opacity || 100) / 100,
                          zIndex: clip.track + 10
                        }}
                      >
                        {clip.type === 'text' && (
                          <div 
                            className="px-6 py-3 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 text-white font-black uppercase tracking-tight shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-90 duration-300 flex flex-col items-center justify-center text-center leading-none"
                            style={{ 
                              fontSize: `${clip.fontSize || 48}px`,
                              textShadow: '0 4px 12px rgba(0,0,0,0.8)',
                              letterSpacing: '-0.02em'
                            }}
                          >
                            {clip.text}
                          </div>
                        )}
                        {(clip.type === 'meme_overlay') && clip.url && (
                          <img src={clip.url} className="max-w-[200px] rounded-xl shadow-2xl pointer-events-none" alt="" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Play/Pause Overlay */}
                  {!isPlaying && (
                    <div 
                      className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer z-50 group-hover:bg-black/60 transition-all"
                      onClick={() => {
                        if (isImageSource) setIsPlaying(true);
                        else videoRef.current?.play();
                      }}
                    >
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-2xl scale-90 hover:scale-100 transition-transform">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                  )}
                  {isPlaying && isImageSource && (
                     <div 
                        className="absolute bottom-4 right-4 z-50 p-3 bg-black/60 backdrop-blur-md rounded-full cursor-pointer hover:bg-black/80 transition-all border border-white/10"
                        onClick={() => setIsPlaying(false)}
                     >
                        <Pause className="w-4 h-4 text-white" />
                     </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A] border-2 border-dashed border-white/5 rounded-3xl m-4">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <FileVideo className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-2">No Video Loaded</h3>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-8">Select a video from your library to start editing</p>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl"
                    >
                      Upload New
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { if (e.target.files?.[0]) setNewVideoFile(e.target.files[0]); }} />
                    <div className="flex -space-x-3 overflow-hidden p-2">
                       {videos.slice(0, 3).map(v => (
                         <img 
                           key={v.id} 
                           src={v.thumbnail} 
                           className="w-10 h-10 rounded-full border-2 border-[#0A0A0A] cursor-pointer hover:scale-110 transition-all shadow-lg" 
                           onClick={() => setSelectedVideoId(v.id)}
                         />
                       ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="h-10 mt-4 flex items-center justify-between px-4 bg-white/[0.02] rounded-2xl border border-white/5">
             <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-white/40">{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                <div className="h-3 w-px bg-white/10" />
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{statusMessage || "Studio Idle"}</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-bold text-white/40 uppercase">Engine Online</span>
             </div>
          </div>
        </div>

        {/* 3. Right: Properties Panel */}
        <aside className="w-[340px] bg-[#0A0A0A] border-l border-white/5 flex flex-col p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-4 h-4 text-white/40" />
            <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Inspector</h3>
          </div>

          {selectedClipId ? (
            <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
              {(() => {
                const clip = clips.find(c => c.id === selectedClipId);
                if (!clip) return null;
                return (
                  <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                    
                    {/* Clip Header */}
                    <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                       <div className="p-3 bg-primary/20 rounded-xl text-primary">
                          {clip.type === 'text' && <Type className="w-5 h-5" />}
                          {clip.type === 'meme_overlay' && <ImageIcon className="w-5 h-5" />}
                          {clip.type === 'video_segment' && <Video className="w-5 h-5" />}
                          {clip.type === 'audio' && <Music className="w-5 h-5" />}
                       </div>
                       <div>
                          <div className="text-[10px] font-black text-white/80 uppercase tracking-widest">{clip.type.replace('_', ' ')}</div>
                          <input 
                            type="text" 
                            value={clip.name} 
                            onChange={(e) => updateClip(clip.id, { name: e.target.value })}
                            className="bg-transparent border-none p-0 text-xs font-bold text-white/40 focus:ring-0 w-full"
                          />
                       </div>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Timer className="w-3 h-3" /> Timing
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest">Start Time</span>
                            <input type="number" step="0.1" value={clip.start} onChange={(e) => updateClip(clip.id, { start: parseFloat(e.target.value) || 0 })} className="prop-input" placeholder="0.0" />
                         </div>
                         <div className="space-y-2">
                            <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest">Duration</span>
                            <input type="number" step="0.1" value={clip.duration} onChange={(e) => updateClip(clip.id, { duration: parseFloat(e.target.value) || 0 })} className="prop-input" placeholder="3.0" />
                         </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Maximize2 className="w-3 h-3" /> Transform
                      </label>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest">X Position (%)</span>
                              <input type="number" value={Math.round(clip.x || 0)} onChange={(e) => updateClip(clip.id, { x: parseInt(e.target.value) })} className="prop-input" placeholder="50" />
                          </div>
                          <div className="space-y-2">
                              <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest">Y Position (%)</span>
                              <input type="number" value={Math.round(clip.y || 0)} onChange={(e) => updateClip(clip.id, { y: parseInt(e.target.value) })} className="prop-input" placeholder="50" />
                          </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest">Opacity</span>
                              <span className="text-[10px] font-mono text-primary">{clip.opacity || 100}%</span>
                            </div>
                            <input type="range" min="0" max="100" value={clip.opacity || 100} onChange={(e) => updateClip(clip.id, { opacity: parseInt(e.target.value) })} className="w-full accent-primary h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer" />
                        </div>
                        {clip.type === 'text' && (
                          <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest">Font Size</span>
                                <span className="text-[10px] font-mono text-primary">{clip.fontSize || 48}px</span>
                              </div>
                              <input type="range" min="20" max="200" value={clip.fontSize || 48} onChange={(e) => updateClip(clip.id, { fontSize: parseInt(e.target.value) })} className="w-full accent-primary h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Layers className="w-3 h-3" /> Content
                      </label>
                      <div className="space-y-3">
                        {clip.type === 'text' ? (
                          <textarea 
                            value={clip.text} 
                            onChange={(e) => updateClip(clip.id, { text: e.target.value })} 
                            className="prop-input min-h-[120px] resize-none py-4 leading-relaxed" 
                            placeholder="Type your caption here..." 
                          />
                        ) : (
                          <div className="space-y-2">
                            <span className="text-[8px] text-white/20 uppercase font-bold tracking-widest">Media URL</span>
                            <input 
                              type="text" 
                              value={clip.url} 
                              onChange={(e) => updateClip(clip.id, { url: e.target.value })} 
                              className="prop-input" 
                              placeholder="https://example.com/media.mp4" 
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <button 
                        onClick={() => { removeClip(clip.id); setSelectedClipId(null); }}
                        className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 group"
                      >
                        <Trash className="w-3.5 h-3.5 group-hover:animate-bounce" /> Remove Layer
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
                {/* Diagnostics Panel */}
                {renderResult && (
                  <div className="mb-6 p-5 bg-green-500/5 border border-green-500/10 rounded-2xl space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Export Diagnostics
                    </h3>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                      {renderResult.applied.map((act, i) => (
                        <div key={i} className="text-[9px] text-white/50 flex items-center gap-2 leading-relaxed">
                          <div className="w-1 h-1 rounded-full bg-green-500/40 shrink-0" />
                          {act}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col items-center justify-center text-white/10 text-center">
                  <MousePointer2 className="w-10 h-10 mb-4 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Inspector Idle</p>
                  <p className="text-[8px] font-bold text-white/20 uppercase mt-2">Select a clip to edit properties</p>
                </div>
              </div>
            )}
        </aside>
      </main>

      {/* 4. Bottom: Professional Timeline */}
      <footer className="h-[320px] bg-[#0A0A0A] border-t border-white/5 flex flex-col overflow-hidden">
        <div className="h-10 border-b border-white/5 flex items-center justify-between px-8 bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <Layers className="w-4 h-4 text-white/20" />
            <span className="text-[10px] font-black uppercase tracking-widest">Timeline Editor</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-white/20 uppercase">Playhead:</span>
              <span className="text-[10px] font-mono text-primary">{currentTime.toFixed(2)}s</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative bg-[#050505]">
          <div className="relative" style={{ width: 60 * timelineScale }}>
            
            {/* Timeline Ruler */}
            <div className="h-8 border-b border-white/5 bg-white/[0.02] flex items-end">
               {Array.from({ length: 60 }).map((_, i) => (
                 <div key={i} className="absolute h-full border-l border-white/10 flex flex-col justify-end pb-1 pl-1" style={{ left: i * timelineScale }}>
                    <span className="text-[8px] font-mono text-white/20">{i}s</span>
                 </div>
               ))}
               {/* Playhead Marker */}
               <div className="absolute top-0 bottom-0 w-px bg-primary z-50 pointer-events-none" style={{ left: currentTime * timelineScale }}>
                  <div className="w-3 h-3 bg-primary rounded-full -ml-[5.5px] -mt-1 shadow-[0_0_15px_#8A2BE2]" />
               </div>
            </div>

            {/* Tracks */}
            <div className="flex flex-col">
              {[0, 1, 2, 3].map(trackIndex => (
                <div key={trackIndex} className="h-16 border-b border-white/5 relative flex items-center group/track">
                  <div className="sticky left-0 z-40 h-full w-24 bg-[#0A0A0A] border-r border-white/5 flex items-center px-4">
                     <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                       {trackIndex === 0 ? "Video" : trackIndex === 1 ? "Overlay" : trackIndex === 2 ? "Text" : "Audio"}
                     </span>
                  </div>
                  
                  {clips.filter(c => c.track === trackIndex).map(clip => (
                    <div
                      key={clip.id}
                      onClick={() => setSelectedClipId(clip.id)}
                      onMouseDown={(e) => {
                        const startX = e.clientX;
                        const initialStart = clip.start;
                        const onMove = (me: MouseEvent) => {
                          const delta = (me.clientX - startX) / timelineScale;
                          updateClip(clip.id, { start: Math.max(0, initialStart + delta) });
                        };
                        const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                      }}
                      className={cn(
                        "absolute h-10 rounded-xl border flex items-center px-3 gap-2 cursor-move transition-all overflow-hidden",
                        selectedClipId === clip.id ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(138,43,226,0.3)] z-10" : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                      style={{ 
                        left: 96 + (clip.start * timelineScale), 
                        width: clip.duration * timelineScale,
                        opacity: clip.visible ? 1 : 0.4
                      }}
                    >
                      {clip.type === 'text' && <Type className="w-3 h-3 text-white/40" />}
                      {clip.type === 'meme_overlay' && <ImageIcon className="w-3 h-3 text-white/40" />}
                      {clip.type === 'video_segment' && <Video className="w-3 h-3 text-white/40" />}
                      {clip.type === 'audio' && <Music className="w-3 h-3 text-white/40" />}
                      <span className="text-[9px] font-bold text-white/60 truncate uppercase tracking-tighter">{clip.name}</span>
                      
                      {/* Resize Right Handle */}
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/50" 
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const sx = e.clientX;
                          const idur = clip.duration;
                          const om = (me: MouseEvent) => {
                            const d = (me.clientX - sx) / timelineScale;
                            updateClip(clip.id, { duration: Math.max(0.1, idur + d) });
                          };
                          const ou = () => { window.removeEventListener('mousemove', om); window.removeEventListener('mouseup', ou); };
                          window.addEventListener('mousemove', om);
                          window.addEventListener('mouseup', ou);
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Global CSS for studio elements */}
      <style jsx global>{`
        .studio-toolbar-btn {
          @apply flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 hover:text-white transition-all active:scale-95;
        }
        .prop-input {
          @apply w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-xs text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all appearance-none shadow-inner;
          color-scheme: dark;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(138, 43, 226, 0.3);
        }
        input[type="range"] {
          @apply accent-primary;
        }
      `}</style>

      {/* Meme Library Modal */}
      {showMemeLibrary && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowMemeLibrary(false)} />
           <div className="relative w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col max-h-[80vh]">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-pink-500/20 rounded-2xl">
                       <Video className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                       <h2 className="text-xl font-black uppercase tracking-widest text-white">Meme Library</h2>
                       <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">Instant greenscreen & reaction templates</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowMemeLibrary(false)}
                   className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                 >
                   <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 <div className="grid grid-cols-3 gap-6">
                    {POPULAR_MEMES.map(meme => (
                       <div 
                         key={meme.id}
                         onClick={() => {
                            const newClip: any = {
                              id: `clip-${Date.now()}`,
                              name: meme.name,
                              type: 'video_segment',
                              track: 0,
                              start: currentTime,
                              duration: 5,
                              visible: true,
                              x: 50,
                              y: 50,
                              size: "medium",
                              opacity: 100,
                              url: meme.url,
                            };
                            addClip(newClip);
                            setSelectedClipId(newClip.id);
                            setShowMemeLibrary(false);
                            setStatusMessage(`Added ${meme.name} to timeline`);
                         }}
                         className="group relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 cursor-pointer hover:border-pink-500/50 hover:scale-[1.02] transition-all"
                       >
                          <img src={meme.thumb} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                             <span className="text-[10px] font-black uppercase tracking-widest text-white">{meme.name}</span>
                          </div>
                          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                             <Plus className="w-4 h-4 text-white" />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-center">
                 <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest italic">More templates being added by the Director Engine...</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
