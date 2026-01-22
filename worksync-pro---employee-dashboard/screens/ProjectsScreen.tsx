import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  ExternalLink,
  Users,
  X,
  Target,
  User,
  Calendar,
  Zap,
  Loader2
} from 'lucide-react';
import { ProjectStatus, Project } from '../types';
import { projectService } from '../services/projectService';

const ProjectsScreen: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getMyProjects();
      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const filteredProjects = projects.filter(p =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-4">
        <div>
          <h2 className="text-[14px] md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Project Command</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[7.5px] lg:text-[11px] mt-1 lg:mt-2 uppercase tracking-tight">Personnel sprint registry archives</p>
        </div>
        <div className="flex items-center gap-1.5 lg:gap-3">
          <div className="relative group flex-1 md:flex-none">
            <Search className="w-2.5 h-2.5 lg:w-4 lg:h-4 absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH PROJECT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-6 lg:pl-12 pr-2 lg:pr-4 py-0.5 lg:py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm lg:rounded-xl text-[8px] lg:text-xs font-black text-slate-700 dark:text-slate-200 focus:border-indigo-500 w-full md:w-36 lg:w-64 transition-all outline-none placeholder:text-slate-400 uppercase tracking-widest lg:shadow-inner"
            />
          </div>
          <button className="p-1.5 lg:p-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm lg:rounded-xl text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-white transition-all active:scale-95 shrink-0 lg:shadow-sm">
            <Filter className="w-2.5 h-2.5 lg:w-4 lg:h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-8">
        {filteredProjects.length > 0 ? filteredProjects.map((project, idx) => (
          <div
            key={project.id || project._id}
            className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-md lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm lg:shadow-xl lg:shadow-slate-200/5 hover:border-indigo-500/30 transition-all group overflow-hidden animate-scale-in flex flex-col"
          >
            <div className="p-2.5 lg:p-8 space-y-2 lg:space-y-6 flex-1">
              <div className="flex justify-between items-start">
                <div className="w-6 h-6 lg:w-14 lg:h-14 rounded-sm lg:rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm lg:shadow-xl lg:shadow-indigo-500/20 shrink-0">
                  <CheckCircle2 className="w-3 h-3 lg:w-7 lg:h-7" />
                </div>
                <div className="flex gap-1">
                  <span className={`px-1 py-0.5 lg:px-3 lg:py-1 rounded-full text-[6px] lg:text-[10px] font-black uppercase tracking-widest ${project.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                    project.status === 'completed' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20' :
                      'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700'
                    }`}>
                    {project.status || 'Active'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-[8.5px] lg:text-xl font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight mb-0.5 lg:mb-2 uppercase tracking-tight truncate">{project.name}</h3>
                <div className="flex items-center gap-1 lg:gap-2">
                  <div className="w-2.5 h-2.5 lg:w-6 lg:h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[5px] lg:text-xs font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase shrink-0">{(project.assignedBy || 'A').charAt(0)}</div>
                  <p className="text-[6.5px] lg:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest truncate">{(project.assignedBy || 'Admin')}</p>
                </div>
              </div>

              <div className="space-y-1 lg:space-y-3">
                <div className="flex justify-between items-center text-[6.5px] lg:text-xs font-black uppercase tracking-widest leading-none">
                  <span className="text-slate-400 dark:text-slate-500">Project Velocity</span>
                  <span className="text-indigo-600 dark:text-indigo-400 tabular-nums">{project.progress || 0}%</span>
                </div>
                <div className="w-full h-0.5 lg:h-2 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5 lg:pt-2">
                <div className="flex items-center gap-1 lg:gap-2 px-1 lg:px-3 py-0.5 lg:py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-sm lg:rounded-lg text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-500/20 max-w-[65%]">
                  <Clock className="w-2 h-2 lg:w-4 lg:h-4 shrink-0" />
                  <span className="text-[6.5px] lg:text-xs font-black uppercase tracking-tight truncate leading-none">Due {project.deadline ? new Date(project.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}</span>
                </div>
                <div className="flex -space-x-1 lg:-space-x-2">
                  {project.assignedTo && Array.isArray(project.assignedTo) && project.assignedTo.slice(0, 3).map((member: any, i: number) => (
                    <div key={i} className="w-3.5 h-3.5 lg:w-9 lg:h-9 rounded-full bg-indigo-50 dark:bg-indigo-900 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[5px] lg:text-xs font-black text-indigo-600 dark:text-indigo-300 shadow-sm cursor-help hover:z-10 transition-transform hover:scale-110" title={member.name}>
                      {member.name ? member.name[0] : '?'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-2.5 lg:px-8 py-1.5 lg:py-6 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-50 dark:border-slate-800/50 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-500/10 transition-colors flex items-center justify-center">
              <button className="flex items-center gap-1 lg:gap-2.5 text-[7.5px] lg:text-sm font-black text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all uppercase tracking-[0.2em] leading-none">
                Access Archives
                <ExternalLink className="w-2 h-2 lg:w-4 lg:h-4" />
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-2 lg:col-span-3 text-center py-12 lg:py-16 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
            <p className="text-slate-400 dark:text-slate-600 font-bold text-[10px] uppercase tracking-[0.2em]">Zero Command Active</p>
          </div>
        )}
      </div>
    </div >
  );
};

export default ProjectsScreen;
