"use client";

import React, { useState, useEffect } from "react";
import { 
  CogniVerdictAPI, 
  BenchmarkCaseItem, 
  BenchmarkReport, 
  PredictionVsActual 
} from "@/lib/api";
import { 
  GitFork, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  TrendingDown, 
  TrendingUp, 
  FileText, 
  ShieldAlert, 
  Cpu, 
  Sparkles,
  BarChart,
  HelpCircle,
  Maximize2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

function renderMarkdown(text: string) {
  if (!text) return null;
  
  const lines = text.split("\n");
  
  return (
    <div className="space-y-1.5 font-sans text-sm">
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
        if (isBullet) {
          trimmed = trimmed.substring(2);
        }
        
        const boldParts = trimmed.split("**");
        const parsedLine = boldParts.map((part, i) => {
          if (i % 2 === 1) {
            return (
              <strong key={i} className="font-bold">
                {part}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[#4A6B53] select-none mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#4A6B53]" />
              <span className="leading-relaxed">{parsedLine}</span>
            </div>
          );
        }

        if (trimmed === "") {
          return <div key={idx} className="h-1.5" />;
        }

        return (
          <p key={idx} className="leading-relaxed">
            {parsedLine}
          </p>
        );
      })}
    </div>
  );
}

export default function BenchmarkPanel() {
  const [cases, setCases] = useState<BenchmarkCaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingStage, setLoadingStage] = useState("");
  const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);

  // Load benchmarkable cases on mount
  useEffect(() => {
    async function loadCases() {
      try {
        const list = await CogniVerdictAPI.fetchBenchmarkCases();
        setCases(list);
        if (list.length > 0) {
          setSelectedCaseId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load benchmark cases", err);
        setErrorMsg("Failed to fetch available cases from benchmark workspace.");
      }
    }
    loadCases();
  }, []);

  // Load latest benchmark report for selected case if it exists in SQLite
  useEffect(() => {
    if (!selectedCaseId || isBenchmarking) return;
    let isMounted = true;
    async function loadLatestReport() {
      setIsLoading(true);
      setErrorMsg("");
      setReport(null);
      setLoadingStage("Checking database for existing benchmark runs...");
      try {
        const latest = await CogniVerdictAPI.fetchLatestBenchmark(selectedCaseId);
        if (isMounted) {
          setReport(latest);
        }
      } catch (err) {
        console.error("Failed to load latest benchmark", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setLoadingStage("");
        }
      }
    }
    loadLatestReport();
    return () => {
      isMounted = false;
    };
  }, [selectedCaseId, isBenchmarking]);

  const handleRunBenchmark = async () => {
    if (!selectedCaseId) return;
    setIsBenchmarking(true);
    setIsLoading(true);
    setErrorMsg("");
    setReport(null);

    const stages = [
      "1. Scanning Case Library workspace...",
      "2. Validating ground-truth benchmark.json queries...",
      "3. Checking Cognee memory for case ingestion...",
      "4. Processing missing case documents...",
      "5. Initiating graph-based semantic queries...",
      "6. Querying LLM Reasoning Engine for Q1-Q10 answers...",
      "7. Computing retrieval recall@k...",
      "8. Recomputing contradiction detection F1 scores...",
      "9. Calculating conviction likelihood Mean Absolute Error...",
      "10. Generating evaluation report..."
    ];

    // Simulate progress updates for a smoother visual experience
    let stageIndex = 0;
    setLoadingStage(stages[0]);
    const stageInterval = setInterval(() => {
      if (stageIndex < stages.length - 1) {
        stageIndex++;
        setLoadingStage(stages[stageIndex]);
      }
    }, 2800);

    try {
      const result = await CogniVerdictAPI.runCaseBenchmark(selectedCaseId);
      clearInterval(stageInterval);
      setReport(result);
    } catch (err: any) {
      clearInterval(stageInterval);
      console.error(err);
      setErrorMsg(err.message || "Execution failed. Please verify API server logs.");
    } finally {
      setIsLoading(false);
      setIsBenchmarking(false);
    }
  };

  const getMetricBadgeClass = (score: number, invert = false) => {
    if (invert) {
      // For MAE, lower is better
      if (score < 15) return "bg-emerald-50 text-emerald-700 border-emerald-200";
      if (score < 30) return "bg-amber-50 text-amber-700 border-amber-200";
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (score >= 0.8) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 0.5) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  const formatPercent = (val: number) => {
    return `${Math.round(val * 100)}%`;
  };

  return (
    <div className="flex-1 bg-[#FAF6F0] p-8 overflow-y-auto max-h-screen">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#D0CBB7] pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#2E4F4F] flex items-center gap-3">
            <GitFork className="w-7 h-7 text-[#4A6B53]" />
            Interactive Benchmarking Layer
          </h2>
          <p className="text-sm text-[#5C615D] mt-1 font-sans">
            Evaluate system ingestion fidelity, retrieval recall, and LLM reasoning against verified legal ground truths on-demand.
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-[#EFECE1] border border-[#D0CBB7] rounded-xl p-6 mb-8 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#2E4F4F] mb-4">
          Select Benchmarking Suite
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px]">
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg border border-[#D0CBB7] bg-[#FAF6F0] text-[#2D312E] font-medium outline-none focus:ring-2 focus:ring-[#4A6B53]/20"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isLoading || !selectedCaseId}
            className="px-6 py-3 bg-[#4A6B53] hover:bg-[#3D5A45] disabled:bg-gray-400 text-white font-medium rounded-lg shadow transition-all duration-200 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Cpu className="w-5 h-5 animate-spin" />
                Executing Ingestion & Analysis...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                {report ? "Re-run Benchmark Suite" : "Run Benchmark Query Suite"}
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading Progress Stages */}
        {isLoading && (
          <div className="mt-6 bg-[#FAF6F0] border border-[#D0CBB7]/65 rounded-lg p-5">
            <div className="flex justify-between text-sm font-medium text-[#2E4F4F] mb-2">
              <span>Evaluating Model Predictions</span>
              <span className="text-[#4A6B53] animate-pulse">Running Ingestion Pipeline...</span>
            </div>
            <div className="w-full bg-[#EFECE1] rounded-full h-2.5 overflow-hidden border border-[#D0CBB7]/30">
              <div 
                className="bg-[#4A6B53] h-2.5 rounded-full transition-all duration-1000" 
                style={{ width: loadingStage.startsWith("10") ? "100%" : loadingStage.startsWith("8") ? "80%" : loadingStage.startsWith("5") ? "50%" : "25%" }}
              />
            </div>
            <p className="text-xs text-[#5C615D] mt-3 font-mono">
              {loadingStage}
            </p>
          </div>
        )}
      </div>

      {/* Benchmarking Report Panel */}
      {report && (
        <div className="space-y-8 animate-fadeIn">
          {/* Run Information Header */}
          <div className="flex items-center justify-between bg-[#EFECE1] border border-[#D0CBB7] px-6 py-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#4A6B53]" />
              <div>
                <span className="font-serif text-sm font-semibold text-[#2D312E] block">
                  Latest Benchmark Run Results
                </span>
                <span className="text-xs text-[#5C615D]">
                  Loaded from persistent SQLite cache
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono bg-[#4A6B53]/15 text-[#4A6B53] border border-[#4A6B53]/30 px-3 py-1 rounded-full font-bold">
                Run ID: #{report.run_id || 1}
              </span>
              <button
                onClick={handleRunBenchmark}
                disabled={isLoading}
                className="px-4 py-2 bg-[#4A6B53] hover:bg-[#3D5A45] text-white text-xs font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Re-run Benchmark Suite
              </button>
            </div>
          </div>

          {/* Section: Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Suspect Accuracy */}
            <div className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-xl p-5 shadow-sm text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5C615D]">Suspect Accuracy</span>
                <div className={`mt-3 text-3xl font-bold font-serif ${report.metrics.suspect_accuracy === 1.0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {formatPercent(report.metrics.suspect_accuracy)}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D0CBB7]/40">
                <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold border rounded-full ${getMetricBadgeClass(report.metrics.suspect_accuracy)}`}>
                  {report.metrics.suspect_accuracy === 1.0 ? "Target Aligned" : "Deviation Found"}
                </span>
              </div>
            </div>

            {/* Retrieval Recall */}
            <div className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-xl p-5 shadow-sm text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5C615D]">Recall @ K Chunks</span>
                <div className="mt-3 text-3xl font-bold font-serif text-[#2E4F4F]">
                  {formatPercent(report.metrics.retrieval_recall)}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D0CBB7]/40">
                <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold border rounded-full ${getMetricBadgeClass(report.metrics.retrieval_recall)}`}>
                  {report.metrics.retrieval_recall >= 0.8 ? "Optimal Retrieval" : "Moderate Coverage"}
                </span>
              </div>
            </div>

            {/* Contradiction F1 */}
            <div className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-xl p-5 shadow-sm text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5C615D]">Contradiction F1</span>
                <div className="mt-3 text-3xl font-bold font-serif text-[#2E4F4F]">
                  {report.metrics.contradiction_f1.toFixed(2)}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D0CBB7]/40">
                <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold border rounded-full ${getMetricBadgeClass(report.metrics.contradiction_f1)}`}>
                  {report.metrics.contradiction_f1 >= 0.8 ? "Precise Detect" : "Partial Detect"}
                </span>
              </div>
            </div>

            {/* Witness Accuracy */}
            <div className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-xl p-5 shadow-sm text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5C615D]">Witness Accuracy</span>
                <div className="mt-3 text-3xl font-bold font-serif text-[#2E4F4F]">
                  {formatPercent(report.metrics.witness_accuracy)}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D0CBB7]/40">
                <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold border rounded-full ${getMetricBadgeClass(report.metrics.witness_accuracy)}`}>
                  {report.metrics.witness_accuracy >= 0.8 ? "High Ingress" : "Sub-optimal Ingress"}
                </span>
              </div>
            </div>

            {/* Conviction MAE */}
            <div className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-xl p-5 shadow-sm text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5C615D]">Conviction MAE</span>
                <div className="mt-3 text-3xl font-bold font-serif text-[#2E4F4F]">
                  {report.metrics.conviction_mae.toFixed(1)}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D0CBB7]/40">
                <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold border rounded-full ${getMetricBadgeClass(report.metrics.conviction_mae, true)}`}>
                  {report.metrics.conviction_mae <= 15 ? "Low Error" : "Significant Drift"}
                </span>
              </div>
            </div>

          </div>

          {/* Section: Failure Analysis & Confidence Drift */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Failure Analysis Report */}
            <div className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-[#2E4F4F] uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-[#D0CBB7] pb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Failure Analysis Report
              </h4>
              <div className="bg-[#EFECE1] border border-[#D0CBB7]/60 rounded-lg p-4 font-mono text-xs text-[#2D312E] leading-relaxed h-[120px] overflow-y-auto">
                {report.failure_analysis}
              </div>
              <div className="mt-3 text-xs text-[#5C615D] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                Fidelity metrics calibrated to strict Sessions Court standard templates.
              </div>
            </div>

            {/* Confidence Drift */}
            <div className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-[#2E4F4F] uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-[#D0CBB7] pb-3">
                {report.confidence_drift >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                )}
                Confidence Drift Analysis
              </h4>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-[#2D312E]">Graph Completeness Shift</span>
                <span className={`text-lg font-bold font-mono ${report.confidence_drift >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {report.confidence_drift >= 0 ? `+${report.confidence_drift.toFixed(1)}%` : `${report.confidence_drift.toFixed(1)}%`}
                </span>
              </div>

              <div className="relative pt-1">
                <div className="overflow-hidden h-3 text-xs flex rounded-full bg-[#EFECE1] border border-[#D0CBB7]/30">
                  <div 
                    style={{ width: `${Math.min(100, Math.max(0, 50 + report.confidence_drift))}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${report.confidence_drift >= 0 ? "bg-emerald-600" : "bg-rose-600"}`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#5C615D] mt-2 font-mono">
                  <span>Extreme Variance (-50%)</span>
                  <span>System Parity (0%)</span>
                  <span>Positive Gain (+50%)</span>
                </div>
              </div>

              <p className="text-xs text-[#5C615D] mt-4 italic">
                Drift measures divergence between computed conviction probability and graph completeness indexes.
              </p>
            </div>
          </div>

          {/* Section: Prediction vs Actual Table */}
          <div className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-[#2E4F4F] uppercase tracking-wider flex items-center gap-2 mb-6 border-b border-[#D0CBB7] pb-3">
              <BarChart className="w-5 h-5 text-[#4A6B53]" />
              Detailed Model Predictions vs Ground Truth
            </h4>

            <div className="space-y-4">
              {report.predictions_vs_actual.map((item, idx) => {
                const isExpanded = expandedQueryId === item.query_id;
                return (
                  <div 
                    key={item.query_id} 
                    className="border border-[#D0CBB7] rounded-lg overflow-hidden bg-[#FAF6F0]"
                  >
                    {/* Header */}
                    <button
                      onClick={() => setExpandedQueryId(isExpanded ? null : item.query_id)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#EFECE1]/45 transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#4A6B53] bg-[#4A6B53]/10 px-2 py-1 rounded">
                          {item.query_id}
                        </span>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded mr-3">
                            {item.category.replace("_", " ")}
                          </span>
                          <span className="text-sm font-semibold text-[#2D312E] font-serif">
                            {item.question}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#5C615D]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#5C615D]" />
                        )}
                      </div>
                    </button>

                    {/* Content Detail */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-[#D0CBB7]/50 pt-4 bg-[#EFECE1]/15 grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideDown">
                        {/* Expected Ground Truth */}
                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-4">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs uppercase tracking-wider mb-2">
                            Expected Ground Truth (benchmark.json)
                          </div>
                          <div className="text-emerald-950">
                            {renderMarkdown(item.expected)}
                          </div>
                        </div>

                        {/* Model Prediction */}
                        <div className="bg-amber-50/30 border border-amber-100/70 rounded-lg p-4">
                          <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs uppercase tracking-wider mb-2">
                            Our Engine (Inference Result)
                          </div>
                          <div className="text-[#2D312E]">
                            {renderMarkdown(item.predicted)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Empty State when no report exists */}
      {!isLoading && !report && selectedCaseId && (
        <div className="bg-[#EFECE1]/60 border border-dashed border-[#D0CBB7] rounded-xl p-12 text-center w-full mx-auto my-12 space-y-4 shadow-sm animate-fadeIn">
          <HelpCircle className="w-16 h-16 text-[#4A6B53]/60 mx-auto animate-pulse" />
          <h3 className="text-xl font-bold font-serif text-[#2E4F4F]">No Benchmark History Found</h3>
          <p className="text-sm text-[#5C615D] max-w-md mx-auto font-sans">
            This case has not been benchmarked yet. Execute the benchmark query suite to evaluate the model's accuracy, recall, and credibility scoring against verified ground truths.
          </p>
        </div>
      )}
    </div>
  );
}
