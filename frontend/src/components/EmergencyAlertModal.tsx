import React from 'react';
import { AlertItem } from '../types';
import { useNavigate } from 'react-router-dom';

interface EmergencyAlertModalProps {
  alert: AlertItem | null;
  onAcknowledge: (id: number) => void;
  onMute: () => void;
  isMuted: boolean;
  onClose: () => void;
}

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  alert,
  onAcknowledge,
  onMute,
  isMuted,
  onClose
}) => {
  const navigate = useNavigate();

  if (!alert) return null;

  const isSevere = alert.level === 'SEVERE';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#2C3E4A]/60 backdrop-blur-sm p-4 animate-fade-in font-mono">
      <div className={`w-full max-w-lg rounded-2xl border shadow-soft-lg overflow-hidden bg-[#EAF2F8] ${
        isSevere ? 'border-[#FACDCD]' : 'border-[#FADAA0]'
      }`}>
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between text-white ${
          isSevere ? 'bg-[#E85D5D] border-b border-[#D13E3E]' : 'bg-[#F2B84B] border-b border-[#D49520]'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h2 className="font-bold tracking-wide text-sm sm:text-base uppercase font-heading">
                {isSevere ? 'CRITICAL EMERGENCY CYCLONE ALERT' : 'CYCLONE WARNING ADVISORY'}
              </h2>
              <p className="text-[10px] text-white/90 font-mono">
                AUTOMATED DISPATCH ENGINE • IMD / RSMC SYNCHRONIZED
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold p-1 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-[#2C3E4A] bg-[#F7FAFC]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                isSevere ? 'bg-[#FDECEC] text-[#E85D5D] border border-[#FACDCD]' : 'bg-[#FEF7E8] text-[#F2B84B] border border-[#FADAA0]'
              }`}>
                {alert.level} • {alert.category}
              </span>
              <span className="text-xs text-[#7C93A3]">
                Wind: {alert.wind_kmh} km/h
              </span>
            </div>
            <h3 className="text-base font-bold text-[#2C3E4A] leading-snug font-heading">
              {alert.title}
            </h3>
          </div>

          <div className="p-3.5 bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl text-xs text-[#2C3E4A] leading-relaxed">
            {alert.message}
          </div>

          {alert.affected_districts && alert.affected_districts.length > 0 && (
            <div className="text-xs">
              <span className="font-bold text-[#2C3E4A]">Affected Coastal Districts: </span>
              <span className="text-[#E85D5D] font-semibold">{alert.affected_districts.join(', ')}</span>
            </div>
          )}

          {/* Status indicators */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#C9DCE8] text-[11px] text-[#7C93A3]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#5FBF8F] font-bold">📱 SMS:</span> Dispatched
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#5FBF8F] font-bold">🔔 Web Push:</span> Active
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#5FBF8F] font-bold">🔊 Audio Siren:</span> {isMuted ? 'Muted' : 'ACTIVE'}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#4FA3D1] font-bold">🔗 Blockchain:</span> SHA-256 Anchored
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#EAF2F8] px-6 py-4 border-t border-[#C9DCE8] flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => {
              onMute();
            }}
            className="px-3.5 py-2 text-xs border border-[#C9DCE8] rounded-xl bg-white hover:bg-[#DCEAF3] text-[#2C3E4A] transition font-bold"
          >
            {isMuted ? '🔊 UNMUTE SOUND' : '🔇 MUTE SIREN'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                navigate('/live-monitoring');
              }}
              className="px-4 py-2 text-xs font-bold bg-white text-[#2C3E4A] border border-[#C9DCE8] rounded-xl hover:bg-[#DCEAF3] transition shadow-xs"
            >
              🗺️ VIEW ON MAP
            </button>
            <button
              onClick={() => {
                onAcknowledge(alert.id);
                onClose();
              }}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition shadow-xs ${
                isSevere ? 'bg-[#E85D5D] hover:bg-[#D13E3E]' : 'bg-[#F2B84B] hover:bg-[#D49520]'
              }`}
            >
              ✓ ACKNOWLEDGE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
