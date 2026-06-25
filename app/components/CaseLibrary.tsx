"use client";

import React, { useState, useRef } from "react";
import { Case } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Search, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Database,
  Calendar,
  Layers,
  ArrowRight,
  Filter
} from "lucide-react";

interface CaseLibraryProps {
  cases: Case[];
  activeCaseId: string | null;
  onSelectCase: (id: string) => void;
  onUploadCollection: (files: File[], collectionName: string) => Promise<void>;
}

export default function CaseLibrary({ 
  cases, 
  activeCaseId, 
  onSelectCase, 
  onUploadCollection 
}: CaseLibraryProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [collectionNameInput, setCollectionNameInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter cases based on search and status filter
  const filteredCases = cases.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.filename.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      filesArray.forEach((file) => {
        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        if (![".pdf", ".docx", ".txt", ".json"].includes(ext)) {
          invalidFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        setErrorMsg(`Unsupported extension in: ${invalidFiles.join(", ")}. Select PDF, DOCX, TXT, or JSON.`);
      } else {
        setErrorMsg("");
      }

      setSelectedFiles(prev => [...prev, ...validFiles]);

      // Auto-set collection name from first file if currently empty
      if (!collectionNameInput && validFiles.length > 0) {
        const firstFile = validFiles[0];
        setCollectionNameInput(firstFile.name.slice(0, firstFile.name.lastIndexOf(".")));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !collectionNameInput.trim()) return;
    
    setIsUploading(true);
    setErrorMsg("");
    
    try {
      await onUploadCollection(selectedFiles, collectionNameInput);
      setSelectedFiles([]);
      setCollectionNameInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed. Please check backend connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-[#4A6B53] animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-[#5C615D]" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-[#B85C4C]" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#EAF2EB] text-emerald-700 border-emerald-300";
      case "processing":
        return "bg-[#4A6B53]/10 text-[#4A6B53] border-[#4A6B53]/30";
      case "pending":
        return "bg-[#EFECE1] text-[#5C615D] border-[#D0CBB7]";
      case "failed":
        return "bg-[#F5EBEA] text-[#B85C4C] border-[#B85C4C]/30";
      default:
        return "";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FAF6F0]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D0CBB7] pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#2D312E] font-serif">Case Dossier Library</h2>
          <p className="text-sm text-[#5C615D] mt-1 font-serif">Upload and manage case files for graph-memory integration and analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Case Column */}
        <div className="space-y-6">
          <div className="bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-6 shadow-sm">
            <h3 className="text-md font-semibold text-[#2D312E] mb-4 flex items-center gap-2 font-serif">
              <Upload className="w-4 h-4 text-[#4A6B53]" />
              Ingest New Collection
            </h3>
            
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Collection (Brain) Name */}
              <div className="font-serif">
                <label className="text-xs text-[#5C615D] block mb-1 font-semibold">Collection (Brain) Name</label>
                <input 
                  type="text"
                  value={collectionNameInput}
                  onChange={(e) => setCollectionNameInput(e.target.value)}
                  placeholder="e.g. State v. Marcus Vance"
                  className="w-full bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg px-3 py-2 text-sm text-[#2D312E] focus:outline-none focus:border-[#4A6B53]"
                  required
                />
              </div>

              {/* Drag & Drop Zone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  selectedFiles.length > 0 
                    ? "border-[#4A6B53]/50 bg-[#4A6B53]/5" 
                    : "border-[#D0CBB7] hover:border-gray-400 bg-[#FAF6F0]/50"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.docx,.txt,.json"
                  multiple
                />
                <Upload className={`w-8 h-8 mb-3 ${selectedFiles.length > 0 ? "text-[#4A6B53]" : "text-[#5C615D]"}`} />
                <div className="text-center font-serif">
                  <p className="text-sm font-medium text-[#2D312E]">Click or drag files to upload</p>
                  <p className="text-[11px] text-[#5C615D] mt-1">PDF, DOCX, TXT, or JSON (Multiple allowed)</p>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-3 font-serif max-h-60 overflow-y-auto pr-1">
                  <label className="text-xs text-[#5C615D] block font-semibold">Files to upload ({selectedFiles.length})</label>
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="p-3 bg-[#FAF6F0] rounded-lg border border-[#D0CBB7] flex items-center justify-between gap-2 relative">
                      <span className="text-xs font-semibold text-[#2D312E] truncate max-w-[180px]" title={file.name}>
                        {file.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#5C615D] font-mono shrink-0 mr-6">
                          {formatSize(file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-2.5 right-2 text-xs font-bold text-[#B85C4C] hover:text-red-700 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full bg-[#4A6B53] hover:bg-[#3F5E4D] disabled:bg-[#FAF6F0] disabled:text-[#5C615D] text-white font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#4A6B53]" />
                        <span>Uploading files to Cognee...</span>
                      </>
                    ) : (
                      <>
                        <span>Ingest into {collectionNameInput || "Collection"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-[#F5EBEA] border border-[#B85C4C]/35 rounded-lg text-xs text-[#B85C4C] flex items-start gap-2 font-serif">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Case List Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl p-4 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-[#5C615D]" />
              <input
                type="text"
                placeholder="Search cases by name or file..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg text-sm text-[#2D312E] placeholder-[#5C615D] focus:outline-none focus:border-[#4A6B53] font-serif"
              />
            </div>
            <div className="flex items-center gap-2 font-serif">
              <Filter className="w-4 h-4 text-[#5C615D] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#FAF6F0] border border-[#D0CBB7] rounded-lg px-3 py-2 text-sm text-[#2D312E] focus:outline-none focus:border-[#4A6B53]"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Grid of Case Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredCases.map((caseItem) => {
                const isActive = caseItem.id === activeCaseId;
                return (
                  <motion.div
                    key={caseItem.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      if (caseItem.status === "completed") {
                        onSelectCase(caseItem.id);
                      }
                    }}
                    className={`border rounded-xl p-5 cursor-pointer shadow-sm transition-all duration-200 ${
                      isActive 
                        ? "bg-[#FAF6F0] border-[#4A6B53] ring-2 ring-[#4A6B53]/25" 
                        : "bg-[#F4F0E6] border-[#D0CBB7] hover:border-gray-400"
                    } ${caseItem.status !== "completed" ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-2 bg-[#4A6B53]/10 text-[#4A6B53] rounded-lg shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      
                      <div className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 font-mono ${getStatusClass(caseItem.status)}`}>
                        {getStatusIcon(caseItem.status)}
                        <span className="capitalize">{caseItem.status}</span>
                      </div>
                    </div>

                    {/* Case Title */}
                    <h4 className="font-semibold text-[#2D312E] truncate text-base mb-1 font-serif" title={caseItem.name}>
                      {caseItem.name}
                    </h4>
                    <p className="text-xs text-[#5C615D] truncate mb-4 font-serif">{caseItem.filename}</p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 border-t border-[#D0CBB7] pt-3 text-xs text-[#2D312E] font-serif">
                      <div className="flex items-center gap-1.5 text-[#5C615D]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(caseItem.uploadedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5C615D] justify-end">
                        <Database className="w-3.5 h-3.5" />
                        <span>{formatSize(caseItem.sizeBytes)}</span>
                      </div>

                      {caseItem.status === "completed" && (
                        <>
                          <div className="flex items-center gap-1.5 text-[#2D312E] mt-1">
                            <Layers className="w-3.5 h-3.5 text-[#4A6B53]" />
                            <span>{caseItem.entitiesCount} Entities</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#6B8E23] mt-1 justify-end font-semibold">
                            <span>{caseItem.confidenceScore}% Confidence</span>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredCases.length === 0 && (
              <div className="col-span-full py-12 text-center bg-[#F4F0E6] border border-[#D0CBB7] rounded-xl text-[#5C615D] text-sm font-serif">
                No matching cases found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
