"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Film, Check, Trophy } from "lucide-react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

export default function UploadPage() {
  const router = useRouter();
  const { addVideo, walletAddress, currentUser, setToastMessage } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [rewardXlm, setRewardXlm] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create a local object URL for previewing the selected video
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (uploadMode === 'file' && !file) return;
    if (uploadMode === 'link' && !videoUrl) return;

    if (!currentUser) {
      setToastMessage("Please login before uploading.");
      router.push("/login");
      return;
    }

    // Validate rewardXlm
    const rewardValue = parseFloat(rewardXlm);
    if (rewardXlm && (isNaN(rewardValue) || rewardValue < 0)) {
      setToastMessage("Please enter a valid positive reward amount.");
      return;
    }

    setIsSubmitting(true);

    try {
      let publicUrl = "";

      if (uploadMode === 'file' && file) {
        // Create a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from('videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        publicUrl = publicUrlData.publicUrl;
      } else {
        publicUrl = videoUrl;
      }

      const newVideo = {
        id: `v${Date.now()}`,
        title,
        thumbnail: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
        creator: walletAddress ? `${walletAddress.slice(0, 5)}...` : "Anonymous User",
        creatorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80",
        views: "0",
        likes: 0,
        timestamp: "Just now",
        url: publicUrl,
        creatorId: currentUser?.username || "anonymous",
        rewardXlm: parseFloat(rewardXlm) || 0,
        paymentStatus: parseFloat(rewardXlm) > 0 ? 'unpaid' : undefined,
        contestEndTime: parseFloat(rewardXlm) > 0 ? Date.now() + 24 * 60 * 60 * 1000 : undefined
      };

      addVideo(newVideo);
      
      // Set success feedback
      setToastMessage(`Successfully uploaded "${title}"!`);

      // Redirect to home
      router.push("/");
    } catch (error: any) {
      console.error("Full Supabase Upload Error:", error);
      const errorMessage = error?.message || "Failed to upload video. Check your connection or bucket permissions.";
      setToastMessage(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Video</h1>
        <p className="text-white/60">Share your raw clips for the community to edit and remix.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Mode Selector & Area */}
        <div className="glass-card p-1">
          <div className="flex p-1 mb-2 bg-black/20 rounded-lg">
            <button 
              type="button"
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${uploadMode === 'file' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Upload File
            </button>
            <button 
              type="button"
              onClick={() => setUploadMode('link')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${uploadMode === 'link' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Paste Link
            </button>
          </div>

          {uploadMode === 'file' ? (
            <>
              {!file ? (
                <div 
                  className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Select a video to upload</h3>
                  <p className="text-white/40 text-sm mb-6 max-w-md">
                    MP4, WebM or OGG. Maximum file size 500MB.
                  </p>
                  <button 
                    type="button"
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors"
                  >
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black/50 aspect-video flex items-center justify-center">
                  {previewUrl && (
                    <video 
                      src={previewUrl} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="video/*" 
                className="hidden" 
              />
            </>
          ) : (
            <div className="p-6">
              <label htmlFor="videoUrl" className="block text-sm font-medium text-white/80 mb-1.5">
                Video URL <span className="text-red-400">*</span>
              </label>
              <input
                id="videoUrl"
                type="url"
                required={uploadMode === 'link'}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4 or YouTube link"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <p className="text-xs text-white/40 mt-2">
                Paste a direct link to an MP4/WebM file, or a supported platform link.
              </p>
            </div>
          )}
        </div>

        {/* Video Details */}
        <div className="glass-card p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white/80 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Crazy 1v5 Clutch in Valorant"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white/80 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the editors what kind of edits you're looking for..."
              rows={4}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden group mt-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[30px] group-hover:bg-primary/20 transition-all rounded-full pointer-events-none"></div>
            <label htmlFor="reward" className="block text-sm font-bold text-white mb-2 flex items-center gap-2 relative z-10">
              <Trophy className="w-4 h-4 text-primary" />
              Fund a 24-Hour Edit Contest (XLM)
              <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded uppercase font-bold tracking-wider">Testnet</span>
            </label>
            <input
              id="reward"
              type="number"
              min="0"
              step="0.1"
              value={rewardXlm}
              onChange={(e) => setRewardXlm(e.target.value)}
              placeholder="e.g. 50"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all relative z-10"
            />
            <p className="mt-3 text-xs text-primary/80 font-medium relative z-10">
              This amount will be tracked for 24 hours. The editor with the highest likes at the end of the countdown will automatically win the prize pool!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-full text-white/60 hover:text-white hover:bg-white/5 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title || (uploadMode === 'file' ? !file : !videoUrl) || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-full py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(138,43,226,0.3)]"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Film className="w-5 h-5" />
                Forge Video
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
