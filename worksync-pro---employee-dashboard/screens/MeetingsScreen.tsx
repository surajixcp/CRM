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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-4 md:mb-6">
        <div>
          <h2 className="text-[14px] md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Agenda Control</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[7.5px] lg:text-[11px] mt-1 lg:mt-2 uppercase tracking-tight">Personnel synchronisation archives</p>
        </div>
        <div className="flex items-center gap-0.5 lg:gap-1.5 bg-white dark:bg-slate-900 p-0.5 lg:p-1.5 rounded-sm lg:rounded-xl border border-slate-200 dark:border-slate-800 self-end md:self-auto shrink-0 shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1 lg:p-2.5 rounded-sm lg:rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <List className="w-2.5 h-2.5 lg:w-4 lg:h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 lg:p-2.5 rounded-sm lg:rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <LayoutGrid className="w-2.5 h-2.5 lg:w-4 lg:h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative group lg:mb-6">
            <Search className="w-2.5 h-2.5 lg:w-4 lg:h-4 absolute left-2.5 lg:left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="QUERY REGISTRY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 lg:pl-12 pr-3 lg:pr-5 py-1 lg:py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm lg:rounded-2xl text-[8.5px] lg:text-xs font-black text-slate-700 dark:text-slate-200 focus:border-indigo-500 shadow-sm lg:shadow-xl lg:shadow-slate-200/5 outline-none placeholder:text-slate-400 uppercase tracking-[0.1em] lg:tracking-[0.2em]"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-950 px-3">Today - {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>

            {todaysMeetings.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 md:gap-6">
                {todaysMeetings.map((meeting) => (
                  <div key={meeting.id || meeting._id} className="bg-white dark:bg-slate-900/50 p-2 lg:p-8 rounded-md lg:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm lg:shadow-xl lg:shadow-slate-200/5 transition-all group relative overflow-hidden flex flex-col hover:border-indigo-500/30">
                    <div className="absolute top-0 right-0 w-8 lg:w-48 h-8 lg:h-48 bg-indigo-50/20 dark:bg-indigo-500/5 rounded-bl-[40px] lg:rounded-bl-[120px] -mr-4 lg:-mr-24 -mt-4 lg:-mt-24 transition-colors group-hover:bg-indigo-100/30"></div>

                    <div className="flex flex-col lg:flex-row items-start gap-2 lg:gap-10 relative z-10 flex-1">
                      <div className="w-full lg:w-32 text-center flex items-center justify-between lg:flex-col lg:justify-center p-1.5 lg:p-6 bg-slate-50 dark:bg-slate-800 rounded-sm lg:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner group-hover:bg-white dark:group-hover:bg-slate-900 transition-all shrink-0">
                        <span className="text-[6.5px] lg:text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none underline underline-offset-4 decoration-indigo-100 dark:decoration-indigo-900">{meeting.time.split(' ')[1] || 'AM'}</span>
                        <span className="text-[12px] lg:text-4xl font-black text-slate-900 dark:text-white leading-none mt-1 lg:mt-3 tracking-tighter">{meeting.time.split(' ')[0] || meeting.time}</span>
                        <div className="hidden lg:block h-1 w-12 bg-indigo-200 dark:bg-indigo-500/30 rounded-full mt-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-1 lg:gap-2 mb-1 lg:mb-3 flex-wrap">
                              <span className="text-[6.5px] lg:text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 lg:px-2.5 py-0.5 lg:py-1 rounded-sm lg:rounded-lg border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-widest leading-none">Live Access</span>
                              <span className="text-[6.5px] lg:text-[10px] font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1 lg:px-2.5 py-0.5 lg:py-1 rounded-sm lg:rounded-lg border border-indigo-100 dark:border-indigo-500/20 uppercase tracking-widest truncate max-w-[80px] leading-none">{meeting.platform || 'General'}</span>
                            </div>
                            <h3 className="text-[10px] lg:text-3xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight line-clamp-1 uppercase leading-tight lg:mb-2">{meeting.title}</h3>
                          </div>
                        </div>

                        <p className="text-[9px] lg:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1.5 line-clamp-2 hidden lg:block">{meeting.description}</p>

                        <div className="flex flex-wrap items-center gap-1.5 lg:gap-8 mt-1.5 lg:mt-8">
                          <div className="flex items-center gap-1 lg:gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${(meeting.createdBy as any)?.name || 'O'}&background=4f46e5&color=fff`}
                              className="w-3.5 h-3.5 lg:w-10 lg:h-10 rounded-sm lg:rounded-xl border border-white dark:border-slate-800 shadow-md transition-transform group-hover:scale-110"
                              alt="Avatar"
                            />
                            <div className="hidden lg:block">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Moderator</p>
                              <span className="text-[12px] font-black text-slate-800 dark:text-slate-200 truncate leading-none">{(meeting.createdBy as any)?.name || 'Organizational Lead'}</span>
                            </div>
                            <span className="lg:hidden text-[7.5px] font-bold text-slate-800 dark:text-slate-200 truncate leading-none">{(meeting.createdBy as any)?.name || 'Org'}</span>
                          </div>

                          <div className="flex items-center gap-1 lg:gap-2 px-1 lg:px-4 py-0.5 lg:py-2 bg-slate-50 dark:bg-slate-800 rounded-sm lg:rounded-xl border border-slate-100 dark:border-slate-700 shrink-0 shadow-inner">
                            <Users className="w-2 h-2 lg:w-5 lg:h-5 text-slate-400 lg:text-indigo-500" />
                            <span className="text-[7.5px] lg:text-sm font-black text-slate-600 dark:text-slate-400">{meeting.attendees?.length || 0}<span className="hidden lg:inline ml-1 text-slate-400 font-bold uppercase tracking-widest text-[8px]">Linked Personnel</span></span>
                          </div>
                        </div>

                        {meeting.meetingLink && (
                          <div className="mt-2 lg:mt-8">
                            <a
                              href={meeting.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full lg:w-auto inline-flex items-center justify-center gap-1 lg:gap-3 px-2.5 lg:px-10 py-1 lg:py-4 bg-indigo-600 text-white rounded-sm lg:rounded-2xl text-[7.5px] lg:text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-sm lg:shadow-xl lg:shadow-indigo-500/30 transition-all active:scale-95"
                            >
                              <Video className="w-2.5 h-2.5 lg:w-5 lg:h-5" />
                              <span className="truncate">Initialize Link</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900/30 p-8 lg:p-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-slate-300 dark:text-slate-700" />
                </div>
                <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[8px] lg:text-[9px]">Zero Agenda Today</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-950 px-3">Upcoming</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
              {upcomingMeetings.length > 0 ? upcomingMeetings.map((meeting) => (
                <div key={meeting.id || meeting._id} className="bg-white dark:bg-slate-900/50 p-2 lg:p-4 rounded-md border border-slate-100 dark:border-slate-800 shadow-sm transition-all group cursor-pointer relative overflow-hidden">
                  <div className="flex items-center gap-2 lg:gap-4">
                    <div className="flex flex-col items-center justify-center p-1.5 lg:p-2.5 bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-100 dark:border-slate-700 min-w-[40px] lg:min-w-[60px] group-hover:bg-indigo-50 dark:group-hover:bg-slate-700 transition-colors text-center shrink-0">
                      <span className="text-[6px] lg:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-indigo-400">{new Date(meeting.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                      <span className="text-sm lg:text-xl font-black text-slate-900 dark:text-white leading-none mt-0.5">{new Date(meeting.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                        <span className="text-[6.5px] lg:text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest leading-none">{meeting.platform || 'General'}</span>
                        <span className="text-[6.5px] lg:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate leading-none">{meeting.time}</span>
                      </div>
                      <h3 className="text-[9px] lg:text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase leading-none">{meeting.title}</h3>
                      <p className="text-[7px] lg:text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 truncate uppercase">By <span className="text-slate-600 dark:text-slate-400">{(meeting.createdBy as any)?.name || 'Organizer'}</span></p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full bg-white dark:bg-slate-900/30 p-6 rounded-md border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[8px] lg:text-[99px]">Zero Trace Forward</p>
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
