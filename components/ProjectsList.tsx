
import React from 'react';
import { Plus, Users, Calendar, ArrowUpRight, Search } from 'lucide-react';
import { Project } from '../types';

interface ProjectsListProps {
  projects: Project[];
  onCreateProject: () => void;
  onSelectProject: (project: Project) => void;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({ projects, onCreateProject, onSelectProject }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Projects</h2>
          <p className="text-slate-500 mt-1">Manage and track your engineering projects.</p>
        </div>
        <button 
          onClick={onCreateProject}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search projects..." 
          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => onSelectProject(project)}
            className="group cursor-pointer bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  project.type === 'Traceability Project' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {project.type}
                </span>
                <button className="text-slate-300 group-hover:text-blue-500 transition-colors">
                  <ArrowUpRight size={20} />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">{project.name}</h3>
              <p className="text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                {project.description}
              </p>
            </div>

            <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
              <div className="flex -space-x-2">
                {project.members.length > 0 ? project.members.map((member, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {member[0]}
                  </div>
                )) : (
                   <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">?</div>
                )}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">
                  +3
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <Calendar size={12} />
                Updated {project.lastUpdated}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
