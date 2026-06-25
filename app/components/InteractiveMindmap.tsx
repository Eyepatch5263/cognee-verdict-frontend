"use client";

import React, { useState, useEffect } from "react";
import { BASE_URL } from "@/lib/api";
import { GitFork, Info, HelpCircle, Loader2, RefreshCw, ZoomIn } from "lucide-react";

interface InteractiveMindmapProps {
  activeCaseId: string | null;
  activeCaseName?: string;
  isLive: boolean;
}

export default function InteractiveMindmap({
  activeCaseId,
  activeCaseName,
  isLive
}: InteractiveMindmapProps) {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCaseId) {
      setIframeSrc(null);
      return;
    }

    if (isLive) {
      setIsLoading(true);
      setError(null);
      // Construct backend endpoint URL
      const srcUrl = `${BASE_URL}/cases/${activeCaseId}/visualize`;
      setIframeSrc(srcUrl);
    } else {
      setIframeSrc(null);
    }
  }, [activeCaseId, isLive]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleRefresh = () => {
    if (activeCaseId && isLive) {
      setIsLoading(true);
      setError(null);
      // Force iframe refresh by appending a timestamp query param
      const srcUrl = `${BASE_URL}/cases/${activeCaseId}/visualize?t=${Date.now()}`;
      setIframeSrc(srcUrl);
    }
  };

  if (!activeCaseId) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center text-center text-[#5C615D] bg-[#FAF6F0] p-6">
        <HelpCircle className="w-12 h-12 mb-3 text-[#D0CBB7]" />
        <h4 className="font-semibold text-[#2D312E] font-serif text-lg">No active case selected</h4>
        <p className="text-xs max-w-sm mt-1 font-serif text-[#5C615D]/80">
          Please select a completed case from the Case Library screen to view its interactive Cognee mindmap.
        </p>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center text-center bg-[#FAF6F0] p-8">
        <div className="max-w-md p-8 rounded-xl border border-[#D0CBB7] bg-[#F4F0E6] shadow-sm space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#4A6B53]/10 flex items-center justify-center text-[#4A6B53]">
            <GitFork className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#2D312E] font-serif">Interactive Mindmap Visualization</h3>
          <p className="text-xs text-[#5C615D] leading-relaxed font-serif">
            The interactive mindmap is powered by the <strong>Cognee Cloud API</strong>. It dynamically maps files, text segments, entities, semantic types, and summarizing nodes on a D3 force-directed layout.
          </p>
          <div className="bg-[#FAF6F0] p-3 rounded-lg border border-[#D0CBB7]/60 text-left text-[11px] text-[#5C615D] font-sans flex gap-2">
            <Info className="w-4 h-4 shrink-0 text-[#4A6B53]" />
            <span>Connect to a live Cognee Cloud tenant backend to render full interactive timelines, group panels, and zoom controls.</span>
          </div>
          <p className="text-[11px] font-semibold text-[#4A6B53]/90 font-serif">
            Current Case: {activeCaseName || "State v. Marcus Vance"} (Demo Mode)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden bg-[#FAF6F0]">
      {/* Top Banner Control */}
      <div className="px-6 py-3 border-b border-[#D0CBB7] bg-[#EFECE1] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-[#4A6B53]" />
          <h2 className="text-sm font-semibold text-[#2D312E] font-serif">
            Interactive Cognee Mindmap: <span className="font-bold text-[#4A6B53]">{activeCaseName || "Selected Case"}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-[#D0CBB7] bg-[#FAF6F0] hover:bg-[#EAE6D8] transition-colors text-[#5C615D] disabled:opacity-50 flex items-center gap-1.5 text-xs font-serif font-medium"
            title="Reload Mindmap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Mindmap Frame Container */}
      <div className="flex-1 relative w-full h-full bg-[#FAF6F0]">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FAF6F0]/80">
            <Loader2 className="w-8 h-8 text-[#4A6B53] animate-spin" />
            <p className="text-xs font-serif font-semibold mt-2 text-[#5C615D]">
              Querying Cognee Cloud D3 Visualization...
            </p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm font-serif text-[#B85C4C] font-semibold">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 border border-[#D0CBB7] rounded-lg bg-[#F4F0E6] font-serif text-xs font-medium text-[#2D312E] hover:bg-[#EAE6D8]"
            >
              Try Again
            </button>
          </div>
        )}

        {iframeSrc && (
          <iframe
            src={iframeSrc}
            onLoad={handleIframeLoad}
            onError={() => {
              setIsLoading(false);
              setError("Failed to load interactive mindmap from server.");
            }}
            className="w-full h-full border-none"
            title="Cognee Graph Visualization"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        )}
      </div>
    </div>
  );
}
