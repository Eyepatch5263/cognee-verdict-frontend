"use client";

import React, { useMemo, useState } from "react";
import { Case, MOCK_GRAPHS, FeedbackItem } from "@/lib/api";
import { 
  BarChart3, 
  TrendingUp, 
  UserX, 
  Gavel, 
  Scale, 
  AlertTriangle,
  Award,
  Users,
  ShieldCheck,
  ZapOff,
  RefreshCw,
  Check,
  X,
  Sliders
} from "lucide-react";

interface AnalysisDashboardProps {
  activeCaseId: string | null;
  activeCase: Case | null;
  nodes?: { id: string; label: string; type?: string; properties?: any }[];
  onImproveMemory?: () => Promise<void>;
  onSubmitFeedback?: (feedbacks: any[]) => Promise<void>;
}

export default function AnalysisDashboard({ 
  activeCaseId, 
  activeCase, 
  nodes, 
  onImproveMemory, 
  onSubmitFeedback 
}: AnalysisDashboardProps) {
  const [isImproving, setIsImproving] = useState(false);
  const [activeSliderItem, setActiveSliderItem] = useState<string | null>(null);

  // Extract evidence from the graph to populate the Evidence Ranking list dynamically
  const evidenceRankings = useMemo(() => {
    if (!activeCaseId) return [];
    
    // Find active case graph
    const activeNodes = nodes && nodes.length > 0 ? nodes : (MOCK_GRAPHS[activeCaseId]?.nodes || []);
    
    // Filter nodes that represent documents or evidence
    const matchedNodes = activeNodes.filter(n => {
      const typeLower = (n.type || "").toLowerCase();
      const labelLower = (n.label || "").toLowerCase();
      return ["evidence", "document", "report", "cctv", "dna", "log", "statement", "testimony"].some(
        x => typeLower.includes(x) || labelLower.includes(x)
      );
    });

    const seenNames = new Set<string>();
    const uniqueRankings: { id: string; name: string; relevance: number; description: string; contradictory: boolean }[] = [];

    matchedNodes.forEach((n, idx) => {
      let cleanName = n.label;
      if (cleanName.toLowerCase().includes("_chunk_")) {
        cleanName = cleanName.split("_chunk_")[0];
      }
      cleanName = cleanName.replace(/_/g, " ").trim();

      const key = cleanName.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);

        let relevance = 85 - (uniqueRankings.length * 8);
        relevance = Math.max(15, relevance);
        if (cleanName.includes("Fingerprint") || cleanName.includes("Log") || cleanName.includes("VPN") || cleanName.includes("DNA")) {
          relevance = 95;
        }

        const props = n.properties || {};
        const description = props.location_found || props.timestamp || props.circuit || props.description || "Found during case ingestion";
        const contradictory = cleanName.toLowerCase().includes("denial") || cleanName.toLowerCase().includes("vpn") || cleanName.toLowerCase().includes("contradiction");

        uniqueRankings.push({
          id: n.id,
          name: cleanName,
          relevance,
          description,
          contradictory
        });
      }
    });

    // Provide default readable fallback evidence nodes if empty
    if (uniqueRankings.length === 0) {
      return [
        { id: "fallback-forensic", name: "Forensic Laboratory Report", relevance: 92, description: "Detailed physical evidence examination", contradictory: false },
        { id: "fallback-cctv", name: "CCTV Digital Access Logs", relevance: 84, description: "Timestamped gate entry recordings", contradictory: true },
        { id: "fallback-dna", name: "DNA Fingerprint Analysis", relevance: 78, description: "Genetic material match results", contradictory: false }
      ];
    }

    return uniqueRankings.sort((a, b) => b.relevance - a.relevance);
  }, [activeCaseId, nodes]);

  if (!activeCaseId || !activeCase) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-[#5C615D] bg-[#FAF6F0] h-screen font-serif">
        <BarChart3 className="w-12 h-12 text-[#D0CBB7] mb-2" />
        <h4 className="font-semibold text-[#2D312E]">Analysis Offline</h4>
        <p className="text-xs max-w-sm mt-1">Please select an active completed case to view the Legal Analysis Dashboard.</p>
      </div>
    );
  }

  // Determine progress colors
  const getProbabilityColor = (prob: number) => {
    if (prob >= 75) return "text-emerald-600 stroke-emerald-600";
    if (prob >= 50) return "text-[#4A6B53] stroke-[#4A6B53]";
    return "text-amber-600 stroke-amber-600";
  };

  const getProbabilityBgColor = (prob: number) => {
    if (prob >= 75) return "bg-[#EAF2EB] text-emerald-700 border-emerald-300";
    if (prob >= 50) return "bg-[#4A6B53]/10 text-[#4A6B53] border-[#4A6B53]/30";
    return "bg-[#FAF5EB] text-amber-700 border-amber-300";
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FAF6F0]">
      {/* Header */}
      <div className="border-b border-[#D0CBB7] pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-[#2D312E] flex items-center gap-2 font-serif">
          <BarChart3 className="w-6 h-6 text-[#4A6B53]" />
          Legal Analysis Dashboard
        </h2>
        <p className="text-sm text-[#5C615D] mt-1 font-serif">
          Algorithmic case breakdown, probabilities, and witness discrepancy matrices.
        </p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-serif">
        {/* Suspect Probability Card */}
        <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs text-[#5C615D] font-semibold uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <UserX className="w-4 h-4 text-amber-600" />
              Suspect Likelihood
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#2D312E]">{activeCase.suspectProbability}%</span>
              <span className="text-[10px] text-amber-600 font-semibold">High Risk</span>
            </div>
            <p className="text-[11px] text-[#5C615D] truncate max-w-[150px]">
              Primary: {activeCase.witnesses.find(w => w.role.includes("Defendant"))?.name || "Target"}
            </p>
          </div>
          {/* Circular Indicator */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-[#EFECE1]" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-amber-600" strokeDasharray={`${activeCase.suspectProbability}, 100`} strokeWidth="3.2" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
          </div>
        </div>

        {/* Conviction Probability Card */}
        <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs text-[#5C615D] font-semibold uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Gavel className="w-4 h-4 text-[#4A6B53]" />
              Conviction Feasibility
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#2D312E]">{activeCase.convictionProbability}%</span>
              <span className="text-[10px] text-[#4A6B53] font-semibold">Strong Case</span>
            </div>
            <p className="text-[11px] text-[#5C615D]">Based on evidence density</p>
          </div>
          {/* Circular Indicator */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-[#EFECE1]" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-[#4A6B53]" strokeDasharray={`${activeCase.convictionProbability}, 100`} strokeWidth="3.2" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
          </div>
        </div>

        {/* Contradictions Count Card */}
        <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs text-[#5C615D] font-semibold uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-4 h-4 text-[#B85C4C]" />
              Contradictions Found
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#B85C4C]">{activeCase.contradictions.length}</span>
              <span className="text-[10px] text-[#B85C4C] font-semibold">Action Required</span>
            </div>
            <p className="text-[11px] text-[#5C615D]">Discrepancies in testimony</p>
          </div>
          <div className="p-3.5 bg-[#B85C4C]/10 text-[#B85C4C] border border-[#B85C4C]/20 rounded-2xl">
            <ZapOff className="w-6 h-6" />
          </div>
        </div>

        {/* Confidence Score Card */}
        <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <span className="text-xs text-[#5C615D] font-semibold uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-[#4A6B53]" />
              Ingestion Quality
            </span>
            <div className="flex items-baseline justify-between pr-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#2D312E]">{activeCase.confidenceScore}%</span>
                <span className="text-[10px] text-[#4A6B53] font-semibold">Ready</span>
              </div>
              {onImproveMemory && (
                <button
                  onClick={async () => {
                    setIsImproving(true);
                    try {
                      await onImproveMemory();
                    } finally {
                      setIsImproving(false);
                    }
                  }}
                  disabled={isImproving}
                  title="Trigger the Cognee Cloud improve() pipeline to discover and enrich relations."
                  className="flex items-center gap-1.5 px-2 py-0.5 bg-[#4A6B53] hover:bg-[#3D5944] text-[#FAF6F0] rounded text-[10px] font-semibold transition-colors disabled:opacity-50 font-mono shadow-sm"
                >
                  <RefreshCw className={`w-3 h-3 ${isImproving ? "animate-spin" : ""}`} />
                  {isImproving ? "Running..." : "Improve"}
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#5C615D]">Cognee Graph Completeness</p>
          </div>
          <div className="p-3.5 bg-[#4A6B53]/10 text-[#4A6B53] border border-[#4A6B53]/20 rounded-2xl shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Row 2: Evidence & Contradictions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-serif">
        {/* Left Side: Evidence Ranking & Witness Credibility */}
        <div className="lg:col-span-2 space-y-8">
          {/* Witness Credibility Card */}
          <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-md font-semibold text-[#2D312E] flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-[#4A6B53]" />
              Witness Credibility Audit
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#D0CBB7] text-[#5C615D] font-mono uppercase tracking-wider pb-2">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Role</th>
                    <th className="py-2.5 text-center">Contradictions</th>
                    <th className="py-2.5 text-right">Credibility Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0CBB7]/50">
                  {activeCase.witnesses.map((w, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF6F0]/50 transition-colors">
                      <td className="py-3 font-medium text-[#2D312E]">{w.name}</td>
                      <td className="py-3 text-[#5C615D]">{w.role}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          w.contradictions > 0 
                            ? "bg-[#F5EBEA] text-[#B85C4C] border border-[#B85C4C]/25" 
                            : "bg-[#EAF2EB] text-emerald-700 border border-emerald-300"
                        }`}>
                          {w.contradictions}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-[#EFECE1] rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                w.credibility >= 80 ? "bg-emerald-600" : w.credibility >= 50 ? "bg-[#4A6B53]" : "bg-amber-600"
                              }`}
                              style={{ width: `${w.credibility}%` }}
                            />
                          </div>
                          <span className="font-semibold text-[#2D312E] font-mono">{w.credibility}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evidence Ranking */}
          <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-md font-semibold text-[#2D312E] flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#4A6B53]" />
              Evidence Ranking (Weight of Proof)
            </h3>
            <div className="space-y-3">
              {evidenceRankings.map((item) => {
                const isExcluded = activeCase.feedbacks?.some(
                  fb => fb.feedback_type === "evidence_correction" && 
                  fb.target.toLowerCase() === item.name.toLowerCase() && 
                  fb.action === "mark_false"
                ) || false;

                const weightOverride = activeCase.feedbacks?.find(
                  fb => fb.feedback_type === "evidence_correction" && 
                  fb.target.toLowerCase() === item.name.toLowerCase() && 
                  fb.action === "correct"
                );

                const currentWeight = isExcluded 
                  ? 0 
                  : (weightOverride ? Math.round(weightOverride.value * 100) : item.relevance);

                return (
                  <div 
                    key={item.id} 
                    className={`p-3 bg-[#FAF6F0] border rounded-lg flex flex-col gap-2 transition-all duration-200 ${
                      isExcluded 
                        ? "border-[#D0CBB7]/40 bg-[#FAF6F0]/40 opacity-60" 
                        : "border-[#D0CBB7] hover:border-[#4A6B53]/55 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className={`text-xs font-semibold ${isExcluded ? "line-through text-[#5C615D]" : "text-[#2D312E]"}`}>
                          {item.name}
                        </span>
                        <p className="text-[11px] text-[#5C615D] truncate max-w-[350px]">{item.description}</p>
                      </div>
                      
                      {/* Action controls */}
                      <div className="flex items-center gap-2.5 shrink-0 font-serif">
                        {item.contradictory && !isExcluded && (
                          <span className="text-[9px] bg-[#F5EBEA] border border-[#B85C4C]/25 text-[#B85C4C] px-1.5 py-0.5 rounded font-mono font-semibold">
                            Contradiction
                          </span>
                        )}
                        
                        {/* Weight Badge */}
                        <div className={`flex items-baseline gap-0.5 font-semibold text-[10px] px-2 py-0.5 rounded ${
                          isExcluded 
                            ? "bg-[#FAF5EB] text-amber-700 border border-amber-300/30" 
                            : "bg-[#4A6B53]/10 border border-[#4A6B53]/20 text-[#4A6B53]"
                        }`}>
                          <span className="font-mono">{currentWeight}%</span>
                          <span className="text-[8px] font-medium font-serif">weight</span>
                        </div>

                        {/* Interactive Buttons */}
                        {onSubmitFeedback && (
                          <div className="flex items-center gap-1 border-l border-[#D0CBB7]/60 pl-2">
                            {isExcluded ? (
                              <button
                                onClick={async () => {
                                  const currentFeedbacks = activeCase.feedbacks || [];
                                  const filtered = currentFeedbacks.filter(
                                    fb => !(fb.target.toLowerCase() === item.name.toLowerCase() && fb.feedback_type === "evidence_correction")
                                  );
                                  await onSubmitFeedback(filtered);
                                }}
                                title="Mark as True / Include Evidence"
                                className="p-1 hover:bg-emerald-100 text-emerald-700 rounded transition-colors"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setActiveSliderItem(activeSliderItem === item.id ? null : item.id)}
                                  title="Calibrate Weight manually"
                                  className={`p-1 rounded transition-colors ${activeSliderItem === item.id ? "bg-[#4A6B53]/10 text-[#4A6B53]" : "hover:bg-[#EFECE1] text-[#5C615D]"}`}
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    const feedback: FeedbackItem = {
                                      feedback_type: "evidence_correction",
                                      target: item.name,
                                      action: "mark_false",
                                      value: 0.0
                                    };
                                    const currentFeedbacks = activeCase.feedbacks || [];
                                    const filtered = currentFeedbacks.filter(
                                      fb => !(fb.target.toLowerCase() === item.name.toLowerCase() && fb.feedback_type === "evidence_correction")
                                    );
                                    await onSubmitFeedback([...filtered, feedback]);
                                  }}
                                  title="Mark as False / Exclude Evidence"
                                  className="p-1 hover:bg-[#F5EBEA] text-[#B85C4C] rounded transition-colors"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inline Slider Calibrator */}
                    {activeSliderItem === item.id && !isExcluded && onSubmitFeedback && (
                      <div className="flex items-center gap-2.5 mt-1.5 pt-1.5 border-t border-[#D0CBB7]/40 w-full">
                        <span className="text-[10px] text-[#5C615D] font-mono shrink-0">Calibrate Weight:</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={currentWeight / 100}
                          onChange={async (e) => {
                            const newWeight = parseFloat(e.target.value);
                            const feedback: FeedbackItem = {
                              feedback_type: "evidence_correction",
                              target: item.name,
                              action: "correct",
                              value: newWeight
                            };
                            const currentFeedbacks = activeCase.feedbacks || [];
                            const filtered = currentFeedbacks.filter(
                              fb => !(fb.target.toLowerCase() === item.name.toLowerCase() && fb.feedback_type === "evidence_correction")
                            );
                            await onSubmitFeedback([...filtered, feedback]);
                          }}
                          className="flex-1 accent-[#4A6B53] h-1 bg-[#EFECE1] rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold text-[#4A6B53] w-8 text-right">{currentWeight}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {evidenceRankings.length === 0 && (
                <p className="text-xs text-[#5C615D] text-center italic py-4">No evidence nodes loaded in memory.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Contradictions Engine Panel */}
        <div className="space-y-6">
          <div className="bg-[#F4F0E6] border border-[#B85C4C]/30 rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <h3 className="text-md font-semibold text-[#2D312E] flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-[#B85C4C]" />
                Contradictions Engine
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#F5EBEA] text-[#B85C4C] rounded-full border border-[#B85C4C]/25">
                ACTIVE AUDIT
              </span>
            </div>

            <div className="space-y-4">
              {activeCase.contradictions.map((contra) => (
                <div 
                  key={contra.id}
                  className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg p-4 space-y-2 relative overflow-hidden"
                >
                  {/* Severity Badge */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs text-[#2D312E]">
                      {contra.title}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      contra.severity === "high" 
                        ? "bg-[#F5EBEA] text-[#B85C4C]" 
                        : "bg-[#FAF5EB] text-amber-700"
                    }`}>
                      {contra.severity} severity
                    </span>
                  </div>

                  <p className="text-[11px] text-[#5C615D] leading-relaxed">
                    {contra.description}
                  </p>
                </div>
              ))}

              {activeCase.contradictions.length === 0 && (
                <div className="py-8 text-center text-[#5C615D] text-xs italic">
                  No testimony contradictions detected by Cognee for this case.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
