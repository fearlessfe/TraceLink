import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  FileText, 
  Share2, 
  Eye, 
  Activity, 
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCcw,
  ArrowLeft,
  Layers,
  Zap,
  FileCheck,
  Inbox,
  List,
  Binary,
  MessageSquare,
  Send,
  Search,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Network as NetworkIcon,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { Project, DataSource, DataSourceType, ManagedDocument, DocStatus } from '../types';
import { Neo4jGraphView } from './Neo4jGraphView';
import { ExamplePlayground } from './ExamplePlayground';
import { AIChatView } from './AIChatView';
import { VerificationView } from './VerificationView';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

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
  const isKB = project.type === 'Knowledge Base';

  const [activeTab, setActiveTab] = useState('ai-assistant');
  const [dataSources, setDataSources] = useState<DataSource[]>(isExistingProject ? MOCK_DATA_SOURCES : []);
  const [documents, setDocuments] = useState<ManagedDocument[]>(isExistingProject ? INITIAL_DOCS : []);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isStructuringModalOpen, setIsStructuringModalOpen] = useState(false);
  const [parsingProgressDoc, setParsingProgressDoc] = useState<ManagedDocument | null>(null);
  const [editingResultDoc, setEditingResultDoc] = useState<ManagedDocument | null>(null);
  const [viewingStructuredDoc, setViewingStructuredDoc] = useState<ManagedDocument | null>(null);

  const tabs = [
    { id: 'ai-assistant', label: 'AI Assistant', icon: <MessageSquare size={16} /> },
    { id: 'verification', label: 'Verification', icon: <ShieldCheck size={16} /> },
    { id: 'overview', label: 'Overview', icon: <Eye size={16} /> },
    { id: 'datasources', label: 'Data Sources', icon: <Activity size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    { id: 'graph', label: isKB ? 'Knowledge Map' : 'System Graph', icon: <NetworkIcon size={16} /> },
    ...(!isKB ? [{ id: 'traceability', label: 'Traceability', icon: <Share2 size={16} /> }] : []),
    { id: 'example', label: 'Example', icon: <Zap size={16} /> },
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

    if (viewingStructuredDoc) {
      if (isKB) {
        return <KnowledgeBaseDocView doc={viewingStructuredDoc} onClose={() => setViewingStructuredDoc(null)} />;
      }
      return (
        <StructuredResultDetailView 
          doc={viewingStructuredDoc} 
          onClose={() => setViewingStructuredDoc(null)}
        />
      );
    }

    switch (activeTab) {
      case 'overview': 
        return <OverviewView project={project} isDataReady={isDataReady} />;
      case 'datasources':
        return (
          <DataSourcesListView 
            sources={dataSources} 
            onConnect={() => setIsConnectModalOpen(true)}
            onDelete={(id) => setDataSources(prev => prev.filter(s => s.id !== id))}
          />
        );
      case 'documents':
        return (
          <DocumentsManagementView 
            isKB={isKB}
            documents={documents} 
            setDocuments={setDocuments}
            onViewProgress={setParsingProgressDoc}
            onViewResult={setEditingResultDoc}
            onViewStructuredResult={setViewingStructuredDoc}
            onOpenStructuringModal={() => setIsStructuringModalOpen(true)}
          />
        );
      case 'ai-assistant':
        return <AIChatView project={project} documents={documents} />;
      case 'verification':
        return <VerificationView project={project} />;
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 h-full flex flex-col">
      {!isAnyDetailOpen && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{project.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isKB ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {project.type}
                </span>
              </div>
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

      <div className={isAnyDetailOpen ? "flex-1" : "mt-6 flex-1 min-h-0"}>
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
          isKB={isKB}
          pendingDocs={documents.filter(d => d.status === 'PARSED_CONFIRMED')}
          onClose={() => setIsStructuringModalOpen(false)} 
          onConfirm={startStructuring}
        />
      )}
    </div>
  );
};

// ... subcomponents ...
function KnowledgeBaseDocView({ doc, onClose }: { doc: ManagedDocument; onClose: () => void }) {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const svgRef = useRef<SVGSVGElement>(null);

  const knowledgeData = useMemo(() => {
    const chunks = Array.from({ length: 8 }).map((_, i) => ({
      id: `chk-${i}`,
      title: `Concept ${i + 1}`,
      content: `Semantic insight from ${doc.name} regarding module ${i * 10}. Relevance detected.`,
      tags: ['Logic'],
      relevance: 0.85 + Math.random() * 0.1
    }));
    const nodes = chunks.map(c => ({ id: c.id, name: c.title, relevance: c.relevance }));
    const links = Array.from({ length: 10 }).map(() => ({
      source: nodes[Math.floor(Math.random() * nodes.length)].id,
      target: nodes[Math.floor(Math.random() * nodes.length)].id
    })).filter(l => l.source !== l.target);
    return { chunks, nodes, links };
  }, [doc]);

  useEffect(() => {
    if (viewMode !== 'graph' || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const width = svgRef.current.clientWidth;
    const height = 500;
    const g = svg.append("g");
    
    const simulation = d3.forceSimulation(knowledgeData.nodes)
      .force("link", d3.forceLink(knowledgeData.links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = g.append("g").attr("stroke", "#e2e8f0").selectAll("line").data(knowledgeData.links).join("line");
    const node = g.append("g").selectAll("g").data(knowledgeData.nodes).join("g");

    node.append("circle").attr("r", (d: any) => d.relevance * 20).attr("fill", "#6366f1").attr("stroke", "#fff").attr("stroke-width", 2);
    node.append("text").text((d: any) => d.name).attr("dy", 35).attr("text-anchor", "middle").attr("font-size", "10px").attr("font-weight", "bold").attr("fill", "#64748b");

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
    return () => { simulation.stop(); };
  }, [viewMode, knowledgeData]);

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
      <div className="bg-white border border-slate-100 p-8 rounded-t-[40px] flex justify-between items-center">
        <div className="flex items-center gap-5">
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"><ArrowLeft size={24} /></button>
          <h3 className="text-xl font-black text-slate-900">Knowledge: {doc.name}</h3>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-xs font-bold ${viewMode === 'list' ? 'bg-white text-blue-600' : 'text-slate-500'}`}><List size={14} /></button>
          <button onClick={() => setViewMode('graph')} className={`px-4 py-2 rounded-lg text-xs font-bold ${viewMode === 'graph' ? 'bg-white text-blue-600' : 'text-slate-500'}`}><Binary size={14} /></button>
        </div>
      </div>
      <div className="flex-1 bg-slate-50 overflow-hidden">
        {viewMode === 'list' ? (
          <div className="h-full overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-4">
              {knowledgeData.chunks.map(chunk => (
                <div key={chunk.id} className="bg-white rounded-3xl p-8 border border-slate-100">
                  <h4 className="text-lg font-bold text-slate-800">{chunk.title}</h4>
                  <p className="text-sm text-slate-600 mt-2">{chunk.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center"><svg ref={svgRef} className="w-full h-full" /></div>
        )}
      </div>
    </div>
  );
}

function MetricItem({ label, value, detail, success }: { label: string; value: string; detail: string; success?: boolean }) {
  return (
    <div className="flex justify-between items-end border-b border-slate-50 pb-3">
      <div><span className="text-xs font-bold text-slate-400 uppercase block mb-1">{label}</span><span className="text-[10px] text-slate-400">{detail}</span></div>
      <span className={`text-sm font-black ${success ? 'text-emerald-500' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}

function SmallStatCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string; subtext: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col justify-between min-h-[120px]">
      <div className="flex justify-between items-start"><div className="p-3 bg-slate-50 rounded-2xl">{icon}</div><h4 className="text-3xl font-black text-slate-900">{value}</h4></div>
      <div className="mt-5"><p className="text-[10px] font-black text-slate-800 uppercase">{label}</p><p className="text-[10px] text-slate-400">{subtext}</p></div>
    </div>
  );
}

function DataSourcesListView({ sources, onConnect, onDelete }: any) {
  return (
    <div className="space-y-6 px-2">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-800">Data Sources</h3>
        <button onClick={onConnect} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md"><Plus size={18} /> Connect</button>
      </div>
      <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase">Source Name</th>
              <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase text-center">Status</th>
              <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sources.length === 0 ? <tr><td colSpan={3} className="p-12 text-center text-slate-400">No sources.</td></tr> : sources.map((s: any) => (
              <tr key={s.id}>
                <td className="px-8 py-6 text-sm font-bold">{s.name}</td>
                <td className="px-8 py-6 text-center text-emerald-600 font-bold">{s.status}</td>
                <td className="px-8 py-6 text-right"><button onClick={() => onDelete(s.id)}><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentsManagementView({ isKB, documents, setDocuments, onViewProgress, onViewResult, onViewStructuredResult, onOpenStructuringModal }: any) {
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const handleParse = async () => {
    setDocuments((docs: any) => docs.map((d: any) => selectedIds.has(d.id) ? { ...d, status: 'PARSING' } : d));
    await new Promise(r => setTimeout(r, 2000));
    setDocuments((docs: any) => docs.map((d: any) => selectedIds.has(d.id) ? { ...d, status: 'PARSED' } : d));
    setSelectedIds(new Set());
  };
  return (
    <div className="space-y-6 px-2">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Project Artifacts</h3>
        <div className="flex gap-3">
          <button onClick={onOpenStructuringModal} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold shadow-sm">{isKB ? 'Extract Knowledge' : 'Extract Traceability'}</button>
          <button disabled={selectedIds.size === 0} onClick={handleParse} className={`px-6 py-3 rounded-2xl text-sm font-bold ${selectedIds.size > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Parse Selected</button>
        </div>
      </div>
      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="pl-8 py-6 w-10"><input type="checkbox" /></th>
              <th className="px-4 py-6 text-[11px] font-black text-slate-400 uppercase">Document</th>
              <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase text-center">Status</th>
              <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {documents.map((doc: any) => (
              <tr key={doc.id}>
                <td className="pl-8 py-6"><input type="checkbox" checked={selectedIds.has(doc.id)} onChange={() => { const n = new Set(selectedIds); if(n.has(doc.id)) n.delete(doc.id); else n.add(doc.id); setSelectedIds(n); }} /></td>
                <td className="px-4 py-6 text-sm font-bold">{doc.name}</td>
                <td className="px-8 py-6 text-center"><StatusBadge status={doc.status} /></td>
                <td className="px-8 py-6 text-right">
                   {doc.status === 'PARSED' ? <button onClick={() => onViewResult(doc)} className="text-orange-500 font-bold text-[10px]">View</button> :
                    doc.status === 'STRUCTURED' ? <button onClick={() => onViewStructuredResult(doc)} className="text-indigo-500 font-bold text-[10px]">Explore</button> :
                    <span className="text-slate-300 text-[10px] font-bold">Ready</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  const color = status === 'STRUCTURED' ? 'text-indigo-500' : status === 'PARSED' ? 'text-emerald-500' : 'text-slate-300';
  return <span className={`text-[10px] font-black uppercase ${color}`}>{status}</span>;
}

function OverviewView({ project, isDataReady }: any) {
  const isKB = project.type === 'Knowledge Base';
  if (!isDataReady) return <div className="py-20 text-center bg-white rounded-[40px] border border-slate-100"><Inbox size={40} className="mx-auto text-slate-200 mb-4" /><p className="text-slate-400">Connect a data source to begin.</p></div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {isKB ? (
           <>
            <SmallStatCard icon={<FileText size={18} className="text-amber-500" />} label="Docs" value="4" subtext="local" />
            <SmallStatCard icon={<Binary size={18} className="text-indigo-500" />} label="Blocks" value="128" subtext="semantic" />
            <SmallStatCard icon={<NetworkIcon size={18} className="text-emerald-500" />} label="Tags" value="24" subtext="auto" />
            <SmallStatCard icon={<Zap size={18} className="text-blue-500" />} label="Density" value="0.72" subtext="score" />
           </>
        ) : (
          <>
            <SmallStatCard icon={<FileText size={18} className="text-blue-500" />} label="Req" value="18" subtext="extracted" />
            <SmallStatCard icon={<Share2 size={18} className="text-purple-500" />} label="Arch" value="8" subtext="nodes" />
            <SmallStatCard icon={<Activity size={18} className="text-amber-500" />} label="Test" value="43" subtext="cases" />
            <SmallStatCard icon={<Layers size={18} className="text-emerald-500" />} label="Design" value="37" subtext="units" />
          </>
        )}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-3xl border border-slate-100 min-h-[400px] p-6"><TraceabilityGraph /></div>
        <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6">
          <h3 className="text-base font-bold text-slate-800">Metrics</h3>
          <MetricItem label="AI Accuracy" value="97.4%" detail="Confidence" success />
          <MetricItem label="Coverage" value="100%" detail="Traceability" success />
        </div>
      </div>
    </div>
  );
}

function TraceabilityGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const data = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    for (let i = 1; i <= 15; i++) nodes.push({ id: `R-${i}` });
    for (let i = 1; i <= 20; i++) nodes.push({ id: `D-${i}` });
    nodes.slice(0, 10).forEach((n, idx) => links.push({ source: n.id, target: `D-${idx + 1}` }));
    return { nodes, links };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const width = svgRef.current.clientWidth;
    const height = 350;
    const g = svg.append("g");
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(50))
      .force("charge", d3.forceManyBody().strength(-50))
      .force("center", d3.forceCenter(width / 2, height / 2));
    const link = g.append("g").attr("stroke", "#e2e8f0").selectAll("line").data(data.links).join("line");
    const node = g.append("g").selectAll("circle").data(data.nodes).join("circle").attr("r", 4).attr("fill", "#3b82f6");
    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
    });
    return () => { simulation.stop(); };
  }, [data]);
  return <svg ref={svgRef} className="w-full h-full" />;
}

function StructuredResultDetailView({ doc, onClose }: any) {
  return (
    <div className="flex flex-col h-full bg-white rounded-t-[40px] border border-slate-100 overflow-hidden">
      <div className="p-8 border-b flex justify-between items-center">
        <h3 className="text-xl font-bold">Trace Mapping: {doc.name}</h3>
        <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-xl">Close</button>
      </div>
      <div className="flex-1 bg-slate-50 p-8 flex gap-6">
        <div className="w-80 bg-white rounded-2xl p-4">Entity List</div>
        <div className="flex-1 bg-white rounded-2xl p-4">Document Content</div>
      </div>
    </div>
  );
}

function ParsingProgressView({ doc, onClose }: any) {
  return <div onClick={onClose} className="h-full bg-slate-900 flex items-center justify-center text-white text-xl">Parsing {doc.name}...</div>;
}

function ParseResultDetailView({ doc, onClose, onConfirm }: any) {
  return (
    <div className="flex flex-col h-full bg-white rounded-t-[40px] border border-slate-100">
      <div className="p-8 border-b flex justify-between items-center">
        <h3 className="text-xl font-bold">Normalization: {doc.name}</h3>
        <div className="flex gap-4"><button onClick={onClose}>Discard</button><button onClick={onConfirm} className="bg-blue-600 text-white px-6 py-2 rounded-xl">Confirm</button></div>
      </div>
      <div className="flex-1 p-8">Normalization preview</div>
    </div>
  );
}

function ConnectDataSourceModal({ onClose, onSubmit }: any) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl p-8">
        <h2 className="text-xl font-bold mb-6">Connect Source</h2>
        <input className="w-full border p-3 rounded-xl mb-6" value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
        <div className="flex justify-end gap-4"><button onClick={onClose}>Cancel</button><button onClick={() => onSubmit(name, 'LOCAL', [])} className="bg-blue-600 text-white px-6 py-2 rounded-xl">Connect</button></div>
      </div>
    </div>
  );
}

function StructuringModal({ isKB, pendingDocs, onClose, onConfirm }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-3xl p-8">
        <h2 className="text-xl font-black mb-4">{isKB ? 'Extract Knowledge' : 'Extract Traceability'}</h2>
        <p className="text-slate-500 mb-8">{pendingDocs.length} documents ready for extraction.</p>
        <div className="flex justify-end gap-4"><button onClick={onClose}>Cancel</button><button onClick={onConfirm} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl">Start</button></div>
      </div>
    </div>
  );
}