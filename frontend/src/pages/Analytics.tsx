import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { cycloneApi } from '../services/api';
import { CyclonicSystem } from '../types';

export default function Analytics() {
  const [activeSystems, setActiveSystems] = useState<CyclonicSystem[]>([]);
  const [timeFilter, setTimeFilter] = useState<'6h' | '24h' | '3d' | 'all'>('24h');
  const [modelMetrics, setModelMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sys, metrics] = await Promise.all([
          cycloneApi.getActiveSystems(),
          cycloneApi.getModelMetrics()
        ]);
        setActiveSystems(sys);
        setModelMetrics(metrics);
      } catch (e) {
        console.error('Analytics load error:', e);
      }
    };
    fetchData();
  }, []);

  // Intensity trend data
  const intensityData = [
    { time: '-24h', observedWind: 65, forecastWind: 68, pressure: 994 },
    { time: '-18h', observedWind: 78, forecastWind: 80, pressure: 988 },
    { time: '-12h', observedWind: 95, forecastWind: 96, pressure: 982 },
    { time: '-6h', observedWind: 105, forecastWind: 108, pressure: 978 },
    { time: 'Current Fix', observedWind: 115, forecastWind: 115, pressure: 976 },
    { time: '+12h', observedWind: null, forecastWind: 125, pressure: 970 },
    { time: '+24h', observedWind: null, forecastWind: 140, pressure: 962 },
    { time: '+36h', observedWind: null, forecastWind: 145, pressure: 958 },
    { time: '+48h', observedWind: null, forecastWind: 105, pressure: 982 },
    { time: '+72h', observedWind: null, forecastWind: 75, pressure: 994 }
  ];

  // Seasonal basin trends data
  const seasonalData = [
    { month: 'Jan', historical: 0.4, actual2026: 0 },
    { month: 'Feb', historical: 0.2, actual2026: 0 },
    { month: 'Mar', historical: 0.5, actual2026: 1 },
    { month: 'Apr', historical: 1.2, actual2026: 1 },
    { month: 'May', historical: 2.8, actual2026: 3 },
    { month: 'Jun', historical: 1.6, actual2026: 2 },
    { month: 'Jul', historical: 0.9, actual2026: 1 },
    { month: 'Aug', historical: 1.1, actual2026: 1 },
    { month: 'Sep', historical: 2.4, actual2026: 3 },
    { month: 'Oct', historical: 3.9, actual2026: 4 },
    { month: 'Nov', historical: 3.2, actual2026: 3 },
    { month: 'Dec', historical: 1.5, actual2026: 1 }
  ];

  const errorData = [
    { lead: '+12h', trackErrorKm: 22.4, benchmarkError: 35.0 },
    { lead: '+24h', trackErrorKm: 41.8, benchmarkError: 65.0 },
    { lead: '+48h', trackErrorKm: 88.5, benchmarkError: 130.0 },
    { lead: '+72h', trackErrorKm: 146.2, benchmarkError: 210.0 },
    { lead: '+96h', trackErrorKm: 218.0, benchmarkError: 290.0 },
    { lead: '+120h', trackErrorKm: 312.4, benchmarkError: 380.0 }
  ];

  const highThreatDistricts = [
    { rank: 1, name: 'Puri District', state: 'Odisha', threatsThisSeason: 3, cumulativeExposure: 'Very High', population: '1.7M' },
    { rank: 2, name: 'Jagatsinghpur (Paradip)', state: 'Odisha', threatsThisSeason: 3, cumulativeExposure: 'Very High', population: '1.1M' },
    { rank: 3, name: 'Kendrapara', state: 'Odisha', threatsThisSeason: 2, cumulativeExposure: 'High', population: '1.4M' },
    { rank: 4, name: 'East Midnapore (Digha)', state: 'West Bengal', threatsThisSeason: 2, cumulativeExposure: 'High', population: '5.1M' },
    { rank: 5, name: 'South 24 Parganas', state: 'West Bengal', threatsThisSeason: 2, cumulativeExposure: 'Moderate', population: '8.2M' },
    { rank: 6, name: 'Visakhapatnam', state: 'Andhra Pradesh', threatsThisSeason: 1, cumulativeExposure: 'Moderate', population: '4.3M' }
  ];

  return (
    <div className="space-y-6 font-sans text-[#2C3E4A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C9DCE8]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#2C3E4A] font-heading">
            🌀 TRACK, INTENSITY & SEASONAL ANALYTICS
          </h1>
          <p className="text-xs text-[#7C93A3]">
            Observed vs. Forecast Curves • Model Accuracy Verification • High-Threat Exposure
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#EAF2F8] p-1 rounded-xl border border-[#C9DCE8] text-xs font-mono shadow-soft">
          {(['6h', '24h', '3d', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1 rounded-lg font-bold uppercase transition ${
                timeFilter === filter
                  ? 'bg-[#4FA3D1] text-white shadow-soft'
                  : 'text-[#7C93A3] hover:text-[#2C3E4A] hover:bg-[#DCEAF3]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Model Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl shadow-soft relative overflow-hidden">
          <div className="text-[11px] text-[#7C93A3] font-bold uppercase">System Detection Rate</div>
          <div className="text-3xl font-extrabold text-[#5FBF8F] mt-1 font-heading">98.4%</div>
          <div className="text-[10px] text-[#7C93A3] mt-1">Multi-Spectral IR+WV CNN</div>
          <div className="absolute top-0 left-0 h-1 w-full bg-[#5FBF8F]" />
        </div>

        <div className="p-4 bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl shadow-soft relative overflow-hidden">
          <div className="text-[11px] text-[#7C93A3] font-bold uppercase">Intensity MAE (Lead +24h)</div>
          <div className="text-3xl font-extrabold text-[#4FA3D1] mt-1 font-heading">5.8 kt</div>
          <div className="text-[10px] text-[#7C93A3] mt-1">Automated Dvorak + NWP</div>
          <div className="absolute top-0 left-0 h-1 w-full bg-[#4FA3D1]" />
        </div>

        <div className="p-4 bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl shadow-soft relative overflow-hidden">
          <div className="text-[11px] text-[#7C93A3] font-bold uppercase">Mean Track Error (+48h)</div>
          <div className="text-3xl font-extrabold text-[#4FA3D1] mt-1 font-heading">88.5 km</div>
          <div className="text-[10px] text-[#7C93A3] mt-1">32% better than climatology</div>
          <div className="absolute top-0 left-0 h-1 w-full bg-[#4FA3D1]" />
        </div>

        <div className="p-4 bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl shadow-soft relative overflow-hidden">
          <div className="text-[11px] text-[#7C93A3] font-bold uppercase">RI Forecast Accuracy</div>
          <div className="text-3xl font-extrabold text-[#F2B84B] mt-1 font-heading">89.2%</div>
          <div className="text-[10px] text-[#7C93A3] mt-1">Rapid Intensification Trigger</div>
          <div className="absolute top-0 left-0 h-1 w-full bg-[#F2B84B]" />
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Intensity Trajectory */}
        <div className="p-5 bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2C3E4A] font-heading">
              Intensity Forecast Trajectory (Cyclone DANA)
            </h2>
            <span className="text-[10px] text-[#7C93A3] font-mono">Wind Speed (km/h)</span>
          </div>
          <div className="h-64 bg-white p-3 rounded-xl border border-[#C9DCE8]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={intensityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF2F8" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#7C93A3' }} />
                <YAxis tick={{ fontSize: 10, fill: '#7C93A3' }} domain={[40, 160]} />
                <Tooltip contentStyle={{ fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#FFFFFF', borderColor: '#C9DCE8', color: '#2C3E4A', borderRadius: '12px', boxShadow: '0 4px 16px rgba(44,62,74,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="observedWind" name="Observed Wind (km/h)" stroke="#4FA3D1" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="forecastWind" name="Forecast Wind (km/h)" stroke="#E85D5D" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Track Error by Lead Time */}
        <div className="p-5 bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2C3E4A] font-heading">
              Track Error by Forecast Lead Time (km)
            </h2>
            <span className="text-[10px] text-[#7C93A3] font-mono">Chakravyuh AI vs. Climatology</span>
          </div>
          <div className="h-64 bg-white p-3 rounded-xl border border-[#C9DCE8]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF2F8" />
                <XAxis dataKey="lead" tick={{ fontSize: 10, fill: '#7C93A3' }} />
                <YAxis tick={{ fontSize: 10, fill: '#7C93A3' }} />
                <Tooltip contentStyle={{ fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#FFFFFF', borderColor: '#C9DCE8', color: '#2C3E4A', borderRadius: '12px', boxShadow: '0 4px 16px rgba(44,62,74,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="trackErrorKm" name="Chakravyuh AI Model (km)" fill="#4FA3D1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="benchmarkError" name="Global Standard Baseline (km)" fill="#C9DCE8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Seasonal Basin Cyclogenesis */}
        <div className="p-5 bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2C3E4A] font-heading">
              Seasonal Basin Cyclogenesis (North Indian Ocean)
            </h2>
            <span className="text-[10px] text-[#7C93A3] font-mono">2026 Season vs 30-Yr Baseline</span>
          </div>
          <div className="h-64 bg-white p-3 rounded-xl border border-[#C9DCE8]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={seasonalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF2F8" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#7C93A3' }} />
                <YAxis tick={{ fontSize: 10, fill: '#7C93A3' }} />
                <Tooltip contentStyle={{ fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#FFFFFF', borderColor: '#C9DCE8', color: '#2C3E4A', borderRadius: '12px', boxShadow: '0 4px 16px rgba(44,62,74,0.08)' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="historical" name="Historical Baseline (Avg Systems)" stroke="#7C93A3" fill="#DCEAF3" fillOpacity={0.7} />
                <Area type="monotone" dataKey="actual2026" name="2026 Detected Systems" stroke="#5FBF8F" fill="#B1E4CB" fillOpacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High-Threat Regions Table */}
        <div className="p-5 bg-[#EAF2F8] border border-[#C9DCE8] rounded-xl shadow-soft space-y-3 flex flex-col font-mono">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2C3E4A] font-heading">
              High-Threat Coastal Regions Leaderboard
            </h2>
            <span className="text-[10px] text-[#E85D5D] font-bold bg-[#FDECEC] px-2 py-0.5 rounded-full border border-[#FACDCD]">2026 Season Threat Index</span>
          </div>
          <div className="flex-1 overflow-x-auto bg-white rounded-xl border border-[#C9DCE8]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#DCEAF3] text-[#7C93A3] border-b border-[#C9DCE8]">
                <tr>
                  <th className="p-2.5 font-bold">RANK</th>
                  <th className="p-2.5 font-bold">DISTRICT / PORT</th>
                  <th className="p-2.5 font-bold">STATE</th>
                  <th className="p-2.5 text-center font-bold">THREATS</th>
                  <th className="p-2.5 font-bold">EXPOSURE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C9DCE8]">
                {highThreatDistricts.map((d) => (
                  <tr key={d.rank} className="hover:bg-[#EAF2F8] transition">
                    <td className="p-2.5 font-bold text-[#7C93A3]">#{d.rank}</td>
                    <td className="p-2.5 font-bold text-[#2C3E4A] font-heading">{d.name}</td>
                    <td className="p-2.5 text-[#7C93A3]">{d.state}</td>
                    <td className="p-2.5 text-center font-bold text-[#E85D5D]">{d.threatsThisSeason}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        d.cumulativeExposure === 'Very High' ? 'bg-[#FDECEC] text-[#E85D5D] border-[#FACDCD]' : (d.cumulativeExposure === 'High' ? 'bg-[#FEF7E8] text-[#F2B84B] border-[#FADAA0]' : 'bg-[#EAF2F8] text-[#7C93A3] border-[#C9DCE8]')
                      }`}>
                        {d.cumulativeExposure}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
