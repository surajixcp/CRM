import React, { useState } from 'react';
import { Icons } from '../constants';
import { authService } from '../src/api/authService';

interface LoginProps {
  onLogin: (status: boolean, remember: boolean) => void;
}

const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await authService.login(email, password);
      // Save token
      if (rememberMe) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data)); // Save user info
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data));
      }

      onLogin(true, rememberMe);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Identity verification failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#020617] font-sans p-6 relative overflow-hidden">
      {/* Hyper-Premium Ambient Background */}
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[340px] bg-[#0f172a]/30 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden relative animate-in zoom-in-95 duration-1000 border border-white/[0.05] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/5">
        {/* Header Section */}
        <div className="px-6 md:px-8 pt-10 pb-6 text-center bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative group overflow-hidden active:scale-95 transition-transform">
            <span className="text-2xl font-black text-white relative z-10 italic">W</span>
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight mb-1.5 uppercase tracking-widest">Admin Access</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] opacity-80">Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 md:px-8 pb-10 space-y-4">
          {/* Identity Field */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identity</label>
            <div className="relative group">
              <input
                type="email"
                value={email}
                autoComplete="off"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#020617]/40 border border-white/[0.08] rounded-2xl px-5 py-3 text-[12px] font-bold text-white placeholder-slate-700 focus:bg-[#020617] focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                placeholder="Email Address"
                required
              />
            </div>
          </div>

          {/* Secure Key Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Password</label>
              <button type="button" className="text-[8px] font-black text-blue-500/80 hover:text-blue-400 uppercase tracking-widest transition-colors">Recovery</button>
            </div>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#020617]/40 border border-white/[0.08] rounded-2xl px-5 py-3 text-[12px] font-bold text-white placeholder-slate-700 focus:bg-[#020617] focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-white transition-colors p-1"
              >
                {showPassword ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-rose-400 text-[9px] font-black text-center bg-rose-500/5 py-2 px-4 rounded-xl border border-rose-500/10 animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          <div className="flex items-center space-x-3 text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-1">
            <label className="flex items-center space-x-2.5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-3.5 h-3.5 border border-slate-800 rounded bg-slate-900 transition-all flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600' : 'group-hover:border-slate-700'}`}>
                  {rememberMe && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>}
                </div>
              </div>
              <span className="group-hover:text-slate-400 transition-colors italic">Persistent session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98] shadow-2xl shadow-blue-500/20 flex items-center justify-center relative group ${isLoading ? 'opacity-70' : ''}`}
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                Login
                <svg className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </>
            )}
          </button>

          <footer className="pt-4 text-center border-t border-white/[0.02]">
            <p className="text-[8px] text-slate-700 font-bold uppercase tracking-[0.3em] opacity-60">
              Admin Gateway // Secure
            </p>
          </footer>
        </form>
      </div>

    </div>
  );
};

export default LoginScreen;
