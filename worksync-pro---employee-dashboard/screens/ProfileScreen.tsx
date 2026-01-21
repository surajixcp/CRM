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
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
            <div className="relative group">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-[4px] border-white dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                <img
                  src={previewUrl || user.image || user.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random`}
                  alt="Profile"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl transition-all duration-300 ${isEditing ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 cursor-default'}`}
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <div className="pb-1">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none">{formData.name}</h2>
              <p className="text-indigo-600 dark:text-indigo-400 font-black text-[9px] uppercase tracking-widest mt-1.5">{formData.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all active:scale-95 uppercase tracking-widest"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Update Credentials
                </button>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="p-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 shadow-lg shadow-slate-950/20 transition-all active:scale-95 border border-slate-800"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 md:flex-none px-6 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-widest active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-soft hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Updating...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/50 w-fit">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'personal' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Personnel
          </button>
          <button
            onClick={() => setActiveTab('employment')}
            className={`px-5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'employment' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Operational
          </button>
        </div>

        {/* Dynamic Card Content */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft p-6 md:p-8 transition-all duration-500">
          {activeTab === 'personal' ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${isEditing ? 'animate-scale-in' : ''}`}>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Legal Full Name</label>
                  {isEditing ? (
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-transparent">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{formData.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Enterprise Email</label>
                  {isEditing ? (
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 transition-all outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-transparent">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{formData.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 transition-all outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-transparent">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{formData.phone || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Office Location</label>
                  {isEditing ? (
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/10 transition-all outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-transparent">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{formData.location || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Working Mode</label>
                  {isEditing ? (
                    <div className="flex gap-3">
                      {['WFO', 'WFH'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setFormData(prev => ({ ...prev, workMode: mode as any }))}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${formData.workMode === mode
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-soft'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                          {mode === 'WFO' ? 'Office' : 'Home'}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-transparent">
                      <Building className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                        {formData.workMode === 'WFH' ? 'Work From Home' : 'Work From Office'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-soft transition-all">
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Role</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{formData.role}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-soft transition-all">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                    <Building className="w-5 h-5" />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Organization</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{(user as any).department || 'Engineering'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-soft transition-all">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Annual Payout</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{user.salary ? `₹${Number(user.salary).toLocaleString()} (${(user as any).salaryType || 'monthly'})` : 'Confidential'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center group hover:bg-white dark:hover:bg-slate-800 hover:shadow-soft transition-all">
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-3 group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Onboard Date</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{(user as any).joiningDate || '-'}</p>
                </div>
              </div>

              <div className="p-6 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 relative overflow-hidden">
                <ShieldCheck className="absolute -bottom-4 -right-4 w-24 h-24 opacity-[0.03] text-indigo-900 dark:text-indigo-400 rotate-12" />
                <h4 className="font-bold text-indigo-900 dark:text-indigo-400 mb-4 flex items-center gap-2.5 tracking-tight text-sm">
                  <div className="p-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg"><ShieldCheck className="w-4 h-4" /></div>
                  Security Clearance & Privileges
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['Admin Control Panel', 'Internal API Access', 'Financial Ledger View', 'HR Database Gateway', 'Cloud Deployment', 'Security Audit Logs'].map((perm, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 transition-all">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 group-hover:text-white" />
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{perm}</span>
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
