import React from 'react';

interface SparklineSummaryCardProps {
  title: string;
  value: string | number;
  data: number[];
  riskLevel?: 'Safe' | 'Watch' | 'Warning' | 'Critical';
}

const colorMap = {
  Safe: '#2D6A4F',
  Watch: '#D4A017',
  Warning: '#C05621',
  Critical: '#9B1C1C',
  Inactive: '#718096'
};

const SparklineSummaryCard: React.FC<SparklineSummaryCardProps> = ({ title, value, data, riskLevel = 'Safe' }) => {
  const color = colorMap[riskLevel] || colorMap.Safe;
  
  // Very simple sparkline SVG generator for 1px stroke, no fill
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ border: '1px solid #4A5568', padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '2px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 500, color: '#4A5568', margin: 0, marginBottom: '8px' }}>
            {title}
          </h3>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '28px', fontWeight: 300, color: color }}>
            {value}
          </div>
        </div>
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="1"
            points={points}
          />
        </svg>
      </div>
    </div>
  );
};

export default SparklineSummaryCard;
