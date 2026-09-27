import React, { useState, useEffect } from 'react';
import { cycloneApi } from '../services/api';
import { AlertItem } from '../types';
import { useAudioAlert } from '../hooks/useAudioAlert';
import { EmergencyAlertModal } from '../components/EmergencyAlertModal';

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [activeModalAlert, setActiveModalAlert] = useState<AlertItem | null>(null);

  const {
    triggerAlert,
    stopSound,
    isPlaying,
    isMuted,
    toggleMute,
    requestAudioPermission
  } = useAudioAlert();

  const loadAlerts = async () => {
    try {
      const data = await cycloneApi.getAlerts(filterLevel !== 'ALL' ? filterLevel : undefined);
      setAlerts(data);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, [filterLevel]);

  const handleAcknowledge = async (id: number) => {
    try {
      await cycloneApi.acknowledgeAlert(id);
      stopSound();
      loadAlerts();
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
    }
  };

  const handleTestSiren = (level: 'WATCH' | 'WARNING' | 'SEVERE') => {
    requestAudioPermission();
    triggerAlert(level);
  };

  const activeEmergency = alerts.find(a => a.level === 'SEVERE' && !a.acknowledged);

  return (
    <div className="space-y-6 font-mono text-[#2C3E4A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C9DCE8]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#2C3E4A] font-heading">
            🚨 MULTI-CHANNEL EMERGENCY ALERT SYSTEM
          </h1>
          <p className="text-xs text-[#7C93A3]">
            Automated Multi-Channel Dispatch (SMS • Web Push • WebSocket • Software Siren)
          </p>
        </div>

        {/* Global Siren Arm / Mute Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              requestAudioPermission();
              toggleMute();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
              isMuted
                ? 'bg-[#EAF2F8] text-[#7C93A3] border-[#C9DCE8] hover:bg-[#DCEAF3]'
                : (isPlaying ? 'bg-[#E85D5D] text-white border-[#E85D5D] animate-pulse' : 'bg-[#E8F8F0] text-[#5FBF8F] border-[#B1E4CB]')
            }`}
          >
            <span>{isMuted ? '🔇' : (isPlaying ? '🚨' : '🔊')}</span>
            <span>{isMuted ? 'SIREN MUTED (CLICK TO UNMUTE)' : (isPlaying ? 'SIREN SOUNDING!' : 'SIREN ARMED & ACTIVE')}</span>
          </button>
          {isPlaying && (
            <button
              onClick={stopSound}
              className="px-3 py-1.5 bg-[#E85D5D] text-white text-xs font-bold rounded-xl hover:bg-[#D13E3E] shadow-soft"
            >
              SILENCE
            </button>
          )}
        </div>
      </div>

      {/* Active Critical Emergency Warning Card */}
      {activeEmergency && (
        <div className="p-4 rounded-xl bg-[#FDECEC] border border-[#FACDCD] shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#E85D5D] animate-ping" />
              <span className="text-xs font-extrabold text-[#E85D5D] uppercase tracking-wider font-heading">
                ACTIVE RED EMERGENCY CYCLONE ALERT
              </span>
            </div>
            <h2 className="text-base font-extrabold text-[#2C3E4A] font-heading">{activeEmergency.title}</h2>
            <p className="text-xs text-[#2C3E4A]">{activeEmergency.message}</p>
            <div className="text-[11px] text-[#E85D5D] font-bold">
              Districts at Risk: {activeEmergency.affected_districts.join(', ')}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveModalAlert(activeEmergency)}
              className="px-3 py-1.5 bg-white border border-[#C9DCE8] text-[#2C3E4A] text-xs font-bold rounded-xl hover:bg-[#EAF2F8] shadow-soft"
            >
              VIEW MODAL
            </button>
            <button
              onClick={() => handleAcknowledge(activeEmergency.id)}
              className="px-4 py-1.5 bg-[#E85D5D] hover:bg-[#D13E3E] text-white text-xs font-bold rounded-xl shadow-soft"
            >
              ✓ ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}

      {/* Software Audio Emergency Siren Test Deck */}
      <div className="p-4 bg-[#EAF2F8] text-[#2C3E4A] rounded-xl border border-[#C9DCE8] shadow-soft space-y-3">
        <div className="flex items-center justify-between border-b border-[#C9DCE8] pb-2">
          <div>
            <h2 className="text-xs font-bold tracking-wider uppercase text-[#4FA3D1] font-heading">
              🔊 SOFTWARE AUDIO EMERGENCY SIREN CONTROL DECK (WEB AUDIO API)
            </h2>
            <p className="text-[10px] text-[#7C93A3]">
              Zero external dependencies • Multi-harmonic synthesized acoustic alerts
            </p>
          </div>
          <span className="text-[10px] bg-[#E8F8F0] px-2 py-0.5 rounded-md text-[#5FBF8F] font-bold border border-[#B1E4CB]">
            AUDIO ENGINE: READY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Watch Tone */}
          <div className="p-3 bg-white border border-[#C9DCE8] rounded-xl space-y-2 shadow-soft">
            <div className="flex items-center justify-between font-bold text-[#5FBF8F]">
              <span>🟢 WATCH ALERT</span>
              <span className="text-[10px] text-[#7C93A3]">520 Hz Single Tone</span>
            </div>
            <p className="text-[10px] text-[#7C93A3]">Triggered for initial disturbances or systems &gt;72h away.</p>
            <button
              onClick={() => handleTestSiren('WATCH')}
              className="w-full py-1.5 bg-[#E8F8F0] hover:bg-[#D4F1E3] text-[#5FBF8F] border border-[#B1E4CB] font-bold rounded-xl text-xs transition"
            >
              TEST WATCH BEEP
            </button>
          </div>

          {/* Warning Tone */}
          <div className="p-3 bg-white border border-[#C9DCE8] rounded-xl space-y-2 shadow-soft">
            <div className="flex items-center justify-between font-bold text-[#F2B84B]">
              <span>🟠 WARNING ALERT</span>
              <span className="text-[10px] text-[#7C93A3]">680 Hz Triple Pulse</span>
            </div>
            <p className="text-[10px] text-[#7C93A3]">Triggered for intensifying storms within 24-72h window.</p>
            <button
              onClick={() => handleTestSiren('WARNING')}
              className="w-full py-1.5 bg-[#FEF7E8] hover:bg-[#FDE8B8] text-[#F2B84B] border border-[#FADAA0] font-bold rounded-xl text-xs transition"
            >
              TEST WARNING BEEP-BEEP-BEEP
            </button>
          </div>

          {/* Severe Siren */}
          <div className="p-3 bg-white border border-[#C9DCE8] rounded-xl space-y-2 shadow-soft">
            <div className="flex items-center justify-between font-bold text-[#E85D5D]">
              <span>🔴 SEVERE SIREN</span>
              <span className="text-[10px] text-[#7C93A3]">850-950 Hz Continuous Dual-Tone</span>
            </div>
            <p className="text-[10px] text-[#7C93A3]">Triggered for imminent landfall (&lt;24h) or Rapid Intensification.</p>
            <button
              onClick={() => handleTestSiren('SEVERE')}
              className="w-full py-1.5 bg-[#E85D5D] hover:bg-[#D13E3E] text-white font-bold rounded-xl text-xs transition shadow-soft"
            >
              TEST SEVERE EMERGENCY SIREN
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Channel Alert Dispatch History Log */}
      <div className="bg-[#EAF2F8] rounded-xl border border-[#C9DCE8] shadow-soft overflow-hidden space-y-3">
        <div className="p-4 border-b border-[#C9DCE8] flex flex-wrap items-center justify-between gap-3 bg-[#DCEAF3]">
          <div>
            <h2 className="text-sm font-bold text-[#2C3E4A] font-heading">
              MULTI-CHANNEL ALERT DISPATCH LOG & BLOCKCHAIN AUDIT
            </h2>
            <p className="text-xs text-[#7C93A3]">
              Auditable record of all SMS, Web Push, and WebSocket alert broadcasts
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#C9DCE8] p-1 rounded-xl text-xs shadow-soft">
            <span className="text-[10px] text-[#7C93A3] font-bold px-1">FILTER:</span>
            {['ALL', 'SEVERE', 'WARNING', 'WATCH'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  filterLevel === lvl ? 'bg-[#4FA3D1] text-white' : 'text-[#7C93A3] hover:text-[#2C3E4A]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#DCEAF3]/60 text-[#7C93A3] border-b border-[#C9DCE8]">
              <tr>
                <th className="p-3 font-bold">TIMESTAMP</th>
                <th className="p-3 font-bold">ALERT LEVEL</th>
                <th className="p-3 font-bold">SYSTEM & CATEGORY</th>
                <th className="p-3 font-bold">CHANNELS DISPATCHED</th>
                <th className="p-3 font-bold">AFFECTED REGIONS</th>
                <th className="p-3 font-bold">BLOCKCHAIN PROOF</th>
                <th className="p-3 font-bold">STATUS</th>
                <th className="p-3 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9DCE8]">
              {alerts.map((al) => {
                const isSev = al.level === 'SEVERE';
                const isWarn = al.level === 'WARNING';
                return (
                  <tr key={al.id} className="hover:bg-[#EAF2F8] transition">
                    <td className="p-3 text-[#7C93A3]">
                      {new Date(al.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        isSev ? 'bg-[#FDECEC] text-[#E85D5D] border border-[#FACDCD]' : (isWarn ? 'bg-[#FEF7E8] text-[#F2B84B] border border-[#FADAA0]' : 'bg-[#EAF2F8] text-[#2C3E4A] border border-[#C9DCE8]')
                      }`}>
                        {al.level}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#2C3E4A]">
                      {al.category} ({al.wind_kmh} km/h)
                    </td>
                    <td className="p-3 text-[#7C93A3]">
                      {al.channels_dispatched.join(' • ')}
                    </td>
                    <td className="p-3 text-[#2C3E4A]">
                      {al.affected_districts && al.affected_districts.length > 0 ? al.affected_districts.slice(0, 2).join(', ') : 'Offshore'}
                    </td>
                    <td className="p-3 text-[#5FBF8F] font-bold">
                      ✓ ANCHORED
                    </td>
                    <td className="p-3">
                      {al.acknowledged ? (
                        <span className="text-[#7C93A3] font-semibold">ACKNOWLEDGED</span>
                      ) : (
                        <span className="text-[#E85D5D] font-extrabold animate-pulse">ACTIVE</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {!al.acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(al.id)}
                          className="px-2.5 py-1 bg-[#4FA3D1] hover:bg-[#3B8EBE] text-white rounded-lg text-[10px] font-bold transition shadow-soft"
                        >
                          ACK
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Modal */}
      {activeModalAlert && (
        <EmergencyAlertModal
          alert={activeModalAlert}
          onAcknowledge={handleAcknowledge}
          onMute={toggleMute}
          isMuted={isMuted}
          onClose={() => setActiveModalAlert(null)}
        />
      )}
    </div>
  );
}
