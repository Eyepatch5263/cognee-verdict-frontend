"use client";

import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import CaseLibrary from "./components/CaseLibrary";
import MemoryExplorer from "./components/MemoryExplorer";
import InteractiveMindmap from "./components/InteractiveMindmap";
import AdvisoryChat, { ChatMessage } from "./components/AdvisoryChat";
import AnalysisDashboard from "./components/AnalysisDashboard";
import FeedbackPanel from "./components/FeedbackPanel";
import BenchmarkPanel from "./components/BenchmarkPanel";
import { 
  Case, 
  CogniVerdictAPI, 
  MOCK_CASES, 
  GraphNode, 
  GraphEdge, 
  RecallResult 
} from "@/lib/api";


export default function Home() {
  const [activeTab, setActiveTab] = useState("library");
  const [isLive, setIsLive] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      try {
        const graph = await CogniVerdictAPI.getCaseGraph(caseId);
        setGraphNodes(graph?.nodes || []);
        setGraphEdges(graph?.edges || []);
      } catch (err) {
        console.error("Failed to load case graph:", err);
        setGraphNodes([]);
        setGraphEdges([]);
      }

      try {
        const chunks = await CogniVerdictAPI.getCaseChunks(caseId);
        setCaseChunks(chunks || []);
      } catch (err) {
        console.error("Failed to load case chunks:", err);
        setCaseChunks([]);
      }

      try {
        const prov = await CogniVerdictAPI.getCaseProvenance(caseId);
        setCaseProvenance(prov || null);
      } catch (err) {
        console.error("Failed to load case provenance:", err);
        setCaseProvenance(null);
      }

      try {
        const cites = await CogniVerdictAPI.getCaseCitations(caseId);
        setCaseCitations(cites || []);
      } catch (err) {
        console.error("Failed to load case citations:", err);
        setCaseCitations([]);
      }

      try {
        const currentCase = cases.find(c => c.id === caseId);
        const hasAnalysis = currentCase && (currentCase.witnesses && currentCase.witnesses.length > 0);
        
        if (!hasAnalysis) {
          console.log("Fetching case analysis for:", caseId);
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
        } else {
          console.log("Analysis already loaded, skipping fetch for case:", caseId);
        }
      } catch (err) {
        console.error("Failed to fetch full case analysis scores:", err);
      }
    }

    loadCaseDetails();
  }, [activeCaseId, activeCaseStatus, isLive]);

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
    const seenLabels = new Set<string>();
    const nodesList: { id: string; label: string }[] = [];

    graphNodes.forEach(n => {
      const typeLower = (n.type || "").toLowerCase();
      const labelLower = (n.label || "").toLowerCase();
      
      const isEvNode = ["evidence", "document", "report", "cctv", "dna", "log", "statement", "testimony"].some(
        x => typeLower.includes(x) || labelLower.includes(x)
      );

      if (isEvNode) {
        let cleanLabel = n.label;
        if (cleanLabel.toLowerCase().includes("_chunk_")) {
          cleanLabel = cleanLabel.split("_chunk_")[0];
        }
        cleanLabel = cleanLabel.replace(/_/g, " ").trim();

        const key = cleanLabel.toLowerCase();
        if (!seenLabels.has(key)) {
          seenLabels.add(key);
          nodesList.push({ id: n.id, label: cleanLabel });
        }
      }
    });

    if (nodesList.length === 0) {
      return [
        { id: "evidence-forensic", label: "Forensic Laboratory Report" },
        { id: "evidence-cctv", label: "CCTV Digital Access Logs" },
        { id: "evidence-dna", label: "DNA Fingerprint Analysis" }
      ];
    }

    return nodesList;
  }, [graphNodes]);

  // Handle feedback override submission and recomputation
  const handleApplyFeedback = async (feedbacks: any[]) => {
    if (!activeCaseId) return;
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
      // case "mindmap":
      //   return (
      //     <InteractiveMindmap
      //       activeCaseId={activeCaseId}
      //       activeCaseName={activeCase?.name}
      //       isLive={isLive}
      //     />
      //   );
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
        return (
          <AnalysisDashboard
            activeCaseId={activeCaseId}
            activeCase={activeCase}
            nodes={graphNodes}
            onImproveMemory={handleImproveMemory}
            onSubmitFeedback={handleApplyFeedback}
          />
        );
      case "feedback":
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
