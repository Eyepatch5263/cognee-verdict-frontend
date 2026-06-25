"use client";

import React, { useState, useMemo } from "react";
import { Case, FeedbackItem } from "@/lib/api";
import { 
  SlidersHorizontal, 
  ThumbsUp, 
  ThumbsDown, 
  XOctagon, 
  Sparkles, 
  Trash2, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Plus,
  RotateCcw,
  ShieldCheck,
  UserX,
  UserCheck,
  EyeOff
} from "lucide-react";

interface FeedbackPanelProps {
  activeCaseId: string | null;
  activeCase: Case | null;
  evidenceNodes: { id: string; label: string }[];
  onImproveMemory: () => Promise<void>;
  onForgetMemory: (dataId?: string, memoryOnly?: boolean) => Promise<void>;
  onSubmitFeedback: (feedbacks: FeedbackItem[]) => Promise<void>;
}

export default function FeedbackPanel({
  activeCaseId,
  activeCase,
  evidenceNodes,
  onImproveMemory,
  onForgetMemory,
  onSubmitFeedback
}: FeedbackPanelProps) {
  const [isImproving, setIsImproving] = useState(false);
  const [isForgetting, setIsForgetting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");

  // Accumulated feedback queue
  const [queuedFeedback, setQueuedFeedback] = useState<FeedbackItem[]>([]);

  // Evidence Form State
  const [selectedEvNode, setSelectedEvNode] = useState("");
  const [evWeight, setEvWeight] = useState("0.90");
  const [evAction, setEvAction] = useState<"mark_false" | "correct">("mark_false");

  // Witness Form State
  const [selectedWitness, setSelectedWitness] = useState("");
  const [witnessAction, setWitnessAction] = useState<"mark_reliable" | "mark_unreliable" | "correct">("mark_reliable");
  const [witnessValue, setWitnessValue] = useState("1.0");

  const queueFeedbackItem = (item: FeedbackItem) => {
    // Avoid duplicates by target and type
    setQueuedFeedback(prev => {
      const filtered = prev.filter(f => !(f.target === item.target && f.feedback_type === item.feedback_type));
      return [...filtered, item];
    });
    setStatusMsg(`Queued correction for: ${item.target}`);
    setStatusType("success");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const removeQueuedItem = (index: number) => {
    setQueuedFeedback(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddEvidenceFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvNode) return;
    
    queueFeedbackItem({
      feedback_type: "evidence_correction",
      target: selectedEvNode,
      action: evAction,
      reason: evAction === "mark_false" ? "Lawyer flagged evidence as falsified/invalid" : "Weight manual calibration",
      value: evAction === "correct" ? parseFloat(evWeight) : 0.0
    });
    setSelectedEvNode("");
  };

  const handleAddWitnessFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWitness) return;

    queueFeedbackItem({
      feedback_type: "witness_correction",
      target: selectedWitness,
      action: witnessAction,
      reason: `Lawyer adjustment: witness marked as ${witnessAction}`,
      value: witnessAction === "correct" ? parseFloat(witnessValue) : (witnessAction === "mark_reliable" ? 1.0 : 0.0)
    });
    setSelectedWitness("");
  };

  const handleDismissContradiction = (id: string, title: string) => {
    queueFeedbackItem({
      feedback_type: "contradiction_override",
      target: id,
      action: "dismiss",
      reason: `Lawyer dismissed contradiction: ${title}`
    });
  };

  const handleDismissTheory = (suspectName: string) => {
    queueFeedbackItem({
      feedback_type: "theory_dismissal",
      target: suspectName,
      action: "dismiss",
      reason: `Lawyer dismissed suspect theory for ${suspectName}`
    });
  };

  const handleApplyFeedback = async () => {
    if (queuedFeedback.length === 0) return;
    setIsSubmitting(true);
    setStatusMsg("");
    setStatusType("");
    try {
      await onSubmitFeedback(queuedFeedback);
      setStatusMsg("Successfully applied human expert overrides and recalculated scoring parameters!");
      setStatusType("success");
      setQueuedFeedback([]); // Clear queue on success
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to submit feedback pipeline request.");
      setStatusType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImprove = async () => {
    setIsImproving(true);
    setStatusMsg("");
    setStatusType("");
    try {
      await onImproveMemory();
      setStatusMsg("Cognee improve pipeline triggered. Graph connections are being refactored.");
      setStatusType("success");
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to trigger improvement.");
      setStatusType("error");
    } finally {
      setIsImproving(false);
    }
  };

  const handleForget = async (memoryOnly = false) => {
    if (!confirm(memoryOnly ? "Are you sure you want to clear vector & graph memories? Raw files will be preserved." : "Are you sure you want to completely purge this case and its files? This action is permanent.")) {
      return;
    }
    setIsForgetting(true);
    setStatusMsg("");
    setStatusType("");
    try {
      await onForgetMemory(undefined, memoryOnly);
      setStatusMsg(memoryOnly ? "Cleared graph memories. Reset complete." : "Purged case from memory library.");
      setStatusType("success");
    } catch (err: any) {
      setStatusMsg(err.message || "Forget operation failed.");
      setStatusType("error");
    } finally {
      setIsForgetting(false);
    }
  };

  if (!activeCaseId || !activeCase) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-[#5C615D] bg-[#FAF6F0] h-screen font-serif">
        <SlidersHorizontal className="w-12 h-12 text-[#D0CBB7] mb-2" />
        <h4 className="font-semibold text-[#2D312E]">Feedback Panel Offline</h4>
        <p className="text-xs max-w-sm mt-1">Please select an active case to manage its feedback and pipeline operations.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FAF6F0] font-serif">
      {/* Header */}
      <div className="border-b border-[#D0CBB7] pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#2D312E] flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-[#4A6B53]" />
            Human-in-the-Loop Feedback System
          </h2>
          <p className="text-sm text-[#5C615D] mt-1">
            Allow legal experts to correct, calibrate, or override algorithmic scores and restructure Cognee's graph memory.
          </p>
        </div>
        {queuedFeedback.length > 0 && (
          <button
            onClick={handleApplyFeedback}
            disabled={isSubmitting}
            className="bg-[#4A6B53] hover:bg-[#3B5441] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Apply {queuedFeedback.length} Corrections</span>
          </button>
        )}
      </div>

      {/* Global Status Message */}
      {statusMsg && (
        <div className={`p-4 border rounded-lg text-sm flex items-start gap-3 animate-fade-in ${
          statusType === "success" 
            ? "bg-[#EAF2EB] border-emerald-300 text-emerald-700" 
            : "bg-[#F5EBEA] border-[#B85C4C]/35 text-[#B85C4C]"
        }`}>
          {statusType === "success" ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#B85C4C]" />}
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 text-[#2D312E]">
        {/* Left Columns - Form Overrides */}
        <div className="xl:col-span-2 space-y-8">
          {/* Evidence Corrections */}
          <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-md font-semibold text-[#2D312E] flex items-center gap-2">
              <XOctagon className="w-4.5 h-4.5 text-[#B85C4C]" />
              Evidence Correction
            </h3>
            <p className="text-xs text-[#5C615D]">
              Exempt specific files or files flagged by forensic teams. You can set them as false (eliminating their weight) or calibrate their weight manually.
            </p>

            <form onSubmit={handleAddEvidenceFeedback} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={selectedEvNode}
                  onChange={(e) => setSelectedEvNode(e.target.value)}
                  className="sm:col-span-2 bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg px-3 py-2 text-xs text-[#2D312E] focus:outline-none focus:border-[#4A6B53]"
                  required
                >
                  <option value="">Select evidence node to override...</option>
                  {evidenceNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.label}
                    </option>
                  ))}
                </select>

                <select
                  value={evAction}
                  onChange={(e) => setEvAction(e.target.value as any)}
                  className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg px-3 py-2 text-xs text-[#2D312E] focus:outline-none focus:border-[#4A6B53]"
                >
                  <option value="mark_false">Mark as False</option>
                  <option value="correct">Override Weight</option>
                </select>
              </div>

              {evAction === "correct" && (
                <div className="flex items-center gap-4 bg-[#FAF6F0] p-3 rounded-lg border border-[#D0CBB7]">
                  <span className="text-xs text-[#5C615D] font-mono">Calibrated Weight:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={evWeight}
                    onChange={(e) => setEvWeight(e.target.value)}
                    className="flex-1 accent-[#4A6B53]"
                  />
                  <span className="text-xs font-semibold font-mono text-[#4A6B53] w-12 text-right">{evWeight}</span>
                </div>
              )}

              <button
                type="submit"
                className="bg-[#4A6B53] hover:bg-[#3B5441] text-white font-semibold rounded-lg px-4 py-2.5 text-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Queue Evidence Correction
              </button>
            </form>
          </div>

          {/* Witness Corrections */}
          <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-md font-semibold text-[#2D312E] flex items-center gap-2">
              <UserCheck className="w-4.5 h-4.5 text-[#4A6B53]" />
              Witness Reliability Adjustment
            </h3>
            <p className="text-xs text-[#5C615D]">
              Force a witness to be completely reliable (e.g. if CCTV corroborates statement) or unreliable (dismissing testimony).
            </p>

            <form onSubmit={handleAddWitnessFeedback} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={selectedWitness}
                  onChange={(e) => setSelectedWitness(e.target.value)}
                  className="sm:col-span-2 bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg px-3 py-2 text-xs text-[#2D312E] focus:outline-none focus:border-[#4A6B53]"
                  required
                >
                  <option value="">Select witness...</option>
                  {activeCase.witnesses.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.name} ({w.role})
                    </option>
                  ))}
                </select>

                <select
                  value={witnessAction}
                  onChange={(e) => setWitnessAction(e.target.value as any)}
                  className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg px-3 py-2 text-xs text-[#2D312E] focus:outline-none focus:border-[#4A6B53]"
                >
                  <option value="mark_reliable">Mark Reliable</option>
                  <option value="mark_unreliable">Mark Unreliable</option>
                  <option value="correct">Override Score</option>
                </select>
              </div>

              {witnessAction === "correct" && (
                <div className="flex items-center gap-4 bg-[#FAF6F0] p-3 rounded-lg border border-[#D0CBB7]">
                  <span className="text-xs text-[#5C615D] font-mono">Credibility Score:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={witnessValue}
                    onChange={(e) => setWitnessValue(e.target.value)}
                    className="flex-1 accent-[#4A6B53]"
                  />
                  <span className="text-xs font-semibold font-mono text-[#4A6B53] w-12 text-right">{witnessValue}</span>
                </div>
              )}

              <button
                type="submit"
                className="bg-[#4A6B53] hover:bg-[#3B5441] text-white font-semibold rounded-lg px-4 py-2.5 text-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Queue Witness Correction
              </button>
            </form>
          </div>

          {/* Contradiction & Theory Overrides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contradictions Override */}
            <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-[#2D312E] flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-amber-600" />
                Contradiction Dismissals
              </h3>
              <p className="text-xs text-[#5C615D]">
                If a contradiction was based on incorrect timestamps or invalid reports, dismiss it to clear penalty scoring.
              </p>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pt-2 pr-1">
                {activeCase.contradictions.map((contra) => {
                  const isDismissed = queuedFeedback.some(q => q.feedback_type === "contradiction_override" && q.target === contra.id);
                  return (
                    <div key={contra.id} className="p-3 bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold block text-[#2D312E]">{contra.title}</span>
                        <p className="text-[10px] text-[#5C615D] leading-snug">{contra.description}</p>
                      </div>
                      <button
                        onClick={() => handleDismissContradiction(contra.id, contra.title)}
                        disabled={isDismissed}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors shrink-0 font-medium ${
                          isDismissed 
                            ? "bg-[#FAF6F0] text-[#D0CBB7] border-[#D0CBB7]/40 cursor-default" 
                            : "bg-[#FAF6F0] border-[#D0CBB7] text-amber-700 hover:bg-[#F5EBEA] hover:border-amber-300"
                        }`}
                      >
                        {isDismissed ? "Dismissed" : "Dismiss"}
                      </button>
                    </div>
                  );
                })}
                {activeCase.contradictions.length === 0 && (
                  <p className="text-xs text-[#5C615D] italic text-center py-4">No contradictions to override.</p>
                )}
              </div>
            </div>

            {/* Theory Dismissal */}
            <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-[#2D312E] flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-[#B85C4C]" />
                Theory Dismissals
              </h3>
              <p className="text-xs text-[#5C615D]">
                Exempt specific suspects or prosecution arguments from probability scoring if ruled out by evidence.
              </p>

              <div className="space-y-2.5 pt-2">
                {/* List suspects */}
                {activeCase.witnesses.filter(w => w.role.includes("Defendant") || w.role.includes("Suspect")).map((sus) => {
                  const isDismissed = queuedFeedback.some(q => q.feedback_type === "theory_dismissal" && q.target === sus.name);
                  return (
                    <div key={sus.name} className="p-3 bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-[#2D312E]">{sus.name}</span>
                        <p className="text-[10px] text-[#5C615D]">Prosecution suspect theory</p>
                      </div>
                      <button
                        onClick={() => handleDismissTheory(sus.name)}
                        disabled={isDismissed}
                        className={`text-[10px] px-2 py-1 rounded border transition-colors shrink-0 font-medium ${
                          isDismissed 
                            ? "bg-[#FAF6F0] text-[#D0CBB7] border-[#D0CBB7]/40 cursor-default" 
                            : "bg-[#FAF6F0] border-[#B85C4C]/45 text-[#B85C4C] hover:bg-[#F5EBEA] hover:border-[#B85C4C]"
                        }`}
                      >
                        {isDismissed ? "Dismissed" : "Dismiss Theory"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Correction Queue & Memory Pipelines */}
        <div className="space-y-8">
          {/* Queued Feedback Summary */}
          <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#2D312E] flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-[#4A6B53]" />
                Pending Corrections Queue
              </h3>
              {queuedFeedback.length > 0 && (
                <button 
                  onClick={() => setQueuedFeedback([])}
                  className="text-[10px] font-semibold text-[#B85C4C] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {queuedFeedback.map((item, idx) => (
                <div key={idx} className="p-3 bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg text-xs space-y-1 relative">
                  <button
                    onClick={() => removeQueuedItem(idx)}
                    className="absolute top-2.5 right-2.5 text-[#5C615D] hover:text-[#B85C4C] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-[#4A6B53] font-bold">
                    {item.feedback_type.replace(/_/g, " ")}
                  </div>
                  <div className="font-semibold text-[#2D312E] pr-6">{item.target}</div>
                  <div className="text-[10px] text-[#5C615D] leading-snug">
                    Action: <span className="font-semibold">{item.action}</span>
                    {item.value !== undefined && ` (${item.value})`}
                  </div>
                </div>
              ))}
              {queuedFeedback.length === 0 && (
                <p className="text-xs text-[#5C615D] italic text-center py-8">No corrections queued. Select options from the left forms to construct modifications.</p>
              )}
            </div>

            {queuedFeedback.length > 0 && (
              <button
                onClick={handleApplyFeedback}
                disabled={isSubmitting}
                className="bg-[#4A6B53] hover:bg-[#3B5441] disabled:bg-[#FAF6F0] disabled:text-[#5C615D] text-white font-semibold rounded-lg w-full py-3 text-xs transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Recalculating Scores...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Apply Corrections & Recompute</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Cognee Memory Management (Memify & Prune) */}
          <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#2D312E] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#4A6B53]" />
              Enrich Graph Memory
            </h3>
            <p className="text-xs text-[#5C615D] leading-relaxed">
              Triggers the Cognee Cloud `improve()` pipeline. This invokes graph reasoning models to discover missing relations and enrich alibi connections.
            </p>

            <button
              onClick={handleImprove}
              disabled={isImproving}
              className="bg-[#4A6B53] hover:bg-[#3F5E4D] disabled:bg-[#FAF6F0] disabled:text-[#5C615D] text-white font-semibold rounded-lg w-full py-2.5 text-xs transition-colors flex items-center justify-center gap-2"
            >
              {isImproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#4A6B53]" />
                  <span>Enriching Cognee Graph...</span>
                </>
              ) : (
                <>
                  <span>Run Graph Improvement</span>
                </>
              )}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-[#F4F0E6] border border-[#B85C4C]/30 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#2D312E] flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-[#B85C4C]" />
              Pruning & Purging (Danger Zone)
            </h3>
            <p className="text-xs text-[#5C615D] leading-relaxed">
              Prune graph models or remove this case's dossier permanently.
            </p>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => handleForget(true)}
                disabled={isForgetting}
                className="flex-1 bg-[#FAF6F0] hover:bg-[#EFECE1] border border-[#D0CBB7] text-[#2D312E] font-semibold rounded-lg py-2.5 text-xs transition-colors"
                title="Clears graph database records, preserving raw documents"
              >
                Clear Graph Only
              </button>
              <button
                onClick={() => handleForget(false)}
                disabled={isForgetting}
                className="flex-1 bg-[#F5EBEA] hover:bg-[#FAF6F0] border border-[#B85C4C]/35 text-[#B85C4C] font-semibold rounded-lg py-2.5 text-xs transition-colors"
                title="Completely deletes case folder and database state"
              >
                Purge Dossier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
