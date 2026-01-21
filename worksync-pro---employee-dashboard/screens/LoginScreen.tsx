
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('alex.rivera@worksync.pro');
  const [password, setPassword] = useState('password123');
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
    } catch (err) {
      console.error('Login failed', err);
      alert('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg animate-scale-in relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-slate-800 overflow-hidden">
          {/* Header Branding */}
          <div className="bg-slate-950/80 p-10 md:p-12 text-center relative overflow-hidden border-b border-slate-800">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
              <ShieldCheck className="w-32 h-32 text-indigo-500" />
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-indigo-500/20">
                W
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-[900] text-white tracking-tight mb-2">Workspace Access</h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Sign in to your enterprise account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-10 md:p-12 space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity (Email)</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-[20px] pl-12 pr-5 py-4 text-sm font-bold text-slate-200 focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secret Key</label>
                  <button type="button" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">Forgot?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-[20px] pl-12 pr-14 py-4 text-sm font-bold text-slate-200 focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`}>
                    {rememberMe && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Remember identity</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm tracking-[0.2em] uppercase transition-all shadow-xl shadow-indigo-900/40 active:scale-95 flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-70 group mt-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Authorize Login
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="pt-4 text-center">
              <p className="text-xs text-slate-400 font-medium">
                Protected by WorkSync Security Protocol v2.4 <br />
                <span className="text-[10px] font-black text-slate-300 uppercase mt-2 inline-block">Enterprise Edition</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
