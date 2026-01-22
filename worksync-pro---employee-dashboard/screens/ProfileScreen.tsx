import React, { useState } from 'react';
import {
  Camera,
  Mail,
  MapPin,
  Phone,
  Lock,
  Edit3,
  ShieldCheck,
  Building,
  IndianRupee,
  Calendar,
  X,
  Save,
  CheckCircle2,
  Loader2,
  User
} from 'lucide-react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';
import { uploadService } from '../services/uploadService';

interface ProfileScreenProps {
  user: UserProfile;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'employment'>('personal');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Local form state
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    phone: (user as any).phone || '', // Using 'any' to bypass if interface not updated yet
    location: (user as any).location || '',
    workMode: user.workMode || 'WFO'
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let imageUrl = user.image || user.avatar;

      if (selectedFile) {
        imageUrl = await uploadService.uploadProfileImage(selectedFile);
      }

      const updateData = {
        ...formData,
        image: imageUrl
      };

      const updated = await authService.updateProfile(updateData);

      // Update local storage with the new user data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const newUser = { ...storedUser, ...updated, image: imageUrl, avatar: imageUrl };
      localStorage.setItem('user', JSON.stringify(newUser));

      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);

      // Force a reload or notify parent to update state if necessary
      window.location.reload();
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-8 animate-fade-in-up">
      <div className="px-4 md:px-6 relative space-y-6">
        {/* Profile Header Info */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-3 lg:gap-10 md:mb-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-2.5 lg:gap-8 text-center md:text-left">
            <div className="relative group">
              <div className="w-14 h-14 lg:w-40 lg:h-40 rounded-md lg:rounded-[40px] border-[2px] lg:border-[8px] border-white dark:border-slate-800 shadow-sm lg:shadow-2xl lg:shadow-slate-200/5 overflow-hidden bg-white dark:bg-slate-900 group-hover:border-indigo-500 transition-all duration-500">
                <img
                  src={previewUrl || user.image || user.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random`}
                  alt="Profile"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                onClick={() => isEditing && fileInputRef.current?.click()}
                className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-md lg:rounded-[40px] transition-all duration-300 ${isEditing ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 cursor-default'}`}
              >
                <Camera className="w-4 h-4 lg:w-8 lg:h-8" />
              </button>
            </div>
            <div className="pb-1 lg:pb-3">
              <h2 className="text-[14px] md:text-4xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">{formData.name}</h2>
              <p className="text-indigo-600 dark:text-indigo-400 font-black text-[7px] lg:text-sm uppercase tracking-[0.3em] mt-1 lg:mt-3 underline underline-offset-8 decoration-indigo-100 dark:decoration-indigo-900 lg:decoration-2">{formData.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 lg:gap-3 w-full md:w-auto mt-1 md:mt-0 lg:pb-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 lg:gap-2.5 px-3 lg:px-8 py-1 lg:py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm lg:rounded-2xl text-[8px] lg:text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm lg:shadow-xl lg:shadow-slate-200/10 transition-all active:scale-95 uppercase tracking-widest"
                >
                  <Edit3 className="w-2.5 h-2.5 lg:w-4 lg:h-4" />
                  Edit Registry
                </button>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="p-1 lg:p-4 px-2.5 lg:px-5 bg-slate-900 dark:bg-slate-800 text-white rounded-sm lg:rounded-2xl hover:bg-indigo-600 transition-all active:scale-95 border border-slate-800 shadow-lg"
                >
                  <Lock className="w-2.5 h-2.5 lg:w-4 lg:h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 md:flex-none px-4 lg:px-8 py-2 lg:py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm lg:rounded-2xl text-[9px] lg:text-xs font-black text-slate-500 uppercase tracking-widest active:scale-95 transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 lg:gap-2.5 px-6 lg:px-12 py-2 lg:py-4 bg-indigo-600 text-white rounded-sm lg:rounded-2xl text-[9px] lg:text-xs font-black shadow-sm lg:shadow-xl lg:shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 lg:w-4 lg:h-4 animate-spin" /> : <Save className="w-3 h-3 lg:w-4 lg:h-4" />}
                  {isSaving ? 'Synchronizing...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 lg:gap-2 p-1 lg:p-1.5 bg-slate-100/50 dark:bg-slate-950/50 rounded-lg lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 w-fit mx-auto md:mx-0">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-3 lg:px-8 py-1 lg:py-3 text-[8px] lg:text-[11px] font-black uppercase tracking-[0.2em] rounded-md lg:rounded-xl transition-all ${activeTab === 'personal' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm lg:shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Personnel registry
          </button>
          <button
            onClick={() => setActiveTab('employment')}
            className={`px-3 lg:px-8 py-1 lg:py-3 text-[8px] lg:text-[11px] font-black uppercase tracking-[0.2em] rounded-md lg:rounded-xl transition-all ${activeTab === 'employment' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm lg:shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Operational data
          </button>
        </div>

        {/* Dynamic Card Content */}
        <div className="bg-white dark:bg-slate-900/50 rounded-xl lg:rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-soft lg:shadow-2xl lg:shadow-slate-200/5 p-4 lg:p-12 transition-all duration-500">
          {activeTab === 'personal' ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-14 ${isEditing ? 'animate-scale-in' : ''}`}>
              <div className="space-y-4 lg:space-y-10">
                <div className="space-y-1 lg:space-y-3">
                  <label className="text-[6.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-0.5 leading-none">Legal Full Name</label>
                  {isEditing ? (
                    <div className="relative">
                      <User className="absolute left-2.5 lg:left-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 lg:w-5 lg:h-5 text-slate-300" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-sm lg:rounded-2xl pl-7 lg:pl-14 pr-2.5 lg:pr-5 py-1.5 lg:py-5 text-[8.5px] lg:text-sm font-black text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all outline-none shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 lg:gap-4 p-1.5 lg:p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-sm lg:rounded-2xl border border-transparent shadow-inner">
                      <User className="w-3 h-3 lg:w-6 lg:h-6 text-slate-400 lg:text-indigo-500" />
                      <span className="text-[9px] lg:text-base font-black text-slate-900 dark:text-white tracking-tight truncate leading-none">{formData.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 lg:space-y-3">
                  <label className="text-[6.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-0.5 leading-none">Enterprise Email</label>
                  {isEditing ? (
                    <div className="relative">
                      <Mail className="absolute left-2.5 lg:left-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 lg:w-5 lg:h-5 text-slate-300" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-sm lg:rounded-2xl pl-7 lg:pl-14 pr-2.5 lg:pr-5 py-1.5 lg:py-5 text-[8.5px] lg:text-sm font-black text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all outline-none shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 lg:gap-4 p-1.5 lg:p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-sm lg:rounded-2xl border border-transparent shadow-inner">
                      <Mail className="w-3 h-3 lg:w-6 lg:h-6 text-slate-400 lg:text-indigo-500" />
                      <span className="text-[9px] lg:text-base font-black text-slate-900 dark:text-white tracking-tight truncate leading-none">{formData.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 lg:space-y-10">
                <div className="space-y-1 lg:space-y-3">
                  <label className="text-[6.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-0.5 leading-none">Phone Number</label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="absolute left-2.5 lg:left-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 lg:w-5 lg:h-5 text-slate-300" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-sm lg:rounded-2xl pl-7 lg:pl-14 pr-2.5 lg:pr-5 py-1.5 lg:py-5 text-[8.5px] lg:text-sm font-black text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all outline-none shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 lg:gap-4 p-1.5 lg:p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-sm lg:rounded-2xl border border-transparent shadow-inner">
                      <Phone className="w-3 h-3 lg:w-6 lg:h-6 text-slate-400 lg:text-indigo-500" />
                      <span className="text-[9px] lg:text-base font-black text-slate-900 dark:text-white tracking-tight truncate leading-none">{formData.phone || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 lg:space-y-3">
                  <label className="text-[6.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-0.5 leading-none">Office Location</label>
                  {isEditing ? (
                    <div className="relative">
                      <MapPin className="absolute left-2.5 lg:left-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 lg:w-5 lg:h-5 text-slate-300" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-sm lg:rounded-2xl pl-7 lg:pl-14 pr-2.5 lg:pr-5 py-1.5 lg:py-5 text-[8.5px] lg:text-sm font-black text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all outline-none shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 lg:gap-4 p-1.5 lg:p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-sm lg:rounded-2xl border border-transparent shadow-inner">
                      <MapPin className="w-3 h-3 lg:w-6 lg:h-6 text-slate-400 lg:text-indigo-500" />
                      <span className="text-[9px] lg:text-base font-black text-slate-900 dark:text-white tracking-tight truncate leading-none">{formData.location || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 lg:space-y-3">
                  <label className="text-[8px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Working Mode</label>
                  {isEditing ? (
                    <div className="flex gap-2 lg:gap-4">
                      {['WFO', 'WFH'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setFormData(prev => ({ ...prev, workMode: mode as any }))}
                          className={`flex-1 py-2 lg:py-5 rounded-sm lg:rounded-2xl text-[9px] lg:text-xs font-black uppercase tracking-[0.2em] border transition-all ${formData.workMode === mode
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20 scale-105 z-10'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                          {mode === 'WFO' ? 'Office Terminal' : 'Remote Gateway'}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 lg:gap-4 p-2.5 lg:p-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-sm lg:rounded-2xl border border-transparent shadow-inner">
                      <Building className="w-3.5 h-3.5 lg:w-6 lg:h-6 text-slate-400 lg:text-indigo-500" />
                      <span className="text-[11px] lg:text-base font-black text-slate-900 dark:text-white tracking-tight">
                        {formData.workMode === 'WFH' ? 'Distributed Network' : 'Centralized On-Site'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 lg:space-y-12 animate-fade-in-up">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <div className="p-3 lg:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg lg:rounded-[32px] border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl lg:hover:shadow-indigo-500/10 transition-all hover:-translate-y-2">
                  <div className="p-2 lg:p-5 rounded-sm lg:rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-2 lg:mb-5 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-sm">
                    <ShieldCheck className="w-4 h-4 lg:w-8 lg:h-8" />
                  </div>
                  <p className="text-[7px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 lg:mb-2">Operational Status</p>
                  <p className="text-[10px] lg:text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">{formData.role}</p>
                </div>
                <div className="p-3 lg:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg lg:rounded-[32px] border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl lg:hover:shadow-emerald-500/10 transition-all hover:-translate-y-2">
                  <div className="p-2 lg:p-5 rounded-sm lg:rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2 lg:mb-5 group-hover:bg-emerald-600 group-hover:text-white group-hover:-rotate-6 transition-all duration-500 shadow-sm">
                    <Building className="w-4 h-4 lg:w-8 lg:h-8" />
                  </div>
                  <p className="text-[7px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 lg:mb-2">Assigned Unit</p>
                  <p className="text-[10px] lg:text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">{(user as any).department || 'Engineering'}</p>
                </div>
                <div className="p-3 lg:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg lg:rounded-[32px] border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl lg:hover:shadow-amber-500/10 transition-all hover:-translate-y-2">
                  <div className="p-2 lg:p-5 rounded-sm lg:rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2 lg:mb-5 group-hover:bg-amber-600 group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-sm">
                    <IndianRupee className="w-4 h-4 lg:w-8 lg:h-8" />
                  </div>
                  <p className="text-[7px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 lg:mb-2">Payout Protocol</p>
                  <p className="text-[10px] lg:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate w-full tabular-nums">{user.salary ? `₹${Number(user.salary).toLocaleString()}` : 'Confidential'}</p>
                </div>
                <div className="p-3 lg:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg lg:rounded-[32px] border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl lg:hover:shadow-rose-500/10 transition-all hover:-translate-y-2">
                  <div className="p-2 lg:p-5 rounded-sm lg:rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-2 lg:mb-5 group-hover:bg-rose-600 group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-sm">
                    <Calendar className="w-4 h-4 lg:w-8 lg:h-8" />
                  </div>
                  <p className="text-[7px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 lg:mb-2">Induction Date</p>
                  <p className="text-[10px] lg:text-lg font-black text-slate-900 dark:text-white tracking-tight">{(user as any).joiningDate || '-'}</p>
                </div>
              </div>

              <div className="p-4 lg:p-14 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-lg lg:rounded-[40px] border border-indigo-100 dark:border-indigo-500/20 relative overflow-hidden transition-all hover:bg-indigo-50/50">
                <ShieldCheck className="absolute -bottom-6 lg:-bottom-12 -right-6 lg:-right-12 w-20 lg:w-64 h-20 lg:h-64 opacity-[0.03] text-indigo-900 dark:text-indigo-400 rotate-12" />
                <h4 className="font-black text-indigo-900 dark:text-indigo-400 mb-3 lg:mb-10 flex items-center gap-2 lg:gap-4 tracking-tight text-[12px] lg:text-2xl uppercase">
                  <div className="p-1 lg:p-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg lg:rounded-2xl shadow-lg shadow-indigo-500/20"><ShieldCheck className="w-3.5 h-3.5 lg:w-8 lg:h-8" /></div>
                  Security Clearance Protocol
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-8 relative z-10">
                  {['Command Center', 'Internal API', 'Ledger View', 'Database Gateway', 'Deployment', 'Audit Logs'].map((perm, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 lg:gap-4 group/perm">
                      <div className="w-3.5 h-3.5 lg:w-7 lg:h-7 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover/perm:bg-emerald-500 transition-all duration-300 shrink-0 border border-emerald-500/20">
                        <CheckCircle2 className="w-2 lg:w-4 h-2 lg:h-4 text-emerald-600 group-hover/perm:text-white" />
                      </div>
                      <span className="text-[7px] lg:text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] truncate group-hover/perm:text-indigo-600 transition-colors">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
