"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { ArrowLeft, Heart, Eye, Play, Share2, Plus, X, Trophy, Medal, Video as VideoIcon, Wallet as WalletIcon, ExternalLink, Loader2, CheckCircle2, Sparkles, Info, Upload } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Video, EditNode } from "@/lib/mockData";
import * as StellarSdk from "@stellar/stellar-sdk";
import { getNetwork, signTransaction, isConnected } from "@stellar/freighter-api";
import { supabase } from "@/lib/supabase";

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { videos, edits, addEdit, likeEdit, likeVideo, markVideoPaid, viewVideo, walletAddress, currentUser, registeredUsers, likedEdits, likedVideos, awardedVideos, setToastMessage } = useStore();
  const [video, setVideo] = useState<Video | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [paymentDebug, setPaymentDebug] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [activeEditId, setActiveEditId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setEditFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setEditFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  // Timer state
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [contestEnded, setContestEnded] = useState(false);
  const [fastForwarded, setFastForwarded] = useState(false);

  // Modal state removed to prevent unwanted popups

  // Timer logic
  useEffect(() => {
    if (!video || !video.rewardXlm || video.rewardXlm <= 0) return;

    const endTime = fastForwarded ? Date.now() - 1000 : (video.contestEndTime || Date.now() + 24 * 60 * 60 * 1000);

    const updateTimer = () => {
      const now = Date.now();
      const difference = endTime - now;

      if (difference <= 0) {
        setContestEnded(true);
        setTimeLeft("Contest Ended");
      } else {
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const m = Math.floor((difference / 1000 / 60) % 60);
        const s = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [video, fastForwarded]);

  useEffect(() => {
    if (params?.id) {
      const foundVideo = videos.find((v) => v.id === params.id);
      if (foundVideo) {
        setVideo(foundVideo);
        if (currentUser) {
          viewVideo(foundVideo.id, currentUser.id);
        }
      } else {
        // Video not found, redirect to home
        router.push("/");
      }
    }
  }, [params?.id, videos, router, currentUser, viewVideo]);

  const handlePayReward = async () => {
    if (!video || !walletAddress || !currentUser) {
      const error = "Missing video, walletAddress, or currentUser";
      setPaymentDebug(error);
      setToastMessage(error);
      return;
    }
    
    setPaymentDebug("Pay Winner clicked");
    setIsPaying(true);

    try {
      // 1. Validate Freighter
      setPaymentDebug("Checking Freighter Wallet...");
      const freighterAvailable = await isConnected();
      if (!freighterAvailable) {
        throw new Error("Freighter Wallet not found. Please install it.");
      }

      // 2. Validate Winner
      setPaymentDebug("Validating wallets...");
      const videoEdits = edits[video.id] || [];
      const sortedEdits = [...videoEdits].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      const winner = sortedEdits[0];

      if (!winner || (winner.likes || 0) <= 0) {
        throw new Error("No winning edit with likes to reward yet.");
      }

      const winnerUser = registeredUsers.find(u => u.username === winner.creator);
      const destination = winnerUser?.walletAddress || winnerUser?.publicKey;

      if (!destination) {
        throw new Error("Winner must connect wallet first.");
      }

      if (!video.rewardXlm || video.rewardXlm <= 0) {
        throw new Error("Reward amount must be positive.");
      }

      // 3. Load Source
      setPaymentDebug("Loading source account...");
      const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
      const sourceAccount = await server.loadAccount(walletAddress);
      
      // 4. Build Transaction
      setPaymentDebug("Building transaction...");
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: destination,
          asset: StellarSdk.Asset.native(),
          amount: video.rewardXlm.toString(),
        }))
        .setTimeout(180)
        .build();

      // 5. Sign
      setPaymentDebug("Waiting for Freighter signature...");
      const unsignedXdr = transaction.toXDR();
      
      const signedResult: any = await signTransaction(unsignedXdr, { 
        networkPassphrase: StellarSdk.Networks.TESTNET,
        address: walletAddress
      });
      
      const signedXdr = typeof signedResult === 'string' 
        ? signedResult 
        : signedResult?.signedTxXdr || signedResult?.signedXDR || signedResult?.xdr;

      if (!signedXdr) {
        throw new Error("Freighter signature cancelled or failed.");
      }

      // 6. Submit
      setPaymentDebug("Submitting to Horizon...");
      const signedTx = new StellarSdk.Transaction(signedXdr, StellarSdk.Networks.TESTNET);
      const result = await server.submitTransaction(signedTx);
      
      // 7. Success
      setPaymentDebug("Payment success!");
      markVideoPaid(video.id, result.hash);
      setToastMessage("Reward paid successfully on Stellar Testnet!");
      
      // Refresh balance
      const updatedAccount = await server.loadAccount(walletAddress);
      const nativeBalance = updatedAccount.balances.find(b => b.asset_type === 'native');
      if (nativeBalance) setWalletBalance(parseFloat(nativeBalance.balance).toFixed(2));
      
      // Clear debug after 5s
      setTimeout(() => setPaymentDebug(null), 5000);
    } catch (error: any) {
      console.error("Payment Flow Error:", error);
      const errorMsg = error?.response?.data?.extras?.result_codes?.operations?.[0] || error?.message || "Payment failed.";
      setPaymentDebug(`Error: ${errorMsg}`);
      setToastMessage(`Payment Failed: ${errorMsg}`);
    } finally {
      setIsPaying(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!video) return;
    
    setIsGeneratingAI(true);
    setToastMessage(`AI is processing: ${aiPrompt || "Smart Edit"}...`);
    
    // Simulate AI generation time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newAIEdit: EditNode = {
      id: `ai-${Date.now()}`,
      title: aiPrompt ? `AI: ${aiPrompt.split(' ').slice(0, 3).join(' ')}...` : "AI Smart Edit 🤖",
      prompt: aiPrompt || "Auto-generated viral edit with zoom, slow motion, and dynamic color grading.",
      thumbnail: video.url || video.thumbnail,
      creator: "ClipForge AI",
      likes: 0,
      timestamp: "Just now",
      isAI: true,
      musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      description: "AI preview generated with selected style and synced music overlay.",
      editPlan: {
        title: "Dynamic Hype Sequence",
        description: "Focusing on high-energy transitions to maximize retention.",
        style: "Fast-paced, high contrast, vibrant saturation.",
        musicSuggestion: "Phonk / Aggressive Bass",
        timeline: [
          { timestamp: "0:00", action: "Fast Zoom In", reason: "Hook viewer immediately" },
          { timestamp: "0:02", action: "Beat Sync Cut", reason: "Create rhythmic impact" },
          { timestamp: "0:05", action: "Speed Ramp", reason: "Enhance kinetic energy" }
        ]
      }
    };
    
    addEdit(video.id, newAIEdit);
    setIsGeneratingAI(false);
    setShowAIForm(false);
    setAiPrompt("");
    setToastMessage("AI Edit generated successfully!");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video || !editPrompt) return;
    if (uploadMode === 'file' && !editFile) return;
    if (uploadMode === 'link' && !editUrl) return;
    
    setIsSubmitting(true);
    
    try {
      let publicUrl = "";

      if (uploadMode === 'file' && editFile) {
        const fileExt = editFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `remixes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, editFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        publicUrl = publicUrlData.publicUrl;
      } else {
        publicUrl = editUrl;
      }

      const newEdit: EditNode = {
        id: `e${Date.now()}`,
        creator: currentUser?.username || (walletAddress ? `${walletAddress.slice(0, 5)}...` : "Anonymous"),
        title: editTitle || "Untitled Edit",
        prompt: editPrompt,
        thumbnail: publicUrl,
        likes: 0,
        timestamp: "Just now",
        url: publicUrl,
      };
      
      addEdit(video.id, newEdit);
      setToastMessage("Edit submitted successfully!");
      
      // Reset form
      setEditTitle("");
      setEditPrompt("");
      setEditUrl("");
      setEditFile(null);
      setPreviewUrl(null);
      setShowForm(false);
      setIsSubmitting(false);
    } catch (error: any) {
      console.error("Submit Error:", error);
      setToastMessage(error.message || "Failed to submit remix.");
      setIsSubmitting(false);
    }
  };

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {videoError ? (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white/40" />
                  </div>
                  <p className="text-white/60 text-sm">Video file not available after refresh in demo mode.</p>
                </div>
              ) : (() => {
                const activeEdit = activeEditId ? edits[video.id]?.find(e => e.id === activeEditId) : null;
                const mediaSrc = activeEdit ? (activeEdit.url || activeEdit.videoUrl || activeEdit.thumbnail) : video.url;
                const isImage = mediaSrc && (mediaSrc.includes('unsplash.com') || mediaSrc.endsWith('.png') || mediaSrc.endsWith('.jpg') || mediaSrc.endsWith('.jpeg'));

                return isImage ? (
                  <div className="w-full h-full flex flex-col items-center justify-center relative group">
                    <img src={mediaSrc} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      <p className="text-white font-medium text-xs whitespace-nowrap">This is a concept edit without a video file.</p>
                    </div>
                  </div>
                ) : mediaSrc ? (
                  <>
                    <video 
                      ref={videoRef}
                      src={mediaSrc} 
                      controls 
                      autoPlay
                      onPlay={() => audioRef.current?.play()}
                      onPause={() => audioRef.current?.pause()}
                      onSeeking={() => {
                        if (audioRef.current && videoRef.current) {
                          audioRef.current.currentTime = videoRef.current.currentTime;
                        }
                      }}
                      onError={() => setVideoError(true)}
                      className={cn(
                        "w-full h-full object-contain",
                        isGeneratingAI ? "opacity-30" : "opacity-100"
                      )}
                    />
                    {activeEdit && activeEdit.musicUrl && !activeEdit.url && !activeEdit.videoUrl && (
                      <audio 
                        ref={audioRef} 
                        src={activeEdit.musicUrl} 
                        preload="auto" 
                      />
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <p className="text-white/60 text-sm">Media not available.</p>
                  </div>
                );
              })()}
            </div>
            
            <div className="p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{video.title}</h1>
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={video.creatorAvatar} 
                    alt={video.creator} 
                    className="w-12 h-12 rounded-full border-2 border-white/10"
                  />
                  <div>
                    <div className="font-semibold text-white">{video.creator}</div>
                    <div className="text-xs text-white/60">{video.timestamp}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                    <span className="flex items-center gap-2 text-sm text-white/80 font-medium">
                      <Eye className="w-4 h-4 text-primary" /> {video.views}
                    </span>
                    <div className="w-px h-4 bg-white/20" />
                    <button 
                      onClick={() => {
                        if (!currentUser) {
                          setToastMessage("Please login before liking.");
                          return;
                        }
                        likeVideo(video.id);
                      }}
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium transition-colors",
                        likedVideos.includes(video.id) ? "text-pink-500" : "text-white/80 hover:text-pink-400"
                      )}
                    >
                      <Heart className={cn("w-4 h-4", likedVideos.includes(video.id) && "fill-current")} /> {video.likes}
                    </button>
                  </div>
                  
                  {video.rewardXlm && video.rewardXlm > 0 && (
                    <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/40 uppercase tracking-tighter">Reward Amount</span>
                        <span className="text-sm font-bold text-yellow-500">{video.rewardXlm} XLM</span>
                      </div>
                      
                      {video.paymentStatus === 'paid' ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/20 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                          </div>
                          {video.txHash && (
                            <a 
                              href={`https://stellar.expert/explorer/testnet/tx/${video.txHash}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-white/40 hover:text-primary flex items-center gap-1 transition-colors"
                            >
                              View TX <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        currentUser && video.creatorId === currentUser.username && (
                          <button 
                            onClick={handlePayReward}
                            disabled={isPaying}
                            className="flex items-center gap-2 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black rounded-full text-xs font-bold transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                          >
                            {isPaying ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <WalletIcon className="w-3.5 h-3.5" />
                            )}
                            Pay Winner
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {paymentDebug && (
                    <div className="absolute top-full mt-4 left-0 right-0 bg-black/90 border border-primary/30 rounded-xl p-4 z-50 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Payment Debug Status</span>
                        {isPaying && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          paymentDebug.includes("Error") ? "bg-red-500 animate-pulse" : 
                          paymentDebug.includes("success") ? "bg-green-500" : "bg-primary animate-pulse"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          paymentDebug.includes("Error") ? "text-red-400" : "text-white"
                        )}>
                          {paymentDebug}
                        </span>
                      </div>
                    </div>
                  )}

                  <button className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-colors ml-auto">
                    <Share2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Edit Plan Display */}
            {activeEditId && edits[video.id]?.find(e => e.id === activeEditId)?.isAI && edits[video.id]?.find(e => e.id === activeEditId)?.editPlan && (
              <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">AI Director's Master Plan</h3>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Powered by Gemini Pro</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Visual Identity</span>
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                        <p className="text-sm text-white/90 font-medium">{edits[video.id]?.find(e => e.id === activeEditId)?.editPlan?.style}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Acoustic Atmosphere</span>
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                        <p className="text-sm text-white/90 font-medium">{edits[video.id]?.find(e => e.id === activeEditId)?.editPlan?.musicSuggestion}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 bg-black/40 rounded-2xl border border-white/10 relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Director's Vision</span>
                    <p className="text-sm text-white/70 italic leading-relaxed relative z-10">
                      "{edits[video.id]?.find(e => e.id === activeEditId)?.editPlan?.description}"
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Neural Timeline Sequence</span>
                    <div className="h-px flex-1 bg-white/10 mx-4" />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {edits[video.id]?.find(e => e.id === activeEditId)?.editPlan?.timeline.map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/30 transition-all group/item">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-mono text-primary font-bold bg-primary/10 px-2 py-1 rounded-md">{item.timestamp}</span>
                          {idx !== (edits[video.id]?.find(e => e.id === activeEditId)?.editPlan?.timeline.length || 0) - 1 && (
                            <div className="w-px h-full bg-white/10 my-2" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white font-bold mb-1 group-hover/item:text-primary transition-colors">{item.action}</p>
                          <p className="text-xs text-white/50 leading-relaxed">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-white/30">
                    <Info className="w-3 h-3" />
                    Preview Mode: Syncing original video with neural edit plan.
                  </div>
                  <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full border border-blue-500/20">
                    AI AGENT ACTIVE
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Gamified Leaderboard & Rewards Section */}
        <div className="space-y-6">
          {/* Prize Pool Banner */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 blur-[50px] group-hover:bg-yellow-500/30 transition-all"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.5)] mb-2">
                <Trophy className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 tracking-tight uppercase">
                24-Hour Remix Challenge
              </h3>
              
              {video.rewardXlm && video.rewardXlm > 0 ? (
                <>
                  <p className="text-sm text-yellow-500/80 font-medium mb-2">Top edit wins the <span className="text-yellow-400 font-bold">{video.rewardXlm} XLM</span> Prize Pool!</p>
                  
                  <div className="flex flex-col items-center mb-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-yellow-500/30 rounded-xl font-mono font-bold text-yellow-400 text-lg shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                      {contestEnded ? "WINNER SELECTED" : `⏳ ${timeLeft}`}
                    </div>
                    {/* Fast Forward Dev Tool */}
                    {!contestEnded && (
                      <button 
                        onClick={() => setFastForwarded(true)}
                        className="mt-2 text-[10px] text-white/30 hover:text-white/80 transition-colors uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded"
                      >
                        [Dev] Fast Forward Time
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-yellow-500/80 font-medium mb-2">Climb the ranks and show off your editing skills!</p>
              )}
              
              {!contestEnded ? (
                <div className="flex flex-col gap-2 w-full mt-2">
                  <button 
                    onClick={() => router.push('/ai-studio')}
                    className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(138,43,226,0.4)] hover:shadow-[0_0_30px_rgba(138,43,226,0.6)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Create with AI Studio
                  </button>
                  <button 
                    onClick={() => setShowForm(!showForm)}
                    className="w-full py-2.5 bg-black/40 hover:bg-black/60 text-white/80 rounded-xl font-bold uppercase tracking-widest text-xs transition-all border border-white/10 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Finished Remix
                  </button>
                </div>
              ) : (
                <div className="w-full mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center flex flex-col gap-2">
                  <span className="text-yellow-400 font-bold uppercase tracking-widest text-xs">Contest is Closed</span>
                  {video.paymentStatus !== 'paid' && currentUser && video.creatorId === currentUser.username && (
                    <button 
                      onClick={handlePayReward}
                      disabled={isPaying}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                    >
                      {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <WalletIcon className="w-4 h-4" />}
                      Pay Winner {video.rewardXlm} XLM
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upload Remix Form */}
          {showForm && !contestEnded && (
            <div className="glass-card p-5 border-primary/30 animate-in slide-in-from-top-4 fade-in duration-300 relative">
              <button 
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Submit Your Remix
              </h4>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Remix Title"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <textarea
                    required
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="What did you change? (e.g. Added slow mo and phonk music)"
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
                <div className="flex p-1 bg-black/20 rounded-lg">
                  <button 
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${uploadMode === 'file' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                  >
                    Upload File
                  </button>
                  <button 
                    type="button"
                    onClick={() => setUploadMode('link')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${uploadMode === 'link' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                  >
                    Paste Link
                  </button>
                </div>

                {uploadMode === 'file' ? (
                  <div className="border border-white/10 rounded-lg bg-black/40 p-2">
                    {!editFile ? (
                      <div 
                        className="border border-dashed border-white/20 rounded-md py-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        <Upload className="w-6 h-6 text-primary mb-2" />
                        <span className="text-xs text-white/60">Click to select video (MP4/WebM)</span>
                      </div>
                    ) : (
                      <div className="relative rounded-md overflow-hidden bg-black aspect-video flex items-center justify-center">
                        {previewUrl && (
                          <video src={previewUrl} controls className="w-full h-full object-contain" />
                        )}
                        <button
                          type="button"
                          onClick={removeFile}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={editFileInputRef} 
                      onChange={handleFileChange} 
                      accept="video/*" 
                      className="hidden" 
                    />
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      required={uploadMode === 'link'}
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="Video URL (.mp4 link)"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!editTitle || !editPrompt || (uploadMode === 'file' ? !editFile : !editUrl) || isSubmitting}
                  className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit to Leaderboard"}
                </button>
              </form>
            </div>
          )}

          {/* Top 10 Leaderboard */}
          <div className="glass-card p-6 border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Medal className="w-5 h-5 text-primary" />
                Top 10 Remixes
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Ranked by Likes</span>
            </div>

            <div className="space-y-3">
              {(!edits[video.id] || edits[video.id].length === 0) ? (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <VideoIcon className="w-5 h-5 text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm font-medium">No remixes yet.</p>
                  <p className="text-white/30 text-xs mt-1">Be the first to claim the #1 spot!</p>
                </div>
              ) : (
                [...edits[video.id]].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 10).map((edit, index) => {
                  const isFirst = index === 0 && (edit.likes || 0) > 0;
                  const isSecond = index === 1 && (edit.likes || 0) > 0;
                  const isThird = index === 2 && (edit.likes || 0) > 0;
                  
                  return (
                    <div 
                      key={edit.id} 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveEditId(edit.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={cn(
                        "flex gap-3 p-3 rounded-xl border transition-all group cursor-pointer relative overflow-hidden items-center",
                        isFirst ? "bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]" :
                        isSecond ? "bg-slate-300/10 border-slate-300/30" :
                        isThird ? "bg-amber-700/10 border-amber-700/30" :
                        "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10",
                        activeEditId === edit.id && !isFirst && "border-primary bg-primary/10"
                      )}
                    >
                      {/* Rank Number */}
                      <div className="flex items-center justify-center w-6 h-6 shrink-0">
                        {isFirst ? <Trophy className="w-5 h-5 text-yellow-400" /> :
                         isSecond ? <Medal className="w-5 h-5 text-slate-300" /> :
                         isThird ? <Medal className="w-5 h-5 text-amber-600" /> :
                         <span className="text-xs font-bold text-white/40">#{index + 1}</span>
                        }
                      </div>

                      {/* Thumbnail */}
                      <div className={cn(
                        "w-12 h-12 rounded-lg overflow-hidden bg-black shrink-0 relative border",
                        isFirst ? "border-yellow-500/50" : "border-white/10"
                      )}>
                        {edit.thumbnail.endsWith('.mp4') || edit.thumbnail.endsWith('.webm') || edit.thumbnail.startsWith('http') ? (
                           <video src={edit.thumbnail} className="w-full h-full object-cover pointer-events-none" muted autoPlay loop />
                        ) : (
                           <img src={edit.thumbnail} alt={edit.title} className="w-full h-full object-cover pointer-events-none" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={cn(
                            "font-bold text-sm truncate",
                            isFirst ? "text-yellow-400" : "text-white"
                          )}>
                            {edit.title || "Untitled Edit"}
                          </h4>
                          {isFirst && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-yellow-500 text-black">
                              Winning
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/50 truncate">by {edit.creator}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!walletAddress && !currentUser) {
                                setToastMessage("Please connect to vote.");
                                return;
                              }
                              likeEdit(video.id, edit.id);
                            }}
                            className={cn(
                              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors z-10 relative",
                              likedEdits.includes(edit.id) ? "text-pink-500 bg-pink-500/10" : "text-white/60 hover:text-pink-400 hover:bg-white/5"
                            )}
                          >
                            <Heart className={cn("w-3 h-3", likedEdits.includes(edit.id) && "fill-current")} />
                            {edit.likes || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
