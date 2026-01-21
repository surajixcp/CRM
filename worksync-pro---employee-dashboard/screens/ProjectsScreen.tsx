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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Project Command Center</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] mt-1.5 uppercase tracking-tight">Personnel sprint registry & delivery flow</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="QUERY REGISTRY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 w-56 shadow-sm transition-all outline-none placeholder:text-slate-400 uppercase"
            />
          </div>
          <button className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-all shadow-sm active:scale-95">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredProjects.length > 0 ? filteredProjects.map((project, idx) => (
          <div
            key={project.id || project._id}
            className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-xl dark:shadow-2xl hover:border-blue-500/30 transition-all group overflow-hidden animate-scale-in"
          >
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex gap-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${project.status === 'active' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20' :
                    project.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                      'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700'
                    }`}>
                    {project.status || 'Active'}
                  </span>
                  <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight mb-1 uppercase tracking-tight">{project.name}</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[7px] font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">{(project.assignedBy || 'Admin').charAt(0)}</div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Supervisor</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest leading-none">
                  <span className="text-slate-400 dark:text-slate-500">Velocity</span>
                  <span className="text-blue-600 dark:text-blue-400 tabular-nums">{project.progress || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out group-hover:opacity-80"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-500/20">
                  <Clock className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase tracking-tight">Due {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex -space-x-2">
                  {project.assignedTo && Array.isArray(project.assignedTo) && project.assignedTo.map((member: any, i: number) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900 border border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-blue-600 dark:text-blue-300 shadow-sm cursor-help" title={member.name}>
                      {member.name ? member.name[0] : '?'}
                    </div>
                  ))}
                  {(!project.assignedTo || project.assignedTo.length === 0) && (
                    <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 border border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-400 shadow-sm">0</div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-50 dark:border-slate-800/50 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-500/10 transition-colors flex items-center justify-center">
              <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all uppercase tracking-widest">
                Full Details
                <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-1 md:col-span-2 xl:col-span-3 text-center py-16 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed">
            <p className="text-slate-400 dark:text-slate-600 font-bold text-xs uppercase tracking-widest">No assigned projects found.</p>
          </div>
        )}
      </div>
    </div >
  );
};

export default ProjectsScreen;
