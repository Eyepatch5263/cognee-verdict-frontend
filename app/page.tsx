"use client";

import Link from "next/link";
import {
  Scale,
  Brain,
  Cpu,
  Database,
  Eye,
  ShieldAlert,
  GitBranch,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2D312E] font-sans selection:bg-[#4A6B53] selection:text-white overflow-x-hidden">
      {/* Top Navbar */}
      <header className="border-b border-[#E8E2D5] bg-[#FAF6F0]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A6B53] flex items-center justify-center shadow-md shadow-[#4A6B53]/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-wide text-[#2D312E]">CogniVerdict</span>
              <span className="block text-[10px] tracking-widest text-[#5C615D] uppercase font-sans">Legal Intelligence</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5C615D]">
            <a href="#features" className="hover:text-[#2D312E] transition-colors duration-200">Features</a>
            <a href="#tech-stack" className="hover:text-[#2D312E] transition-colors duration-200">Tech Stack</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-[#4A6B53] hover:bg-[#3D5944] text-white text-sm font-semibold transition-all duration-200 shadow-md shadow-[#4A6B53]/10 hover:shadow-[#4A6B53]/20 flex items-center gap-2 group"
            >
              Launch Workspace
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 border-b border-[#E8E2D5] bg-radial-[circle_at_center_top] from-[#F4EFE6] via-[#FAF6F0] to-[#FAF6F0]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#EAE3D5_1px,transparent_1px),linear-gradient(to_bottom,#EAE3D5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#1C201D] max-w-4xl mx-auto leading-[1.1] mb-6">
            Where Evidence Meets <span className="text-[#4A6B53] underline decoration-[#E6AD45] decoration-wavy">Evolving Graph Memory</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#5C615D] max-w-2xl mx-auto leading-relaxed mb-10 font-light">
            Transform unstructured legal briefs, statements, and forensic dossiers into self-correcting knowledge graphs. Quantify credibility and verify case theories automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#4A6B53] hover:bg-[#3D5944] text-white text-base font-semibold transition-all duration-200 shadow-lg shadow-[#4A6B53]/15 flex items-center justify-center gap-2 group"
            >
              Enter Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#F0EAE1] hover:bg-[#E7DFD4] text-[#2D312E] border border-[#DCD3C4] text-base font-semibold transition-all duration-200 flex items-center justify-center"
            >
              Explore Features
            </a>
          </div>

          {/* Interactive Mockup Preview */}
          <div className="mt-16 md:mt-20 border border-[#D2CAB6] bg-[#F2ECE0] p-3 rounded-2xl shadow-xl shadow-[#2D312E]/5 relative group">
            <div className="rounded-xl overflow-hidden border border-[#D2CAB6] bg-[#FAF6F0] aspect-[16/9] flex flex-col shadow-sm">
              {/* Fake Window bar */}
              <div className="h-10 bg-[#EFECE1] border-b border-[#D2CAB6] px-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#E05E56]" />
                  <div className="w-3 h-3 rounded-full bg-[#F4B41A]" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                </div>
                <div className="text-[10px] text-[#5C615D] font-mono tracking-widest uppercase">CogniVerdict Case Analyzer</div>
                <div className="w-12" />
              </div>
              {/* Fake Dashboard Body */}
              <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 bg-[#FAF6F0]">
                {/* Left Side Panel */}
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                  <div className="bg-[#FAF6F0] border border-[#E5DEC9] p-4 rounded-xl text-left">
                    <span className="text-[10px] text-[#4A6B53] font-semibold tracking-wider uppercase block mb-1">Active Dossier</span>
                    <h3 className="font-serif font-bold text-base text-[#2D312E]">CASE_003: Sector 17 Burglary</h3>
                    <p className="text-[11px] text-[#5C615D] mt-1.5 line-clamp-2">Burglary at Mehta residence. Stolen Gold watch and ₹2.5 lakh cash. Fingerprint matches Rohan Verma.</p>
                  </div>
                  <div className="bg-[#FAF6F0] border border-[#E5DEC9] p-4 rounded-xl text-left">
                    <span className="text-[10px] text-[#E6AD45] font-semibold tracking-wider uppercase block mb-1">Scoring metrics</span>
                    <div className="flex justify-between items-center mt-2 border-b border-[#FAF6F0] pb-2">
                      <span className="text-xs text-[#5C615D]">Suspect Match</span>
                      <span className="text-xs font-bold text-[#2D312E]">Rohan Verma (92%)</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-[#5C615D]">Conviction Probability</span>
                      <span className="text-xs font-bold text-[#4A6B53]">74.5%</span>
                    </div>
                  </div>
                </div>
                {/* Right Side Panel - Fake Contradiction Network */}
                <div className="flex-1 bg-[#FAF6F0] border border-[#E5DEC9] p-4 rounded-xl flex flex-col justify-between text-left">
                  <div>
                    <span className="text-[10px] text-red-600 font-semibold tracking-wider uppercase block mb-1">Contradiction alert</span>
                    <h4 className="font-serif text-sm font-bold text-[#2D312E] mb-2">Timeline Discrepancy: Priya Mehta Statement</h4>
                    <p className="text-xs text-[#5C615D] leading-relaxed">
                      Priya claims she saw Rohan exit at <strong className="text-[#2D312E]">7:30 PM</strong>. However, gate CCTV records no movement until <strong className="text-[#2D312E]">8:47 PM</strong>. Investigation suggests Priya misjudged time due to the 7:20 PM sector power outage.
                    </p>
                  </div>
                  <div className="bg-[#F0EAE1] border border-[#D9D1BF] p-3 rounded-lg flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#4A6B53]" />
                      <span className="text-[11px] text-[#5C615D]">Mapped to: <code className="text-[#2D312E] bg-[#E7DFD1] px-1 py-0.5 rounded">WS-003.json (Line 12)</code></span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#FAF6F0] text-[#E6AD45] border border-[#D5CDBC] font-mono">ADJUSTABLE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#2D312E] mb-4">
            Designed for Precise Judicial Reasoning
          </h2>
          <p className="text-[#5C615D] font-light leading-relaxed">
            CogniVerdict replaces standard black-box AI outputs with structured, mathematical calculations grounded directly in document memory graphs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Card 1: Ingestion (remember) */}
          <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-8 rounded-2xl hover:border-[#4A6B53] transition-all duration-300 group flex flex-col justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D312E] mb-3">Memory Ingestion <span className="text-xs font-mono block text-[#4A6B53]">remember()</span></h3>
              <p className="text-sm text-[#5C615D] leading-relaxed font-light">
                Parses raw case documents (PDFs, JSON witness briefs), chunks texts semantically, and builds the initial entity-relationship graph in Cognee.
              </p>
            </div>
          </div>

          {/* Card 2: Retrieval (recall) */}
          <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-8 rounded-2xl hover:border-[#4A6B53] transition-all duration-300 group flex flex-col justify-between">
            <div>

              <h3 className="font-serif font-bold text-lg text-[#2D312E] mb-3">Context Retrieval <span className="text-xs font-mono block text-[#4A6B53]">recall()</span></h3>
              <p className="text-sm text-[#5C615D] leading-relaxed font-light">
                Queries the case dataset by traversing graph topologies and fetching vector chunks to ground the advisory chat and reasoning engines.
              </p>
            </div>
          </div>

          {/* Card 3: Alignment (improve) */}
          <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-8 rounded-2xl hover:border-[#4A6B53] transition-all duration-300 group flex flex-col justify-between">
            <div>

              <h3 className="font-serif font-bold text-lg text-[#2D312E] mb-3">Real-time Alignment <span className="text-xs font-mono block text-[#4A6B53]">improve()</span></h3>
              <p className="text-sm text-[#5C615D] leading-relaxed font-light">
                Enriches and optimizes graph representation in the background, restructuring entity relations based on submitted feedback.
              </p>
            </div>
          </div>

          {/* Card 4: Pruning (forget) */}
          <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-8 rounded-2xl hover:border-[#4A6B53] transition-all duration-300 group flex flex-col justify-between">
            <div>

              <h3 className="font-serif font-bold text-lg text-[#2D312E] mb-3">Controlled Pruning <span className="text-xs font-mono block text-[#4A6B53]">forget()</span></h3>
              <p className="text-sm text-[#5C615D] leading-relaxed font-light">
                Cleans and prunes discredited evidence nodes, invalid witness statements, or deletes entire case datasets securely.
              </p>
            </div>
          </div>

          {/* Card 5: Parallel Agent Reasoning */}
          <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-8 rounded-2xl hover:border-[#4A6B53] transition-all duration-300 group flex flex-col justify-between">
            <div>

              <h3 className="font-serif font-bold text-lg text-[#2D312E] mb-3">Parallel Agent Reasoning</h3>
              <p className="text-sm text-[#5C615D] leading-relaxed font-light">
                Runs contradictions, motives, and credibility analyses concurrently via <code className="text-[#2D312E] bg-[#E7DFD1] px-1 rounded">asyncio.gather</code>, completing tasks in seconds.
              </p>
            </div>
          </div>

          {/* Card 6: Explainable Mapping */}
          <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-8 rounded-2xl hover:border-[#4A6B53] transition-all duration-300 group flex flex-col justify-between">
            <div>

              <h3 className="font-serif font-bold text-lg text-[#2D312E] mb-3">Explainable Mapping</h3>
              <p className="text-sm text-[#5C615D] leading-relaxed font-light">
                Links every graph connection back to raw source lines (e.g. <code className="text-[#2D312E] bg-[#E7DFD1] px-1 rounded">WS-005.json</code>) so that all AI logic remains human-verifiable.
              </p>
            </div>
          </div>

          {/* Card 7: Continuous Benchmarking */}
          <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-8 rounded-2xl hover:border-[#4A6B53] transition-all duration-300 group flex flex-col justify-between">
            <div>

              <h3 className="font-serif font-bold text-lg text-[#2D312E] mb-3">Continuous Benchmarking</h3>
              <p className="text-sm text-[#5C615D] leading-relaxed font-light">
                Evaluates suspect predictions, vector recall rates, and MAE scores against hidden judicial ground truths continuously.
              </p>
            </div>
          </div>

          {/* Card 8: Deterministic Scoring */}
          <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-8 rounded-2xl hover:border-[#4A6B53] transition-all duration-300 group flex flex-col justify-between">
            <div>

              <h3 className="font-serif font-bold text-lg text-[#2D312E] mb-3">Deterministic Scoring</h3>
              <p className="text-sm text-[#5C615D] leading-relaxed font-light">
                Blends extracted qualitative signals with mathematical credibility and strength formulas for objective conviction likelihood.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech-stack" className="py-24 bg-[#FAF6F0] border-t border-[#E8E2D5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-[#2D312E] mb-4">
              Built on a Modern, Premium Architecture
            </h2>
            <p className="text-[#5C615D] font-light text-sm leading-relaxed">
              Standardized engineering patterns that enable millisecond-level responsiveness and clean separation of concerns.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-6 rounded-xl text-center">
              <span className="font-serif text-xl font-bold text-[#2D312E] block mb-1">Cognee Cloud</span>
              <span className="text-xs text-[#5C615D]">Graph & Vector DB Memory</span>
            </div>
            <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-6 rounded-xl text-center">
              <span className="font-serif text-xl font-bold text-[#2D312E] block mb-1">FastAPI</span>
              <span className="text-xs text-[#5C615D]">Python Async Services</span>
            </div>
            <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-6 rounded-xl text-center">
              <span className="font-serif text-xl font-bold text-[#2D312E] block mb-1">Next.js 16</span>
              <span className="text-xs text-[#5C615D]">Frontend App Router</span>
            </div>
            <div className="bg-[#F6F1E5] border border-[#E5DEC9] p-6 rounded-xl text-center">
              <span className="font-serif text-xl font-bold text-[#2D312E] block mb-1">NVIDIA NIM</span>
              <span className="text-xs text-[#5C615D]">Llama 3.1 70B Reasoning</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-24 text-center max-w-4xl mx-auto px-6">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2D312E] mb-6">
          Ready to Calibrate Your Case Reasoning?
        </h2>
        <p className="text-base text-[#5C615D] font-light max-w-xl mx-auto mb-10 leading-relaxed">
          Ingest new legal dossiers, visualize the connection topology, and let the parallelized multi-agent analysis work for you.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#4A6B53] hover:bg-[#3D5944] text-white text-base font-semibold transition-all duration-200 shadow-lg shadow-[#4A6B53]/15 group"
        >
          Launch Workspace
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E2D5] py-12 bg-[#EFECE1] text-[#5C615D]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#4A6B53]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#2D312E]">CogniVerdict Workspace &copy; 2026</span>
          </div>
          <div className="flex gap-8 text-xs">
            <a href="https://cognee.ai" className="hover:text-[#2D312E] transition-colors duration-200">Cognee Cloud</a>
            <a href="https://nextjs.org" className="hover:text-[#2D312E] transition-colors duration-200">Next.js</a>
            <a href="https://fastapi.tiangolo.com" className="hover:text-[#2D312E] transition-colors duration-200">FastAPI</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
