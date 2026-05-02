"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { isConnected, requestAccess, getAddress, getNetwork } from "@stellar/freighter-api";
import { Wallet, Loader2, AlertCircle, Copy, LogOut, RefreshCw, ChevronDown, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as StellarSdk from "@stellar/stellar-sdk";

export default function WalletConnectButton({ className }: { className?: string }) {
  const { walletAddress, setWalletAddress, currentUser, updateUser, setToastMessage, setWalletBalance: setGlobalBalance } = useStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [notInstalled, setNotInstalled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [network, setNetwork] = useState<string>("");
  const [balance, setBalance] = useState<string>("0.00");
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchBalance = async (address: string) => {
    try {
      const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
      const account = await server.loadAccount(address);
      const nativeBalance = account.balances.find(b => b.asset_type === 'native');
      if (nativeBalance) {
        const b = parseFloat(nativeBalance.balance).toFixed(4);
        setBalance(b);
        setGlobalBalance(b);
      }
    } catch (err) {
      console.error("Failed to fetch Stellar balance:", err);
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      const connected = await isConnected();
      if (!connected) {
        setNotInstalled(true);
        return;
      }

      try {
        const result = await getAddress();
        const address = typeof result === 'string' ? result : result?.address || result?.publicKey;
        
        if (address && typeof address === 'string') {
          setWalletAddress(address);
          const networkResult = await getNetwork();
          const networkName = typeof networkResult === 'string' ? networkResult : networkResult?.network || "UNKNOWN";
          setNetwork(networkName);
          
          if (networkName === "TESTNET") {
            fetchBalance(address);
          }
          
          if (currentUser && !currentUser.walletAddress) {
            updateUser(currentUser.id, { walletAddress: address, publicKey: address });
          }
        }
      } catch (err) {
        console.error("Failed to check Freighter status:", err);
      }
    };
    checkStatus();
  }, [setWalletAddress, currentUser, updateUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const connectWallet = async () => {
    console.log("Connect Freighter process started");
    
    setIsConnecting(true);
    try {
      const result = await requestAccess();
      const address = typeof result === 'string' ? result : result?.address || result?.publicKey;

      if (address && typeof address === 'string') {
        setWalletAddress(address);
        const networkResult = await getNetwork();
        const networkName = typeof networkResult === 'string' ? networkResult : networkResult?.network || "UNKNOWN";
        setNetwork(networkName);
        
        if (networkName === "TESTNET") {
          fetchBalance(address);
        } else {
          setToastMessage("Warning: Please switch Freighter to TESTNET.");
        }
        
        if (currentUser) {
          updateUser(currentUser.id, { walletAddress: address, publicKey: address });
        }
        setToastMessage("Wallet connected successfully!");
      }
    } catch (error: any) {
      console.error("Error connecting to Freighter:", error);
      setToastMessage(error?.message || "Failed to connect.");
    } finally {
      setIsConnecting(false);
      setIsOpen(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setIsOpen(false);
    setToastMessage("Wallet disconnected.");
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setToastMessage("Address copied to clipboard!");
    }
  };

  const formatAddress = (addr: any) => {
    if (typeof addr !== "string") return "Connected";
    if (addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => walletAddress ? setIsOpen(!isOpen) : connectWallet()}
        disabled={isConnecting}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300",
          walletAddress 
            ? "bg-white/5 hover:bg-white/10 border border-white/10 text-white" 
            : "bg-gradient-to-r from-primary to-purple-600 hover:scale-105 text-white shadow-[0_0_20px_rgba(138,43,226,0.3)]",
          className
        )}
      >
        {isConnecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : notInstalled ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Wallet className="w-4 h-4" />
        )}
        <span>
          {walletAddress ? formatAddress(walletAddress) : notInstalled ? "Get Freighter" : "Connect Freighter"}
        </span>
        {walletAddress && (
          <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isOpen && "rotate-180")} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && walletAddress && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-72 glass-card p-4 shadow-2xl z-[100] border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Connected Wallet</span>
              <div className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                network === "TESTNET" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              )}>
                {network || "PUBLIC"}
              </div>
            </div>

            {network !== "TESTNET" && (
              <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-400 leading-snug">
                  Please switch Freighter to <strong>TESTNET</strong> for ClipForge demo.
                </p>
              </div>
            )}

            <div className="bg-black/40 rounded-lg p-3 mb-4 border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-[10px] text-white/30 mb-1">Stellar Balance</div>
                  <div className="text-lg font-bold text-white">
                    {balance} <span className="text-xs text-white/40">XLM</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/30 mb-1">Network</div>
                  <div className="text-[10px] text-white/60 font-mono">Testnet</div>
                </div>
              </div>
              <div className="h-px bg-white/5 my-2" />
              <div className="text-[10px] text-white/30 mb-1">Stellar Address</div>
              <div className="text-[10px] font-mono text-white/80 break-all leading-relaxed">
                {walletAddress}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                onClick={copyAddress}
                className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white transition-colors border border-white/5"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button 
                onClick={connectWallet}
                className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white transition-colors border border-white/5"
              >
                <RefreshCw className="w-3 h-3" /> Reconnect
              </button>
            </div>

            <button 
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs text-red-400 font-bold transition-colors border border-red-500/20"
            >
              <LogOut className="w-3.5 h-3.5" /> Disconnect Wallet
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
