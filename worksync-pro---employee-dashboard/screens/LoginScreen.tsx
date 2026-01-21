
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('ws_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.login(email, password);

      if (rememberMe) {
        localStorage.setItem('ws_remembered_email', email);
      } else {
        localStorage.removeItem('ws_remembered_email');
      }
      onLogin();
    } catch (err: any) {
      console.error('Login failed', err);
      alert('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Hyper-Premium Ambient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[340px] animate-scale-in relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] border border-white/[0.05] overflow-hidden ring-1 ring-white/5">
          {/* Header Branding */}
          <div className="pt-10 pb-6 text-center relative overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl relative group overflow-hidden active:scale-95 transition-transform">
                <span className="italic">W</span>
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
              </div>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight mb-1.5 uppercase tracking-widest">Employee Access</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] opacity-80">WorkSync Pro</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identity</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-[#020617]/40 border border-white/[0.08] rounded-2xl pl-11 pr-5 py-3 text-[12px] font-bold text-slate-200 placeholder-slate-700 focus:bg-[#020617] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/40 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Password</label>
                  <button type="button" className="text-[8px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">Forgot?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-[#020617]/40 border border-white/[0.08] rounded-2xl pl-11 pr-12 py-3 text-[12px] font-bold text-slate-200 placeholder-slate-700 focus:bg-[#020617] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/40 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pl-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-3.5 h-3.5 rounded border border-slate-800 bg-slate-900 transition-all flex items-center justify-center ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'group-hover:border-slate-700'}`}>
                    {rememberMe && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors italic">Remember identity</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase transition-all shadow-2xl shadow-indigo-900/40 active:scale-[0.98] flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-emerald-700 disabled:opacity-70 group mt-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  Login
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform opacity-70" />
                </>
              )}
            </button>

            <footer className="pt-4 text-center border-t border-white/[0.02]">
              <p className="text-[8px] text-slate-700 font-bold uppercase tracking-[0.3em] opacity-60">
                Secured by WorkSync Protocol
              </p>
            </footer>
          </form>
        </div>
      </div>
    </div>

  );
};

export default LoginScreen;
