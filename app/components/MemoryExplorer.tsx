"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { GraphNode, GraphEdge, RecallResult } from "@/lib/api";
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position
} from "@xyflow/react";
import { 
  Filter, 
  Sliders, 
  Maximize2, 
  Info, 
  FileText, 
  GitCommit, 
  Link,
  HelpCircle,
  Eye,
  RefreshCw
} from "lucide-react";

// Custom node components for clean visual structure
function CustomNode({ data, selected }: any) {
  const type = data.type || "Entity";
  const label = data.label;
  const isDimmed = data.isDimmed;

  // Type styling
  let badgeBg = "bg-[#FAF6F0] text-[#5C615D] border-[#D0CBB7]";
  let dotBg = "bg-[#5C615D]";
  let borderAccent = "border-[#D0CBB7]";

  if (type === "Suspect") {
    badgeBg = "bg-[#B85C4C]/10 text-[#B85C4C] border-[#B85C4C]/25";
    dotBg = "bg-[#B85C4C]";
    borderAccent = "border-[#B85C4C]";
  } else if (type === "Witness") {
    badgeBg = "bg-[#4A6B53]/10 text-[#4A6B53] border-[#4A6B53]/25";
    dotBg = "bg-[#4A6B53]";
    borderAccent = "border-[#4A6B53]";
  } else if (type === "Evidence") {
    badgeBg = "bg-[#6B8E23]/10 text-[#6B8E23] border-[#6B8E23]/25";
    dotBg = "bg-[#6B8E23]";
    borderAccent = "border-[#6B8E23]";
  } else if (type === "Location") {
    badgeBg = "bg-[#FAF5EB] text-[#8B6508] border-[#ECDAB9]";
    dotBg = "bg-[#D2B48C]";
    borderAccent = "border-[#D2B48C]";
  } else if (type.toLowerCase().includes("document") && !type.toLowerCase().includes("chunk")) {
    badgeBg = "bg-[#4B5320]/10 text-[#4B5320] border-[#4B5320]/25";
    dotBg = "bg-[#4B5320]";
    borderAccent = "border-[#4B5320]";
  } else if (type.toLowerCase().includes("chunk")) {
    badgeBg = "bg-[#8A8A8A]/10 text-[#5C615D] border-[#8A8A8A]/25";
    dotBg = "bg-[#8A8A8A]";
    borderAccent = "border-[#8A8A8A]";
  }

  const opacityStyle = isDimmed ? 0.15 : 1.0;

  return (
    <div
      className={`rounded-xl border p-3 min-w-[170px] max-w-[210px] transition-all bg-[#F4F0E6] ${
        selected ? `ring-2 ring-[#4A6B53] ${borderAccent}` : "border-[#D0CBB7]"
      }`}
      style={{
        opacity: opacityStyle,
        boxShadow: selected 
          ? "0 0 16px rgba(74, 107, 83, 0.25)" 
          : "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
        fontFamily: "var(--font-inria-serif), Georgia, serif"
      }}
    >
      <Handle type="target" position={Position.Left} className="w-1.5 h-1.5 bg-[#B8B3A0]! border-none!" />
      <Handle type="source" position={Position.Right} className="w-1.5 h-1.5 bg-[#B8B3A0]! border-none!" />

      <div className="flex items-center justify-between gap-2 border-b border-[#D0CBB7]/50 pb-1.5 mb-1.5 select-none">
        <span className={`text-[8.5px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded border uppercase ${badgeBg}`}>
          {type}
        </span>
        <span className={`w-1.5 h-1.5 rounded-full ${dotBg}`} />
      </div>

      <div className="text-[11px] font-serif font-bold text-[#2D312E] leading-relaxed wrap-break-word">
        {label}
      </div>
    </div>
  );
}

function ColumnHeaderNode({ data }: any) {
  return (
    <div 
      className="text-[9.5px] font-mono font-bold tracking-widest text-[#5C615D] border-b border-[#D0CBB7] pb-1 uppercase select-none w-[170px] text-center"
      style={{ fontFamily: "var(--font-inria-sans), sans-serif" }}
    >
      {data.label}
    </div>
  );
}

const nodeTypes = {
  customNode: CustomNode,
  columnHeader: ColumnHeaderNode
};

interface MemoryExplorerProps {
  activeCaseId: string | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  chunks: RecallResult[];
  provenance: any;
  citations: any[];
}

export default function MemoryExplorer({
  activeCaseId,
  nodes,
  edges,
  chunks,
  provenance,
  citations
}: MemoryExplorerProps) {
  // Node and Edge states for React Flow
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Selection states
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"details" | "chunks" | "provenance" | "citations">("details");

  // Filtering configurations
  const [nodeTypeFilters, setNodeTypeFilters] = useState<Record<string, boolean>>({
    Suspect: true,
    Witness: true,
    Evidence: true,
    Location: true,
    Entity: true
  });
  
  const [edgePriorityThreshold, setEdgePriorityThreshold] = useState<number>(0.1);
  const [lazyExpansion, setLazyExpansion] = useState<boolean>(false);

  // Available node types in the current graph
  const uniqueNodeTypes = useMemo(() => {
    const types = new Set<string>();
    nodes.forEach(n => {
      if (n.type) types.add(n.type);
    });
    return Array.from(types);
  }, [nodes]);

  // Dynamic layout calculations (Column swimlanes layout)
  const calculateLayout = useCallback(() => {
    if (nodes.length === 0) {
      setRfNodes([]);
      setRfEdges([]);
      return;
    }

    // Step 1: Assign mock priorities/weights to edges (for filtering)
    const edgeWeights: Record<string, number> = {};
    edges.forEach((edge) => {
      let weight = 0.7;
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode?.type === "Suspect" && targetNode?.type === "Evidence") weight = 0.95;
      else if (sourceNode?.type === "Suspect" && targetNode?.type === "Location") weight = 0.85;
      else if (sourceNode?.type === "Witness" && targetNode?.type === "Suspect") weight = 0.8;
      else if (edge.label.includes("CONTRADICTS") || edge.label.includes("LIED")) weight = 0.99;
      
      edgeWeights[edge.id || `${edge.source}-${edge.target}-${edge.label}`] = weight;
    });

    // Step 2: Apply Filters
    const activeNodes = nodes.filter(n => {
      const isTypeActive = nodeTypeFilters[n.type] ?? true;
      return isTypeActive;
    });
    
    const activeNodeIds = new Set(activeNodes.map(n => n.id));

    // Filter edges:
    // A. Source and Target must both be active
    // B. Edge weight must be >= priority threshold
    // C. If lazy expansion is active and a node is selected, show only edges connected to the selected node
    let filteredEdges = edges.filter(e => {
      const key = e.id || `${e.source}-${e.target}-${e.label}`;
      const weight = edgeWeights[key] || 0.7;
      const passesWeight = weight >= edgePriorityThreshold;
      const nodesAreActive = activeNodeIds.has(e.source) && activeNodeIds.has(e.target);
      
      if (!nodesAreActive || !passesWeight) return false;
      
      if (lazyExpansion && selectedNode) {
        return e.source === selectedNode.id || e.target === selectedNode.id;
      }
      return true;
    });

    // If lazy expansion is active, restrict visible nodes to the selected node and its neighbors
    let filteredNodes = activeNodes;
    if (lazyExpansion && selectedNode) {
      const connectedNodeIds = new Set<string>([selectedNode.id]);
      filteredEdges.forEach(e => {
        connectedNodeIds.add(e.source);
        connectedNodeIds.add(e.target);
      });
      filteredNodes = activeNodes.filter(n => connectedNodeIds.has(n.id));
    }

    // Step 3: Compute Positions (Grouped in horizontal swimlane columns)
    const colXPositions = {
      documents: 50,
      chunks: 350,
      entities: 650,
      types: 950,
      summaries: 1250
    };

    const colCounts = {
      documents: 0,
      chunks: 0,
      entities: 0,
      types: 0,
      summaries: 0
    };

    const startY = 80;
    const spacingY = 90;

    // Find neighbors of the selected node for path highlighting
    const neighborNodeIds = new Set<string>();
    if (selectedNode) {
      edges.forEach(e => {
        if (e.source === selectedNode.id) {
          neighborNodeIds.add(e.target);
        } else if (e.target === selectedNode.id) {
          neighborNodeIds.add(e.source);
        }
      });
    }

    const activeNodesFromEdge = new Set<string>();
    if (selectedEdge) {
      activeNodesFromEdge.add(selectedEdge.source);
      activeNodesFromEdge.add(selectedEdge.target);
    }

    const formattedNodes: Node[] = filteredNodes.map((node) => {
      const typeLower = (node.type || "").toLowerCase();
      let colKey: keyof typeof colXPositions = "entities";

      if (typeLower.includes("document") && !typeLower.includes("chunk") && !typeLower.includes("summary")) {
        colKey = "documents";
      } else if (typeLower.includes("chunk")) {
        colKey = "chunks";
      } else if (typeLower.includes("type")) {
        colKey = "types";
      } else if (typeLower.includes("summary")) {
        colKey = "summaries";
      }

      const x = colXPositions[colKey];
      const y = startY + colCounts[colKey] * spacingY;
      colCounts[colKey] += 1;

      // Determine brightness / dimming based on selection
      const isSelf = selectedNode?.id === node.id;
      const isNeighbor = selectedNode ? neighborNodeIds.has(node.id) : false;
      let isDimmed = false;
      if (selectedNode) {
        isDimmed = !isSelf && !isNeighbor;
      } else if (selectedEdge) {
        isDimmed = !activeNodesFromEdge.has(node.id);
      }

      return {
        id: node.id,
        position: { x, y },
        data: { 
          label: node.label,
          type: node.type || "Entity",
          isDimmed
        },
        selected: selectedNode?.id === node.id,
        type: "customNode"
      };
    });

    // Add header nodes at the top of each column that has at least one node (or show all)
    const headerNodes: Node[] = Object.entries(colXPositions).map(([colKey, x]) => {
      let label = "ENTITIES";
      if (colKey === "documents") label = "DOCUMENTS";
      else if (colKey === "chunks") label = "CHUNKS";
      else if (colKey === "types") label = "TYPES";
      else if (colKey === "summaries") label = "SUMMARIES";

      return {
        id: `header-${colKey}`,
        position: { x: x + 10, y: 25 },
        data: { label },
        type: "columnHeader",
        draggable: false,
        selectable: false
      };
    });

    const finalNodes = [...headerNodes, ...formattedNodes];

    const formattedEdges: Edge[] = filteredEdges.map((edge) => {
      const isSelected = selectedEdge?.source === edge.source && selectedEdge?.target === edge.target && selectedEdge?.label === edge.label;
      
      let isEdgeDimmed = false;
      let isEdgeHighlighted = false;
      if (selectedNode) {
        isEdgeDimmed = edge.source !== selectedNode.id && edge.target !== selectedNode.id;
        isEdgeHighlighted = edge.source === selectedNode.id || edge.target === selectedNode.id;
      } else if (selectedEdge) {
        isEdgeDimmed = !isSelected;
        isEdgeHighlighted = isSelected;
      }

      // Determine colors and styling
      let strokeColor = "#B8B3A0";
      if (isEdgeHighlighted) {
        strokeColor = "#4A6B53"; // Active link glowing green
      }

      return {
        id: `${edge.source}-${edge.target}-${edge.label}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "default",
        selected: isSelected,
        style: {
          stroke: strokeColor,
          strokeWidth: isEdgeHighlighted ? 3.5 : 1.5,
          opacity: isEdgeDimmed ? 0.08 : 1.0,
          transition: "all 0.2s ease"
        },
        labelStyle: {
          fill: isEdgeDimmed ? "transparent" : "#5C615D",
          fontSize: 9,
          fontWeight: 600,
          opacity: isEdgeDimmed ? 0 : 1.0,
          transition: "all 0.2s ease"
        },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        labelBgStyle: {
          fill: "#FAF6F0",
          fillOpacity: isEdgeDimmed ? 0 : 0.95
        }
      };
    });

    setRfNodes(finalNodes);
    setRfEdges(formattedEdges);
  }, [nodes, edges, nodeTypeFilters, edgePriorityThreshold, lazyExpansion, selectedNode, selectedEdge, setRfNodes, setRfEdges]);

  // Recalculate layout on filter changes
  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  const onNodeClick = (_: any, node: any) => {
    const originalNode = nodes.find(n => n.id === node.id);
    if (originalNode) {
      setSelectedNode(originalNode);
      setSelectedEdge(null); // Deselect edge
      setSidebarTab("details");
    }
  };

  const onEdgeClick = (_: any, edge: any) => {
    const originalEdge = edges.find(e => `${e.source}-${e.target}-${e.label}` === edge.id);
    if (originalEdge) {
      setSelectedEdge(originalEdge);
      setSelectedNode(null); // Deselect node
      setSidebarTab("details");
    }
  };

  const onPaneClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleFilterToggle = (type: string) => {
    setNodeTypeFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const resetFilters = () => {
    setNodeTypeFilters({
      Suspect: true,
      Witness: true,
      Evidence: true,
      Location: true,
      Entity: true
    });
    setEdgePriorityThreshold(0.1);
    setLazyExpansion(false);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  // Node details renderer
  const renderDetailPanel = () => {
    // Helper to format property values recursively (handles nested objects, arrays, booleans, and JSON strings)
    const formatPropertyValue = (value: any): React.ReactNode => {
      if (value === null || value === undefined) return "N/A";
      
      // Attempt to parse string values that contain stringified JSON or python-like dict representations
      if (typeof value === "string") {
        const trimmed = value.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || 
            (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
          try {
            // 1. Try standard JSON parse
            const parsed = JSON.parse(trimmed);
            return formatPropertyValue(parsed);
          } catch (e) {
            // 2. Try to parse python/cognee pseudo-dict or list representation (e.g. ["key": "val"])
            try {
              let candidate = trimmed;
              if (trimmed.startsWith("[") && trimmed.endsWith("]") && trimmed.includes(":")) {
                candidate = "{" + trimmed.slice(1, -1) + "}";
              }
              // Replace single quotes with double quotes safely supporting escaped characters
              const sanitized = candidate
                .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
                .replace(/:\s*True/gi, ": true")
                .replace(/:\s*False/gi, ": false")
                .replace(/:\s*None/gi, ": null");
              const parsed = JSON.parse(sanitized);
              return formatPropertyValue(parsed);
            } catch (e2) {
              // Fall back to plain string
            }
          }
        }
      }

      if (typeof value === "object") {
        if (Array.isArray(value)) {
          if (value.length === 0) return "[]";
          return (
            <div className="flex flex-wrap gap-1 mt-1">
              {value.map((item, index) => (
                <span key={index} className="px-1.5 py-0.5 bg-[#4A6B53]/10 text-[#4A6B53] rounded text-[10px] font-mono border border-[#4A6B53]/25">
                  {String(item)}
                </span>
              ))}
            </div>
          );
        }
        const entries = Object.entries(value);
        if (entries.length === 0) return "{}";
        return (
          <div className="pl-2 border-l-2 border-[#D0CBB7] mt-1.5 space-y-2.5 bg-[#FAF6F0]/60 p-2 rounded">
            {entries.map(([subKey, subVal]) => {
              const isLargeText = ["content", "text", "description", "summary"].includes(subKey.toLowerCase());
              return (
                <div key={subKey} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-[#5C615D] uppercase font-bold tracking-wider">{subKey.replace(/_/g, " ")}</span>
                  {isLargeText ? (
                    <span className="text-xs text-[#2D312E] leading-relaxed bg-white border border-[#D0CBB7]/40 p-2 rounded block mt-0.5 whitespace-pre-wrap wrap-break-word font-sans shadow-sm">
                      {formatPropertyValue(subVal)}
                    </span>
                  ) : (
                    <span className="text-[#2D312E] wrap-break-word text-[11px] font-sans">
                      {formatPropertyValue(subVal)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
      if (typeof value === "boolean") return value ? "True" : "False";
      return String(value);
    };

    if (selectedNode) {
      return (
        <div className="space-y-4 animate-fade-in font-serif text-[#2D312E]">
          <div className="flex items-center gap-2 border-b border-[#D0CBB7] pb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#4A6B53]/15 text-[#4A6B53]">
              {selectedNode.type}
            </span>
            <h4 className="font-semibold truncate text-md">{selectedNode.label}</h4>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-semibold text-[#5C615D] uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#4A6B53]" />
              Node Properties
            </h5>
            <div className="bg-[#FAF6F0] rounded-lg p-3 border border-[#D0CBB7] space-y-3 text-xs">
              {Object.keys(selectedNode.properties || {}).length === 0 ? (
                <span className="text-[#5C615D] italic">No custom properties extracted.</span>
              ) : (
                Object.entries(selectedNode.properties).map(([key, val]) => {
                  const isTopLargeText = ["content", "text", "description", "summary"].includes(key.toLowerCase());
                  return (
                    <div key={key} className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-[#5C615D] capitalize font-semibold">{key.replace(/_/g, " ")}</span>
                      {isTopLargeText ? (
                        <div className="text-xs text-[#2D312E] leading-relaxed bg-white border border-[#D0CBB7]/40 p-2.5 rounded mt-1 whitespace-pre-wrap wrap-break-word font-sans shadow-sm">
                          {formatPropertyValue(val)}
                        </div>
                      ) : (
                        <div className="font-medium text-[#2D312E] wrap-break-word">
                          {formatPropertyValue(val)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      );
    }

    if (selectedEdge) {
      const srcNode = nodes.find(n => n.id === selectedEdge.source);
      const tgtNode = nodes.find(n => n.id === selectedEdge.target);
      return (
        <div className="space-y-4 animate-fade-in font-serif text-[#2D312E]">
          <div className="flex items-center gap-2 border-b border-[#D0CBB7] pb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#B85C4C]/15 text-[#B85C4C]">
              Relationship
            </span>
            <h4 className="font-semibold truncate text-md">{selectedEdge.label}</h4>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-[#FAF6F0] rounded-lg p-3 border border-[#D0CBB7] space-y-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-[#5C615D]">Source Entity</span>
                <span className="font-medium text-[#2D312E]">{srcNode?.label || selectedEdge.source} ({srcNode?.type})</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-[#5C615D]">Relationship Type</span>
                <span className="text-[#4A6B53] font-bold tracking-wide font-mono">{selectedEdge.label}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-[#5C615D]">Target Entity</span>
                <span className="font-medium text-[#2D312E]">{tgtNode?.label || selectedEdge.target} ({tgtNode?.type})</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-[#5C615D] py-12">
        <HelpCircle className="w-10 h-10 text-[#D0CBB7] mb-2" />
        <p className="text-xs font-serif">Click a node or edge in the graph to view properties and metadata.</p>
      </div>
    );
  };

  return (
    <div className="flex-1 flex h-screen overflow-hidden bg-[#FAF6F0]">
      {/* Graph Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Top Control Overlay */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-3 max-w-[calc(100%-20px)]">
          {/* Node Type Filters */}
          <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-lg p-2.5 shadow-sm flex items-center gap-3 text-xs">
            <span className="font-semibold text-[#2D312E] flex items-center gap-1 shrink-0 font-serif">
              <Filter className="w-3.5 h-3.5 text-[#4A6B53]" />
              Types:
            </span>
            <div className="flex items-center gap-2">
              {["Suspect", "Witness", "Evidence", "Location"].map((type) => (
                <label key={type} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={nodeTypeFilters[type] ?? true}
                    onChange={() => handleFilterToggle(type)}
                    className="accent-[#4A6B53] h-3.5 w-3.5"
                  />
                  <span className="text-[#5C615D] hover:text-[#2D312E] transition-colors">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Slider Controls */}
          <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-lg p-2.5 shadow-sm flex items-center gap-3 text-xs">
            <span className="font-semibold text-[#2D312E] flex items-center gap-1 shrink-0 font-serif">
              <Sliders className="w-3.5 h-3.5 text-[#4A6B53]" />
              Priority:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={edgePriorityThreshold}
                onChange={(e) => setEdgePriorityThreshold(parseFloat(e.target.value))}
                className="w-20 accent-[#4A6B53]"
              />
              <span className="font-mono text-[#5C615D] w-6 text-right font-bold">
                {Math.round(edgePriorityThreshold * 10)}
              </span>
            </div>
          </div>

          {/* Lazy Expansion Mode */}
          <button
            onClick={() => setLazyExpansion(!lazyExpansion)}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors ${
              lazyExpansion
                ? "bg-[#4A6B53]/15 text-[#4A6B53] border-[#4A6B53]/50"
                : "bg-[#F4F0E6] border-[#D0CBB7] text-[#5C615D] hover:text-[#2D312E]"
            }`}
            title="Focus only on neighbors of selected node to clean up layout"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="font-serif">{lazyExpansion ? "Lazy On" : "Lazy Expansion"}</span>
          </button>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="bg-[#F4F0E6] border border-[#D0CBB7] hover:border-gray-400 text-[#5C615D] hover:text-[#2D312E] px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="font-serif">Reset View</span>
          </button>
        </div>

        {/* React Flow Panel */}
        <div className="flex-1 w-full h-full bg-[#FAF6F0]">
          {!activeCaseId ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center text-[#5C615D]">
              <HelpCircle className="w-12 h-12 mb-2 text-[#D0CBB7]" />
              <h4 className="font-semibold text-[#2D312E] font-serif">No active case selected</h4>
              <p className="text-xs max-w-sm mt-1 font-serif">Please select a completed case from the Case Library screen to explore its memory graph.</p>
            </div>
          ) : nodes.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center text-[#5C615D]">
              <GitCommit className="w-12 h-12 mb-2 text-[#4A6B53] animate-pulse" />
              <h4 className="font-semibold text-[#2D312E] font-serif">Extracting memory graph</h4>
              <p className="text-xs max-w-sm mt-1 font-serif">Graph coordinates are currently being mapped. If this case is still processing, wait for ingestion to complete.</p>
            </div>
          ) : (
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.5}
              maxZoom={2.0}
            >
              <Background color="#D0CBB7" gap={16} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          )}
        </div>
      </div>

      {/* Side Details Panel */}
      <div className="w-80 border-l border-[#D0CBB7] bg-[#F4F0E6] flex flex-col h-full shrink-0">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 border-b border-[#D0CBB7] bg-[#EFECE1] text-xs">
          <button
            onClick={() => setSidebarTab("details")}
            className={`py-3 text-center font-medium border-b-2 transition-all font-serif ${
              sidebarTab === "details"
                ? "text-[#4A6B53] border-[#4A6B53] bg-[#F4F0E6]"
                : "text-[#5C615D] border-transparent hover:text-[#2D312E]"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setSidebarTab("chunks")}
            className={`py-3 text-center font-medium border-b-2 transition-all font-serif ${
              sidebarTab === "chunks"
                ? "text-[#4A6B53] border-[#4A6B53] bg-[#F4F0E6]"
                : "text-[#5C615D] border-transparent hover:text-[#2D312E]"
            }`}
          >
            Chunks
          </button>
          <button
            onClick={() => setSidebarTab("provenance")}
            className={`py-3 text-center font-medium border-b-2 transition-all font-serif ${
              sidebarTab === "provenance"
                ? "text-[#4A6B53] border-[#4A6B53] bg-[#F4F0E6]"
                : "text-[#5C615D] border-transparent hover:text-[#2D312E]"
            }`}
          >
            Lineage
          </button>
          <button
            onClick={() => setSidebarTab("citations")}
            className={`py-3 text-center font-medium border-b-2 transition-all font-serif ${
              sidebarTab === "citations"
                ? "text-[#4A6B53] border-[#4A6B53] bg-[#F4F0E6]"
                : "text-[#5C615D] border-transparent hover:text-[#2D312E]"
            }`}
          >
            Cites
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 1. DETAILS TAB */}
          {sidebarTab === "details" && renderDetailPanel()}

          {/* 2. CHUNKS TAB */}
          {sidebarTab === "chunks" && (
            <div className="space-y-4 animate-fade-in font-serif text-[#2D312E]">
              <h5 className="text-xs font-semibold text-[#5C615D] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#4A6B53]" />
                Case Chunk Metadata
              </h5>
              <div className="space-y-3">
                {chunks.map((chunk, idx) => (
                  <div key={idx} className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg p-3 text-[11px] space-y-2">
                    <div className="flex justify-between items-center text-[#5C615D] font-mono text-[9px] border-b border-[#D0CBB7]/50 pb-1.5">
                      <span>Source: {chunk.source}</span>
                      {chunk.score && <span>Score: {Math.round(chunk.score * 100)}%</span>}
                    </div>
                    <p className="text-[#2D312E] leading-relaxed font-serif">{chunk.text}</p>
                    {chunk.metadata && (
                      <div className="flex gap-3 text-[#5C615D] font-mono text-[9px] pt-1">
                        {chunk.metadata.page && <span>Page: {chunk.metadata.page}</span>}
                        {chunk.metadata.line && <span>Line: {chunk.metadata.line}</span>}
                      </div>
                    )}
                  </div>
                ))}
                {chunks.length === 0 && (
                  <p className="text-xs text-[#5C615D] text-center italic py-10">No chunks retrieved for this case.</p>
                )}
              </div>
            </div>
          )}

          {/* 3. PROVENANCE TAB */}
          {sidebarTab === "provenance" && (
            <div className="space-y-4 animate-fade-in font-serif text-[#2D312E]">
              <h5 className="text-xs font-semibold text-[#5C615D] uppercase tracking-wider flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-[#4A6B53]" />
                Lineage / Data Flow
              </h5>
              {provenance ? (
                <div className="space-y-3 text-xs">
                  <div className="bg-[#FAF6F0] rounded-lg p-3 border border-[#D0CBB7] space-y-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-[#5C615D]">Dataset scope UUID</span>
                      <span className="text-[#2D312E] font-mono truncate">{provenance.dataset_id}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-[#5C615D]">Lineage Type</span>
                      <span className="font-medium text-[#2D312E]">{provenance.provenance_type}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-[#5C615D]">Isolation Layer</span>
                      <span className="font-medium text-[#2D312E]">Tenant Isolated (Cognee Cloud)</span>
                    </div>
                  </div>

                  <h6 className="text-[10px] uppercase font-bold text-[#5C615D] tracking-wider mt-4">Source Documents Ingested</h6>
                  <div className="space-y-2">
                    {provenance.source_files?.map((file: any) => (
                      <div key={file.id} className="p-2.5 bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg flex items-center justify-between">
                        <span className="text-[11px] font-medium text-[#2D312E] truncate max-w-[170px]">{file.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#EFECE1] text-[#4A6B53] rounded uppercase">
                          {file.extension || ".pdf"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#5C615D] text-center italic py-10">No lineage record loaded.</p>
              )}
            </div>
          )}

          {/* 4. CITATIONS TAB */}
          {sidebarTab === "citations" && (
            <div className="space-y-4 animate-fade-in font-serif text-[#2D312E]">
              <h5 className="text-xs font-semibold text-[#5C615D] uppercase tracking-wider flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-[#4A6B53]" />
                Citations Index
              </h5>
              <div className="space-y-3">
                {citations.map((cite, idx) => (
                  <div key={idx} className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#4A6B53] font-mono">{cite.reference_key}</span>
                      <span className="text-[9px] text-[#5C615D]">Doc ID: {String(cite.document_id).slice(0, 8)}...</span>
                    </div>
                    <div className="text-[#2D312E] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#5C615D] text-[10px]">Format:</span>
                        <span>{cite.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5C615D] text-[10px]">Uploaded:</span>
                        <span>{new Date(cite.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {citations.length === 0 && (
                  <p className="text-xs text-[#5C615D] text-center italic py-10">No citations tracked for this case.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
