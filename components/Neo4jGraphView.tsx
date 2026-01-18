
import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { Database, Play, CircleDot, X, ExternalLink } from 'lucide-react';

export const Neo4jGraphView: React.FC = () => {
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
