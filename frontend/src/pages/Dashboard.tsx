import React, { useState, useEffect } from 'react';
import { cycloneApi } from '../services/api';
import { CyclonicSystem, AlertItem, BulletinItem, SystemStatusData, SavedWatchpoint, SituationReportData, DataProvenance } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeSystems, setActiveSystems] = useState<CyclonicSystem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [bulletins, setBulletins] = useState<BulletinItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);
  const [provenance, setProvenance] = useState<DataProvenance | null>(null);
  const [situationReport, setSituationReport] = useState<SituationReportData | null>(null);
  const [showSitRepModal, setShowSitRepModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Time-to-landfall ticking countdown (starting at 28h 35m 14s)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(28 * 3600 + 35 * 60 + 14);

  // My Saved Coastal Watchpoints
  const [watchpoints, setWatchpoints] = useState<SavedWatchpoint[]>([
    { id: '1', name: 'Puri Sea Beach', lat: 19.81, lon: 85.83, state: 'Odisha', basin: 'Bay of Bengal', alertLevel: 'SEVERE' },
    { id: '2', name: 'Paradip Port Harbor', lat: 20.31, lon: 86.61, state: 'Odisha', basin: 'Bay of Bengal', alertLevel: 'SEVERE' },
    { id: '3', name: 'Digha Coastal Sector', lat: 21.62, lon: 87.50, state: 'West Bengal', basin: 'Bay of Bengal', alertLevel: 'WARNING' },
    { id: '4', name: 'Visakhapatnam Naval Base', lat: 17.68, lon: 83.21, state: 'Andhra Pradesh', basin: 'Bay of Bengal', alertLevel: 'WATCH' }
  ]);
  const [newWatchName, setNewWatchName] = useState<string>('');
  const [newWatchState, setNewWatchState] = useState<string>('Odisha');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [sysData, alertData, bltnData, statusData, provData, sitrepData] = await Promise.all([
          cycloneApi.getActiveSystems(),
          cycloneApi.getAlerts(),
          cycloneApi.getBulletins(),
          cycloneApi.getSystemStatus(),
          cycloneApi.getDataProvenance().catch(() => null),
          cycloneApi.getSituationReport().catch(() => null)
        ]);
        setActiveSystems(sysData);
        setAlerts(alertData);
        setBulletins(bltnData);
        setSystemStatus(statusData);
        if (provData) setProvenance(provData);
        if (sitrepData) setSituationReport(sitrepData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const highestSystem = activeSystems.length > 0 ? activeSystems[0] : null;

  const handleAddWatchpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchName.trim()) return;
    const newPt: SavedWatchpoint = {
      id: Date.now().toString(),
      name: newWatchName.trim(),
      lat: 20.0,
      lon: 86.0,
      state: newWatchState,
      basin: 'Bay of Bengal',
      alertLevel: 'WATCH'
    };
    setWatchpoints([...watchpoints, newPt]);
    setNewWatchName('');
  };

  const handleRemoveWatchpoint = (id: string) => {
    setWatchpoints(watchpoints.filter(w => w.id !== id));
  };

  return (
    <div className="space-y-4 font-sans text-[#2C3E4A]">
      {/* Top Header Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C9DCE8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#2C3E4A] font-heading">
              METEOROLOGICAL COMMAND CENTER
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono bg-[#E8F8F0] text-[#5FBF8F] rounded-full border border-[#B1E4CB]">
              🟢 ALL SUBSYSTEMS NOMINAL
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono bg-[#DCEAF3] text-[#7C93A3] rounded-full border border-[#C9DCE8]">
              🤖 MODEL: v2.1.0-FPN-BiLSTM
            </span>
          </div>
          <p className="text-xs text-[#7C93A3] mt-0.5">
            AI Multi-Source Threat Intelligence & GIS Early Warning System
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={() => setShowSitRepModal(true)}
            className="px-3.5 py-2 bg-[#EAF2F8] hover:bg-[#DCEAF3] text-[#2C3E4A] border border-[#C9DCE8] rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-soft"
          >
            <span>📋</span>
            <span>SITUATION REPORT</span>
          </button>
          <button
            onClick={() => navigate('/live-monitoring')}
            className="px-4 py-2 bg-[#4FA3D1] hover:bg-[#3B8EBE] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-soft"
          >
            <span>🛰️</span>
            <span>OPEN GIS RADAR</span>
          </button>
        </div>
      </div>

      {/* Data Provenance & Freshness Strip */}
      <div className="bg-[#EAF2F8] text-[#7C93A3] px-4 py-2.5 rounded-xl border border-[#C9DCE8] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono shadow-soft">
        <div className="flex items-center gap-4">
          <span className="text-[#5FBF8F] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#5FBF8F] animate-ping" />
            LIVE SENSOR PROVENANCE:
          </span>
          <span className="text-[#2C3E4A]">🛰️ INSAT-3DR TIR-1 (12m)</span>
          <span className="text-[#2C3E4A]">🛰️ Himawari-9 Clean IR (8m)</span>
          <span className="text-[#2C3E4A]">🌪️ MetOp ASCAT (45m)</span>
          <span className="text-[#2C3E4A]">🌐 NWP: GFS 0.25°</span>
        </div>
        <div className="flex items-center gap-3">
          <span>📐 PostGIS SRID:4326</span>
          <span className="text-[#4FA3D1] font-bold">🔗 Ledger #1543392</span>
        </div>
      </div>

      {/* Live Ticking Time-To-Landfall Banner */}
      {highestSystem && (
        <div className="p-4 rounded-xl bg-[#EAF2F8] border-l-4 border-l-[#E85D5D] border border-[#C9DCE8] text-[#2C3E4A] shadow-soft flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDECEC] border border-[#FACDCD] flex items-center justify-center text-xl animate-pulse text-[#E85D5D]">
              ⏱️
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#E85D5D] font-bold font-mono">
                HIGH-THREAT TIME-TO-LANDFALL COUNTDOWN
              </div>
              <div className="text-sm text-[#2C3E4A] font-medium font-heading">
                Target Sector: <strong className="text-[#2C3E4A]">Puri & Kendrapara Coast (Odisha)</strong> • {highestSystem.name}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#7C93A3] font-bold font-mono uppercase">ESTIMATED TIME REMAINING</div>
            <div className="text-2xl font-extrabold text-[#E85D5D] tracking-tight font-mono">
              {formatCountdown(countdownSeconds)}
            </div>
          </div>
        </div>
      )}

      {/* Summary Metrics Cards (Powder Blue Surface Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Systems */}
        <div className="p-4 rounded-xl bg-[#EAF2F8] border border-[#C9DCE8] shadow-soft relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-[#7C93A3] font-bold font-mono">Active Systems</span>
            <div className="w-8 h-8 rounded-lg bg-[#E5F3FA] text-[#4FA3D1] flex items-center justify-center text-base font-bold">
              🌀
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-[#4FA3D1] font-heading">
              {activeSystems.filter(s => s.status === 'active').length}
            </span>
            <span className="text-xs text-[#7C93A3]">Monitored</span>
          </div>
          <p className="text-[11px] text-[#7C93A3] mt-2 truncate">
            {highestSystem ? `Top Threat: ${highestSystem.name}` : 'No active cyclogenesis'}
          </p>
          <div className="absolute top-0 left-0 h-1 w-full bg-[#4FA3D1]" />
        </div>

        {/* Card 2: Highest Intensity */}
        <div className="p-4 rounded-xl bg-[#EAF2F8] border border-[#C9DCE8] shadow-soft relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-[#7C93A3] font-bold font-mono">Highest Intensity</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F8F0] text-[#5FBF8F] flex items-center justify-center text-base font-bold">
              ⚡
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-[#2C3E4A] font-heading truncate">
              {highestSystem ? highestSystem.current_category : 'NORMAL'}
            </span>
          </div>
          <p className="text-[11px] text-[#7C93A3] mt-2">
            Peak Winds: <strong className="text-[#2C3E4A]">{highestSystem ? `${highestSystem.current_wind_kmh} km/h` : '--'}</strong>
          </p>
          <div className="absolute top-0 left-0 h-1 w-full bg-[#5FBF8F]" />
        </div>

        {/* Card 3: RI Probability */}
        <div className="p-4 rounded-xl bg-[#EAF2F8] border border-[#C9DCE8] shadow-soft relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-[#7C93A3] font-bold font-mono">RI Probability (24h)</span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF7E8] text-[#F2B84B] flex items-center justify-center text-base font-bold">
              📈
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-[#F2B84B] font-heading">68%</span>
            <span className="text-[10px] text-[#F2B84B] bg-[#FEF7E8] px-2 py-0.5 rounded-full font-bold uppercase border border-[#FADAA0]">HIGH RISK</span>
          </div>
          <p className="text-[11px] text-[#7C93A3] mt-2">
            SST: 30.4°C • Shear: 9.2 kt
          </p>
          <div className="absolute top-0 left-0 h-1 w-full bg-[#F2B84B]" />
        </div>

        {/* Card 4: Active Alerts */}
        <div className="p-4 rounded-xl bg-[#EAF2F8] border border-[#C9DCE8] shadow-soft relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-[#7C93A3] font-bold font-mono">Active Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-[#FDECEC] text-[#E85D5D] flex items-center justify-center text-base font-bold">
              🚨
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-[#E85D5D] font-heading">
              {alerts.filter(a => !a.acknowledged).length}
            </span>
            <span className="text-xs text-[#7C93A3]">Unacknowledged</span>
          </div>
          <p className="text-[11px] text-[#7C93A3] mt-2">
            Multi-channel: SMS + Siren + Push
          </p>
          <div className="absolute top-0 left-0 h-1 w-full bg-[#E85D5D]" />
        </div>
      </div>

      {/* Global Cyclone Tracker & Trend Sparklines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Systems Table */}
        <div className="lg:col-span-2 bg-[#EAF2F8] rounded-xl border border-[#C9DCE8] shadow-soft overflow-hidden flex flex-col">
          <div className="p-4 bg-[#DCEAF3] border-b border-[#C9DCE8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[#2C3E4A] font-mono">
                🌐 Global Cyclone Tracker & Intensity Trends
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-[#E8F8F0] text-[#5FBF8F] border border-[#B1E4CB] rounded-full font-mono">
                LIVE SPATIAL FEED
              </span>
            </div>
            <button
              onClick={() => navigate('/live-monitoring')}
              className="text-xs text-[#4FA3D1] hover:text-[#3B8EBE] font-bold hover:underline font-mono"
            >
              Interactive Map →
            </button>
          </div>

          <div className="overflow-x-auto flex-1 font-mono">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#DCEAF3]/70 text-[#7C93A3] border-b border-[#C9DCE8]">
                  <th className="p-3 font-bold">System Name</th>
                  <th className="p-3 font-bold">Basin</th>
                  <th className="p-3 font-bold">Category</th>
                  <th className="p-3 font-bold">Wind (km/h)</th>
                  <th className="p-3 font-bold">Pressure</th>
                  <th className="p-3 font-bold">24h Intensity Trend</th>
                  <th className="p-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C9DCE8] bg-white">
                {activeSystems.map((sys) => (
                  <tr key={sys.id} className="hover:bg-[#EAF2F8]/70 transition">
                    <td className="p-3 font-bold text-[#2C3E4A] flex items-center gap-1.5 font-heading">
                      <span className="text-base">🌀</span>
                      <span>{sys.name}</span>
                    </td>
                    <td className="p-3 text-[#7C93A3]">{sys.basin}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        sys.current_category.includes('VERY SEVERE') ? 'bg-[#FDECEC] text-[#E85D5D] border-[#FACDCD]' :
                        sys.current_category.includes('SEVERE') ? 'bg-[#FEF7E8] text-[#F2B84B] border-[#FADAA0]' :
                        'bg-[#E8F8F0] text-[#5FBF8F] border-[#B1E4CB]'
                      }`}>
                        {sys.current_category}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#2C3E4A]">{sys.current_wind_kmh}</td>
                    <td className="p-3 text-[#7C93A3]">{sys.current_pressure_hpa} hPa</td>
                    <td className="p-3">
                      <svg className="w-20 h-6 text-[#E85D5D]" viewBox="0 0 80 24">
                        <path
                          d="M 0 18 Q 20 14, 40 10 T 80 4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <circle cx="80" cy="4" r="3" fill="#E85D5D" />
                      </svg>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate('/live-monitoring')}
                        className="px-2.5 py-1 bg-[#E5F3FA] hover:bg-[#4FA3D1] hover:text-white border border-[#A5CEE6] text-[#4FA3D1] rounded-lg text-[10px] font-bold transition font-mono"
                      >
                        Track & Analyze
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comparative Coastal Risk Ranking */}
        <div className="bg-[#EAF2F8] rounded-xl border border-[#C9DCE8] shadow-soft p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#C9DCE8] mb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-[#2C3E4A] font-mono">
                🏆 Coastal Risk Ranking
              </span>
              <span className="text-[10px] text-[#E85D5D] font-bold bg-[#FDECEC] px-2 py-0.5 rounded-full border border-[#FACDCD] font-mono">TOP THREATS</span>
            </div>
            <div className="space-y-2.5 font-mono">
              {[
                { district: 'Puri', state: 'Odisha', pop: '1.7M', prob: 92, risk: 'CRITICAL', surge: '2.8m' },
                { district: 'Kendrapara', state: 'Odisha', pop: '1.4M', prob: 88, risk: 'CRITICAL', surge: '2.5m' },
                { district: 'Jagatsinghpur', state: 'Odisha', pop: '1.1M', prob: 84, risk: 'HIGH', surge: '2.2m' },
                { district: 'East Medinipur', state: 'West Bengal', pop: '5.1M', prob: 76, risk: 'HIGH', surge: '1.9m' },
                { district: 'Srikakulam', state: 'Andhra Pradesh', pop: '2.7M', prob: 45, risk: 'MODERATE', surge: '1.2m' }
              ].map((item, idx) => (
                <div key={item.district} className="p-2.5 bg-white hover:bg-[#DCEAF3] rounded-xl border border-[#C9DCE8] flex items-center justify-between text-xs transition">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#EAF2F8] border border-[#C9DCE8] text-[#7C93A3] flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-[#2C3E4A] font-heading">{item.district}, {item.state}</div>
                      <div className="text-[10px] text-[#7C93A3]">Pop: {item.pop} • Surge: {item.surge}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                      item.risk === 'CRITICAL' ? 'bg-[#FDECEC] text-[#E85D5D] border-[#FACDCD]' : 'bg-[#FEF7E8] text-[#F2B84B] border-[#FADAA0]'
                    }`}>
                      {item.prob}% Strike
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#C9DCE8] text-[10px] text-[#7C93A3] font-mono">
            PostGIS spatial intersection updated every 15 mins.
          </div>
        </div>
      </div>

      {/* Saved Coastal Watchpoints Widget */}
      <div className="bg-[#EAF2F8] rounded-xl border border-[#C9DCE8] shadow-soft p-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#C9DCE8] mb-3">
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-[#2C3E4A] flex items-center gap-2">
              <span>📍 My Saved Coastal Watchpoints</span>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-[#E8F8F0] text-[#5FBF8F] border border-[#B1E4CB] rounded-full">
                CUSTOM MONITORING
              </span>
            </div>
            <p className="text-[11px] text-[#7C93A3]">
              Personalized coastal sectors for localized wind threshold & surge monitoring
            </p>
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddWatchpoint} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Gopalpur Port"
              value={newWatchName}
              onChange={(e) => setNewWatchName(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white text-[#2C3E4A] border border-[#C9DCE8] rounded-xl font-mono focus:outline-none focus:border-[#4FA3D1]"
            />
            <select
              value={newWatchState}
              onChange={(e) => setNewWatchState(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white text-[#2C3E4A] border border-[#C9DCE8] rounded-xl font-mono focus:outline-none"
            >
              <option value="Odisha">Odisha</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Gujarat">Gujarat</option>
            </select>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#4FA3D1] hover:bg-[#3B8EBE] text-white font-bold rounded-xl text-xs transition shadow-soft"
            >
              + Add
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {watchpoints.map((wp) => (
            <div key={wp.id} className="p-3 bg-white border border-[#C9DCE8] rounded-xl relative group shadow-soft">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-xs text-[#2C3E4A] font-heading">{wp.name}</div>
                  <div className="text-[10px] text-[#7C93A3]">{wp.state} • {wp.basin}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                  wp.alertLevel === 'SEVERE' ? 'bg-[#FDECEC] text-[#E85D5D] border-[#FACDCD]' :
                  wp.alertLevel === 'WARNING' ? 'bg-[#FEF7E8] text-[#F2B84B] border-[#FADAA0]' :
                  'bg-[#E8F8F0] text-[#5FBF8F] border-[#B1E4CB]'
                }`}>
                  {wp.alertLevel}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-[#7C93A3] flex justify-between items-center">
                <span>{wp.lat}°N, {wp.lon}°E</span>
                <button
                  onClick={() => handleRemoveWatchpoint(wp.id)}
                  className="text-[#7C93A3] hover:text-[#E85D5D] opacity-0 group-hover:opacity-100 transition"
                  title="Remove Watchpoint"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Situation Report Modal */}
      {showSitRepModal && (
        <div className="fixed inset-0 z-[9999] bg-[#2C3E4A]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#EAF2F8] rounded-2xl shadow-soft-lg max-w-2xl w-full border border-[#C9DCE8] overflow-hidden flex flex-col max-h-[85vh] font-mono">
            <div className="p-4 bg-[#DCEAF3] text-[#2C3E4A] flex items-center justify-between border-b border-[#C9DCE8]">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <div>
                  <h3 className="font-bold text-sm font-heading">CHAKRAVYUH RAKSHAK — QUICK SITUATION REPORT</h3>
                  <p className="text-[10px] text-[#7C93A3]">Official IMD Synoptic Summary Format</p>
                </div>
              </div>
              <button
                onClick={() => setShowSitRepModal(false)}
                className="text-[#7C93A3] hover:text-[#2C3E4A] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs text-[#2C3E4A] bg-[#F7FAFC] flex-1">
              <pre className="whitespace-pre-wrap font-mono p-3 bg-white border border-[#C9DCE8] rounded-xl text-[11px] leading-relaxed text-[#2C3E4A]">
                {situationReport ? situationReport.summary_markdown : 'Loading official situation report...'}
              </pre>
            </div>

            <div className="p-3 bg-[#EAF2F8] border-t border-[#C9DCE8] flex justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3 py-1.5 bg-white hover:bg-[#DCEAF3] text-[#2C3E4A] rounded-xl text-xs font-bold border border-[#C9DCE8]"
              >
                🖨️ Print / Save as PDF
              </button>
              <button
                onClick={() => setShowSitRepModal(false)}
                className="px-3 py-1.5 bg-[#4FA3D1] hover:bg-[#3B8EBE] text-white font-bold rounded-xl text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
