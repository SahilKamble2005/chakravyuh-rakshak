import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import VoiceSOCOperatorHUD from '../components/VoiceSOCOperatorHUD';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7FAFC] text-[#2C3E4A] font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dynamic Route Workspace Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F7FAFC]">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Tactical Voice Assistant HUD */}
      <VoiceSOCOperatorHUD />
    </div>
  );
}
