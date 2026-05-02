export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  creator: string;
  creatorAvatar: string;
  views: string;
  likes: number;
  timestamp: string;
  url?: string;
  creatorId: string;
  rewardXlm?: number;
  paymentStatus?: 'unpaid' | 'paid';
  txHash?: string;
}

export interface EditNode {
  id: string;
  creator: string;
  prompt: string;
  thumbnail: string;
  likes: number;
  parentId?: string;
  timestamp: string;
  title?: string;
  isAI?: boolean;
  musicUrl?: string | null;
  videoUrl?: string;
  description?: string;
  editPlan?: {
    title: string;
    description: string;
    style: string;
    musicSuggestion: string;
    timeline: { timestamp: string; action: string; reason: string }[];
  };
}

export const mockVideos: Video[] = [
  {
    id: "v1",
    title: "Cyberpunk City Walkthrough",
    thumbnail: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80",
    creator: "NeoPixel",
    creatorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80",
    views: "124K",
    likes: 12050,
    timestamp: "2 hours ago"
  },
  {
    id: "v2",
    title: "Abstract Liquid Simulation",
    thumbnail: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80",
    creator: "RenderGod",
    creatorAvatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&q=80",
    views: "89K",
    likes: 8430,
    timestamp: "5 hours ago"
  },
  {
    id: "v3",
    title: "Cosmic Journey - AI Generated",
    thumbnail: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
    creator: "AstroArt",
    creatorAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80",
    views: "210K",
    likes: 45200,
    timestamp: "1 day ago"
  },
  {
    id: "v4",
    title: "Neon Racing - Gameplay Edit",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
    creator: "SpeedRunner",
    creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    views: "45K",
    likes: 3200,
    timestamp: "2 days ago"
  }
];

export const mockEdits: Record<string, EditNode[]> = {
  "v1": [
    {
      id: "e1",
      creator: "SynthWave",
      prompt: "Make it rain neon colors",
      thumbnail: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&q=80",
      likes: 450,
      timestamp: "1 hour ago"
    },
    {
      id: "e2",
      creator: "PixelMaster",
      prompt: "Add flying cars in the background",
      thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
      likes: 890,
      parentId: "e1",
      timestamp: "30 mins ago"
    }
  ]
};

export const leaderboardData = [
  { rank: 1, username: "NeoPixel", score: 15420, avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80", trend: "up" },
  { rank: 2, username: "RenderGod", score: 12100, avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&q=80", trend: "up" },
  { rank: 3, username: "AstroArt", score: 9850, avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80", trend: "down" },
  { rank: 4, username: "SynthWave", score: 8400, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80", trend: "up" },
  { rank: 5, username: "PixelMaster", score: 7200, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80", trend: "down" },
];
