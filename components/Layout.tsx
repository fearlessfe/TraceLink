
import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Settings, 
  HelpCircle, 
  LogOut,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { ViewType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  return (
    <div className="flex h-screen w-full text-slate-700">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 relative">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-900">TraceLink</h1>
              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">AI Powered</span>
            </div>
          </div>
          <button className="p-1 hover:bg-slate-100 rounded-full text-slate-400 absolute -right-3 top-7 bg-white border border-slate-200 shadow-sm transition-transform hover:scale-110">
            <ChevronLeft size={16} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-6">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">Menu</p>
            <div className="space-y-1">
              <NavItem 
                icon={<LayoutDashboard size={20} />} 
                label="Overview" 
                active={currentView === 'overview'} 
                onClick={() => onViewChange('overview')} 
              />
              <NavItem 
                icon={<FolderKanban size={20} />} 
                label="Projects" 
                active={currentView === 'projects'} 
                onClick={() => onViewChange('projects')} 
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">System</p>
            <div className="space-y-1">
              <NavItem icon={<Settings size={20} />} label="Settings" onClick={() => {}} />
              <NavItem icon={<HelpCircle size={20} />} label="Help & Support" onClick={() => {}} />
            </div>
          </div>
        </nav>

        {/* AI Engine Status */}
        <div className="p-4 mx-4 mb-4 bg-slate-900 rounded-xl relative overflow-hidden group cursor-pointer transition-all hover:bg-slate-800">
          <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
            <Sparkles size={40} className="text-blue-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-green-500 uppercase">System Online</span>
            </div>
            <p className="text-white font-bold text-sm">AI Engine v2.5</p>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold">
              ZP
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-900">Zhen Peng</p>
              <p className="text-xs text-slate-400">Software Engineer</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] rotate-[-25deg] flex flex-wrap gap-x-32 gap-y-24 justify-center items-center overflow-hidden z-[-1] select-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="text-xl font-bold whitespace-nowrap">KI-BJ-0794 zhenp9890 80-30-49-99-73-85</div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
      active 
        ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm ring-1 ring-blue-100' 
        : 'text-slate-500 hover:bg-slate-50'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);
