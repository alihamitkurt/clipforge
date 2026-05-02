"use client";

import { User as UserIcon, Wallet, Trophy, Heart, Edit3, Camera, Play, Eye, LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import * as StellarSdk from "@stellar/stellar-sdk";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, updateUser, walletAddress, likedEdits, edits, videos, walletBalance: globalBalance, setWalletBalance } = useStore();
  
  // Wallet balance state
  const [walletBalance, setLocalWalletBalance] = useState<string | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || currentUser?.username || "");
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");
  const [bio, setBio] = useState(currentUser?.bio || "");

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    updateUser(currentUser.id, {
      displayName,
      avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80",
      bio
    });
    
    setIsEditing(false);
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) {
        setWalletBalance(null);
        return;
      }

      setIsBalanceLoading(true);
      setBalanceError(null);
      try {
        const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
        const account = await server.loadAccount(walletAddress);
        const nativeBalance = account.balances.find(b => b.asset_type === 'native');
        if (nativeBalance) {
          const b = parseFloat(nativeBalance.balance).toFixed(4);
          setLocalWalletBalance(b);
          setWalletBalance(b);
        } else {
          setLocalWalletBalance("0.00");
          setWalletBalance("0.00");
        }
      } catch (err: any) {
        console.error("Failed to fetch balance:", err);
        setBalanceError("Failed to load balance");
      } finally {
        setIsBalanceLoading(false);
      }
    };

    fetchBalance();
  }, [walletAddress]);



  // Calculate real stats
  let uploadedVideosCount = 0;
  let submittedRemixesCount = 0;
  let likesReceivedOnVideos = 0;
  let likesReceivedOnRemixes = 0;
  let totalViewsOnVideos = 0;

  if (currentUser) {
    // Stats from uploaded videos
    const userVideos = videos.filter(v => v.creator === currentUser.username);
    uploadedVideosCount = userVideos.length;
    userVideos.forEach(v => {
      likesReceivedOnVideos += (v.likes || 0);
      totalViewsOnVideos += parseInt(v.views || "0");
    });

    // Stats from remixes
    Object.values(edits).forEach(editList => {
      editList.forEach(edit => {
        if (edit.creator === currentUser.username) {
          submittedRemixesCount++;
          likesReceivedOnRemixes += (edit.likes || 0);
        }
      });
    });
  }

  const totalLikesReceived = likesReceivedOnVideos + likesReceivedOnRemixes;
  const totalEarnings = currentUser.earnings || 0;

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Please log in to view your profile.</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Your Profile</h1>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors"
        >
          {isEditing ? "Cancel Edit" : "Edit Profile"}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Identity Card */}
        <div className="glass-card p-6 md:col-span-1 flex flex-col items-center text-center">
          <div className="relative mb-4 group cursor-pointer">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.username} 
              className="w-32 h-32 rounded-full border-4 border-white/10 object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{currentUser.displayName || currentUser.username}</h2>
          <p className="text-white/40 text-sm mb-3">@{currentUser.username}</p>
          
          {currentUser.bio && (
            <p className="text-white/80 text-sm mb-4 px-2 italic">"{currentUser.bio}"</p>
          )}
          
          <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <Wallet className="w-4 h-4 text-green-400" />
            <span className="text-xs font-mono text-white/80">
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Wallet Not Connected"}
            </span>
          </div>

          <button 
            onClick={() => {
              setCurrentUser(null);
              router.push("/login");
            }}
            className="mt-6 flex items-center justify-center gap-2 w-full py-2 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Stats & Edit Section */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {isEditing ? (
            <div className="glass-card p-6 border border-primary/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                Edit Profile
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Avatar URL</label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Tell us about your editing style..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Save Changes
                </button>
              </form>
            </div>
          ) : (
          <div className="glass-card p-6 bg-gradient-to-br from-black/40 to-primary/5">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Creator Statistics
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
                <span className="text-white/40 text-sm mb-1 flex items-center gap-1.5"><Play className="w-3 h-3" /> Videos</span>
                <span className="text-2xl font-bold text-white">{uploadedVideosCount}</span>
                <span className="text-[10px] text-white/30 uppercase mt-1">{likesReceivedOnVideos} likes received</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
                <span className="text-white/40 text-sm mb-1 flex items-center gap-1.5"><Edit3 className="w-3 h-3" /> Remixes</span>
                <span className="text-2xl font-bold text-white">{submittedRemixesCount}</span>
                <span className="text-[10px] text-white/30 uppercase mt-1">{likesReceivedOnRemixes} likes received</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
                <span className="text-white/40 text-sm mb-1 flex items-center gap-1.5"><Eye className="w-3 h-3" /> Total Views</span>
                <span className="text-2xl font-bold text-white">{totalViewsOnVideos.toLocaleString()}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
                <span className="text-white/40 text-sm mb-1 flex items-center gap-1.5"><Heart className="w-3 h-3" /> Total Likes</span>
                <span className="text-2xl font-bold text-white">{totalLikesReceived}</span>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col col-span-2 sm:col-span-1 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/10 blur-2xl -z-10 group-hover:bg-yellow-500/20 transition-all" />
                <span className="text-white/40 text-sm mb-1 flex items-center gap-1.5"><Wallet className="w-3 h-3" /> Wallet Balance</span>
                {walletAddress ? (
                  isBalanceLoading ? (
                    <div className="flex items-center gap-2 text-white/60">
                      <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-lg">Loading...</span>
                    </div>
                  ) : balanceError ? (
                    <span className="text-sm text-red-400">{balanceError}</span>
                  ) : (
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-yellow-500">{globalBalance}</span>
                      <span className="text-xs text-white/40 mb-1">XLM (Testnet)</span>
                    </div>
                  )
                ) : (
                  <span className="text-xs text-white/40 italic">Connect Freighter to view balance</span>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col col-span-2 sm:col-span-1 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 blur-3xl -z-10 group-hover:bg-primary/20 transition-all" />
                <span className="text-white/40 text-sm mb-1">Estimated Earnings</span>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                    {totalEarnings.toFixed(1)}
                  </span>
                  <span className="text-xs font-medium text-white/60 mb-1">XLM</span>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
