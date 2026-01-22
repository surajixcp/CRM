import React, { useState, useRef, useEffect } from 'react';
import { uploadService } from '../src/api/uploadService';
import { authService } from '../src/api/authService';
import { settingService, CompanySettings } from '../src/api/settingService';

const Settings: React.FC = () => {
  const [logo, setLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    password: '',
    image: '',
    phone: '',
    location: ''
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: 'WorkStream Inc.',
    adminEmail: 'admin@workstream.com',
    workingHours: {
      checkIn: '09:00',
      gracePeriod: 15,
      checkOut: '18:00'
    },
    weekendPolicy: ['Sat', 'Sun'],
    officeLocation: {
      latitude: 0,
      longitude: 0,
      radius: 100
    }
  });

  useEffect(() => {
    fetchProfile();
    fetchCompanySettings();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = await authService.getMe();
      setProfile({
        name: user.name || '',
        email: user.email || '',
        password: '',
        image: user.image || '',
        phone: user.phone || '',
        location: user.location || ''
      });
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const data = await settingService.getSettings();
      setCompanySettings(data);
      if (data.companyLogo) setLogo(data.companyLogo);
    } catch (err) {
      console.error('Failed to fetch company settings', err);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.updateProfile(profile);
      alert('Profile updated successfully!');
      fetchProfile(); // Refresh
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to update profile');
    }
  };

  const handleCompanyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingService.updateSettings(companySettings);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to update settings', err);
      alert('Failed to update settings');
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadService.uploadProfileImage(file);
        setProfile(prev => ({ ...prev, image: url }));
      } catch (err) {
        console.error('Profile image upload failed', err);
        alert('Image upload failed');
      }
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadService.uploadCompanyLogo(file);
        setLogo(url);
        setCompanySettings(prev => ({ ...prev, companyLogo: url }));
        alert('Logo uploaded successfully');
      } catch (error) {
        console.error('Logo upload failed', error);
        alert('Logo upload failed');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const toggleWeekendDay = (day: string) => {
    setCompanySettings(prev => {
      const newPolicy = prev.weekendPolicy.includes(day)
        ? prev.weekendPolicy.filter(d => d !== day)
        : [...prev.weekendPolicy, day];
      return { ...prev, weekendPolicy: newPolicy };
    });
  };
  const handleDeleteCompany = async () => {
    if (!deletePassword) {
      alert('Please enter your password to confirm deletion');
      return;
    }

    setIsDeleting(true);
    try {
      await settingService.deleteCompany(deletePassword);
      alert('Company data deleted successfully. You will now be logged out.');
      authService.logout();
      window.location.reload();
    } catch (err: any) {
      console.error('Failed to delete company', err);
      alert(err.response?.data?.message || 'Failed to delete company. Please verify your password.');
    } finally {
      setIsDeleting(false);
      setDeletePassword('');
      setShowDeleteModal(false);
    }
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400";
  const labelClasses = "text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5 mb-1 block";

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">

      {/* Personal Profile Section */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Personal Profile</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Manage account and security</p>
        </div>

        <form className="p-6 space-y-6" onSubmit={handleProfileUpdate}>
          {/* Profile Image */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <div className="relative group">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden border-2 border-white dark:border-slate-900 shadow-md">
                {profile.image ? (
                  <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                )}
              </div>
              <button
                type="button"
                onClick={() => profileImageInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 rounded-lg text-white shadow-lg hover:bg-blue-700 transition-all active:scale-90"
                title="Change Photo"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
              <input
                type="file"
                ref={profileImageInputRef}
                onChange={handleProfileImageChange}
                className="hidden"
                accept="image/*"
              />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{profile.name || 'Admin User'}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Super Admin Role</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1.5">
              <label className={labelClasses}>Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className={inputClasses}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Location</label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className={inputClasses}
                placeholder="New York, USA"
              />
            </div>
            <div className="space-y-1.5 col-span-full">
              <label className={labelClasses}>New Password (Optional)</label>
              <input
                type="password"
                value={profile.password}
                onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                className={inputClasses}
                placeholder="Leave blank to keep unchanged"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-all active:scale-95">
              Update Profile
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">General Settings</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">System configurations and policies</p>
        </div>

        <form className="p-6 space-y-8" onSubmit={handleCompanyUpdate}>
          {/* Logo Section */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 bg-blue-50/30 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-500/20">
            <div className="relative group">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-black shadow-lg overflow-hidden">
                {logo ? (
                  <img src={logo} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  companySettings.companyName?.[0] || "W"
                )}
              </div>
              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 text-blue-600 hover:text-blue-700 transition-all active:scale-90"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleLogoChange} className="hidden" accept="image/*" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none mb-1">Company Branding</h4>
              <div className="flex space-x-2 mt-2">
                <button type="button" onClick={triggerFileInput} className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9px] font-black text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 transition-colors uppercase tracking-widest">Upload</button>
                {logo && (
                  <button type="button" onClick={() => { setLogo(null); setCompanySettings(prev => ({ ...prev, companyLogo: '' })); }} className="px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-[9px] font-black text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 transition-colors uppercase tracking-widest">Remove</button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1.5">
              <label className={labelClasses}>Company Identity</label>
              <input
                type="text"
                value={companySettings.companyName}
                onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClasses}>Primary Admin Email</label>
              <input
                type="email"
                value={companySettings.adminEmail}
                onChange={(e) => setCompanySettings({ ...companySettings, adminEmail: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600 rounded-full"></div>
              Check-in Protocol
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className={labelClasses}>Daily Check-in</label>
                <input
                  type="time"
                  value={companySettings.workingHours.checkIn}
                  onChange={(e) => setCompanySettings({
                    ...companySettings,
                    workingHours: { ...companySettings.workingHours, checkIn: e.target.value }
                  })}
                  className={inputClasses}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Grace Limit (Min)</label>
                <input
                  type="number"
                  value={companySettings.workingHours.gracePeriod}
                  onChange={(e) => setCompanySettings({
                    ...companySettings,
                    workingHours: { ...companySettings.workingHours, gracePeriod: parseInt(e.target.value) || 0 }
                  })}
                  className={inputClasses}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Check-out</label>
                <input
                  type="time"
                  value={companySettings.workingHours.checkOut}
                  onChange={(e) => setCompanySettings({
                    ...companySettings,
                    workingHours: { ...companySettings.workingHours, checkOut: e.target.value }
                  })}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600 rounded-full"></div>
              Weekend Policy
            </h4>
            <div className="flex flex-wrap gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <label key={`weekend-${index}-${day}`} className={`flex items-center space-x-2 cursor-pointer p-2 px-3 rounded-lg border transition-all ${companySettings.weekendPolicy.includes(day)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                  <input
                    type="checkbox"
                    checked={companySettings.weekendPolicy.includes(day)}
                    onChange={() => toggleWeekendDay(day)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-0 transition-all cursor-pointer"
                  />
                  <span className="text-[11px] font-black uppercase tracking-tight">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600 rounded-full"></div>
              Office Geofencing
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className={labelClasses}>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={companySettings.officeLocation?.latitude === 0 ? '' : companySettings.officeLocation?.latitude}
                  onChange={(e) => setCompanySettings({
                    ...companySettings,
                    officeLocation: { ...companySettings.officeLocation, latitude: e.target.value === '' ? 0 : parseFloat(e.target.value) }
                  })}
                  className={inputClasses}
                  placeholder="e.g. 28.6139"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={companySettings.officeLocation?.longitude === 0 ? '' : companySettings.officeLocation?.longitude}
                  onChange={(e) => setCompanySettings({
                    ...companySettings,
                    officeLocation: { ...companySettings.officeLocation, longitude: e.target.value === '' ? 0 : parseFloat(e.target.value) }
                  })}
                  className={inputClasses}
                  placeholder="e.g. 77.2090"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClasses}>Radius (Meters)</label>
                <input
                  type="number"
                  value={companySettings.officeLocation?.radius || 100}
                  onChange={(e) => setCompanySettings({
                    ...companySettings,
                    officeLocation: { ...companySettings.officeLocation, radius: parseInt(e.target.value) || 100 }
                  })}
                  className={inputClasses}
                  placeholder="100"
                />
              </div>
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-normal">
              Employees can only check-in/out within this radius. Set to 0 to disable geofencing.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-2 md:py-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-all active:scale-95">
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Access Control</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Manage role-based permissions</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[
              { role: 'Admin', users: 3, description: 'Full system sovereignty and configuration control', color: 'bg-blue-600' },
              { role: 'Manager', users: 12, description: 'Team management and approval authority', color: 'bg-indigo-600' },
              { role: 'Employee', users: 109, description: 'Standard platform usage and self-service', color: 'bg-emerald-600' },
            ].map((role, i) => (
              <div key={i} className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-all group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 ${role.color} rounded-lg flex items-center justify-center text-white text-sm font-black shadow-md`}>
                    {role.role[0]}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className="font-black text-slate-900 dark:text-white text-[13px] uppercase tracking-tight leading-none">{role.role}</span>
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">{role.users} Users</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tight leading-none">{role.description}</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-500/20">
                  Settings
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/30 dark:bg-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-500/20 overflow-hidden mt-4">
        <div className="px-6 py-4 border-b border-rose-100 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20">
          <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">Danger Zone</h3>
          <p className="text-[10px] text-rose-500/70 font-bold uppercase tracking-widest leading-none mt-1">Irreversible destructive actions</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">Delete Whole Company Data</h4>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Permanently erase all employees, logs, projects, and configurations. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-2.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/10 active:scale-95 whitespace-nowrap"
            >
              Delete Company
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Critical Confirmation</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 px-4 leading-relaxed">
                Enter your <span className="text-rose-600 font-black">Admin Password</span> to permanently vanish all system data from everywhere.
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className={labelClasses}>Admin Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
                className={inputClasses}
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Go Back
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/10 active:scale-95 disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : 'Vanish Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
