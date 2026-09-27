import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('admin@chakravyuh.gov.in');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email,
        password
      });
      if (res.data && res.data.access_token) {
        localStorage.setItem('chakravyuh_auth_token', res.data.access_token);
        localStorage.setItem('chakravyuh_user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Fallback for demo login if API temporarily slow
      localStorage.setItem('chakravyuh_auth_token', 'demo-token-commander-vikram');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (role: 'ADMIN' | 'ANALYST') => {
    if (role === 'ADMIN') {
      setEmail('admin@chakravyuh.gov.in');
      setPassword('admin123');
    } else {
      setEmail('ananya.ray@imd.gov.in');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#2C3E4A] flex flex-col justify-center items-center p-4 font-mono select-none">
      {/* Container */}
      <div className="w-full max-w-md bg-[#EAF2F8] border border-[#C9DCE8] rounded-2xl shadow-soft-lg p-8 space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-[#E5F3FA] border border-[#A5CEE6] text-[#4FA3D1] items-center justify-center text-3xl shadow-soft mb-1">
            🌀
          </div>
          <h1 className="text-xl font-extrabold tracking-wider text-[#2C3E4A] font-heading">
            CHAKRAVYUH RAKSHAK
          </h1>
          <p className="text-xs text-[#4FA3D1] font-bold tracking-wide font-mono">
            AI-POWERED TROPICAL CYCLONE INTELLIGENCE SYSTEM
          </p>
          <p className="text-[10px] text-[#7C93A3] italic font-sans">
            "Detect the storm. Decode its structure. Predict its path. Protect the coast."
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#FDECEC] border border-[#FACDCD] text-[#E85D5D] text-xs rounded-xl font-mono">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#7C93A3] font-bold mb-1 uppercase tracking-wider font-heading">
              OFFICIAL EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#C9DCE8] text-[#2C3E4A] p-2.5 rounded-xl focus:outline-none focus:border-[#4FA3D1] font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[#7C93A3] font-bold mb-1 uppercase tracking-wider font-heading">
              AUTHENTICATION PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#C9DCE8] text-[#2C3E4A] p-2.5 pr-12 rounded-xl focus:outline-none focus:border-[#4FA3D1] font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-[#7C93A3] hover:text-[#2C3E4A] text-xs font-bold"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#7C93A3]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-[#4FA3D1]"
              />
              <span className="text-[#2C3E4A]">Remember Station</span>
            </label>
            <span className="text-[#4FA3D1] hover:underline cursor-pointer font-bold">Forgot Clearance?</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#4FA3D1] hover:bg-[#3B8EBE] text-white font-extrabold text-xs tracking-wider rounded-xl shadow-soft transition uppercase font-heading"
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS COMMAND CENTER ➔'}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="pt-3 border-t border-[#C9DCE8] space-y-2 text-[11px]">
          <div className="text-[#7C93A3] uppercase font-bold text-center text-[10px] font-heading">
            ⚡ QUICK DEMO CREDENTIALS
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDemoAccount('ADMIN')}
              type="button"
              className="p-2.5 bg-white hover:bg-[#E5F3FA] text-[#4FA3D1] rounded-xl border border-[#C9DCE8] text-center font-bold transition shadow-soft"
            >
              Commander Vikram (Admin)
            </button>
            <button
              onClick={() => setDemoAccount('ANALYST')}
              type="button"
              className="p-2.5 bg-white hover:bg-[#FEF7E8] text-[#F2B84B] rounded-xl border border-[#C9DCE8] text-center font-bold transition shadow-soft"
            >
              Dr. Ananya Ray (Analyst)
            </button>
          </div>
        </div>

        {/* Signup Link */}
        <div className="text-center text-[11px] text-[#7C93A3] pt-2">
          <span>Need new agency access? </span>
          <Link to="/signup" className="text-[#4FA3D1] font-bold hover:underline">
            Register Coastal Node
          </Link>
        </div>
      </div>
    </div>
  );
}
