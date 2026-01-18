
import React, { useState, useRef, useEffect } from 'react';
import { 
  RefreshCcw, Sparkles, Terminal, PanelLeft, PanelLeftClose, 
  Layers, CheckSquare, MousePointer2, Edit3, Scissors, Combine, 
  Braces, Check, X, Loader2, Code2, Square
} from 'lucide-react';

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

export const ExamplePlayground: React.FC = () => {
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
