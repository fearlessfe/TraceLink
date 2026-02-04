import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Search, 
  FileText, 
  Layers, 
  Zap, 
  MousePointer2, 
  LayoutList, 
  RectangleHorizontal,
  Link,
  Info,
  History,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ArrowRightLeft,
  Undo2,
  ChevronRightSquare,
  SkipForward,
  MoreHorizontal
} from 'lucide-react';
import { Project } from '../types';

interface VerificationViewProps {
  project: Project;
}

type ViewMode = 'list' | 'rapid' | 'manual';

interface TraceLinkCandidate {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceContent: string;
  targetId: string;
  targetTitle: string;
  targetContent: string;
  reason: 'ID Match' | 'Exact Text' | 'Semantic' | 'Keyword';
  confidence: number;
  highlightWords: string[];
}

const MOCK_LINKS: TraceLinkCandidate[] = [
  {
    id: 'l1',
    sourceId: 'REQ-101',
    sourceTitle: 'Reverse Radar Delay',
    sourceContent: 'When gear is shifted to R-Gear, radar must start within 200ms.',
    targetId: 'TEST-505',
    targetTitle: 'Verification of Reverse Response',
    targetContent: 'Simulate Reverse gear engagement and assert start_time < 0.2s.',
    reason: 'Semantic',
    confidence: 0.82,
    highlightWords: ['R-Gear', '200ms', 'Reverse', '0.2s']
  },
  {
    id: 'l2',
    sourceId: 'REQ-005',
    sourceTitle: 'Emergency Brake Lighting',
    sourceContent: 'Brake lights must flash during emergency deceleration. Flash frequency should be 4Hz to maximize visibility for trailing vehicles. Applies to both manual and automated emergency braking events.',
    targetId: 'CODE-882',
    targetTitle: 'brake_light_ctrl.cpp',
    targetContent: 'Implementation of emergency light flashing logic during high-G braking. Triggered by the Emergency_Brake_State flag. PWM duty cycle adjusted to meet the 4Hz requirement specification.',
    reason: 'Semantic',
    confidence: 0.94,
    highlightWords: ['Brake', 'Emergency', '4Hz', 'flash', 'flashing']
  },
  {
      id: 'l3',
      sourceId: 'REQ-012',
      sourceTitle: 'Radar Startup Latency',
      sourceContent: 'Radar shall initialize in less than 200ms after the main Power Distribution Unit (PDU) sends the wake-up signal on the CAN-FD bus.',
      targetId: 'TEST-505',
      targetTitle: 'Initialization Timer Test',
      targetContent: 'Ensure startup cycle is under 0.2s using a logic analyzer on the bus. Measure from "Wake_Signal" to "Heartbeat_Init".',
      reason: 'Semantic',
      confidence: 0.88,
      highlightWords: ['200ms', '0.2s', 'Startup', 'initialize', 'under']
  }
];

export const VerificationView: React.FC<VerificationViewProps> = ({ project }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('rapid');
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [rapidIndex, setRapidIndex] = useState(0);

  const pendingLinks = useMemo(() => 
    MOCK_LINKS.filter(l => !confirmedIds.has(l.id) && !rejectedIds.has(l.id)),
  [confirmedIds, rejectedIds]);

  const renderContent = () => {
    switch (viewMode) {
      case 'list': 
        return (
          <ListReview 
            links={pendingLinks} 
            onApprove={id => setConfirmedIds(prev => new Set(prev).add(id))} 
            onReject={id => setRejectedIds(prev => new Set(prev).add(id))} 
          />
        );
      case 'rapid': 
        return (
          <RapidReview 
            links={MOCK_LINKS} 
            currentIndex={rapidIndex}
            onApprove={() => { 
              setConfirmedIds(prev => new Set(prev).add(MOCK_LINKS[rapidIndex].id)); 
              if(rapidIndex < MOCK_LINKS.length - 1) setRapidIndex(i => i + 1); 
            }} 
            onReject={() => { 
              setRejectedIds(prev => new Set(prev).add(MOCK_LINKS[rapidIndex].id)); 
              if(rapidIndex < MOCK_LINKS.length - 1) setRapidIndex(i => i + 1); 
            }} 
            onSkip={() => setRapidIndex(i => (i + 1) % MOCK_LINKS.length)} 
            onUndo={() => rapidIndex > 0 && setRapidIndex(i => i - 1)}
          />
        );
      case 'manual': 
        return <ManualLinking project={project} />;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-4 flex items-center justify-between shrink-0">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          <ModeTab active={viewMode === 'list'} icon={<LayoutList size={16} />} label="Bulk List" onClick={() => setViewMode('list')} />
          <ModeTab active={viewMode === 'rapid'} icon={<RectangleHorizontal size={16} />} label="Rapid Review" onClick={() => setViewMode('rapid')} />
          <ModeTab active={viewMode === 'manual'} icon={<Link size={16} />} label="Manual Linking" onClick={() => setViewMode('manual')} />
        </div>
        <div className="flex items-center gap-6 px-4">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Progress</span>
              <div className="flex items-center gap-2">
                 <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(confirmedIds.size / MOCK_LINKS.length) * 100}%` }}></div>
                 </div>
                 <span className="text-xs font-black text-slate-900">{confirmedIds.size} / {MOCK_LINKS.length}</span>
              </div>
           </div>
           <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
             Commit Changes
           </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
};

const ModeTab = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
    {icon} {label}
  </button>
);

const RapidReview = ({ links, currentIndex, onApprove, onReject, onSkip, onUndo }: any) => {
  const currentLink = links[currentIndex];
  if(!currentLink) return <div className="h-full flex items-center justify-center bg-white rounded-[40px] border border-slate-100 shadow-sm"><div className="text-center"><Sparkles size={48} className="mx-auto text-indigo-200 mb-4" /><p className="text-slate-400 font-bold">All caught up!</p></div></div>;
  
  const progressPercent = ((currentIndex + 1) / links.length) * 100;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onApprove(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onReject(); }
      if (e.key.toLowerCase() === 's') { e.preventDefault(); onSkip(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onApprove, onReject, onSkip]);

  return (
    <div className="h-full flex flex-col px-8 py-4 relative bg-[#fdfdfd] rounded-[40px] border border-slate-100 overflow-hidden">
       {/* Session Header */}
       <div className="flex justify-between items-center mb-6 px-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Review Session:</span>
                <span className="text-xs font-black text-blue-600">{currentIndex + 1} / {links.length}</span>
            </div>
            <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
          
          <div className="flex gap-6">
             <ShortcutHint kbd="SPACE" action="Link" />
             <ShortcutHint kbd="DEL" action="Reject" />
             <ShortcutHint kbd="S" action="Skip" />
          </div>
       </div>

       {/* Main Review Card Container */}
       <div className="flex-1 flex flex-col justify-center items-center">
          <div className="w-full max-w-7xl h-[85%] bg-white rounded-[40px] border border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
            
            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Side: Source */}
                <div className="flex-1 p-16 flex flex-col border-r border-slate-50 relative overflow-y-auto custom-scrollbar-slim">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">{currentLink.sourceId}</div>
                        <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Source Requirement</span>
                    </div>
                    <h3 className="text-5xl font-black text-slate-800 mb-10 tracking-tight leading-tight">{currentLink.sourceTitle}</h3>
                    <div className="text-3xl font-medium text-slate-500 leading-relaxed pr-6">
                        <HighlightedText text={currentLink.sourceContent} highlights={currentLink.highlightWords} />
                    </div>
                </div>

                {/* Central AI Indicator Badge (Slim) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-full border border-slate-100 shadow-xl flex items-center justify-center">
                        <Sparkles size={28} className="text-blue-500" />
                    </div>
                    <div className="mt-4 bg-blue-600 text-white px-5 py-1.5 rounded-full text-[11px] font-black shadow-lg shadow-blue-200 uppercase tracking-widest">
                        {(currentLink.confidence * 100).toFixed(0)}% Match
                    </div>
                </div>

                {/* Right Side: Target */}
                <div className="flex-1 p-16 flex flex-col text-right items-end relative overflow-y-auto custom-scrollbar-slim bg-slate-50/10">
                    <div className="mb-6 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Verification Artifact</span>
                        <div className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">{currentLink.targetId}</div>
                    </div>
                    <h3 className="text-5xl font-black text-slate-800 mb-10 tracking-tight leading-tight">{currentLink.targetTitle}</h3>
                    <div className="text-3xl font-medium text-slate-500 leading-relaxed pl-6">
                        <HighlightedText text={currentLink.targetContent} highlights={currentLink.highlightWords} />
                    </div>
                </div>
            </div>

            {/* Bottom Action Section: Reject, Skip, Confirm */}
            <div className="h-40 bg-white border-t border-slate-100 flex items-center justify-center gap-16 px-14">
                <div className="flex items-center gap-12">
                    {/* REJECT */}
                    <button 
                      onClick={onReject}
                      className="group flex flex-col items-center gap-3"
                    >
                        <div className="w-20 h-20 rounded-full border-2 border-rose-500 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-lg shadow-rose-100 active:scale-90">
                            <X size={40} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-rose-600 transition-colors">Reject</span>
                    </button>

                    {/* SKIP */}
                    <button 
                      onClick={onSkip}
                      className="group flex flex-col items-center gap-3"
                    >
                        <div className="w-16 h-16 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-all shadow-md active:scale-90">
                            <SkipForward size={28} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Skip</span>
                    </button>

                    {/* CONFIRM */}
                    <button 
                      onClick={onApprove}
                      className="group flex flex-col items-center gap-3"
                    >
                        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white group-hover:bg-blue-700 group-hover:scale-105 transition-all shadow-2xl shadow-blue-400/30 active:scale-90 ring-4 ring-white">
                            <Check size={48} strokeWidth={3} />
                        </div>
                        <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] group-hover:text-blue-700 transition-colors mt-1">Confirm Link</span>
                    </button>
                </div>
            </div>
          </div>
       </div>

       {/* Footer Context Bar */}
       <div className="h-14 flex items-center justify-between px-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <button onClick={onUndo} className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                <Undo2 size={14} /> Undo Last Action
            </button>
            <div className="flex items-center gap-4">
                <span>Reason: <span className="text-slate-500">{currentLink.reason}</span></span>
                <div className="h-4 w-px bg-slate-100"></div>
                <button className="flex items-center gap-2 hover:text-slate-500 transition-colors">
                    <Info size={14} /> See Details
                </button>
            </div>
       </div>
    </div>
  );
};

const ShortcutHint = ({ kbd, action }: { kbd: string, action: string }) => (
    <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-black text-slate-400 font-mono tracking-tighter">{kbd}</span>
        <span className="text-[10px] font-bold text-slate-400">{action}</span>
    </div>
);

const ListReview = ({ links, onApprove, onReject }: { links: TraceLinkCandidate[], onApprove: (id: string) => void, onReject: (id: string) => void }) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  const grouped = useMemo(() => {
    const map: Record<string, TraceLinkCandidate[]> = {};
    links.forEach(l => {
      if(!map[l.reason]) map[l.reason] = [];
      map[l.reason].push(l);
    });
    return Object.entries(map);
  }, [links]);

  return (
    <div className="h-full overflow-y-auto bg-white rounded-[32px] border border-slate-100 shadow-sm custom-scrollbar">
      <div className="p-8 border-b flex justify-between items-center bg-slate-50/30">
        <div>
          <h3 className="text-xl font-black text-slate-900">Bulk Verification</h3>
          <p className="text-sm text-slate-500 font-medium">Scan AI-suggested links and confirm in groups.</p>
        </div>
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100"><Zap size={14} /> Approve All Groups</button>
      </div>

      <div className="divide-y divide-slate-100">
        {grouped.map(([reason, groupLinks]) => (
          <div key={reason} className="animate-in fade-in duration-500">
            <button 
              onClick={() => setCollapsedGroups(s => { const n = new Set(s); if(n.has(reason)) n.delete(reason); else n.add(reason); return n; })}
              className="w-full flex items-center justify-between px-8 py-4 bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                 {collapsedGroups.has(reason) ? <ChevronRight size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                 <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{reason} ({groupLinks.length})</span>
                 <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-black rounded-full">AI RECOMMENDED</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); groupLinks.forEach(l => onApprove(l.id)); }} className="text-[10px] font-black text-blue-600 uppercase hover:underline">Approve Group</button>
            </button>
            
            {!collapsedGroups.has(reason) && (
              <table className="w-full table-fixed">
                <thead className="bg-white border-b border-slate-50">
                   <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-8 py-3 text-left w-12"></th>
                      <th className="px-4 py-3 text-left w-1/3">Source Artifact</th>
                      <th className="px-4 py-3 text-center w-20">Link</th>
                      <th className="px-4 py-3 text-left w-1/3">Target Artifact</th>
                      <th className="px-4 py-3 text-right w-40">Reasoning</th>
                      <th className="px-8 py-3 w-32"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groupLinks.map(link => (
                    <tr key={link.id} className="hover:bg-blue-50/30 transition-colors group">
                       <td className="px-8 py-5"><input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></td>
                       <td className="px-4 py-5">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-slate-400 mb-1">{link.sourceId}</span>
                             <p className="text-xs font-bold text-slate-800 line-clamp-1">{link.sourceTitle}</p>
                             <div className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic font-medium">
                                <HighlightedText text={link.sourceContent} highlights={link.highlightWords} />
                             </div>
                          </div>
                       </td>
                       <td className="px-4 py-5 text-center"><Sparkles size={14} className="text-indigo-400 mx-auto" /></td>
                       <td className="px-4 py-5">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-slate-400 mb-1">{link.targetId}</span>
                             <p className="text-xs font-bold text-slate-800 line-clamp-1">{link.targetTitle}</p>
                             <div className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic font-medium">
                                <HighlightedText text={link.targetContent} highlights={link.highlightWords} />
                             </div>
                          </div>
                       </td>
                       <td className="px-4 py-5 text-right">
                          <div className="flex flex-col items-end">
                             <span className={`text-[10px] font-black ${link.confidence > 0.95 ? 'text-emerald-500' : 'text-amber-500'}`}>{(link.confidence * 100).toFixed(0)}% Match</span>
                             <span className="text-[9px] font-medium text-slate-400 mt-1">{link.reason}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5 text-right">
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => onReject(link.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><X size={14} /></button>
                             <button onClick={() => onApprove(link.id)} className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"><Check size={14} /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ManualLinking = ({ project }: any) => {
  const [selectedOrphan, setSelectedOrphan] = useState<any | null>(null);

  return (
    <div className="h-full flex gap-6">
       {/* Left: Orphans */}
       <div className="w-1/3 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
             <h3 className="text-base font-black text-slate-900">Orphan Requirements</h3>
             <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full">12 REMAINING</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
             {[1,2,3,4,5,6].map(i => (
                <div 
                  key={i} 
                  onClick={() => setSelectedOrphan(i)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedOrphan === i ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-50 hover:border-slate-200'}`}
                >
                   <span className="text-[10px] font-black text-slate-400 uppercase mb-1 block">REQ-0{i+40}</span>
                   <p className="text-xs font-bold text-slate-800 leading-tight">ADAS Dynamic Object Calibration for low-light environments</p>
                </div>
             ))}
          </div>
       </div>

       {/* Right: Recommendations */}
       <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
          {!selectedOrphan ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                <Link size={48} className="mb-4" />
                <p className="font-black text-slate-400 uppercase tracking-widest">Select an artifact to link</p>
             </div>
          ) : (
            <>
              <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5"><Sparkles size={12} /> AI Recommended Top Matches</span>
                     <div className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1 text-[10px] font-bold text-slate-500">
                        <Search size={10} className="mr-2" />
                        <input type="text" placeholder="Hybrid Search..." className="outline-none bg-transparent" />
                     </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-400">Context: <span className="text-slate-900">REQ-041 Dynamic Calibration...</span></h4>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                 <ManualCard id="T-01" title="Low light simulation test suite" confidence={92} reason="Parameter Match (low-light)" />
                 <ManualCard id="T-05" title="Environmental calibration logic" confidence={78} reason="Semantic Match" />
                 <ManualCard id="T-12" title="Static object verification" confidence={45} reason="Weak association" />
                 
                 <div className="p-8 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-center gap-3">
                    <p className="text-xs font-medium text-slate-400">Don't see a match?</p>
                    <button className="flex items-center gap-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all">
                       <Plus size={14} /> Create Placeholder Node
                    </button>
                 </div>
              </div>
            </>
          )}
       </div>
    </div>
  );
};

const ManualCard = ({ id, title, confidence, reason }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group flex items-center gap-6">
     <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</span>
           <span className={`text-[10px] font-black px-2 py-0.5 rounded ${confidence > 90 ? 'bg-emerald-50 text-emerald-600' : confidence > 70 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
             {confidence}% Match
           </span>
        </div>
        <h4 className="text-sm font-black text-slate-900 mb-1 leading-tight">{title}</h4>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Reason: {reason}</p>
     </div>
     <button className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90">
        <Link size={18} />
     </button>
  </div>
);

const HighlightedText = ({ text, highlights }: { text: string, highlights: string[] }) => {
  const parts = useMemo(() => {
    if (!highlights || highlights.length === 0) return [text];
    const escaped = highlights
      .filter(h => h.trim().length > 0)
      .map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (escaped.length === 0) return [text];
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    return text.split(regex);
  }, [text, highlights]);

  return (
    <>
      {parts.map((part, i) => {
        const isHighlight = highlights.some(h => h.toLowerCase() === part.toLowerCase());
        const isValue = /^\d+(\.\d+)?[a-zA-Z/]+$/.test(part) || /\d+(\.\d+)?s/.test(part) || /\d+(\.\d+)?ms/.test(part);

        if (isHighlight) {
            let colorClass = "bg-emerald-100 text-emerald-800";
            if (isValue) colorClass = "bg-orange-100 text-orange-800";
            
            return (
              <span key={i} className={`${colorClass} px-2 py-0.5 rounded-md font-bold shadow-sm inline-block mx-1`}>
                {part}
              </span>
            );
        }
        return part;
      })}
    </>
  );
};
