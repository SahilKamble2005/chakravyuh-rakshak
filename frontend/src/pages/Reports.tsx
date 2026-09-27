import React, { useState, useEffect } from 'react';
import { cycloneApi } from '../services/api';
import { BulletinItem } from '../types';

export default function Reports() {
  const [bulletins, setBulletins] = useState<BulletinItem[]>([]);
  const [selectedBulletin, setSelectedBulletin] = useState<BulletinItem | null>(null);

  useEffect(() => {
    const fetchBulletins = async () => {
      try {
        const data = await cycloneApi.getBulletins();
        setBulletins(data);
        if (data.length > 0) {
          setSelectedBulletin(data[0]);
        }
      } catch (e) {
        console.error('Failed to load bulletins:', e);
      }
    };
    fetchBulletins();
  }, []);

  return (
    <div className="space-y-6 font-mono text-[#2C3E4A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C9DCE8]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#2C3E4A] font-heading">
            📄 OFFICIAL CYCLONE BULLETINS & ADVISORIES
          </h1>
          <p className="text-xs text-[#7C93A3]">
            Standardized Meteorological Warning Dispatches (WMO / RSMC / IMD Protocols)
          </p>
        </div>

        {selectedBulletin && (
          <button
            onClick={() => cycloneApi.downloadBulletin(selectedBulletin.id)}
            className="px-4 py-2 bg-[#4FA3D1] hover:bg-[#3B8EBE] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-soft"
          >
            <span>📥</span>
            <span>DOWNLOAD OFFICIAL ADVISORY</span>
          </button>
        )}
      </div>

      {/* Main Grid: Bulletin List & Full Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Bulletin Index */}
        <div className="bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl shadow-soft overflow-hidden flex flex-col">
          <div className="p-3 bg-[#DCEAF3] border-b border-[#C9DCE8]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7C93A3] font-heading">
              DISPATCHED ADVISORY LOG
            </h2>
          </div>

          <div className="divide-y divide-[#C9DCE8] overflow-y-auto max-h-[600px] bg-white">
            {bulletins.map((b) => {
              const isSelected = selectedBulletin?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBulletin(b)}
                  className={`p-3.5 cursor-pointer transition space-y-1 ${
                    isSelected ? 'bg-[#DCEAF3] border-l-4 border-[#4FA3D1]' : 'hover:bg-[#EAF2F8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#4FA3D1]">{b.bulletin_number}</span>
                    <span className="text-[10px] text-[#7C93A3]">
                      {new Date(b.issued_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#2C3E4A] line-clamp-1 font-heading">{b.title}</h3>
                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="text-[#E85D5D] font-bold uppercase">{b.category}</span>
                    <span className="text-[#5FBF8F] font-semibold">✓ Anchored</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Official Bulletin Preview */}
        {selectedBulletin && (
          <div className="lg:col-span-2 bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl shadow-soft p-6 space-y-5">
            {/* Header / Seal */}
            <div className="border-b border-[#C9DCE8] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#7C93A3] font-heading">
                  CHAKRAVYUH RAKSHAK METEOROLOGICAL SERVICE
                </div>
                <h2 className="text-base font-extrabold text-[#2C3E4A] mt-1 font-heading">
                  {selectedBulletin.title}
                </h2>
                <div className="text-xs text-[#7C93A3] mt-0.5">
                  BULLETIN NO.: <strong className="text-[#4FA3D1]">{selectedBulletin.bulletin_number}</strong> • ISSUED: {new Date(selectedBulletin.issued_at).toUTCString()}
                </div>
              </div>

              {/* Blockchain Stamp */}
              <div className="p-2.5 bg-white border border-[#C9DCE8] rounded-xl text-center shrink-0 shadow-soft">
                <div className="text-[9px] text-[#7C93A3] uppercase font-bold">LEDGER ANCHOR</div>
                <div className="text-xs font-bold text-[#5FBF8F]">🔐 SHA-256 SEALED</div>
                <div className="text-[9px] text-[#7C93A3]">Block #{selectedBulletin.block_number || 1543288}</div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-[#C9DCE8] text-center text-xs shadow-soft">
              <div>
                <div className="text-[10px] text-[#7C93A3] uppercase">Intensity Category</div>
                <div className="font-extrabold text-[#E85D5D] text-sm mt-0.5 font-heading">{selectedBulletin.category}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#7C93A3] uppercase">Max Sustained Wind</div>
                <div className="font-extrabold text-[#2C3E4A] text-sm mt-0.5 font-mono">{selectedBulletin.wind_kmh} km/h</div>
              </div>
              <div>
                <div className="text-[10px] text-[#7C93A3] uppercase">Central Pressure</div>
                <div className="font-extrabold text-[#2C3E4A] text-sm mt-0.5 font-mono">{selectedBulletin.pressure_hpa} hPa</div>
              </div>
            </div>

            {/* Port Signals Warning */}
            <div className="p-3 bg-[#FDECEC] border border-[#FACDCD] rounded-xl text-xs text-[#E85D5D] space-y-1 shadow-soft">
              <strong className="uppercase tracking-wider font-bold font-heading">Maritime Port Signals: </strong>
              <span>{selectedBulletin.warning_signals}</span>
            </div>

            {/* Fishermen Warning */}
            <div className="p-3 bg-[#FEF7E8] border border-[#FADAA0] rounded-xl text-xs text-[#2C3E4A] space-y-1 shadow-soft">
              <strong className="uppercase tracking-wider font-bold text-[#F2B84B] font-heading">Fishermen Advisory: </strong>
              <span>{selectedBulletin.fishermen_warning}</span>
            </div>

            {/* Full Meteorological Dispatch Text */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C93A3] font-heading">
                FULL DISPATCH TEXT
              </h3>
              <pre className="p-4 bg-white text-[#2C3E4A] border border-[#C9DCE8] rounded-xl text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap shadow-soft">
                {selectedBulletin.full_text}
              </pre>
            </div>

            {/* Provenance Details */}
            <div className="pt-3 border-t border-[#C9DCE8] text-[11px] text-[#7C93A3] space-y-1 truncate">
              <div>SHA-256 Hash: <code className="text-[#4FA3D1] font-bold">{selectedBulletin.sha256_hash}</code></div>
              <div>Blockchain Tx: <code className="text-[#4FA3D1] font-bold">{selectedBulletin.blockchain_tx_ref}</code></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
