import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Users,
  ChevronRight,
  Search,
  LayoutGrid,
  List
} from 'lucide-react';
import { Meeting } from '../types';
import { meetingService } from '../services/meetingService';

const MeetingsScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const data = await meetingService.getMyMeetings();
      if (Array.isArray(data)) {
        setMeetings(data);
      }
    } catch (error) {
      console.error("Failed to fetch meetings", error);
    }
  };

  const filteredMeetings = meetings.filter(m =>
    (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayStr = new Date().toDateString();
  const todaysMeetings = filteredMeetings.filter(m => new Date(m.date).toDateString() === todayStr);
  const upcomingMeetings = filteredMeetings.filter(m => new Date(m.date) > new Date() && new Date(m.date).toDateString() !== todayStr);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Agenda Control Hub</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] mt-1.5 uppercase tracking-tight">Personnel synchronisation archives & schedule flow</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative group">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="QUERY REGISTRY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm outline-none placeholder:text-slate-400 uppercase"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-950 px-3">Today - {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>

            {todaysMeetings.length > 0 ? todaysMeetings.map((meeting) => (
              <div key={meeting.id || meeting._id} className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-bl-[80px] -mr-12 -mt-12 group-hover:bg-indigo-100/50 dark:group-hover:bg-indigo-500/10 transition-colors"></div>

                <div className="flex flex-col sm:flex-row items-start gap-5 relative z-10">
                  <div className="w-full sm:w-20 text-center flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner group-hover:bg-indigo-50 dark:group-hover:bg-slate-700 transition-colors">
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-0.5">{meeting.time.split(' ')[1] || 'AM'}</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{meeting.time.split(' ')[0] || meeting.time}</span>
                    <div className="h-0.5 w-6 bg-indigo-200 dark:bg-indigo-500/30 rounded-full mt-2" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[8px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-widest">Live Today</span>
                          <span className="text-[8px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-500/20 uppercase tracking-widest">{meeting.platform || 'General'}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight line-clamp-1">{meeting.title}</h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1.5 line-clamp-2">{meeting.description}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <img
                            src={`https://ui-avatars.com/api/?name=${(meeting.createdBy as any)?.name || 'Organizer'}&background=4f46e5&color=fff`}
                            className="w-6 h-6 rounded-lg border border-white dark:border-slate-800 shadow-sm"
                            alt="Avatar"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-800 rounded-full" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Organizer</span>
                          <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{(meeting.createdBy as any)?.name || 'Organizer'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{meeting.attendees?.length || 0} Members</span>
                      </div>
                    </div>

                    {meeting.meetingLink && (
                      <div className="mt-4 flex gap-3">
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Join via {meeting.platform || 'Link'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-white dark:bg-slate-900/30 p-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6 text-slate-200 dark:text-slate-700" />
                </div>
                <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[9px]">No meetings today</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-950 px-3">Upcoming</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcomingMeetings.length > 0 ? upcomingMeetings.map((meeting) => (
                <div key={meeting.id || meeting._id} className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-soft hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 min-w-[60px] group-hover:bg-indigo-50 dark:group-hover:bg-slate-700 transition-colors text-center">
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-indigo-400">{new Date(meeting.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white leading-none mt-0.5">{new Date(meeting.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">{meeting.platform || 'General'}</span>
                        <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{meeting.time}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{meeting.title}</h3>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">By <span className="text-slate-600 dark:text-slate-400">{(meeting.createdBy as any)?.name || 'Organizer'}</span></p>
                    </div>
                    <div className="flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full bg-white dark:bg-slate-900/30 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[9px]">No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="hidden lg:block space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Calendar Mode</h3>
            <div className="aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-5 space-y-3">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Switch to Calendar View</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Get a visual bird's eye view of your meetings across the entire month.</p>
              </div>
              <button className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm shadow-indigo-100 dark:shadow-none">Open Calendar</button>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-800/50 p-5 rounded-xl text-white border border-slate-800">
            <h4 className="font-bold text-sm mb-4">Meeting Tips</h4>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                <p className="text-[10px] text-slate-400 leading-normal">Join 2 minutes before the start time to test your audio.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                <p className="text-[10px] text-slate-400 leading-normal">Keep your camera on for better engagement during planning sessions.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                <p className="text-[10px] text-slate-400 leading-normal">Record all client demos for future reference and documentation.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingsScreen;
