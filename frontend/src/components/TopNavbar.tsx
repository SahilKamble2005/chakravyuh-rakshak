import React, { useState, useEffect } from 'react';
import { useAudioAlert } from '../hooks/useAudioAlert';
import { cycloneApi } from '../services/api';
import { SystemStatusData } from '../types';

interface TopNavbarProps {
  onMenuClick?: () => void;
}

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const [currentTimeUTC, setCurrentTimeUTC] = useState<string>('');
  const [currentTimeLocal, setCurrentTimeLocal] = useState<string>('');
  const [statusData, setStatusData] = useState<SystemStatusData | null>(null);
  const { isMuted, toggleMute, isPlaying, requestAudioPermission } = useAudioAlert();

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setCurrentTimeUTC(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
      setCurrentTimeLocal(now.toLocaleTimeString());
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await cycloneApi.getSystemStatus();
        setStatusData(data);
      } catch (e) {
        console.warn('System status fetch failed:', e);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b border-[#C9DCE8] bg-[#EAF2F8] text-[#2C3E4A] px-4 flex items-center justify-between shrink-0 z-30 select-none shadow-soft font-sans">
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-mono">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5FBF8F] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5FBF8F]"></span>
          </span>
          <span className="text-xs font-bold tracking-wider text-[#5FBF8F] uppercase">SYSTEM ONLINE</span>
        </div>

        {/* DEMO MODE Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F8F0] border border-[#B1E4CB] text-[10px] font-mono font-bold text-[#5FBF8F]">
          <span>⚡ DEMO MODE</span>
          <span className="text-[9px] text-[#5FBF8F]/80 font-normal">(INSAT-3DR / ERA5)</span>
        </div>

        {/* Satellite Feed Live Pill */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#DCEAF3] border border-[#C9DCE8] text-[11px] font-mono text-[#7C93A3]">
          <span className="text-xs">🛰️</span>
          <span className="font-semibold text-[#2C3E4A]">INSAT-3DR • Himawari-9</span>
          <span className="text-[#5FBF8F] font-bold text-[9px] bg-[#E8F8F0] px-1.5 py-0.5 rounded-md border border-[#B1E4CB]">LIVE</span>
        </div>
      </div>

      {/* Right: Audio Siren, Clock & Subsystems */}
      <div className="flex items-center gap-3">
        {/* Audio Siren Toggle */}
        <button
          onClick={() => {
            requestAudioPermission();
            toggleMute();
          }}
          title={isMuted ? "Click to enable audio siren" : "Audio siren is active"}
          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition border ${
            isPlaying
              ? 'bg-[#E85D5D] text-white border-[#E85D5D] animate-pulse'
              : isMuted
              ? 'bg-[#DCEAF3] text-[#7C93A3] border-[#C9DCE8] hover:text-[#2C3E4A] hover:bg-[#C9DCE8]'
              : 'bg-[#E8F8F0] text-[#5FBF8F] border-[#B1E4CB] hover:bg-[#D4F1E3]'
          }`}
        >
          <span>{isMuted ? '🔇' : (isPlaying ? '🚨' : '🔊')}</span>
          <span className="hidden sm:inline">{isMuted ? 'SIREN MUTED' : (isPlaying ? 'SIREN ACTIVE!' : 'SIREN ARMED')}</span>
        </button>

        {/* Blockchain Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DCEAF3] border border-[#C9DCE8] text-[11px] font-mono text-[#7C93A3]">
          <span>🔗</span>
          <span>LEDGER: <strong className="text-[#2C3E4A]">512 ANCHORED</strong></span>
        </div>

        {/* Clocks */}
        <div className="flex flex-col text-right font-mono">
          <span className="text-[11px] font-bold text-[#2C3E4A] tracking-tight">{currentTimeUTC}</span>
          <span className="text-[9px] text-[#7C93A3]">{currentTimeLocal} Local</span>
        </div>
      </div>
    </header>
  );
}
