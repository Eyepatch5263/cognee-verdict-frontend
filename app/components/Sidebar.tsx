"use client";

import React from "react";
import { 
  FolderOpen, 
  Network, 
  MessageSquare, 
  BarChart3, 
  SlidersHorizontal,
  Scale,
  CloudLightning,
  WifiOff,
  GitFork
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLive: boolean;
  activeCaseName?: string;
}

export default function Sidebar({ activeTab, setActiveTab, isLive, activeCaseName }: SidebarProps) {
  const menuItems = [
    { id: "library", label: "Case Library", icon: FolderOpen },
    { id: "explorer", label: "Memory Explorer", icon: Network },
    { id: "chat", label: "Advisory Chat", icon: MessageSquare },
    { id: "analysis", label: "Analysis Dashboard", icon: BarChart3 },
    { id: "feedback", label: "Feedback Panel", icon: SlidersHorizontal },
    { id: "benchmarking", label: "Benchmarking Layer", icon: GitFork },
  ];


  return (
    <aside className="w-64 bg-[#EFECE1] border-r border-[#D0CBB7] flex flex-col h-screen shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#D0CBB7] flex items-center gap-3">
        <div className="p-2 bg-[#4A6B53]/15 text-[#4A6B53] rounded-lg">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-semibold text-lg tracking-tight text-[#2E4F4F] font-serif">CogniVerdict</h1>
          <p className="text-[10px] text-[#5C615D] font-mono">LEGAL CO-PILOT v1.0</p>
        </div>
      </div>

      {/* Selected Case Indicator */}
      <div className="px-6 py-4 border-b border-[#D0CBB7] bg-[#FAF6F0]/50">
        <p className="text-[10px] text-[#5C615D] font-medium uppercase tracking-wider">Active Workspace</p>
        <p className="text-sm font-semibold truncate text-[#2D312E] mt-1 font-serif">
          {activeCaseName || "No Case Loaded"}
        </p>
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? "bg-[#4A6B53]/15 text-[#4A6B53] border-l-4 border-[#4A6B53]"
                  : "text-[#5C615D] hover:bg-[#EAE6D8] hover:text-[#2D312E]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Connection Status Footnote */}
      <div className="p-4 border-t border-[#D0CBB7] bg-[#EFECE1]">
        <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-[#EAE6D8]/50 border border-[#D0CBB7]/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-600 animate-pulse" : "bg-amber-600"}`} />
            <span className="text-[11px] font-medium text-[#2D312E]">
              {isLive ? "Live Mode" : "Demo Mode"}
            </span>
          </div>
          {isLive ? (
            <span title="Connected to Cognee Cloud">
              <CloudLightning className="w-3.5 h-3.5 text-emerald-600" />
            </span>
          ) : (
            <span title="Offline Demo Data active">
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
