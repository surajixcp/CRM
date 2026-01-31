
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { uploadService } from '../src/api/uploadService';
import { authService } from '../src/api/authService';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    image: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = await authService.getMe();
      setProfile({
        name: user.name || '',
        email: user.email || '',
        role: user.role === 'admin' ? 'Super Admin' : user.role === 'sub-admin' ? 'Manager' : 'Employee',
        image: user.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || 'User'),
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: any = {
        name: profile.name,
        email: profile.email,
        image: profile.image
      };

      // Only include password if user is trying to change it
      if (profile.newPassword) {
        if (profile.newPassword !== profile.confirmPassword) {
          alert('New password and confirm password do not match!');
          setIsLoading(false);
          return;
        }
        updateData.password = profile.newPassword;
      }

      await authService.updateProfile(updateData);
      alert('Profile updated successfully!');

      // Clear password fields
      setProfile(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      fetchProfile(); // Refresh
    } catch (error) {
      console.error(error);
      alert('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsLoading(true);
        const url = await uploadService.uploadProfileImage(file);
        setProfile(prev => ({ ...prev, image: url }));
      } catch (error) {
        console.error('Upload failed', error);
        alert('Image upload failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        <div className="relative h-20 md:h-28 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="absolute -bottom-8 md:-bottom-10 left-6 md:left-8">
            <div className="relative group">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt="Profile"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-4 border-white dark:border-slate-900 shadow-xl object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-4 border-white dark:border-slate-900 shadow-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                  <Icons.Search className="w-6 h-6 md:w-7 md:h-7" />
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-slate-950/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer backdrop-blur-[2px]">
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                <Icons.Plus className="w-4 h-4 md:w-5 md:h-5" />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-10 md:pt-14 pb-4 md:pb-6 px-6 md:px-8 flex justify-between items-end">
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{profile.name}</h2>
            <p className="text-[9px] md:text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mt-0.5">{profile.role}</p>
          </div>
          <p className="text-[8px] md:text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Verified</p>
        </div>

        <form onSubmit={handleSave} className="p-6 md:p-8 border-t border-slate-50 dark:border-slate-800/50 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div className="space-y-1.5">
              <label className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Personnel Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-xl px-3 md:px-4 py-2 md:py-2.5 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-[10px] md:text-[11px] text-slate-800 dark:text-slate-100 uppercase tracking-tight"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Communication Point</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-xl px-3 md:px-4 py-2 md:py-2.5 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-[10px] md:text-[11px] text-slate-800 dark:text-slate-100 tracking-tight"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1.5 md:pb-2">Security Infrastructure</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Existing Key</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={profile.currentPassword}
                    onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-xl px-3 md:px-4 py-2 md:py-2.5 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-[10px] md:text-[11px] font-bold dark:text-slate-100 pr-10"
                    placeholder="Enter current key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center"
                  >
                    {showCurrentPassword ? (
                      <Icons.EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Icons.Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">New Key Assignment</label>
                <input
                  type="password"
                  value={profile.newPassword}
                  onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-xl px-3 md:px-4 py-2 md:py-2.5 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-[10px] md:text-[11px] font-bold dark:text-slate-100"
                  placeholder="MIN 8 CHARS"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Key Validation</label>
                <input
                  type="password"
                  value={profile.confirmPassword}
                  onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-xl px-3 md:px-4 py-2 md:py-2.5 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-[10px] md:text-[11px] font-bold dark:text-slate-100"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 md:pt-6 border-t border-slate-50 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-widest text-center md:text-left">
              Integrity: Operational
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full md:w-auto px-6 md:px-8 py-2 md:py-2.5 bg-blue-600 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                'Sync Profile'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl p-6 border border-blue-100/50 dark:border-blue-500/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 dark:border-blue-500/20">
            <Icons.Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-tight">Advanced Core Security</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-tight mt-0.5">Multi-factor operational validation</p>
          </div>
        </div>
        <button className="px-5 py-2 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all active:scale-95 shadow-sm">
          Initialize MFA
        </button>
      </div>
    </div>
  );
};

export default Profile;
