"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Film, User, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { registeredUsers, registerUser, setCurrentUser, setToastMessage } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    if (isLogin) {
      // Login flow
      const existingUser = registeredUsers.find(u => u.username === username);
      if (existingUser) {
        if (existingUser.password === password) {
          setCurrentUser(existingUser);
          setToastMessage("Logged in successfully!");
          router.push("/");
        } else {
          setToastMessage("Incorrect password for existing user.");
        }
      } else {
        setToastMessage("User not found. Please register first.");
      }
    } else {
      // Register flow
      const existingUser = registeredUsers.find(u => u.username === username);
      if (existingUser) {
        setToastMessage("Username already exists.");
        return;
      }

      const newUser = {
        id: `u${Date.now()}`,
        publicKey: "",
        username,
        password,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80",
        displayName: username,
        earnings: 0
      };

      registerUser(newUser);
      setToastMessage("Account created successfully! Please sign in.");
      setPassword(""); // clear password for them to type it again in sign in
      setIsLogin(true); // switch to sign in tab
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10" />
      
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(138,43,226,0.5)] mb-6">
            <Film className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to ClipForge</h1>
          <p className="text-white/60 text-center">The premier Web3 video editing marketplace.</p>
        </div>

        <div className="glass-card p-8">
          <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
            <button 
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-4 -mb-[17px] border-b-2 font-medium transition-colors ${isLogin ? "border-primary text-primary" : "border-transparent text-white/50 hover:text-white"}`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-4 -mb-[17px] border-b-2 font-medium transition-colors ${!isLogin ? "border-primary text-primary" : "border-transparent text-white/50 hover:text-white"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-white/40" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-white/40" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-bold hover:from-primary/90 hover:to-purple-600/90 transition-all flex items-center justify-center gap-2 group"
            >
              {isLogin ? "Sign In" : "Create Account"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <p className="mt-6 text-xs text-center text-white/40">
            *This is a local demo mode. Accounts are stored locally.
          </p>
        </div>
      </div>
    </div>
  );
}
