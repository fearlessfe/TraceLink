import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  FileText, 
  Share2, 
  Layout, 
  Eye, 
  Activity, 
  BarChart3,
  ExternalLink,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCcw,
  GitBranch,
  Database,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  FileCode,
  Play,
  Layers,
  Zap,
  Box,
  FileCheck,
  Inbox,
  Link as LinkIcon,
  File as FileIcon
} from 'lucide-react';
import { Project, DataSource, DataSourceType, ManagedDocument, DocStatus } from '../types';
import { Neo4jGraphView } from './Neo4jGraphView';
import { ExamplePlayground } from './ExamplePlayground';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

// Global mock data to preserve for existing projects
const MOCK_DATA_SOURCES: DataSource[] = [
  { id: 'ds-1', name: 'local', type: 'LOCAL', status: 'Synced', lastUpdated: '2025/12/21' }
];

const INITIAL_DOCS: ManagedDocument[] = [
  { id: 'd1', name: 'requirement.docx', source: 'local', type: 'docx', status: 'STRUCTURED', lastModified: '2025/12/21' },
  { id: 'd2', name: 'architect.md', source: 'local', type: 'md', status: 'STRUCTURED', lastModified: '2025/12/21' },
  { id: 'd3', name: 'test_cases.xlsx', source: 'local', type: 'xlsx', status: 'STRUCTURED', lastModified: '2025/12/22' },
  { id: 'd4', name: 'detail_design.docx', source: 'local', type: 'docx', status: 'STRUCTURED', lastModified: '2025/12/22' },
];

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack }) => {
  const isExistingProject = project.id === '1' || project.id === '2';

  const [activeTab, setActiveTab] = useState('overview');
  const [dataSources, setDataSources] = useState<DataSource[]>(isExistingProject ? MOCK_DATA_SOURCES : []);
  const [documents, setDocuments] = useState<ManagedDocument[]>(isExistingProject ? INITIAL_DOCS : []);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isStructuringModalOpen, setIsStructuringModalOpen] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  
  const [parsingProgressDoc, setParsingProgressDoc] = useState<ManagedDocument | null>(null);
  const [editingResultDoc, setEditingResultDoc] = useState<ManagedDocument | null>(null);
  const [viewingStructuredDoc, setViewingStructuredDoc] = useState<ManagedDocument | null>(null);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Eye size={16} /> },
    { id: 'datasources', label: 'Data Sources', icon: <Activity size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    { id: 'example', label: 'Example', icon: <Zap size={16} /> },
    { id: 'graph', label: 'Knowledge Graph', icon: <NetworkIcon size={16} /> },
    { id: 'traceability', label: 'Traceability', icon: <Share2 size={16} /> },
  ];

  const handleConnectSource = (name: string, type: DataSourceType, files: File[]) => {
    const source: DataSource = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || (type === 'LOCAL' ? 'Local Upload' : 'Untitled Source'),
      type: type,
      status: 'Synced',
      lastUpdated: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    };
    
    setDataSources(prev => [...prev, source]);
    
    if (type === 'LOCAL' && files.length > 0) {
      const newDocs: ManagedDocument[] = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        source: source.name,
        type: file.name.split('.').pop() || 'unknown',
        status: 'ACTIVE',
        lastModified: new Date(file.lastModified).toISOString(),
      }));
      setDocuments(prev => [...prev, ...newDocs]);
    }
    
    setIsConnectModalOpen(false);
  };

  const startStructuring = async () => {
    const pendingDocs = documents.filter(d => d.status === 'PARSED_CONFIRMED');
    if (pendingDocs.length === 0) return;
    setDocuments(docs => docs.map(d => d.status === 'PARSED_CONFIRMED' ? { ...d, status: 'STRUCTURING' } : d));
    setIsStructuringModalOpen(false);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setDocuments(docs => docs.map(d => d.status === 'STRUCTURING' ? { ...d, status: 'STRUCTURED' } : d));
  };

  const isDataReady = documents.some(d => d.status === 'STRUCTURED');

  const renderTabContent = () => {
    if (parsingProgressDoc) return <ParsingProgressView doc={parsingProgressDoc} onClose={() => setParsingProgressDoc(null)} />;
    if (editingResultDoc) return (
      <ParseResultDetailView 
        doc={editingResultDoc} 
        onClose={() => setEditingResultDoc(null)} 
        onConfirm={() => {
          setDocuments(docs => docs.map(d => d.id === editingResultDoc.id ? {...d, status: 'PARSED_CONFIRMED'} : d));
          setEditingResultDoc(null);
        }}
      />
    );
    if (viewingStructuredDoc) return (
      <StructuredResultDetailView 
        doc={viewingStructuredDoc} 
        allDocs={documents}
        onClose={() => setViewingStructuredDoc(null)}
        onConfirm={() => setViewingStructuredDoc(null)}
      />
    );

    switch (activeTab) {
      case 'overview': 
        return <OverviewView project={project} isDataReady={isDataReady} />;
      case 'datasources':
        return (
          <DataSourcesListView 
            sources={dataSources} 
            onConnect={() => setIsConnectModalOpen(true)}
            onViewDetails={setSelectedDataSource}
            onDelete={(id) => setDataSources(prev => prev.filter(s => s.id !== id))}
          />
        );
      case 'documents':
        return (
          <DocumentsManagementView 
            documents={documents} 
            setDocuments={setDocuments}
            onViewProgress={setParsingProgressDoc}
            onViewResult={setEditingResultDoc}
            onViewStructuredResult={setViewingStructuredDoc}
            onOpenStructuringModal={() => setIsStructuringModalOpen(true)}
          />
        );
      case 'example':
        return <ExamplePlayground />;
      case 'graph':
        return <Neo4jGraphView />;
      case 'traceability':
        return (
             <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm min-h-[600px] flex flex-col">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Full Traceability Matrix</h3>
                    <p className="text-sm text-slate-500">Comprehensive view of all artifact linkages.</p>
                </div>
                <div className="flex-1 border rounded-2xl bg-slate-50/50 p-4">
                    <TraceabilityGraph />
                </div>
             </div>
        );
      default:
        return <div className="py-20 text-center text-slate-400">Under construction</div>;
    }
  };

  const isAnyDetailOpen = !!(parsingProgressDoc || editingResultDoc || viewingStructuredDoc);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {!isAnyDetailOpen && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{project.name}</h2>
              <p className="text-xs text-slate-400 mt-1">Updated: {project.lastUpdated}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
            <Download size={14} /> Export Report
          </button>
        </div>
      )}

      {!isAnyDetailOpen && (
        <div className="flex items-center gap-1 border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-blue-600' 
                  : 'text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className={isAnyDetailOpen ? "" : "mt-6"}>
        {renderTabContent()}
      </div>

      {isConnectModalOpen && (
        <ConnectDataSourceModal 
          onClose={() => setIsConnectModalOpen(false)} 
          onSubmit={handleConnectSource} 
        />
      )}

      {isStructuringModalOpen && (
        <StructuringModal 
          pendingDocs={documents.filter(d => d.status === 'PARSED_CONFIRMED')}
          onClose={() => setIsStructuringModalOpen(false)} 
          onConfirm={startStructuring}
        />
      )}
    </div>
  );
};

// Renamed Network icon to avoid conflict if any, although in this file scope it should be fine.
// Added explicit import above.
import { Network as NetworkIcon } from 'lucide-react';

// --- Data Sources View ---

const DataSourcesListView: React.FC<{
  sources: DataSource[];
  onConnect: () => void;
  onViewDetails: (source: DataSource) => void;
  onDelete: (id: string) => void;
}> = ({ sources, onConnect, onViewDetails, onDelete }) => (
  <div className="space-y-6 px-2">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-2xl font-bold text-slate-800">Data Sources</h3>
        <p className="text-sm text-slate-500 mt-1">Manage inputs from Jira, GitLab, and local files.</p>
      </div>
      <button 
        onClick={onConnect} 
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-blue-700 transition-all"
      >
        <Plus size={18} /> Connect New Source
      </button>
    </div>
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50">
          <tr>
            <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Source Name</th>
            <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Type</th>
            <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
            <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Last Updated</th>
            <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sources.length === 0 ? (
            <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm italic">No data sources.</td></tr>
          ) : (
            sources.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400">
                      {s.type === 'LOCAL' ? <FileText size={18} /> : s.type === 'GIT' ? <GitBranch size={18} /> : <Database size={18} />}
                    </div>
                    <span className="text-sm font-bold text-slate-900">{s.name}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">{s.type}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                    <CheckCircle2 size={14} /> {s.status}
                  </div>
                </td>
                <td className="px-8 py-6 text-center text-sm text-slate-500 font-medium">{s.lastUpdated}</td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onViewDetails(s)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all"><Eye size={14} /> View Details</button>
                    <button onClick={() => onDelete(s.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Connect Modal ---

const ConnectDataSourceModal: React.FC<{ 
  onClose: () => void; 
  onSubmit: (name: string, type: DataSourceType, files: File[]) => void 
}> = ({ onClose, onSubmit }) => {
  const [type, setType] = useState<DataSourceType>('LOCAL');
  const [name, setName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sourceTypes = [
    { id: 'LOCAL', label: 'Local Files', icon: <FileText size={24} />, description: 'Upload bulk documents' },
    { id: 'GIT', label: 'Git Repository', icon: <GitBranch size={24} />, description: 'Connect GitLab/GitHub' },
    { id: 'JIRA', label: 'Jira', icon: <Database size={24} />, description: 'Sync system issues' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files!)]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 flex items-center gap-4 border-b border-slate-100">
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><ArrowLeft size={18} /></button>
          <h2 className="text-xl font-bold text-slate-800">Connect New Data Source</h2>
        </div>
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Source Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Requirements Doc" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Source Type</label>
            <div className="grid grid-cols-3 gap-4">
              {sourceTypes.map((t) => (
                <button key={t.id} onClick={() => setType(t.id as DataSourceType)} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all ${type === t.id ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/5 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                  <div className={`${type === t.id ? 'text-blue-600' : 'text-slate-400'}`}>{t.icon}</div>
                  <div className="text-center"><p className={`text-xs font-bold ${type === t.id ? 'text-blue-600' : 'text-slate-700'}`}>{t.label}</p></div>
                </button>
              ))}
            </div>
          </div>
          {type === 'LOCAL' && (
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Upload File</label>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
              <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`flex flex-col items-center justify-center gap-4 py-10 px-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${selectedFiles.length > 0 ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/20'}`}>
                <div className={`p-3 rounded-full bg-slate-50 text-slate-400 transition-colors`}><Upload size={28} /></div>
                <div className="text-center space-y-1"><p className="text-sm font-medium text-slate-800">Click or drag file to upload</p><p className="text-xs text-slate-400">Support for single or bulk upload.</p></div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Selected Files ({selectedFiles.length})</p>
                   <div className="grid grid-cols-1 gap-2">
                     {selectedFiles.map((file, idx) => (
                       <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm group animate-in slide-in-from-left-2 duration-200">
                         <div className="flex items-center gap-3"><div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><FileIcon size={14} /></div><p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{file.name}</p></div>
                         <button onClick={(e) => { e.stopPropagation(); setSelectedFiles(prev => prev.filter((_, i) => i !== idx)); }} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-all"><X size={14} /></button>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-6">
          <button onClick={onClose} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
          <button disabled={!name || (type === 'LOCAL' && selectedFiles.length === 0)} onClick={() => onSubmit(name, type, selectedFiles)} className="px-10 py-3.5 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">Connect Source</button>
        </div>
      </div>
    </div>
  );
};

// --- Traceability Network Map ---

const TraceabilityGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const data = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    for (let i = 1; i <= 18; i++) nodes.push({ id: `REQ-${i}`, type: 'Requirement', name: `REQ-${i}` });
    for (let i = 1; i <= 8; i++) nodes.push({ id: `ARCH-${i}`, type: 'Architecture', name: `ARCH-${i}` });
    for (let i = 1; i <= 37; i++) nodes.push({ id: `DD-${i}`, type: 'Design', name: `DD-${i}` });
    for (let i = 1; i <= 43; i++) nodes.push({ id: `TC-${i}`, type: 'Test', name: `TC-${i}` });
    nodes.filter(n => n.type === 'Requirement').forEach((n, idx) => {
      links.push({ source: n.id, target: `ARCH-${(idx % 8) + 1}` });
      links.push({ source: n.id, target: `TC-${(idx * 2) % 43 + 1}` });
    });
    nodes.filter(n => n.type === 'Architecture').forEach((n, idx) => {
      const start = idx * 4 + 1;
      const end = Math.min(start + 4, 37);
      for (let j = start; j <= end; j++) links.push({ source: n.id, target: `DD-${j}` });
    });
    return { nodes, links };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const width = svgRef.current.clientWidth;
    const height = 450;
    const g = svg.append("g");
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(15));
    const link = g.append("g").attr("stroke", "#e2e8f0").attr("stroke-opacity", 0.4).selectAll("line").data(data.links).join("line").attr("stroke-width", 1);
    const node = g.append("g").selectAll("circle").data(data.nodes).join("circle").attr("r", 6).attr("fill", (d: any) => {
        if (d.type === 'Requirement') return '#3b82f6';
        if (d.type === 'Architecture') return '#a855f7';
        if (d.type === 'Design') return '#10b981';
        return '#f59e0b';
      }).attr("stroke", "#fff").attr("stroke-width", 1.5).style("cursor", "pointer").call(d3.drag<SVGCircleElement, any>().on("start", (event, d: any) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }).on("drag", (event, d: any) => { d.fx = event.x; d.fy = event.y; }).on("end", (event, d: any) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }) as any);
    node.on("mouseover", (event, d: any) => {
      const related = new Set([d.id]);
      data.links.forEach(l => { if (l.source.id === d.id) related.add(l.target.id); if (l.target.id === d.id) related.add(l.source.id); });
      node.transition().duration(200).attr("opacity", (n: any) => related.has(n.id) ? 1 : 0.08).attr("r", (n: any) => n.id === d.id ? 10 : 6);
      link.transition().duration(200).attr("stroke", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? "#3b82f6" : "#e2e8f0").attr("stroke-opacity", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.05);
    }).on("mouseout", () => {
      node.transition().duration(200).attr("opacity", 1).attr("r", 6);
      link.transition().duration(200).attr("stroke", "#e2e8f0").attr("stroke-opacity", 0.4);
    });
    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
    });
    const zoom = d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom as any);
    return () => { simulation.stop(); };
  }, [data]);

  return (
    <div className="relative w-full h-[450px] bg-slate-50/20 rounded-2xl border border-slate-100">
      <svg ref={svgRef} className="w-full h-full cursor-grab" />
      <div className="absolute top-4 left-4 bg-white/90 p-4 rounded-xl border border-slate-100 shadow-sm pointer-events-none">
        <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">Traceability Network</h4>
        <div className="flex flex-col gap-1.5">
          <LegendItem color="bg-blue-500" label="Requirement" />
          <LegendItem color="bg-purple-500" label="Architecture" />
          <LegendItem color="bg-emerald-500" label="Design" />
          <LegendItem color="bg-amber-500" label="Test Case" />
        </div>
      </div>
    </div>
  );
};
const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${color}`}></div><span className="text-[10px] font-bold text-slate-600">{label}</span></div>
);

// --- Optimized Structured Result Detail View ---

const StructuredResultDetailView: React.FC<{
  doc: ManagedDocument;
  allDocs: ManagedDocument[];
  onClose: () => void;
  onConfirm: () => void;
}> = ({ doc, allDocs, onClose, onConfirm }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const chunkRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { nodes, chunks } = useMemo(() => {
    let generatedNodes: any[] = [];
    let generatedChunks: any[] = [];

    if (doc.name === 'requirement.docx') {
      const reqs = [
        { title: "REQ-ADS-101", desc: "The Perception System shall detect obstacles with >99% accuracy within 150m range.", chunk: "3.1 Perception Accuracy\nThe system must identify static and dynamic objects with high precision. Specifically, the Perception System shall detect obstacles with >99% accuracy within 150m range under clear weather conditions." },
        { title: "REQ-ADS-102", desc: "System latency from sensor photon-in to actuation command shall not exceed 100ms.", chunk: "3.2 Performance Constraints\nReal-time processing is critical. The end-to-end system latency from sensor photon-in to actuation command shall not exceed 100ms to ensure safe stopping distances at highway speeds." },
        { title: "REQ-ADS-103", desc: "Emergency Braking must achieve a deceleration rate of at least 4m/s² on dry asphalt.", chunk: "4.5 Safety Mechanisms\nAutomatic Emergency Braking (AEB) is a failsafe. The Emergency Braking must achieve a deceleration rate of at least 4m/s² on dry asphalt when an imminent collision is detected." },
        { title: "REQ-ADS-104", desc: "The vehicle shall maintain lane position with a lateral deviation of less than 10cm.", chunk: "5.1 Lateral Control\nSteering algorithms must be robust. The vehicle shall maintain lane position with a lateral deviation of less than 10cm on straight roads and curves with radius > 500m." },
        { title: "REQ-ADS-105", desc: "Traffic Light Recognition must distinguish state (Red/Yellow/Green) in direct sunlight.", chunk: "3.4 Environmental Conditions\nCameras must handle high dynamic range. Traffic Light Recognition must distinguish state (Red/Yellow/Green) in direct sunlight and occlusion up to 20%." },
        { title: "REQ-ADS-106", desc: "Sensor Fusion module must synchronize LiDAR and Camera timestamps within 1ms.", chunk: "6.1 Sensor Fusion\nData alignment is prerequisite. The Sensor Fusion module must synchronize LiDAR and Camera timestamps within 1ms using PTP (Precision Time Protocol)." },
        { title: "REQ-ADS-107", desc: "Path Planning shall update the local trajectory at a minimum frequency of 10Hz.", chunk: "7.0 Trajectory Planning\nThe local planner generates drivable paths. Path Planning shall update the local trajectory at a minimum frequency of 10Hz to adapt to dynamic obstacles." },
        { title: "REQ-ADS-108", desc: "The system must identify and yield to emergency vehicles using visual and audio cues.", chunk: "3.5 Special Object Detection\nSirens and lights indicate priority. The system must identify and yield to emergency vehicles using visual and audio cues classification." },
      ];
      
      generatedNodes = reqs.map((r, i) => ({
        id: `node-${doc.id}-${i}`,
        type: 'Requirement',
        title: r.title,
        description: r.desc,
        sourceId: String(i + 1),
        docId: doc.id
      }));

      generatedChunks = reqs.map((r, i) => ({
        id: String(i + 1),
        content: r.chunk
      }));
      
      // Add some filler chunks
      generatedChunks.push({ id: "9", content: "1.0 Introduction\nThis document outlines the software requirements for the Autonomous Driving System (ADS) Level 3."});
      generatedChunks.push({ id: "10", content: "2.0 Scope\nThe scope includes Perception, Prediction, Planning, and Control modules."});

    } else if (doc.name === 'architect.md') {
       const archs = [
        { title: "ARCH-NODE-01", desc: "Sensor Abstraction Layer: Normalizes raw data from LiDAR, Radar, and Camera.", chunk: "## Sensor Abstraction Layer\n\nResponsible for driver interactions. Normalizes raw data from LiDAR, Radar, and Camera into a shared memory format." },
        { title: "ARCH-NODE-02", desc: "Perception Engine: Deep learning pipeline for object detection and classification.", chunk: "## Perception Engine\n\nRuns neural networks. Deep learning pipeline for object detection and classification. Outputs object list with 3D bounding boxes." },
        { title: "ARCH-NODE-03", desc: "Sensor Fusion: Late fusion of object lists using Extended Kalman Filter (EKF).", chunk: "## Sensor Fusion\n\nCombines disparate data sources. Late fusion of object lists using Extended Kalman Filter (EKF) to reduce uncertainty." },
        { title: "ARCH-NODE-04", desc: "World Model: Maintains static map and dynamic object state graph.", chunk: "## World Model\n\nThe source of truth. Maintains static map (HD Map) and dynamic object state graph for the planner." },
        { title: "ARCH-NODE-05", desc: "Behavior Planner: Finite State Machine for high-level decision making.", chunk: "## Behavior Planner\n\nDecides maneuvers. Finite State Machine for high-level decision making (e.g., Lane Change, Overtake, Yield)." },
       ];
       
       generatedNodes = archs.map((a, i) => ({
        id: `node-${doc.id}-${i}`,
        type: 'Architecture',
        title: a.title,
        description: a.desc,
        sourceId: String(i + 1),
        docId: doc.id
      }));

      generatedChunks = archs.map((a, i) => ({
        id: String(i + 1),
        content: a.chunk
      }));

    } else if (doc.name === 'test_cases.xlsx') {
       const tests = [
         { title: "TC-VAL-201", desc: "Validate Pedestrian Detection at Night.", chunk: "ID: TC-201 | Scenario: Pedestrian crossing in low light (<5 lux). | Expected: System detects pedestrian > 40m away." },
         { title: "TC-VAL-202", desc: "Validate AEB on Wet Road.", chunk: "ID: TC-202 | Scenario: Lead vehicle sudden stop on wet surface (friction 0.5). | Expected: No collision, deceleration > 3.5m/s²." },
         { title: "TC-VAL-203", desc: "Validate Lane Keeping in Curve.", chunk: "ID: TC-203 | Scenario: Highway curve radius 600m at 100kph. | Expected: Lateral deviation < 10cm." },
         { title: "TC-VAL-204", desc: "Validate Traffic Light Red.", chunk: "ID: TC-204 | Scenario: Approach intersection, light turns Red. | Expected: Vehicle stops at stop line." },
         { title: "TC-VAL-205", desc: "Validate Cut-in Scenario.", chunk: "ID: TC-205 | Scenario: Vehicle cuts in from right lane at 5m distance. | Expected: Adaptive Cruise Control adjusts gap smoothly." },
       ];
       
       generatedNodes = tests.map((t, i) => ({
          id: `node-${doc.id}-${i}`,
          type: 'TestCase',
          title: t.title,
          description: t.desc,
          sourceId: String(i + 1),
          docId: doc.id
       }));

       generatedChunks = tests.map((t, i) => ({
         id: String(i + 1),
         content: t.chunk
       }));
    } else {
       // Design doc or others
       const designs = [
         { title: "DD-CTRL-301", desc: "PID Controller parameters for longitudinal speed tracking.", chunk: "Module: Longitudinal Control\nClass: PID_Speed\nDetails: PID Controller parameters (Kp, Ki, Kd) tuned for smooth acceleration. Anti-windup implemented." },
         { title: "DD-CTRL-302", desc: "EKF Matrix dimensions and initialization values.", chunk: "Module: Sensor Fusion\nStruct: EKF_State\nDetails: State vector [x, y, vx, vy, ax, ay]. EKF Matrix dimensions 6x6. Initialization values set to identity * noise_floor." },
         { title: "DD-CTRL-303", desc: "YOLO Head configuration for traffic light bounding boxes.", chunk: "Module: Perception\nConfig: YOLO_v5_Head\nDetails: Anchor boxes optimized for small objects. Output layer provides bounding box (x,y,w,h) and class probabilities." },
       ];
       
       generatedNodes = designs.map((d, i) => ({
          id: `node-${doc.id}-${i}`,
          type: 'DesignElement',
          title: d.title,
          description: d.desc,
          sourceId: String(i + 1),
          docId: doc.id
       }));

       generatedChunks = designs.map((d, i) => ({
         id: String(i + 1),
         content: d.chunk
       }));
    }

    return { nodes: generatedNodes, chunks: generatedChunks };
  }, [doc]);

  const handleNodeClick = (node: any) => {
    setSelectedNodeId(node.id);
    const targetChunk = chunkRefs.current[node.sourceId];
    if (targetChunk) {
      targetChunk.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="bg-white border border-slate-100 p-8 rounded-t-[40px] flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-5">
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"><ArrowLeft size={24} /></button>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Trace Result: {doc.name}</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Entity-to-Source Linkage Analysis</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="text-sm font-bold text-slate-500">Close</button>
          <button onClick={onConfirm} className="px-10 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-xl">Confirm Trace Mapping</button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 mt-6 overflow-hidden">
        {/* Left: Extracted Entities */}
        <div className="w-[480px] flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
             <div className="flex items-center gap-2">
                <Box size={16} className="text-indigo-500" />
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Extracted Entities</span>
             </div>
             <div className="bg-white px-3 py-1 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-600">{nodes.length} Items</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {nodes.map(node => (
              <div 
                key={node.id} 
                onClick={() => handleNodeClick(node)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer group relative ${
                  selectedNodeId === node.id 
                    ? 'border-indigo-500 bg-indigo-50/30 ring-4 ring-indigo-500/5' 
                    : 'border-slate-50 bg-white hover:border-indigo-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    node.type === 'Requirement' ? 'bg-blue-50 text-blue-600' : 
                    node.type === 'TestCase' ? 'bg-amber-50 text-amber-600' : 
                    node.type === 'Architecture' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {node.type}
                  </span>
                  <div className={`text-slate-300 group-hover:text-indigo-400 transition-colors ${selectedNodeId === node.id ? 'text-indigo-500' : ''}`}>
                    <LinkIcon size={14} />
                  </div>
                </div>
                <h5 className="text-sm font-black text-slate-800 truncate mb-1.5">{node.title}</h5>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">{node.description}</p>
                
                {selectedNodeId === node.id && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Linked to Chunk #{node.sourceId}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Original Document Chunks */}
        <div className="flex-1 flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden bg-slate-50/20">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
             <div className="flex items-center gap-2">
                <FileCode size={16} className="text-slate-400" />
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Source Parsing Chunks</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-slate-400">Viewing: {doc.name}</span>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {chunks.map(chunk => (
              <div 
                key={chunk.id}
                ref={(el) => { chunkRefs.current[chunk.id] = el; }}
                className={`bg-white rounded-3xl p-8 border transition-all duration-300 ${
                  selectedNode?.sourceId === chunk.id 
                    ? 'border-indigo-400 shadow-xl shadow-indigo-500/10 scale-[1.02] ring-8 ring-indigo-500/5' 
                    : 'border-slate-100 shadow-sm opacity-60'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    selectedNode?.sourceId === chunk.id ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-400'
                  }`}>
                    Chunk #{chunk.id}
                  </span>
                  {selectedNode?.sourceId === chunk.id && (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                      <Zap size={14} className="text-amber-500 fill-amber-500" />
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Source Found</span>
                    </div>
                  )}
                </div>
                <div className={`text-sm leading-relaxed transition-colors whitespace-pre-line ${
                  selectedNode?.sourceId === chunk.id ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'
                }`}>
                  {chunk.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Overview View Component ---

const OverviewView: React.FC<{ project: Project; isDataReady: boolean }> = ({ project, isDataReady }) => {
  if (!isDataReady) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Inbox size={40} className="text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No Traceability Insights Yet</h3>
        <p className="text-slate-500 max-w-sm text-sm leading-relaxed mb-8">To generate health insights, connect a data source and complete normalization.</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><CheckCircle2 size={14} /> Connect Source</div>
          <ArrowRight size={14} className="text-slate-200" />
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><RefreshCcw size={14} /> Normalize</div>
          <ArrowRight size={14} className="text-slate-200" />
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Layers size={14} /> Structure</div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SmallStatCard icon={<FileText size={18} className="text-blue-500" />} label="Extracted Req" value="18" subtext="from documents" />
        <SmallStatCard icon={<Share2 size={18} className="text-purple-500" />} label="Arch Elements" value="8" subtext="from documents" />
        <SmallStatCard icon={<Layout size={18} className="text-emerald-500" />} label="Design Units" value="37" subtext="from documents" />
        <SmallStatCard icon={<Activity size={18} className="text-amber-500" />} label="Validations" value="43" subtext="from documents" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6 px-2">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Share2 size={18} /></div>
             <div><h3 className="text-base font-bold text-slate-800">ADS Traceability Map</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Force-Directed Mesh Analysis</p></div>
          </div>
          <div className="flex-1 min-h-[450px]"><TraceabilityGraph /></div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><NetworkIcon size={200} /></div>
          <div className="space-y-10 relative z-10">
            <div className="flex items-center gap-3"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BarChart3 size={18} /></div><h3 className="text-base font-bold text-slate-800">Graph Coverage</h3></div>
            <div className="space-y-6">
              <MetricItem label="Total Artifacts" value="106" detail="ADS Stack" />
              <MetricItem label="AI Confidence" value="97.4%" detail="High Strength" success />
              <MetricItem label="Linkage Density" value="2.8" detail="Links / Node" />
              <MetricItem label="Orphaned Items" value="0" detail="Perfect Sync" success />
            </div>
          </div>
          <div className="mt-12 p-5 bg-slate-50 rounded-2xl border border-slate-100/50">
             <div className="flex gap-3 items-start"><div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5"><Zap size={10} className="text-white" /></div><p className="text-[10px] text-slate-500 leading-relaxed font-medium"><span className="font-black text-slate-700 block mb-1">AI Recommendation:</span>Trace coverage is 100% complete.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const MetricItem: React.FC<{ label: string; value: string; detail: string; success?: boolean }> = ({ label, value, detail, success }) => (
  <div className="flex justify-between items-end border-b border-slate-50 pb-3">
    <div><span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">{label}</span><span className="text-[10px] text-slate-400 font-medium">{detail}</span></div>
    <span className={`text-sm font-black tracking-tight ${success ? 'text-emerald-500' : 'text-slate-800'}`}>{value}</span>
  </div>
);

const SmallStatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; subtext: string }> = ({ icon, label, value, subtext }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
    <div className="flex justify-between items-start"><div className="p-3 bg-slate-50 rounded-2xl shadow-inner">{icon}</div><h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4></div>
    <div className="mt-5"><p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">{label}</p><p className="text-[10px] text-slate-400 font-medium">{subtext}</p></div>
  </div>
);

const DocumentsManagementView: React.FC<{
  documents: ManagedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<ManagedDocument[]>>;
  onViewProgress: (doc: ManagedDocument) => void;
  onViewResult: (doc: ManagedDocument) => void;
  onViewStructuredResult: (doc: ManagedDocument) => void;
  onOpenStructuringModal: () => void;
}> = ({ documents, setDocuments, onViewProgress, onViewResult, onViewStructuredResult, onOpenStructuringModal }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isParsingBatch, setIsParsingBatch] = useState(false);
  const toggleSelect = (id: string) => { const n = new Set(selectedIds); if (n.has(id)) n.delete(id); else n.add(id); setSelectedIds(n); };
  const toggleSelectAll = () => { if (selectedIds.size === documents.length) setSelectedIds(new Set()); else setSelectedIds(new Set(documents.map(d => d.id))); };
  const handleParse = async () => { if (selectedIds.size === 0) return; setIsParsingBatch(true); setDocuments(docs => docs.map(d => selectedIds.has(d.id) ? { ...d, status: 'PARSING' } : d)); await new Promise(r => setTimeout(r, 2000)); setDocuments(docs => docs.map(d => selectedIds.has(d.id) ? { ...d, status: 'PARSED' } : d)); setIsParsingBatch(false); setSelectedIds(new Set()); };
  return (
    <div className="space-y-6 px-2">
      <div className="flex justify-between items-start">
        <div><h3 className="text-2xl font-black text-slate-900 tracking-tight">Project Artifacts</h3><p className="text-sm text-slate-500 mt-1">Manage system specifications and engineering docs.</p></div>
        <div className="flex gap-3">
          <button onClick={onOpenStructuringModal} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-50"><Layers size={18} /> Structure</button>
          <button disabled={selectedIds.size === 0 || isParsingBatch} onClick={handleParse} className={`px-6 py-3 rounded-2xl text-sm font-bold shadow-xl transition-all ${selectedIds.size > 0 && !isParsingBatch ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>{isParsingBatch ? <RefreshCcw size={18} className="animate-spin" /> : <Play size={18} />}{isParsingBatch ? 'Parsing...' : `Parse Selected`}</button>
        </div>
      </div>
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {documents.length === 0 ? <div className="p-16 text-center"><FileCode size={40} className="mx-auto text-slate-200 mb-4" /><p className="text-sm font-bold text-slate-400">No documents found. Connect a data source first.</p></div> : (
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100"><tr><th className="pl-8 pr-4 py-6 w-10"><input type="checkbox" checked={selectedIds.size === documents.length && documents.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-blue-600" /></th><th className="px-4 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Document</th><th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th><th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="pl-8 pr-4 py-6"><input type="checkbox" checked={selectedIds.has(doc.id)} onChange={() => toggleSelect(doc.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600" /></td>
                <td className="px-4 py-6"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><FileText size={18} /></div><div><span className="text-sm font-bold text-slate-800">{doc.name}</span><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{doc.source}</p></div></div></td>
                <td className="px-8 py-6 text-center"><StatusBadge status={doc.status} /></td>
                <td className="px-8 py-6 text-right">{doc.status === 'PARSING' || doc.status === 'STRUCTURING' ? <button onClick={() => onViewProgress(doc)} className="text-[10px] font-black text-blue-500 hover:underline uppercase tracking-widest">View Progress</button> : (doc.status === 'PARSED' || doc.status === 'PARSED_CONFIRMED' || doc.status === 'ACTIVE') ? <button onClick={() => onViewResult(doc)} className="text-[10px] font-black text-orange-500 hover:underline uppercase tracking-widest">{doc.status === 'ACTIVE' ? 'Wait Parse' : 'View Detail'}</button> : doc.status === 'STRUCTURED' ? <button onClick={() => onViewStructuredResult(doc)} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Trace Result</button> : <span className="text-[10px] font-black text-slate-300 uppercase italic">Ready</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const ParsingProgressView: React.FC<{ doc: ManagedDocument; onClose: () => void }> = ({ doc, onClose }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => { const i = setInterval(() => setProgress(p => Math.min(p + 15, 100)), 400); return () => clearInterval(i); }, []);
  return (
    <div className="bg-slate-900 rounded-[40px] h-[calc(100vh-200px)] flex flex-col border border-slate-800 animate-in zoom-in-95 p-12 items-center justify-center gap-14 text-center">
      <div className="relative w-52 h-52"><svg className="w-full h-full -rotate-90"><circle cx="104" cy="104" r="96" className="stroke-slate-800 fill-none" strokeWidth="12" /><circle cx="104" cy="104" r="96" className="stroke-blue-500 fill-none transition-all duration-300" strokeWidth="12" strokeDasharray={`${2 * Math.PI * 96}`} strokeDashoffset={`${2 * Math.PI * 96 * (1 - progress / 100)}`} strokeLinecap="round" /></svg><div className="absolute inset-0 flex items-center justify-center font-black text-5xl text-white tracking-tighter">{progress}%</div></div>
      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Processing ADS Stack Logic...</p>
    </div>
  );
};

const ParseResultDetailView: React.FC<{ doc: ManagedDocument; onClose: () => void; onConfirm: () => void; }> = ({ doc, onClose, onConfirm }) => {
  const count = doc.name === 'requirement.docx' ? 30 : doc.name === 'architect.md' ? 11 : doc.name === 'test_cases.xlsx' ? 46 : 42;
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in slide-in-from-bottom-4">
      <div className="bg-white border border-slate-100 p-8 rounded-t-[40px] flex justify-between items-center shadow-sm"><div className="flex items-center gap-5"><button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"><ArrowLeft size={24} /></button><div><h3 className="text-2xl font-black text-slate-900 tracking-tight">Normalization: {doc.name}</h3><p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Found {count} Logical Chunks</p></div></div><div className="flex gap-5"><button onClick={onClose} className="text-sm font-bold text-slate-500">Discard</button><button onClick={onConfirm} className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl">Confirm Normalization</button></div></div>
      <div className="flex-1 bg-slate-50/50 p-8 overflow-y-auto custom-scrollbar"><div className="max-w-4xl mx-auto space-y-4 pb-20">{Array.from({ length: count }).map((_, i) => (<div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm"><span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 mb-4 inline-block">Chunk #{i+1}</span><div className="text-sm text-slate-700 font-bold">Document segment identified as potential TraceLink entity. Logic mapping required.</div></div>))}</div></div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: DocStatus }> = ({ status }) => {
  switch (status) {
    case 'STRUCTURED': return <span className="text-[10px] font-black text-indigo-500 tracking-wider">STRUCTURED</span>;
    case 'STRUCTURING': return <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-black tracking-wider justify-center"><RefreshCcw size={12} className="animate-spin" /> STRUCTURING</div>;
    case 'PARSED_CONFIRMED': return <span className="text-[10px] font-black text-slate-500 tracking-wider">CONFIRMED</span>;
    case 'PARSED': return <span className="text-[10px] font-black text-emerald-500 tracking-wider">PARSED</span>;
    case 'PARSING': return <div className="flex items-center gap-1.5 text-blue-500 text-[10px] font-black tracking-wider justify-center"><RefreshCcw size={12} className="animate-spin" /> PARSING</div>;
    default: return <span className="text-[10px] font-black text-blue-400 tracking-wider">READY</span>;
  }
};

const StructuringModal: React.FC<{ pendingDocs: ManagedDocument[]; onClose: () => void; onConfirm: () => void }> = ({ pendingDocs, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden"><div className="p-8 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center"><h2 className="text-xl font-black text-slate-900 tracking-tight">Extract V-Model Entities</h2><button onClick={onClose} className="p-2 text-slate-400"><X size={20} /></button></div><div className="p-8 space-y-6"><p className="text-sm text-slate-500 font-medium leading-relaxed">System will extract Requirements, Architecture Nodes, Designs, and Test Cases from normalized chunks.</p><div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Selected Docs ({pendingDocs.length})</label><div className="space-y-2">{pendingDocs.map(d => (<div key={d.id} className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100"><FileCheck size={16} className="text-emerald-500" /><span className="text-xs font-bold text-slate-700">{d.name}</span></div>))}</div></div></div><div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-6"><button onClick={onClose} className="text-sm font-bold text-slate-500">Cancel</button><button disabled={pendingDocs.length === 0} onClick={onConfirm} className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl">Confirm Extraction</button></div></div>
  </div>
);