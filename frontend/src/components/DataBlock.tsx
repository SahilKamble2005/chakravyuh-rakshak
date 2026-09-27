import React from 'react';

interface DataBlockProps {
  title: string;
  value?: string | number;
  statusColor?: string;
  statusText?: string;
  riskLevel?: 'Safe' | 'Watch' | 'Warning' | 'Critical' | 'Inactive';
  sparkline?: boolean;
  secondaryData?: { label: string; val: string | number }[];
  children?: React.ReactNode;
}

const RISK_COLORS = {
  Safe: 'bg-forest',
  Watch: 'bg-amber',
  Warning: 'bg-orange',
  Critical: 'bg-crimson',
  Inactive: 'bg-slate'
};

export default function DataBlock({ title, value, statusColor, statusText, riskLevel, sparkline, secondaryData, children }: DataBlockProps) {
  return (
    <div className="border border-[#DFE3E8] bg-white rounded-xl flex flex-col shadow-sm">
      <div className="p-3.5 border-b border-[#DFE3E8] flex justify-between items-center bg-slate-50/70 rounded-t-xl">
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-[#2C3E50] font-mono">{title}</h3>
        {riskLevel && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${RISK_COLORS[riskLevel]} transition-colors duration-300 ease-in-out`} />
            <span className="text-[11px] uppercase tracking-wide text-[#919EAB] font-mono">{riskLevel}</span>
          </div>
        )}
        {statusText && (
          <div className="flex items-center gap-2 font-mono">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor || '#448AFF' }} />
            <span className="text-[11px] uppercase tracking-wide text-[#919EAB]">{statusText}</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2">
        {value !== undefined && (
          <div className="text-[28px] md:text-[36px] font-display font-bold text-[#2C3E50] leading-none">
            {value}
          </div>
        )}
        {sparkline && (
          <div className="w-full h-8 mt-2 border-b border-[#DFE3E8] flex items-end">
            <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke="#448AFF"
                strokeWidth="2"
                points="0,15 20,10 40,12 60,5 80,18 100,2"
              />
            </svg>
          </div>
        )}
        {children}
      </div>
      {secondaryData && secondaryData.length > 0 && (
        <div className="flex flex-col border-t border-[#DFE3E8]">
          {secondaryData.map((item, idx) => (
            <div key={idx} className="flex justify-between py-2 px-3.5 border-b border-[#DFE3E8] last:border-b-0 text-xs text-[#919EAB] font-mono">
              <span>{item.label}</span>
              <span className="font-mono font-bold text-[#2C3E50]">{item.val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
