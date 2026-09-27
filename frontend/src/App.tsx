import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import BlockchainAudit from './pages/BlockchainAudit';
import AIChatbot from './pages/AIChatbot';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-monitoring" element={<LiveMonitoring />} />
          <Route path="/threat-map" element={<LiveMonitoring />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/zero-trust" element={<Analytics />} />
          <Route path="/digital-twin" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/incidents" element={<Alerts />} />
          <Route path="/blockchain" element={<BlockchainAudit />} />
          <Route path="/quarantine" element={<BlockchainAudit />} />
          <Route path="/ai-chatbot" element={<AIChatbot />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/vulnerabilities" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
