
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { meetingService } from '../src/api/meetingService';
import { employeeService } from '../src/api/employeeService'; // Import employeeService
import { Meeting, Employee } from '../types';

const Meetings: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    fetchMeetings();
    fetchEmployees();
  }, []);

  const fetchMeetings = async () => {
    try {
      const data = await meetingService.getAllMeetings();
      // Map backend data to frontend model
      const mapped = Array.isArray(data) ? data.map((m: any) => ({
        id: m._id,
        title: m.title,
        description: m.description,
        date: m.date ? new Date(m.date).toLocaleDateString() : '', // Format date string
        rawDate: m.date,
        time: m.time,
        platform: m.platform,
        meetingLink: m.meetingLink,
        attendees: m.attendees ? m.attendees.map((u: any) => u.name) : [], // Start with names for display
        attendeeIds: m.attendees ? m.attendees.map((u: any) => u._id) : [] // Keep IDs
      })) : [];
      setMeetings(mapped);
    } catch (err) {
      console.error('Failed to fetch meetings', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  // Helper form data structure for internal form use
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    date: '',
    time: '',
    platform: 'Google Meet',
    meetingLink: '',
    attendees: [] // Storing IDs here
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMeeting) {
        await meetingService.updateMeeting(editingMeeting.id, formData);
      } else {
        // @ts-ignore
        await meetingService.createMeeting(formData);
      }
      fetchMeetings();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save meeting', err);
      alert('Failed to save meeting');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await meetingService.deleteMeeting(id);
      fetchMeetings();
    } catch (err) {
      console.error('Failed to delete meeting', err);
      alert('Failed to delete meeting');
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description,
      date: meeting.rawDate ? new Date(meeting.rawDate).toISOString().split('T')[0] : '',
      time: meeting.time,
      platform: meeting.platform || 'Google Meet',
      meetingLink: meeting.meetingLink,
      attendees: meeting.attendeeIds || []
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingMeeting(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      platform: 'Google Meet',
      meetingLink: '',
      attendees: []
    });
  };

  const inputClasses = "w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400";
  const labelClasses = "text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5 mb-1 block";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Meetings & Events</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">Coordinate team collaboration</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 flex items-center shadow-lg shadow-blue-500/10 transition-all active:scale-95"
        >
          <Icons.Plus className="w-3.5 h-3.5" />
          <span className="ml-1.5">Schedule Meeting</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {meetings.length > 0 ? meetings.map((meeting) => (
          <div key={meeting.id} className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-col hover:border-blue-500 dark:hover:border-blue-500/50 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                <Icons.Meetings className="w-4 h-4" />
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(meeting)}
                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button
                  onClick={() => handleDelete(meeting.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>

            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{meeting.title}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 font-medium leading-relaxed">{meeting.description}</p>

            <div className="space-y-2 mt-auto">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                  <svg className="w-3 h-3 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {meeting.date}
                </div>
                <div className="flex items-center text-[10px] font-black text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                  <svg className="w-3 h-3 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {meeting.time}
                </div>
              </div>

              {meeting.meetingLink && (
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white transition-all border border-indigo-100 dark:border-indigo-500/20"
                >
                  <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  Join via {meeting.platform || 'Link'}
                </a>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <div className="flex -space-x-1.5">
                  {meeting.attendees && meeting.attendees.map((attendeeMember, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-white dark:border-slate-900 bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[7px] font-black text-blue-700 dark:text-blue-400 shadow-sm overflow-hidden" title={attendeeMember}>
                      {attendeeMember[0]}
                    </div>
                  ))}
                  <div className="w-5 h-5 rounded-full border border-white dark:border-slate-900 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[7px] font-black text-slate-400">
                    +
                  </div>
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{meeting.attendees ? meeting.attendees.length : 0} Team Members</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-10 text-center bg-white dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest">No meetings scheduled.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[6px] flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">{editingMeeting ? 'Edit Event' : 'Schedule Event'}</h3>
                <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Team collaboration session</p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form className="p-6 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar" onSubmit={handleSubmit}>
              <div>
                <label className={labelClasses}>Session Title</label>
                <input
                  type="text"
                  className={inputClasses}
                  placeholder="e.g. Q4 Product Roadmap Review"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClasses}>Agenda</label>
                <textarea
                  rows={2}
                  className={inputClasses}
                  placeholder="Outline discussion points..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Date</label>
                  <input
                    type="date"
                    className={inputClasses}
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Time</label>
                  <input
                    type="time"
                    className={inputClasses}
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50/30 dark:bg-blue-500/5 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClasses}>Platform</label>
                    <select
                      className={inputClasses}
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Teams">MS Teams</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Link</label>
                    <input
                      type="url"
                      className={inputClasses}
                      placeholder="https://..."
                      value={formData.meetingLink}
                      onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Participants</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                  {employees.map(emp => (
                    <label key={emp.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${formData.attendees?.includes(emp.id)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}>
                      <input
                        type="checkbox"
                        className="w-3 h-3 rounded text-blue-600"
                        checked={formData.attendees?.includes(emp.id)}
                        onChange={(e) => {
                          const current = formData.attendees || [];
                          if (e.target.checked) setFormData({ ...formData, attendees: [...current, emp.id] });
                          else setFormData({ ...formData, attendees: current.filter((n: string) => n !== emp.id) });
                        }}
                      />
                      <span className="text-[10px] font-bold truncate">{emp.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-[1.5] px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
              >
                {editingMeeting ? 'Update' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
