import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Video, mockVideos, EditNode, mockEdits } from '@/lib/mockData';

interface User {
  id: string;
  publicKey: string;
  username: string;
  password?: string;
  avatar: string;
  displayName?: string;
  bio?: string;
  walletAddress?: string;
  earnings?: number;
  walletBalance?: string;
}

export interface Clip {
  id: string;
  type: 'video' | 'meme_overlay' | 'gif_overlay' | 'text' | 'sound_effect' | 'zoom' | 'shake' | 'slow_motion' | 'append_segment';
  name: string;
  track: number;
  start: number; // in seconds
  duration: number; // in seconds
  visible: boolean;
  position?: string;
  size?: string;
  intensity?: string;
  opacity?: number;
  text?: string;
  url?: string;
  x?: number; // percentage 0-100
  y?: number; // percentage 0-100
}

interface StoreState {
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  registeredUsers: User[];
  registerUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  videos: Video[];
  addVideo: (video: Video) => void;
  viewVideo: (videoId: string, userId: string) => void;
  likeVideo: (videoId: string) => void;
  markVideoPaid: (videoId: string, txHash: string) => void;
  edits: Record<string, EditNode[]>;
  addEdit: (videoId: string, edit: EditNode) => void;
  likeEdit: (videoId: string, editId: string) => void;
  likedEdits: string[];
  likedVideos: string[];
  viewedVideos: Record<string, string[]>;
  awardedVideos: string[];
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  walletBalance: string;
  setWalletBalance: (balance: string) => void;
  clips: Clip[];
  setClips: (clips: Clip[]) => void;
  addClip: (clip: Clip) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  removeClip: (clipId: string) => void;
  selectedVideoId: string;
  setSelectedVideoId: (id: string) => void;
  lastUploadedSourceUrl: string;
  setLastUploadedSourceUrl: (url: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      walletAddress: null,
      setWalletAddress: (address) => set({ walletAddress: address }),
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      registeredUsers: [],
      registerUser: (user) => set((state) => ({ 
        registeredUsers: [...state.registeredUsers, user] 
      })),
      updateUser: (userId, updates) => set((state) => {
        const updatedUsers = state.registeredUsers.map(u => 
          u.id === userId ? { ...u, ...updates } : u
        );
        const updatedCurrent = state.currentUser?.id === userId 
          ? { ...state.currentUser, ...updates } 
          : state.currentUser;
        return { registeredUsers: updatedUsers, currentUser: updatedCurrent };
      }),
      videos: [],
      addVideo: (video) => set((state) => ({ videos: [video, ...state.videos] })),
      viewVideo: (videoId, userId) => set((state) => {
        const userViews = state.viewedVideos[userId] || [];
        if (userViews.includes(videoId)) return state;

        const updatedVideos = state.videos.map(v => 
          v.id === videoId ? { ...v, views: (parseInt(v.views) + 1).toString() } : v
        );

        return {
          videos: updatedVideos,
          viewedVideos: {
            ...state.viewedVideos,
            [userId]: [...userViews, videoId]
          }
        };
      }),
      likeVideo: (videoId) => set((state) => {
        const isLiked = state.likedVideos.includes(videoId);
        const updatedVideos = state.videos.map(v => {
          if (v.id === videoId) {
            const currentLikes = v.likes || 0;
            return { ...v, likes: isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1 };
          }
          return v;
        });
        const updatedLikedVideos = isLiked 
          ? state.likedVideos.filter(id => id !== videoId)
          : [...state.likedVideos, videoId];
        
        return {
          videos: updatedVideos,
          likedVideos: updatedLikedVideos
        };
      }),
      markVideoPaid: (videoId, txHash) => set((state) => ({
        videos: state.videos.map(v => 
          v.id === videoId ? { ...v, paymentStatus: 'paid', txHash } : v
        )
      })),
      edits: {},
      addEdit: (videoId, edit) => set((state) => ({
        edits: {
          ...state.edits,
          [videoId]: [edit, ...(state.edits[videoId] || [])]
        }
      })),
      likeEdit: (videoId, editId) => set((state) => {
        const isLiked = state.likedEdits.includes(editId);
        
        const videoEdits = state.edits[videoId] || [];
        const updatedEdits = videoEdits.map((edit) => {
          if (edit.id === editId) {
            const currentLikes = edit.likes || 0;
            const newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
            return { ...edit, likes: newLikes };
          }
          return edit;
        });

        const updatedLikedEdits = isLiked 
          ? state.likedEdits.filter(id => id !== editId)
          : [...state.likedEdits, editId];

        // Reward logic: Determine winner and award if not already awarded
        let awardedVideos = state.awardedVideos;
        let registeredUsers = state.registeredUsers;
        let currentUser = state.currentUser;

        const currentWinner = [...updatedEdits].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
        
        if (currentWinner && (currentWinner.likes || 0) > 0 && !awardedVideos.includes(videoId)) {
          const reward = 5;
          awardedVideos = [...awardedVideos, videoId];
          
          registeredUsers = registeredUsers.map(u => 
            u.username === currentWinner.creator ? { ...u, earnings: (u.earnings || 0) + reward } : u
          );
          
          if (currentUser && currentUser.username === currentWinner.creator) {
            currentUser = { ...currentUser, earnings: (currentUser.earnings || 0) + reward };
          }
        }

        return {
          edits: {
            ...state.edits,
            [videoId]: updatedEdits
          },
          likedEdits: updatedLikedEdits,
          awardedVideos,
          registeredUsers,
          currentUser
        };
      }),
      likedEdits: [],
      likedVideos: [],
      viewedVideos: {},
      awardedVideos: [],
      toastMessage: null,
      setToastMessage: (msg) => set({ toastMessage: msg }),
      walletBalance: "0.00",
      setWalletBalance: (balance) => set({ walletBalance: balance }),
      clips: [],
      setClips: (clips) => set({ clips }),
      addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
      updateClip: (clipId, updates) => set((state) => ({
        clips: state.clips.map(c => c.id === clipId ? { ...c, ...updates } : c)
      })),
      removeClip: (clipId) => set((state) => ({
        clips: state.clips.filter(c => c.id !== clipId)
      })),
      selectedVideoId: "",
      setSelectedVideoId: (id) => set({ selectedVideoId: id }),
      lastUploadedSourceUrl: "",
      setLastUploadedSourceUrl: (url) => set({ lastUploadedSourceUrl: url }),
    }),
    {
      name: 'clipforge-storage',
      // Optionally exclude toastMessage if you don't want toasts showing on reload
      partialize: (state) => ({ 
        videos: state.videos, 
        edits: state.edits, 
        walletAddress: state.walletAddress, 
        currentUser: state.currentUser,
        registeredUsers: state.registeredUsers,
        likedEdits: state.likedEdits,
        likedVideos: state.likedVideos,
        viewedVideos: state.viewedVideos,
        awardedVideos: state.awardedVideos,
        clips: state.clips,
        selectedVideoId: state.selectedVideoId,
        lastUploadedSourceUrl: state.lastUploadedSourceUrl,
      }),
    }
  )
);
