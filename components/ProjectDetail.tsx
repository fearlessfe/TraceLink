
import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  FileText, 
  Share2, 
  Layout, 
  Settings, 
  Eye, 
  Activity, 
  MessageSquare,
  BarChart3,
  ExternalLink,
  ChevronDown,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  RefreshCcw,
  GitBranch,
  Database,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  FileCode,
  FolderOpen,
  Play,
  Layers,
  Check,
  Search,
  Loader2,
  Zap,
  Cpu,
  Edit3,
  Info,
  Network,
  Box,
  FileCheck,
  Maximize2,
  Inbox,
  Github,
  Trello,
  File as FileIcon,
  Link as LinkIcon,
  Sparkles,
  Scissors,
  Combine,
  Terminal,
  PanelLeftClose,
  PanelLeft,
  Braces,
  Code2,
  CheckSquare,
  Square,
  MousePointer2,
  MoreHorizontal,
  Save,
  Pencil,
  CircleDot
} from 'lucide-react';
import { Project, DataSource, DataSourceType, ManagedDocument, DocStatus, DocChunk, StructuredNode } from '../types';

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
    { id: 'graph', label: 'Knowledge Graph', icon: <Network size={16} /> },
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

// --- Neo4j Graph View Component ---

const Neo4jGraphView: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [cypherQuery, setCypherQuery] = useState("MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 50");

  const data = useMemo(() => {
    // Generate simulated Neo4j Data
    const nodes = [];
    const links = [];
    
    // Requirements
    for (let i = 1; i <= 15; i++) {
        nodes.push({ id: `REQ-${i}`, label: 'Requirement', name: `System Req ${i}`, status: 'Approved', properties: { version: '1.0', priority: 'High' } });
    }
    // Functions
    for (let i = 1; i <= 8; i++) {
        nodes.push({ id: `FUNC-${i}`, label: 'System Function', name: `Functionality ${i}`, status: 'Implemented', properties: { complexity: 'Medium' } });
    }
    // Blocks (Design)
    for (let i = 1; i <= 12; i++) {
        nodes.push({ id: `BLK-${i}`, label: 'Block', name: `Design Block ${i}`, status: 'Reviewed', properties: { language: 'C++' } });
    }
    // Test Cases
    for (let i = 1; i <= 20; i++) {
        nodes.push({ id: `TC-${i}`, label: 'Test Case', name: `Verify scenario ${i}`, status: 'Passed', properties: { automation: 'Yes', type: 'Unit' } });
    }

    // Relationships
    // Req -> Func
    nodes.filter(n => n.label === 'Requirement').forEach((n, i) => {
        const target = nodes.find(x => x.id === `FUNC-${(i % 8) + 1}`);
        if(target) links.push({ source: n.id, target: target.id, type: 'SATISFIES' });
    });
    // Func -> Block
    nodes.filter(n => n.label === 'System Function').forEach((n, i) => {
        const target = nodes.find(x => x.id === `BLK-${(i % 12) + 1}`);
        const target2 = nodes.find(x => x.id === `BLK-${((i+1) % 12) + 1}`);
        if(target) links.push({ source: n.id, target: target.id, type: 'IMPLEMENTED_BY' });
        if(target2 && i % 2 === 0) links.push({ source: n.id, target: target2.id, type: 'IMPLEMENTED_BY' });
    });
    // Req -> Test Case
    nodes.filter(n => n.label === 'Requirement').forEach((n, i) => {
        const target = nodes.find(x => x.id === `TC-${(i % 20) + 1}`);
        if(target) links.push({ source: target.id, target: n.id, type: 'VERIFIED_BY' }); // Test verifies Req
    });

    return { nodes, links };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Zoom container
    const g = svg.append("g");
    
    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
    svg.call(zoom);

    // Simulation setup
    const simulation = d3.forceSimulation(data.nodes as any)
        .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(30));

    // Links
    const link = g.append("g")
        .selectAll("line")
        .data(data.links)
        .join("line")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 1.5)
        .attr("marker-end", "url(#arrow)");

    // Define Arrow Marker
    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28) // Shift arrow back so it doesn't overlap node
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#cbd5e1");

    // Nodes
    const node = g.append("g")
        .selectAll("g")
        .data(data.nodes)
        .join("g")
        .style("cursor", "grab")
        .call(d3.drag<SVGGElement, any>()
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }));

    // Node Circles
    node.append("circle")
        .attr("r", 20)
        .attr("fill", (d: any) => {
            switch(d.label) {
                case 'Requirement': return '#3b82f6'; // blue-500
                case 'System Function': return '#8b5cf6'; // violet-500
                case 'Block': return '#10b981'; // emerald-500
                case 'Test Case': return '#f59e0b'; // amber-500
                default: return '#64748b';
            }
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

    // Node Icons/Text (Simplified as first letter)
    node.append("text")
        .text((d: any) => d.label === 'System Function' ? 'F' : d.label[0])
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("fill", "white")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .style("pointer-events", "none");

    // Click Interaction
    node.on("click", (event, d) => {
        setSelectedNode(d);
        event.stopPropagation();
    });

    // Background Click to deselect
    svg.on("click", () => setSelectedNode(null));

    // Simulation Tick
    simulation.on("tick", () => {
        link
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);

        node
            .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [data]);

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px] flex flex-col bg-slate-50 rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500 relative">
        {/* Fake Cypher Query Bar */}
        <div className="h-16 border-b border-slate-200 bg-white flex items-center px-6 gap-4 shrink-0 z-10">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-sm font-bold bg-slate-100 px-3 py-1.5 rounded-lg">
                <span className="text-blue-500">neo4j$</span>
            </div>
            <div className="flex-1 relative group">
                <input 
                    type="text" 
                    value={cypherQuery}
                    onChange={(e) => setCypherQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-mono text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    <Play size={12} fill="currentColor" />
                </button>
            </div>
            <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Req</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-lg border border-violet-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div>
                    <span className="text-[10px] font-bold text-violet-700 uppercase">Func</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Block</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Test</span>
                </div>
            </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-slate-50/50">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            
            {/* Legend / Stats Floating */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm pointer-events-none">
                <div className="flex items-center gap-2 mb-2">
                    <Database size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Graph Database</span>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between gap-4 text-xs font-medium text-slate-600"><span>Nodes</span><span className="font-bold text-slate-900">{data.nodes.length}</span></div>
                    <div className="flex justify-between gap-4 text-xs font-medium text-slate-600"><span>Relationships</span><span className="font-bold text-slate-900">{data.links.length}</span></div>
                </div>
            </div>
        </div>

        {/* Selected Node Panel */}
        {selectedNode && (
            <div className="absolute right-4 top-20 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl animate-in slide-in-from-right-4 duration-300 overflow-hidden flex flex-col max-h-[calc(100%-6rem)]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-1.5 ${
                            selectedNode.label === 'Requirement' ? 'bg-blue-100 text-blue-700' :
                            selectedNode.label === 'System Function' ? 'bg-violet-100 text-violet-700' :
                            selectedNode.label === 'Block' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                            {selectedNode.label}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{selectedNode.name}</h4>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"><X size={16} /></button>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</label>
                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <CircleDot size={14} className="text-slate-400" />
                            <span className="text-xs font-mono font-medium text-slate-600">#{selectedNode.id}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Properties</label>
                        <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                            {Object.entries(selectedNode.properties).map(([key, value], idx) => (
                                <div key={key} className={`flex justify-between items-center px-3 py-2 ${idx !== 0 ? 'border-t border-slate-100' : ''}`}>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{key}</span>
                                    <span className="text-xs font-medium text-slate-800">{value as string}</span>
                                </div>
                            ))}
                            <div className={`flex justify-between items-center px-3 py-2 border-t border-slate-100`}>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
                                <span className="text-xs font-bold text-emerald-600">{selectedNode.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        Open in Source <ExternalLink size={12} />
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

// --- Example Playground Component ---

const INITIAL_MARKDOWN = `# Navigation System SRS

## 1. Perception Requirements
The system shall identify obstacles within 200m.
It must also categorize weather conditions into 4 levels.

## 2. Planning Requirements
Path recalculation should happen every 50ms.
Emergency braking must engage if an obstacle is <5m.

## 3. Communication
The car will sync with cloud every 10 minutes.
Status logs must be encrypted using AES-256.`;

const ExamplePlayground: React.FC = () => {
  const [rawText, setRawText] = useState(INITIAL_MARKDOWN);
  const [chunks, setChunks] = useState<string[]>(INITIAL_MARKDOWN.split('\n\n'));
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Interaction States
  const [viewingChunkIndex, setViewingChunkIndex] = useState<number | null>(0);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [splittingChunkIndex, setSplittingChunkIndex] = useState<number | null>(null);

  // Edit States
  const chunkListRef = useRef<HTMLDivElement>(null);
  const [editingChunkIndex, setEditingChunkIndex] = useState<number | null>(null);
  const [tempChunkValue, setTempChunkValue] = useState("");
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [tempResultValue, setTempResultValue] = useState("");

  // Simulated AI extraction logic
  const extractStructure = (text: string, index: number) => {
    const lower = text.toLowerCase();
    let type = 'General Info';
    let confidence = 0.85;

    if (lower.includes('shall') || lower.includes('must') || lower.includes('should')) {
      type = 'Requirement';
      confidence = 0.92 + Math.random() * 0.07;
    } else if (lower.includes('#')) {
      type = 'Header/Context';
      confidence = 0.99;
    }

    // Simulate a structured JSON response similar to an LLM output
    return {
      _meta: {
        timestamp: new Date().toISOString(),
        model_version: "tracelink-v2.5-turbo",
        chunk_id: `chk_${index + 100}`,
      },
      entity: {
        id: type === 'Requirement' ? `REQ-SYS-${2000 + index}` : `CTX-${500 + index}`,
        type: type,
        title: text.split('\n')[0].replace(/#/g, '').trim().substring(0, 40),
        status: "DRAFT",
        priority: type === 'Requirement' ? "HIGH" : "NONE",
        attributes: {
          safety_critical: lower.includes('braking') || lower.includes('obstacle'),
          performance_impact: lower.includes('ms') || lower.includes('latency'),
        }
      },
      content: {
        original_text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        semantic_embedding_vector: "[0.021, -0.453, 0.119, ...]",
      },
      confidence_score: parseFloat(confidence.toFixed(4))
    };
  };

  useEffect(() => {
    setIsProcessing(true);
    const timer = setTimeout(() => {
      setExtractedData(chunks.map((c, i) => extractStructure(c, i)));
      setIsProcessing(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [chunks]);

  // Scroll active chunk into view
  useEffect(() => {
    if (viewingChunkIndex !== null && chunkListRef.current) {
        const children = chunkListRef.current.children;
        if (viewingChunkIndex < children.length) {
            const chunkEl = children[viewingChunkIndex] as HTMLElement;
            if (chunkEl) {
                chunkEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
  }, [viewingChunkIndex, chunks.length, editingChunkIndex]);

  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  const handleSplitClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSplittingChunkIndex(index);
  };

  const handleEditChunkClick = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingChunkIndex(index);
      setTempChunkValue(chunks[index]);
      setViewingChunkIndex(index);
      if (isSelectionMode) setIsSelectionMode(false);
  };

  const handleSaveChunk = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editingChunkIndex !== null) {
          const newChunks = [...chunks];
          newChunks[editingChunkIndex] = tempChunkValue;
          setChunks(newChunks);
          setEditingChunkIndex(null);
          // extractedData will update via useEffect
      }
  };

  const handleEditResultClick = () => {
    const current = viewingChunkIndex !== null ? extractedData[viewingChunkIndex] : null;
    if (current) {
        setTempResultValue(JSON.stringify(current, null, 2));
        setIsEditingResult(true);
    }
  };

  const handleSaveResult = () => {
    try {
        const parsed = JSON.parse(tempResultValue);
        const newData = [...extractedData];
        if (viewingChunkIndex !== null) {
             newData[viewingChunkIndex] = parsed;
             setExtractedData(newData); // Manual override, won't trigger useEffect loop as chunks didn't change
        }
        setIsEditingResult(false);
    } catch (e) {
        alert("Invalid JSON format. Please correct it before saving.");
    }
  };

  const handleConfirmSplit = (splitIndex: number) => {
    if (splittingChunkIndex === null) return;
    const text = chunks[splittingChunkIndex];
    
    // Safety check
    if (splitIndex <= 0 || splitIndex >= text.length) return;

    const firstHalf = text.substring(0, splitIndex).trim();
    const secondHalf = text.substring(splitIndex).trim();

    if (!firstHalf || !secondHalf) return; // Prevent empty chunks

    const newChunks = [...chunks];
    newChunks.splice(splittingChunkIndex, 1, firstHalf, secondHalf);
    setChunks(newChunks);
    setViewingChunkIndex(splittingChunkIndex); // Focus first new chunk
    setSplittingChunkIndex(null);
  };

  const handleMerge = () => {
    if (selectedIndices.size < 2) return;
    
    // Sort indices to merge in meaningful order
    const sortedIndices = Array.from(selectedIndices).sort((a: number, b: number) => a - b);
    
    // Combine text with double newline
    const mergedText = sortedIndices.map(i => chunks[i]).join('\n\n');
    
    // Reconstruct chunks array:
    const finalChunks = [];
    let inserted = false;

    // Use a simple loop to rebuild
    for (let i = 0; i < chunks.length; i++) {
        if (selectedIndices.has(i)) {
            if (!inserted) {
                finalChunks.push(mergedText);
                inserted = true;
            }
            // Skip subsequent selected chunks
        } else {
            finalChunks.push(chunks[i]);
        }
    }

    setChunks(finalChunks);
    setSelectedIndices(new Set());
    setIsSelectionMode(false);
    setViewingChunkIndex(sortedIndices[0]); // Focus the newly created merged chunk
  };

  const currentExtraction = viewingChunkIndex !== null && viewingChunkIndex < extractedData.length 
    ? extractedData[viewingChunkIndex] 
    : null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 h-[calc(100vh-220px)] min-h-[600px]">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Interactive AI Playground</h3>
          <p className="text-sm text-slate-500 mt-0.5">Edit, Chunk, and Extract structured data in real-time.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${isProcessing ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
          {isProcessing ? <RefreshCcw size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {isProcessing ? 'AI Extracting...' : 'System Synced'}
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Column 1: Parsed Source Markdown (Collapsible) */}
        <div className={`bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${isLeftCollapsed ? 'w-16 opacity-80 hover:opacity-100' : 'flex-1'}`}>
          <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between h-16 shrink-0">
            {!isLeftCollapsed && (
              <div className="flex items-center gap-3">
                <Terminal size={16} className="text-slate-400" />
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Parsed Source</span>
              </div>
            )}
            <button 
              onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors mx-auto"
              title={isLeftCollapsed ? "Expand Source" : "Collapse Source"}
            >
              {isLeftCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          
          {!isLeftCollapsed && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {rawText.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-2 mb-2">{line.replace('# ', '')}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-2">{line.replace('## ', '')}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-slate-700 mt-2 mb-1">{line.replace('### ', '')}</h3>;
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} className="text-sm text-slate-600 leading-relaxed font-mono">{line}</p>;
              })}
            </div>
          )}
        </div>

        {/* Column 2: Chunking View (Interactive) */}
        <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col relative">
          <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between h-16 shrink-0">
            <div className="flex items-center gap-3">
              <Layers size={16} className="text-indigo-500" />
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Structure Chunks ({chunks.length})</span>
            </div>
            <button 
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedIndices(new Set());
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                isSelectionMode 
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/20' 
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {isSelectionMode ? <CheckSquare size={14} /> : <MousePointer2 size={14} />}
              {isSelectionMode ? 'Cancel Selection' : 'Select & Merge'}
            </button>
          </div>

          <div ref={chunkListRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/10 pb-24 scroll-smooth">
            {chunks.map((chunk, idx) => {
              const isSelected = selectedIndices.has(idx);
              const isViewing = viewingChunkIndex === idx;
              const isEditing = editingChunkIndex === idx;
              
              if (isEditing) {
                  return (
                    <div key={idx} className="p-4 rounded-2xl border border-indigo-500 bg-white shadow-lg ring-4 ring-indigo-500/10 z-20 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Editing Chunk #{idx + 1}</span>
                             <div className="flex gap-2">
                                 <button onClick={() => setEditingChunkIndex(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><X size={14} /></button>
                                 <button onClick={handleSaveChunk} className="p-1 bg-indigo-600 hover:bg-indigo-700 rounded text-white"><Check size={14} /></button>
                             </div>
                        </div>
                        <textarea 
                            value={tempChunkValue}
                            onChange={(e) => setTempChunkValue(e.target.value)}
                            className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                            autoFocus
                        />
                    </div>
                  );
              }

              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (isSelectionMode) toggleSelection(idx);
                    else setViewingChunkIndex(idx);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative group animate-in slide-in-from-left-2 duration-300 ${
                    isSelectionMode && isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500'
                      : !isSelectionMode && isViewing
                      ? 'border-indigo-400 bg-white shadow-lg ring-4 ring-indigo-500/5 z-10 scale-[1.02]' 
                      : 'border-slate-100 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      {isSelectionMode && (
                        <div className={`transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}>
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isViewing && !isSelectionMode ? 'text-indigo-600' : 'text-slate-300'}`}>
                        Chunk #{idx + 1}
                      </span>
                    </div>
                    
                    {/* Action Buttons - Only show if NOT in selection mode */}
                    {!isSelectionMode && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                            onClick={(e) => handleEditChunkClick(idx, e)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit Content"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={(e) => handleSplitClick(idx, e)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Split Chunk here"
                          >
                            <Scissors size={14} />
                          </button>
                      </div>
                    )}
                  </div>
                  <div className={`text-xs leading-relaxed transition-colors whitespace-pre-wrap ${isViewing && !isSelectionMode ? 'text-slate-800 font-bold' : 'text-slate-500 font-medium'}`}>
                    {chunk}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Merge Action Bar */}
          {isSelectionMode && selectedIndices.size > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-4 z-20">
              <button 
                onClick={handleMerge}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-bold text-sm shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 transition-all"
              >
                <Combine size={18} />
                Merge {selectedIndices.size} Chunks
              </button>
            </div>
          )}
        </div>

        {/* Column 3: Structured Extraction (JSON View) */}
        <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between h-16 shrink-0">
            <div className="flex items-center gap-3">
                 <Braces size={16} className="text-amber-500" />
                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Extracted JSON Payload</span>
            </div>
            {!isEditingResult && currentExtraction && (
                <button 
                    onClick={handleEditResultClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                    <Edit3 size={12} /> Edit JSON
                </button>
            )}
            {isEditingResult && (
                 <div className="flex items-center gap-2">
                     <button onClick={() => setIsEditingResult(false)} className="text-xs font-bold text-slate-500 px-2 py-1 hover:bg-slate-100 rounded">Cancel</button>
                     <button onClick={handleSaveResult} className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-700">Save JSON</button>
                 </div>
            )}
          </div>
          <div className="flex-1 overflow-auto bg-slate-900 custom-scrollbar relative">
            {isProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 bg-slate-900/80 backdrop-blur-sm z-20">
                <Loader2 size={32} className="text-indigo-400 animate-spin" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Analyzing Semantic Structure...</p>
              </div>
            ) : isEditingResult ? (
               <div className="h-full">
                   <textarea 
                        value={tempResultValue}
                        onChange={(e) => setTempResultValue(e.target.value)}
                        className="w-full h-full p-6 bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none resize-none"
                        spellCheck={false}
                   />
               </div>
            ) : currentExtraction ? (
              <div className="p-6">
                <pre className="font-mono text-xs leading-relaxed text-emerald-400 whitespace-pre-wrap">
                  {JSON.stringify(currentExtraction, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20 opacity-20">
                <Code2 size={40} className="text-slate-500" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Select a chunk to inspect JSON</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Splitting Modal */}
      {splittingChunkIndex !== null && (
        <SplittingModal
            chunkIndex={splittingChunkIndex}
            content={chunks[splittingChunkIndex]}
            onClose={() => setSplittingChunkIndex(null)}
            onConfirm={handleConfirmSplit}
        />
      )}
    </div>
  );
};

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
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Network size={200} /></div>
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

const SplittingModal: React.FC<{
  chunkIndex: number;
  content: string;
  onClose: () => void;
  onConfirm: (index: number) => void;
}> = ({ chunkIndex, content, onClose, onConfirm }) => {
  const [splitIndex, setSplitIndex] = useState<number>(Math.floor(content.length / 2));
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setSplitIndex(e.currentTarget.selectionStart);
  };

  const partA = content.substring(0, splitIndex).trim();
  const partB = content.substring(splitIndex).trim();
  const isValid = partA.length > 0 && partB.length > 0;

  useEffect(() => {
    if(textAreaRef.current) {
        textAreaRef.current.setSelectionRange(splitIndex, splitIndex);
        textAreaRef.current.focus();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Split Chunk #{chunkIndex + 1}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Place your cursor to define the split point.</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Original Text (Click to set split point)</label>
                    <textarea
                        ref={textAreaRef}
                        value={content}
                        readOnly
                        onClick={handleSelection}
                        onKeyUp={handleSelection}
                        className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none cursor-text selection:bg-indigo-200 selection:text-indigo-900"
                    />
                     <div className="absolute bottom-3 right-4 text-[10px] font-bold text-slate-400 bg-white/80 px-2 py-1 rounded border border-slate-100 pointer-events-none">
                        Cursor: {splitIndex}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Result A (Top)</label>
                            <span className="text-[10px] font-bold text-slate-400">{partA.length} chars</span>
                         </div>
                         <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl h-32 overflow-y-auto text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                            {partA || <span className="text-slate-300 italic">Empty part...</span>}
                         </div>
                    </div>
                    <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Result B (Bottom)</label>
                            <span className="text-[10px] font-bold text-slate-400">{partB.length} chars</span>
                         </div>
                         <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl h-32 overflow-y-auto text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                             {partB || <span className="text-slate-300 italic">Empty part...</span>}
                         </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
                <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button 
                    onClick={() => onConfirm(splitIndex)} 
                    disabled={!isValid}
                    className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    <Scissors size={16} />
                    Confirm Split
                </button>
            </div>
        </div>
    </div>
  );
}
