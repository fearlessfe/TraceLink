
import React, { useState } from 'react';
import { X, FileText, Share2, ChevronDown, Check } from 'lucide-react';
import { ProjectType } from '../types';

interface NewProjectModalProps {
  onClose: () => void;
  onSubmit: (project: { name: string; description: string; type: ProjectType; members: string[] }) => void;
}

const SAMPLE_MEMBERS = [
  { id: '1', name: 'Alex Johnson', role: 'Product Manager' },
  { id: '2', name: 'Sarah Chen', role: 'Lead Architect' },
  { id: '3', name: 'Michael Wu', role: 'QA Engineer' },
  { id: '4', name: 'Emma Wilson', role: 'Security Analyst' },
  { id: '5', name: 'James Kim', role: 'Fullstack Dev' },
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ProjectType>('Traceability Project');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSubmit({ name, description, type, members: selectedMembers });
  };

  const toggleMember = (memberName: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberName) 
        ? prev.filter(m => m !== memberName) 
        : [...prev, memberName]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-slate-100">
        <div className="flex justify-between items-center p-8 border-b border-slate-50 bg-slate-50/30">
          <h2 className="text-2xl font-bold text-slate-800">Create New Project</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Project Name <span className="text-rose-500">*</span></label>
            <div className="relative">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                placeholder="e.g. Apollo Guidance"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">{name.length}/20</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <div className="relative">
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                placeholder="Briefly describe the project goals..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm resize-none"
              />
              <span className="absolute right-4 bottom-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">{description.length}/200</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Project Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('Knowledge Base')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                  type === 'Knowledge Base' 
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${type === 'Knowledge Base' ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                  <FileText size={24} />
                </div>
                <span className={`text-xs font-bold ${type === 'Knowledge Base' ? 'text-slate-800' : 'text-slate-400'}`}>Knowledge Base</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Traceability Project')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                  type === 'Traceability Project' 
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${type === 'Traceability Project' ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                  <Share2 size={24} />
                </div>
                <span className={`text-xs font-bold ${type === 'Traceability Project' ? 'text-slate-800' : 'text-slate-400'}`}>Traceability Project</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-sm font-bold text-slate-700">Project Members</label>
            <div 
              onClick={() => setShowMemberDropdown(!showMemberDropdown)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-100/50 cursor-pointer transition-colors"
            >
              <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-6">
                {selectedMembers.length === 0 ? (
                  <span className="text-slate-400">Select team members...</span>
                ) : (
                  selectedMembers.map(m => (
                    <span key={m} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {m}
                    </span>
                  ))
                )}
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${showMemberDropdown ? 'rotate-180' : ''}`} />
            </div>

            {showMemberDropdown && (
              <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-white border border-slate-100 shadow-xl rounded-2xl p-2 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {SAMPLE_MEMBERS.map(member => (
                    <div 
                      key={member.id}
                      onClick={() => toggleMember(member.name)}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-[10px] font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{member.name}</p>
                          <p className="text-[10px] text-slate-400">{member.role}</p>
                        </div>
                      </div>
                      {selectedMembers.includes(member.name) && (
                        <Check size={14} className="text-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-6 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!name}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
