import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Search, 
  Send, 
  ArrowRight, 
  BookOpen, 
  ChevronRight, 
  ExternalLink, 
  Sparkles, 
  MessageSquare,
  Network as NetworkIcon,
  Layers,
  FileText,
  User,
  Zap,
  RefreshCcw,
  ArrowLeft
} from 'lucide-react';
import { Project, ManagedDocument } from '../types';

interface AIChatViewProps {
  project: Project;
  documents: ManagedDocument[];
}

interface QAHistory {
  query: string;
  response: string;
  sources: { id: string; title: string; content: string; url?: string }[];
}

export const AIChatView: React.FC<AIChatViewProps> = ({ project, documents }) => {
  const [searchState, setSearchState] = useState<'idle' | 'searching' | 'results'>('idle');
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<QAHistory[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  // Mesh Graph Data based on project documents
  const graphData = useMemo(() => {
    const nodes: any[] = documents.map((doc, i) => ({
        id: doc.id,
        name: doc.name,
        type: 'doc',
        group: 1
    }));

    // Add some requirement/entity nodes for visual complexity
    for (let i = 0; i < 20; i++) {
        nodes.push({ id: `ent-${i}`, name: `Entity ${i}`, type: 'entity', group: 2 });
    }

    const links: any[] = [];
    nodes.forEach((node, i) => {
        if (node.type === 'entity') {
            // Link entities to random docs
            const docNodes = nodes.filter(n => n.type === 'doc');
            if (docNodes.length > 0) {
                const randomDoc = docNodes[Math.floor(Math.random() * docNodes.length)];
                links.push({ source: node.id, target: randomDoc.id });
            }
        }
    });

    return { nodes, links };
  }, [documents]);

  useEffect(() => {
    if (searchState !== 'idle' || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const g = svg.append("g");
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = g.append("g")
      .attr("stroke", "#6366f1")
      .attr("stroke-opacity", 0.15)
      .selectAll("line")
      .data(graphData.links)
      .join("line");

    const node = g.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g");

    node.append("circle")
      .attr("r", (d: any) => d.type === 'doc' ? 6 : 3)
      .attr("fill", (d: any) => d.type === 'doc' ? "#4f46e5" : "#94a3b8")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    node.append("text")
      .text((d: any) => d.type === 'doc' ? d.name : "")
      .attr("dx", 12)
      .attr("dy", 4)
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#64748b")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    const zoom = d3.zoom().scaleExtent([0.5, 3]).on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom as any);

    return () => { simulation.stop(); };
  }, [searchState, graphData]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearchState('searching');
    
    setTimeout(() => {
      const newQA: QAHistory = {
        query: query,
        response: `Based on your request regarding "${query}", I've analyzed the system requirements and architectural blueprints. 
        The current implementation follows the decentralized micro-module strategy [1]. Specifically, the perception module [2] 
        handles environmental data within 150m, while the decision engine ensures a latency of <50ms for safety-critical events [3]. 
        The traceability coverage for these requirements is currently at 98.4%.`,
        sources: [
          { id: '1', title: 'System Architecture v2.pdf', content: 'Describes the decentralized nature of the ADS modules and how they interact via shared memory layers.' },
          { id: '2', title: 'Perception Requirements.docx', content: 'Section 4.2 states the identification range for static objects is 150m with 99.9% confidence.' },
          { id: '3', title: 'Safety Logic Spec.md', content: 'Safety critical latency must not exceed 50ms to guarantee collision avoidance at highway speeds.' }
        ]
      };
      setHistory([newQA, ...history]);
      setSearchState('results');
    }, 1500);
  };

  if (searchState === 'idle' || (searchState === 'searching' && history.length === 0)) {
    return (
      <div className="h-full flex flex-col relative overflow-hidden bg-white rounded-[40px] border border-slate-100 shadow-sm animate-in fade-in duration-500">
        {/* Full-screen Background Graph */}
        <div className="absolute inset-0 z-0">
           <svg ref={svgRef} className="w-full h-full" />
           <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/60 pointer-events-none"></div>
        </div>
        
        {/* Overlay Branding */}
        <div className="relative z-10 p-12 pointer-events-none">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-200">
                    <Sparkles size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Knowledge Assistant</h2>
            </div>
            <p className="text-sm font-medium text-slate-400">Ask the system about "{project.name}" specifications and links.</p>
        </div>

        {/* Floating Bottom Input Bar */}
        <div className="absolute bottom-12 left-0 right-0 z-20 px-12 flex justify-center">
          <div className="w-full max-w-3xl">
              <form 
                onSubmit={handleSearch}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xl rounded-[32px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center bg-white/90 backdrop-blur-xl border-2 border-slate-200/50 rounded-[32px] p-2 shadow-2xl shadow-indigo-100 group-focus-within:border-indigo-500/30 transition-all">
                  <div className="pl-5 text-slate-400">
                    <Search size={24} />
                  </div>
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search engineering knowledge or trace dependencies..."
                    className="flex-1 bg-transparent border-none outline-none px-4 py-5 text-lg font-semibold text-slate-800 placeholder:text-slate-300"
                  />
                  <button 
                    type="submit"
                    disabled={!query || searchState === 'searching'}
                    className="w-14 h-14 bg-indigo-600 text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {searchState === 'searching' ? <RefreshCcw size={22} className="animate-spin" /> : <Send size={22} />}
                  </button>
                </div>
              </form>

              <div className="mt-6 flex justify-center gap-3">
                <SuggestionChip text="Explain architecture" onClick={() => { setQuery("Explain the system architecture"); }} />
                <SuggestionChip text="Show traceability gaps" onClick={() => { setQuery("Show me where traceability is missing"); }} />
                <SuggestionChip text="Safety requirements" onClick={() => { setQuery("List all safety-critical requirements"); }} />
              </div>
          </div>
        </div>
      </div>
    );
  }

  // Q&A Result Page (DeepWiki Style)
  const currentQA = history[0];

  return (
    <div className="h-full flex flex-col bg-slate-50/30 animate-in slide-in-from-bottom-4 duration-500 rounded-t-[40px] overflow-hidden border border-slate-100">
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between shadow-sm z-20 shrink-0">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => { setSearchState('idle'); setQuery(''); }} 
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <span className="text-sm font-bold text-slate-800">Assisted Insight</span>
            </div>
         </div>
         <div className="flex-1 max-w-xl mx-8">
            <div className="relative flex items-center bg-slate-50 rounded-full px-4 py-2 border border-slate-200/50">
              <Search size={14} className="text-slate-400" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-transparent border-none outline-none px-3 py-1 text-sm font-medium w-full text-slate-700"
              />
            </div>
         </div>
         <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
           <ExternalLink size={14} /> Source View
         </button>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Chat Flow */}
        <div className="flex-[1.5] overflow-y-auto p-12 space-y-12 custom-scrollbar bg-white">
          <div className="max-w-3xl mx-auto space-y-12">
            
            <div className="flex gap-6">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 text-slate-400">
                <User size={20} />
              </div>
              <div className="flex-1 pt-1">
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  {currentQA.query}
                </h2>
              </div>
            </div>

            <div className="flex gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 text-white shadow-lg shadow-indigo-500/20">
                <Sparkles size={20} />
              </div>
              <div className="flex-1 pt-1 space-y-8">
                <div className="text-slate-700 leading-relaxed font-medium text-base">
                  {currentQA.response.split(/(\[\d+\])/).map((part, i) => {
                    if (part.match(/\[\d+\]/)) {
                      return <span key={i} className="text-indigo-600 font-bold cursor-help bg-indigo-50 px-1 rounded mx-0.5 hover:bg-indigo-100 transition-colors">{part}</span>;
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
                
                <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In-depth Analysis:</span>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all">Open Mesh View</button>
                    <button className="px-4 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all">Compliance Audit</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sources / References */}
        <div className="flex-1 bg-slate-50/50 border-l border-slate-100 overflow-y-auto p-12 custom-scrollbar">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen size={20} className="text-slate-400" />
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Evidence & Sources</h3>
            </div>
            <div className="h-px flex-1 bg-slate-100 mx-4"></div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{currentQA.sources.length} Items</span>
          </div>

          <div className="space-y-6">
            {currentQA.sources.map((source, idx) => (
              <div 
                key={source.id} 
                className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all group cursor-pointer animate-in fade-in slide-in-from-right-4"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-[11px] font-black text-slate-500 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                      {idx + 1}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Document</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" />
                  {source.title}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  {source.content}
                </p>
                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Verified</span>
                   </div>
                   <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">View Fragment</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-10 rounded-[40px] bg-slate-900 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
              <NetworkIcon size={140} />
            </div>
            <div className="relative z-10">
              <Zap size={28} className="mb-6 text-indigo-400" />
              <h4 className="text-xl font-bold mb-3 tracking-tight">Generate Mesh Map</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-8">
                Build a visual traceability network specifically for this query's relevant entities.
              </p>
              <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30">
                Create Dynamic Graph
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuggestionChip: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
  <button 
    onClick={onClick}
    className="px-6 py-3 bg-white/70 backdrop-blur-md hover:bg-white border border-slate-200/50 rounded-2xl text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-95"
  >
    {text}
  </button>
);
