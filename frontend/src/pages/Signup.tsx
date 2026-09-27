import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [basin, setBasin] = useState('Bay of Bengal');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', {
        name,
        email,
        password,
        phone_number: phone,
        preferred_basin: basin,
        preferred_language: 'en'
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Try logging in directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#2C3E4A] flex flex-col justify-center items-center p-4 font-mono select-none">
      <div className="w-full max-w-md bg-[#EAF2F8] border border-[#C9DCE8] rounded-2xl shadow-soft-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-[#E5F3FA] border border-[#A5CEE6] text-[#4FA3D1] items-center justify-center text-2xl shadow-soft">
            🌀
          </div>
          <h1 className="text-lg font-extrabold tracking-wider text-[#2C3E4A] font-heading">
            REGISTER COASTAL NODE
          </h1>
          <p className="text-xs text-[#4FA3D1] font-bold font-mono">
            CHAKRAVYUH RAKSHAK AGENCY CLEARANCE
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#FDECEC] border border-[#FACDCD] text-[#E85D5D] text-xs rounded-xl font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[#7C93A3] font-bold mb-1 uppercase font-heading">Full Name & Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Verma (Disaster Manager)"
              className="w-full bg-white border border-[#C9DCE8] text-[#2C3E4A] p-2.5 rounded-xl focus:outline-none focus:border-[#4FA3D1] font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[#7C93A3] font-bold mb-1 uppercase font-heading">Official Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agency.gov.in"
              className="w-full bg-white border border-[#C9DCE8] text-[#2C3E4A] p-2.5 rounded-xl focus:outline-none focus:border-[#4FA3D1] font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[#7C93A3] font-bold mb-1 uppercase font-heading">Emergency Mobile (SMS Dispatch)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-white border border-[#C9DCE8] text-[#2C3E4A] p-2.5 rounded-xl focus:outline-none focus:border-[#4FA3D1] font-mono"
            />
          </div>

          <div>
            <label className="block text-[#7C93A3] font-bold mb-1 uppercase font-heading">Preferred Basin</label>
            <select
              value={basin}
              onChange={(e) => setBasin(e.target.value)}
              className="w-full bg-white border border-[#C9DCE8] text-[#2C3E4A] p-2.5 rounded-xl focus:outline-none font-mono"
            >
              <option value="Bay of Bengal">Bay of Bengal (North Indian Ocean)</option>
              <option value="Arabian Sea">Arabian Sea (North Indian Ocean)</option>
              <option value="Western Pacific">Western Pacific Ocean</option>
              <option value="North Atlantic">North Atlantic Ocean</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#7C93A3] font-bold mb-1 uppercase font-heading">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#C9DCE8] text-[#2C3E4A] p-2.5 rounded-xl focus:outline-none focus:border-[#4FA3D1] font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[#7C93A3] font-bold mb-1 uppercase font-heading">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-[#C9DCE8] text-[#2C3E4A] p-2.5 rounded-xl focus:outline-none focus:border-[#4FA3D1] font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#4FA3D1] hover:bg-[#3B8EBE] text-white font-extrabold text-xs tracking-wider rounded-xl shadow-soft transition uppercase mt-2 font-heading"
          >
            {loading ? 'CREATING CLEARANCE...' : 'CREATE ACCOUNT & CLEARANCE ➔'}
          </button>
        </form>

        <div className="text-center text-[11px] text-[#7C93A3] pt-2">
          <span>Already have clearance? </span>
          <Link to="/login" className="text-[#4FA3D1] font-bold hover:underline">
            Login Here
          </Link>
        </div>
      </div>
    </div>
  );
}
