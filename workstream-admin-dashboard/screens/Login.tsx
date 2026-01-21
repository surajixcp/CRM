import React, { useState } from 'react';
import { Icons } from '../constants';
import { authService } from '../src/api/authService';

interface LoginProps {
  onLogin: (status: boolean, remember: boolean) => void;
}

const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('surajgiri2002x@gmail.com');
  const [password, setPassword] = useState('suraj123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
    <div className="h-screen w-full flex items-center justify-center bg-slate-950 font-sans p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" />

      <div className="w-full max-w-sm bg-white/5 backdrop-blur-3xl rounded-2xl p-8 relative animate-in zoom-in-95 duration-500 border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Icons.Search className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-widest">WorkStream Admin</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Personnel Management Infrastructure</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5 focus-within:translate-x-1 transition-transform duration-300">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-0.5">Electronic Mail</label>
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2.5 text-[11px] font-bold text-white placeholder-white/20 focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                placeholder="AUTHENTICATION@SYSTEM.IO"
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                <Icons.Search className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 focus-within:translate-x-1 transition-transform duration-300">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-0.5">Secure Passkey</label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2.5 text-[11px] font-bold text-white placeholder-white/20 focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                title={showPassword ? "Obscure Identity" : "Reveal Identity"}
              >
                {showPassword ? (
                  <Icons.EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Icons.Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-rose-400 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between text-[9px] text-slate-500 font-black uppercase tracking-widest">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-3.5 h-3.5 border border-white/10 rounded bg-slate-900 font-black transition-all flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600' : ''}`}>
                  {rememberMe && <Icons.Check className="w-2.5 h-2.5 text-white" />}
                </div>
              </div>
              <span className="group-hover:text-slate-300 transition-colors">Persistent Session</span>
            </label>
            <button type="button" className="hover:text-white transition-all">Identity Recovery</button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/10 flex items-center justify-center ${isLoading ? 'opacity-70' : ''}`}
          >
            {isLoading ? (
              <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Establish Connection'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-center gap-4">
          {/* Decorative elements */}
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
        </div>
      </div>

      <div className="fixed bottom-6 right-8 text-[9px] text-slate-700 font-black uppercase tracking-[0.3em] pointer-events-none">
        Protocol Version 4.0.2 // SECURE.ENV
      </div>
    </div>
  );
};

export default LoginScreen;
