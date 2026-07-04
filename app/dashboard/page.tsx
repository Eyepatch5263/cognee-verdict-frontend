"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import CaseLibrary from "../components/CaseLibrary";
import MemoryExplorer from "../components/MemoryExplorer";
import InteractiveMindmap from "../components/InteractiveMindmap";
import AdvisoryChat, { ChatMessage } from "../components/AdvisoryChat";
import AnalysisDashboard from "../components/AnalysisDashboard";
import FeedbackPanel from "../components/FeedbackPanel";
import BenchmarkPanel from "../components/BenchmarkPanel";
import { 
  Case, 
  CogniVerdictAPI, 
  MOCK_CASES, 
  GraphNode, 
  GraphEdge, 
  RecallResult 
} from "@/lib/api";
import { Scale } from "lucide-react";

// Native IndexedDB cache utilities for smooth, offline-first graph loading
const DB_NAME = "CogneeVerdictDB";
const STORE_NAME = "case_cache";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject("Window is undefined");
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "caseId" });
      }
    };
  });
}

async function getCachedCase(caseId: string): Promise<any | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(caseId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (err) {
    console.error("IndexedDB get error:", err);
    return null;
  }
}

async function saveCachedCase(caseId: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ caseId, ...data, timestamp: Date.now() });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (err) {
    console.error("IndexedDB put error:", err);
  }
}

export default function DashboardHome() {
  const [activeTab, setActiveTab] = useState("library");
  const [isLive, setIsLive] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

  // Case details states
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [caseChunks, setCaseChunks] = useState<RecallResult[]>([]);
  const [caseProvenance, setCaseProvenance] = useState<any>(null);
  const [caseCitations, setCaseCitations] = useState<any[]>([]);

  // Get active case item details
  const activeCase = cases.find(c => c.id === activeCaseId) || null;
  const activeCaseStatus = activeCase?.status;

  // Chat states
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Check health and set mode on load
  useEffect(() => {
    async function init() {
      try {
        const healthy = await CogniVerdictAPI.checkBackendHealth();
        setIsLive(healthy);
        
        if (healthy) {
          console.log("Connected to live CogniVerdict FastAPI backend.");
          try {
            const list = await CogniVerdictAPI.fetchCases();
            setCases(list);
            setActiveCaseId(null);
          } catch (err) {
            console.error("Failed to load active case list from backend:", err);
          }
        } else {
          console.log("Running in offline Demo Mode (Mock Cognee memory active).");
          setCases(MOCK_CASES);
          setActiveCaseId(MOCK_CASES.length > 0 ? MOCK_CASES[0].id : null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Helper to fetch and cache case details (graph, chunks, citations)
  const fetchAndCacheCaseDetails = useCallback(async (caseId: string, version: string, updateLoadingState: boolean) => {
    if (updateLoadingState) {
      setIsAnalysisLoading(true);
    }
    try {
      let nodes: any[] = [];
      let edges: any[] = [];
      let chunks: any[] = [];
      let provenance: any = null;
      let citations: any[] = [];

      try {
        const graph = await CogniVerdictAPI.getCaseGraph(caseId);
        nodes = graph?.nodes || [];
        edges = graph?.edges || [];
      } catch (err) {
        console.error("Failed to load case graph:", err);
      }

      try {
        chunks = await CogniVerdictAPI.getCaseChunks(caseId) || [];
      } catch (err) {
        console.error("Failed to load case chunks:", err);
      }

      try {
        provenance = await CogniVerdictAPI.getCaseProvenance(caseId) || null;
      } catch (err) {
        console.error("Failed to load case provenance:", err);
      }

      try {
        citations = await CogniVerdictAPI.getCaseCitations(caseId) || [];
      } catch (err) {
        console.error("Failed to load case citations:", err);
      }

      // Render to UI
      setGraphNodes(nodes);
      setGraphEdges(edges);
      setCaseChunks(chunks);
      setCaseProvenance(provenance);
      setCaseCitations(citations);

      // Save/Update in IndexedDB cache
      await saveCachedCase(caseId, {
        nodes,
        edges,
        chunks,
        provenance,
        citations,
        version
      });

      // Fetch and update case analysis in background
      try {
        const analysis = await CogniVerdictAPI.getCaseAnalysis(caseId);
        setCases(prev => prev.map(c => {
          if (c.id === caseId) {
            return {
              ...c,
              confidenceScore: analysis.ui_metrics.confidenceScore,
              suspectProbability: analysis.ui_metrics.suspectProbability,
              convictionProbability: analysis.ui_metrics.convictionProbability,
              witnesses: analysis.ui_metrics.witnesses,
              contradictions: analysis.ui_metrics.contradictions,
              feedbacks: analysis.feedbacks,
              status: "completed"
            };
          }
          return c;
        }));
      } catch (err) {
        console.error("Failed to load case analysis:", err);
      }
    } finally {
      if (updateLoadingState) {
        setIsAnalysisLoading(false);
      }
    }
  }, []);

  // Fetch active case information when selected case changes
  useEffect(() => {
    if (!activeCaseId) {
      setGraphNodes([]);
      setGraphEdges([]);
      setCaseChunks([]);
      setCaseProvenance(null);
      setCaseCitations([]);
      return;
    }

    const caseId = activeCaseId;

    async function loadCaseDetails() {
      if (isLive && activeCaseStatus !== "completed") {
        return;
      }

      // Determine active case version/hash from the cases list
      const currentCase = cases.find(c => c.id === caseId);
      const currentVersion = currentCase 
        ? `${currentCase.entitiesCount}-${currentCase.relationshipsCount}-${currentCase.status}`
        : "";

      // 1. Check IndexedDB
      let cached = null;
      try {
        cached = await getCachedCase(caseId);
      } catch (err) {
        console.error("Failed to read from IndexedDB cache:", err);
      }

      if (cached) {
        // HIT -> Render instantly!
        setGraphNodes(cached.nodes || []);
        setGraphEdges(cached.edges || []);
        setCaseChunks(cached.chunks || []);
        setCaseProvenance(cached.provenance || null);
        setCaseCitations(cached.citations || []);

        // Background version check
        if (cached.version !== currentVersion) {
          // Version changed -> refetch + update cache + UI in the background
          fetchAndCacheCaseDetails(caseId, currentVersion, false);
        }
      } else {
        // MISS -> fetch from Cognee -> cache -> render
        await fetchAndCacheCaseDetails(caseId, currentVersion, true);
      }
    }

    loadCaseDetails();
  }, [activeCaseId, activeCaseStatus, isLive, fetchAndCacheCaseDetails]);

  // Poll status for cases in "processing" state
  useEffect(() => {
    const processingCases = cases.filter(c => c.status === "processing" || c.status === "pending");
    if (processingCases.length === 0 || !isLive) return;

    const intervalId = setInterval(async () => {
      for (const c of processingCases) {
        try {
          const statusRes = await CogniVerdictAPI.getCaseStatus(c.id);
          const rawStatus = statusRes.status.toUpperCase();
          
          let nextStatus: "completed" | "processing" | "pending" | "failed" = "processing";
          
          if (rawStatus === "DATASET_PROCESSING_COMPLETED") {
            nextStatus = "completed";
          } else if (rawStatus === "DATASET_PROCESSING_ERRORED" || rawStatus === "FAILED" || rawStatus === "ERROR") {
            nextStatus = "failed";
          } else if (rawStatus === "DATASET_PROCESSING_STARTED" || rawStatus === "PROCESSING") {
            nextStatus = "processing";
          }
          
          if (nextStatus !== c.status) {
            // Update status in the state
            setCases(prev => prev.map(item => {
              if (item.id === c.id) {
                return { ...item, status: nextStatus };
              }
              return item;
            }));

            // If it completed, trigger the analysis fetch to fill in details (like metrics, confidence, etc.)
            if (nextStatus === "completed") {
              try {
                const analysis = await CogniVerdictAPI.getCaseAnalysis(c.id);
                setCases(prev => prev.map(item => {
                  if (item.id === c.id) {
                    return {
                      ...item,
                      confidenceScore: analysis.ui_metrics.confidenceScore,
                      suspectProbability: analysis.ui_metrics.suspectProbability,
                      convictionProbability: analysis.ui_metrics.convictionProbability,
                      witnesses: analysis.ui_metrics.witnesses,
                      contradictions: analysis.ui_metrics.contradictions,
                      feedbacks: analysis.feedbacks,
                      status: "completed"
                    };
                  }
                  return item;
                }));
              } catch (analysisErr) {
                console.error("Failed to load analysis for completed case:", analysisErr);
              }
            }
          }
        } catch (err) {
          console.error(`Failed to poll status for case ${c.id}:`, err);
        }
      }
    }, 1000); // 1000ms polling interval

    return () => clearInterval(intervalId);
  }, [cases, isLive]);

  // Handle case selection
  const handleSelectCase = (id: string) => {
    setActiveCaseId(id);
    // Switch to Memory Explorer automatically when case is selected
    setActiveTab("explorer");
  };

  // Handle file upload pipeline execution for a unified collection
  const handleUploadCollection = async (files: File[], collectionName: string) => {
    if (files.length === 0) return;

    // Ingest all files collectively in a single API request
    const uploadRes = await CogniVerdictAPI.uploadCollection(files, collectionName);
    const newId = uploadRes.dataset_id;
    
    // Refresh cases list
    const healthy = await CogniVerdictAPI.checkBackendHealth();
    setIsLive(healthy);
    
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const filenamesStr = files.map(f => f.name).join(", ");
    
    if (!healthy) {
      setCases([...MOCK_CASES]);
      setActiveCaseId(newId);
    } else {
      // In live mode: construct a temporary unified case card
      const newCaseItem: Case = {
        id: newId,
        name: collectionName,
        filename: files.length === 1 ? files[0].name : `${files.length} files (${filenamesStr})`,
        uploadedAt: new Date().toISOString(),
        status: "processing",
        sizeBytes: totalSize,
        entitiesCount: 0,
        relationshipsCount: 0,
        confidenceScore: 0,
        suspectProbability: 0,
        convictionProbability: 0,
        witnesses: [],
        contradictions: []
      };
      
      setCases(prev => {
        const exists = prev.some(c => c.id === newId);
        if (exists) {
          return prev.map(c => c.id === newId ? { ...c, status: "processing", sizeBytes: totalSize, filename: newCaseItem.filename } : c);
        }
        return [newCaseItem, ...prev];
      });
      setActiveCaseId(newId);
    }
  };

  // Handle Chat advisory messaging
  const handleSendChatMessage = async (query: string) => {
    if (!activeCaseId) return;

    // 1. Create User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query
    };

    const currentChat = chatHistory[activeCaseId] || [];
    const updatedChat = [...currentChat, userMsg];
    setChatHistory(prev => ({
      ...prev,
      [activeCaseId]: updatedChat
    }));
    setIsSendingChat(true);

    try {
      // 2. Fetch memory from Cognee recall
      const recallRes = await CogniVerdictAPI.recallMemory(activeCaseId, query);
      
      // 3. Format AI Response
      let aiText = "No matching memory records could be retrieved for this query.";
      let evidenceCards: any[] = [];
      let citations: string[] = [];

      if (recallRes && recallRes.length > 0) {
        aiText = recallRes[0].text;
        evidenceCards = recallRes.map(r => ({
          title: r.source.replace(/_/g, " ").toUpperCase(),
          desc: r.text.slice(0, 160) + (r.text.length > 160 ? "..." : ""),
          type: r.source.includes("witness") || r.source.includes("testimony") ? "testimony" : "evidence",
          score: r.score ? Math.round(r.score * 100) : undefined
        }));
        citations = recallRes[0].citations || [];
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiText,
        evidenceCards,
        citations
      };

      setChatHistory(prev => ({
        ...prev,
        [activeCaseId]: [...updatedChat, aiMsg]
      }));
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: `Error calling Cognee Cloud: ${err.message || "Request timed out."}`
      };
      setChatHistory(prev => ({
        ...prev,
        [activeCaseId]: [...updatedChat, errorMsg]
      }));
    } finally {
      setIsSendingChat(false);
    }
  };

  // Dynamically extract evidence nodes from graph to provide to FeedbackPanel
  const evidenceNodes = useMemo(() => {
    // 1. Identify all document / source nodes in the graph
    const docNodesMap = new Map<string, string>(); // maps id -> document label (e.g. "WS-001")
    
    graphNodes.forEach(n => {
      const typeLower = (n.type || "").toLowerCase();
      const labelLower = (n.label || "").toLowerCase();
      
      const isDoc = ["textdocument", "document", "file", "ws-", "er-", "ir-", "cctv-", "report"].some(
        x => typeLower.includes(x) || labelLower.includes(x)
      ) || labelLower.startsWith("ws-") || labelLower.startsWith("er-") || labelLower.startsWith("ir-") || labelLower.startsWith("cctv-");
      
      const isChunk = labelLower.includes("chunk");

      if (isDoc && !isChunk) {
        docNodesMap.set(n.id, n.label);
      }
    });

    // 2. Extract actual evidence entities and map them to their document source
    const seenKeys = new Set<string>();
    const nodesList: { id: string; label: string }[] = [];

    graphNodes.forEach(n => {
      const typeLower = (n.type || "").toLowerCase();
      const labelLower = (n.label || "").toLowerCase();

      // Exclude document nodes or chunk nodes themselves
      const isDocOrChunk = ["chunk", "summary", "textdocument", "document", "file", "metadata", "dataset", "cases"].some(
        x => typeLower.includes(x) || labelLower.includes(x)
      ) || labelLower.startsWith("ws-") || labelLower.startsWith("er-") || labelLower.startsWith("ir-") || labelLower.startsWith("cctv-");

      if (isDocOrChunk) return;

      // Include valid evidence types or labels
      const isEvNode = ["evidence", "cctv", "dna", "log", "statement", "testimony", "asset", "event", "knife", "phone", "sedan", "canister", "report", "weapon", "fingerprint"].some(
        x => typeLower.includes(x) || labelLower.includes(x)
      );

      if (isEvNode) {
        // Trace to find which document node this evidence is connected to
        let sourceDocLabel = "";
        
        // Find connected edges
        const connectedEdges = graphEdges.filter(e => e.source === n.id || e.target === n.id);
        
        // Try direct edge to document first
        for (const edge of connectedEdges) {
          const otherId = edge.source === n.id ? edge.target : edge.source;
          if (docNodesMap.has(otherId)) {
            sourceDocLabel = docNodesMap.get(otherId) || "";
            break;
          }
        }
        
        // If not found directly, try finding edge to a chunk first, and then chunk to document
        if (!sourceDocLabel) {
          for (const edge of connectedEdges) {
            const otherId = edge.source === n.id ? edge.target : edge.source;
            const otherNode = graphNodes.find(gn => gn.id === otherId);
            if (otherNode && (otherNode.label || "").toLowerCase().includes("chunk")) {
              // Find edges connecting this chunk to a document
              const chunkEdges = graphEdges.filter(e => e.source === otherId || e.target === otherId);
              for (const ce of chunkEdges) {
                const docId = ce.source === otherId ? ce.target : ce.source;
                if (docNodesMap.has(docId)) {
                  sourceDocLabel = docNodesMap.get(docId) || "";
                  break;
                }
              }
            }
            if (sourceDocLabel) break;
          }
        }

        // Format clean name for the evidence
        let cleanLabel = n.label;
        if (cleanLabel.toLowerCase().includes("_chunk_")) {
          cleanLabel = cleanLabel.split("_chunk_")[0];
        }
        if (cleanLabel.includes(".")) {
          cleanLabel = cleanLabel.split(".")[0];
        }
        cleanLabel = cleanLabel.replace(/([A-Z])/g, " $1");
        cleanLabel = cleanLabel.replace(/[_-]/g, " ").trim();
        cleanLabel = cleanLabel.split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        // Format document label cleanly (e.g. "WS-001" -> "WS-001")
        let cleanDoc = sourceDocLabel;
        if (cleanDoc) {
          cleanDoc = cleanDoc.replace(/[_-]/g, " ").trim();
        }

        let displayLabel = cleanLabel;
        if (cleanDoc) {
          displayLabel = `${cleanLabel} (from ${cleanDoc})`;
        } else {
          // Fallback to properties if any
          const props = n.properties || {};
          const propDoc = props.source || props.document || props.file;
          if (propDoc) {
            displayLabel = `${cleanLabel} (from ${propDoc})`;
          }
        }

        const key = displayLabel.toLowerCase();
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          nodesList.push({ id: n.id, label: displayLabel });
        }
      }
    });

    if (nodesList.length === 0) {
      return [
        { id: "evidence-forensic", label: "Forensic Laboratory Report (from ER-001)" },
        { id: "evidence-cctv", label: "CCTV Digital Access Logs (from CCTV-002)" },
        { id: "evidence-dna", label: "DNA Fingerprint Analysis (from ER-002)" }
      ];
    }

    return nodesList;
  }, [graphNodes, graphEdges]);

  // Handle feedback override submission and recomputation
  const handleApplyFeedback = async (feedbacks: any[]) => {
    if (!activeCaseId) return;
    setIsAnalysisLoading(true);
    try {
      const updatedAnalysis = await CogniVerdictAPI.submitCaseFeedback(activeCaseId, feedbacks);
      
      // Update local state with the recomputed response
      setCases(prev => prev.map(c => {
        if (c.id === activeCaseId) {
          return {
            ...c,
            confidenceScore: updatedAnalysis.ui_metrics.confidenceScore,
            suspectProbability: updatedAnalysis.ui_metrics.suspectProbability,
            convictionProbability: updatedAnalysis.ui_metrics.convictionProbability,
            witnesses: updatedAnalysis.ui_metrics.witnesses,
            contradictions: updatedAnalysis.ui_metrics.contradictions,
            feedbacks: updatedAnalysis.feedbacks
          };
        }
        return c;
      }));

      // Reload case graph as Cognee might have pruned nodes (on forget_memory)
      const graph = await CogniVerdictAPI.getCaseGraph(activeCaseId);
      setGraphNodes(graph?.nodes || []);
      setGraphEdges(graph?.edges || []);
      
    } catch (err: any) {
      console.error("Feedback pipeline execution failed:", err);
      throw new Error(err.message || "Pipeline recomputation error.");
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // Handle case analysis trigger
  const handleAnalyzeCase = async (caseId: string) => {
    setIsAnalysisLoading(true);
    try {
      const analysis = await CogniVerdictAPI.getCaseAnalysis(caseId, true);
      setCases(prev => prev.map(c => {
        if (c.id === caseId) {
          return {
            ...c,
            confidenceScore: analysis.ui_metrics.confidenceScore,
            suspectProbability: analysis.ui_metrics.suspectProbability,
            convictionProbability: analysis.ui_metrics.convictionProbability,
            witnesses: analysis.ui_metrics.witnesses,
            contradictions: analysis.ui_metrics.contradictions,
            feedbacks: analysis.feedbacks,
            status: "completed"
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Failed to run case analysis:", err);
      throw err;
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // Handle improve memory (memify)
  const handleImproveMemory = async () => {
    if (!activeCaseId) return;
    await CogniVerdictAPI.improveMemory(activeCaseId);
    
    // Reload case data
    const graph = await CogniVerdictAPI.getCaseGraph(activeCaseId);
    setGraphNodes(graph?.nodes || []);
    setGraphEdges(graph?.edges || []);
    
    // Reload case analysis to reflect new reasoning and score updates
    try {
      const analysis = await CogniVerdictAPI.getCaseAnalysis(activeCaseId);
      setCases(prev => prev.map(c => {
        if (c.id === activeCaseId) {
          return {
            ...c,
            confidenceScore: analysis.ui_metrics.confidenceScore,
            suspectProbability: analysis.ui_metrics.suspectProbability,
            convictionProbability: analysis.ui_metrics.convictionProbability,
            witnesses: analysis.ui_metrics.witnesses,
            contradictions: analysis.ui_metrics.contradictions,
            feedbacks: analysis.feedbacks,
            status: "completed"
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Failed to reload analysis after graph improvement:", err);
    }
  };

  // Handle forget memory
  const handleForgetMemory = async (dataId?: string, memoryOnly = false) => {
    if (!activeCaseId) return;
    await CogniVerdictAPI.forgetMemory(activeCaseId, dataId, memoryOnly);
    
    // Reset view states if entire case was forgotten
    if (!dataId && !memoryOnly) {
      setCases(prev => prev.filter(c => c.id !== activeCaseId));
      setActiveCaseId(null);
      setActiveTab("library");
    } else {
      // Reload case data to reflect changes
      const graph = await CogniVerdictAPI.getCaseGraph(activeCaseId);
      setGraphNodes(graph.nodes);
      setGraphEdges(graph.edges);
    }
  };

  // Render active tab view content
  const renderTabContent = () => {
    switch (activeTab) {
      case "library":
        return (
          <CaseLibrary
            cases={cases}
            activeCaseId={activeCaseId}
            onSelectCase={handleSelectCase}
            onUploadCollection={handleUploadCollection}
          />
        );
      case "explorer":
        return (
          <MemoryExplorer
            activeCaseId={activeCaseId}
            nodes={graphNodes}
            edges={graphEdges}
            chunks={caseChunks}
            provenance={caseProvenance}
            citations={caseCitations}
          />
        );
      case "chat":
        return (
          <AdvisoryChat
            activeCaseId={activeCaseId}
            activeCaseName={activeCase?.name}
            messages={chatHistory[activeCaseId || ""] || []}
            onSendMessage={handleSendChatMessage}
            isSending={isSendingChat}
          />
        );
      case "analysis":
        if (isAnalysisLoading) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-[#5C615D] bg-[#FAF6F0] h-screen font-serif">
              <div className="flex flex-col items-center gap-4 p-8 bg-[#F4F0E6] border border-[#D0CBB7] rounded-2xl shadow-sm max-w-md">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-[#4A6B53]/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-[#4A6B53] border-t-transparent rounded-full animate-spin" />
                  <Scale className="w-6 h-6 text-[#4A6B53] animate-pulse" />
                </div>
                <h4 className="font-semibold text-lg text-[#2D312E] tracking-tight mt-2">Running Legal Intelligence Engine</h4>
                <p className="text-xs text-[#5C615D] leading-relaxed">
                  Executing Phase 3 LLM reasoning orchestration and Phase 4 mathematical evidence weighting. This may take up to 20 seconds.
                </p>
              </div>
            </div>
          );
        }
        return (
          <AnalysisDashboard
            activeCaseId={activeCaseId}
            activeCase={activeCase}
            nodes={graphNodes}
            edges={graphEdges}
            onImproveMemory={handleImproveMemory}
            onSubmitFeedback={handleApplyFeedback}
            onAnalyzeCase={handleAnalyzeCase}
          />
        );
      case "feedback":
        if (isAnalysisLoading) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-[#5C615D] bg-[#FAF6F0] h-screen font-serif">
              <div className="flex flex-col items-center gap-4 p-8 bg-[#F4F0E6] border border-[#D0CBB7] rounded-2xl shadow-sm max-w-md">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-[#4A6B53]/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-[#4A6B53] border-t-transparent rounded-full animate-spin" />
                  <Scale className="w-6 h-6 text-[#4A6B53] animate-pulse" />
                </div>
                <h4 className="font-semibold text-lg text-[#2D312E] tracking-tight mt-2">Running Legal Intelligence Engine</h4>
                <p className="text-xs text-[#5C615D] leading-relaxed">
                  Executing Phase 3 LLM reasoning orchestration and Phase 4 mathematical evidence weighting. This may take up to 20 seconds.
                </p>
              </div>
            </div>
          );
        }
        return (
          <FeedbackPanel
            activeCaseId={activeCaseId}
            activeCase={activeCase}
            evidenceNodes={evidenceNodes}
            onImproveMemory={handleImproveMemory}
            onForgetMemory={handleForgetMemory}
            onSubmitFeedback={handleApplyFeedback}
          />
        );
      case "benchmarking":
        return (
          <BenchmarkPanel />
        );
      default:
        return (
          <div className="flex-1 p-8 text-[#2D312E]">
            Screen not found.
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-screen bg-[#FAF6F0] items-center justify-center text-[#2D312E] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#4A6B53] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-[#5C615D]">Initializing CogniVerdict Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#FAF6F0]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLive={isLive}
        activeCaseName={activeCase?.name || undefined}
      />
      {renderTabContent()}
    </div>
  );
}
