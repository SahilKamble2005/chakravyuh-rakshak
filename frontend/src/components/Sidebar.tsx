import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  badge?: string;
  badgeType?: 'live' | 'alert' | 'lang';
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Live Monitoring', path: '/live-monitoring', icon: '🛰️', badge: 'LIVE', badgeType: 'live' },
  { name: 'Track & Intensity', path: '/analytics', icon: '🌀' },
  { name: 'Alerts & Siren', path: '/alerts', icon: '🚨', badge: '1 RED', badgeType: 'alert' },
  { name: '🔗 Blockchain Audit', path: '/blockchain', icon: '🔐' },
  { name: 'AI Chatbot', path: '/ai-chatbot', icon: '🤖', badge: '13 LANG', badgeType: 'lang' },
  { name: 'Bulletins / Reports', path: '/reports', icon: '📄' },
  { name: 'Settings', path: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('chakravyuh_auth_token');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-[#EAF2F8] text-[#2C3E4A] flex flex-col h-full border-r border-[#C9DCE8] select-none shrink-0 font-sans shadow-soft">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#C9DCE8] bg-[#DCEAF3]/70">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#4FA3D1]/20 border border-[#4FA3D1]/40 text-[#4FA3D1] flex items-center justify-center text-xl shadow-xs">
            🌀
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide text-[#2C3E4A] font-heading">
              CHAKRAVYUH
            </h1>
            <p className="text-[10px] text-[#4FA3D1] font-mono tracking-wider font-bold">
              RAKSHAK • SOC OS
            </p>
          </div>
        </div>
        <p className="text-[9px] text-[#7C93A3] mt-2 font-mono leading-tight">
          AI Multi-Source Threat Intelligence & Early Warning
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto font-mono text-xs">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#4FA3D1] text-white font-bold shadow-soft'
                  : 'text-[#7C93A3] hover:bg-[#DCEAF3] hover:text-[#2C3E4A] border border-transparent font-medium'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                item.badgeType === 'live' ? 'bg-[#E8F8F0] text-[#5FBF8F] border-[#B1E4CB]' :
                item.badgeType === 'alert' ? 'bg-[#FDECEC] text-[#E85D5D] border-[#FACDCD]' :
                'bg-[#DCEAF3] text-[#2C3E4A] border-[#C9DCE8]'
              }`}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-[#C9DCE8] bg-[#DCEAF3]/70">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#EAF2F8] border border-[#C9DCE8]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#4FA3D1]/20 border border-[#4FA3D1]/40 flex items-center justify-center text-xs font-bold text-[#4FA3D1] shrink-0">
              CM
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-[#2C3E4A] truncate font-heading">Commander Vikram</div>
              <div className="text-[10px] text-[#7C93A3] font-mono">SecOps Lead</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-[#7C93A3] hover:text-[#E85D5D] hover:bg-[#DCEAF3] rounded-lg transition"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}
