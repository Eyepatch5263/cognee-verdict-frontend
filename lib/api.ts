export interface Case {
  id: string;
  name: string;
  filename: string;
  uploadedAt: string;
  status: "completed" | "processing" | "pending" | "failed";
  sizeBytes: number;
  entitiesCount: number;
  relationshipsCount: number;
  confidenceScore: number;
  suspectProbability: number;
  convictionProbability: number;
  witnesses: { name: string; credibility: number; role: string; contradictions: number }[];
  contradictions: { id: string; title: string; description: string; severity: "high" | "medium" | "low" }[];
  feedbacks?: FeedbackItem[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface RecallResult {
  source: string;
  text: string;
  score?: number;
  metadata?: Record<string, any>;
  citations?: string[];
}

export interface ContradictionItem {
  contradiction: boolean;
  type: string;
  severity: string;
  reason: string;
}

export interface MotiveItem {
  party: string;
  motive_type: string;
  evidence: string;
  explanation: string;
}

export interface WitnessBiasItem {
  witness_name: string;
  bias_type: string;
  credibility_implication: string;
  evidence: string;
}

export interface LegalSignals {
  contradiction_count: number;
  corroboration_count: number;
  bias_score: string;
  motive_score: string;
  consistency_score: string;
  evidence_strength: string;
  justification: string;
}

export interface CaseReasoning {
  contradictions: ContradictionItem[];
  motives: MotiveItem[];
  witness_biases: WitnessBiasItem[];
  signals: LegalSignals;
  explanation: string;
}

export interface EvidenceItem {
  id: string;
  name: string;
  type: string;
  relevance: number;
  description: string;
  contradictory: boolean;
}

// -------------------------------------------------------------
// Beautiful, Complete Mock Data for Offline Demo Mode
// -------------------------------------------------------------
export const MOCK_CASES: Case[] = [];

export const MOCK_GRAPHS: Record<string, { nodes: GraphNode[]; edges: GraphEdge[] }> = {
  "vance-arson-001": {
    nodes: [
      { id: "node-vance", label: "Marcus Vance", type: "Suspect", properties: { role: "Owner", motive: "Insurance payout ($1.2M)", alibi: "Sleeping at home" } },
      { id: "node-detective", label: "Sean Ryan", type: "Witness", properties: { role: "Detective", division: "Arson Squad" } },
      { id: "node-sarah", label: "Sarah Jenkins", type: "Witness", properties: { relation: "Neighbor", testimony: "Saw dark sedan drive away" } },
      { id: "node-warehouse", label: "Vance Logistics HQ", type: "Location", properties: { address: "404 Industrial Blvd", status: "Destroyed" } },
      { id: "node-canister", label: "Gasoline Canister", type: "Evidence", properties: { brand: "Scepter", location_found: "Rear exit alleyway", fingerprints: "Partial match Vance" } },
      { id: "node-igniter", label: "Timed Igniter", type: "Evidence", properties: { circuit: "Arduino Nano", delay_set: "120 mins", components: "RadioShack relay" } },
      { id: "node-shell", label: "Shell Station #492", type: "Location", properties: { address: "202 Highway 6", footage: "Confirms dark sedan at 11:15 PM" } },
      { id: "node-insurance", label: "Liberty Fire Insurance", type: "Entity", properties: { policy_value: "$1,200,000", filed_date: "2026-06-10" } }
    ],
    edges: [
      { id: "edge-1", source: "node-vance", target: "node-warehouse", label: "OWNS" },
      { id: "edge-2", source: "node-detective", target: "node-warehouse", label: "INVESTIGATED" },
      { id: "edge-3", source: "node-vance", target: "node-canister", label: "PURCHASED" },
      { id: "edge-4", source: "node-canister", target: "node-warehouse", label: "FOUND_AT" },
      { id: "edge-5", source: "node-igniter", target: "node-warehouse", label: "USED_TO_IGNITE" },
      { id: "edge-6", source: "node-vance", target: "node-insurance", label: "FILED_CLAIM_WITH" },
      { id: "edge-7", source: "node-sarah", target: "node-warehouse", label: "WITNESSED_FIRE_AT" },
      { id: "edge-8", source: "node-shell", target: "node-canister", label: "SOURCE_OF" },
      { id: "edge-9", source: "node-vance", target: "node-igniter", label: "CONSTRUCTED" }
    ]
  },
  "sterling-espionage-002": {
    nodes: [
      { id: "node-sterling", label: "Jane Sterling", type: "Suspect", properties: { role: "DevOps Engineer", clearance: "Level 3", employment_status: "Terminated" } },
      { id: "node-patel", label: "Vikram Patel", type: "Victim", properties: { role: "CEO", business: "Global Trade Corp" } },
      { id: "node-server", label: "Confidential R&D Database", type: "Location", properties: { ip: "10.0.4.15", host: "rd-main-prod" } },
      { id: "node-usb", label: "Lexar USB Drive", type: "Evidence", properties: { capacity: "64GB", owner: "Jane Sterling", key_find: "Found in briefcase" } },
      { id: "node-vpn", label: "VPN Log Entry #891", type: "Evidence", properties: { timestamp: "03:12:44 AM", IP_address: "185.190.140.2" } }
    ],
    edges: [
      { id: "edge-e1", source: "node-sterling", target: "node-server", label: "ACCESSED" },
      { id: "edge-e2", source: "node-sterling", target: "node-usb", label: "POSSESSED" },
      { id: "edge-e3", source: "node-vpn", target: "node-sterling", label: "IDENTIFIED" },
      { id: "edge-e4", source: "node-patel", target: "node-server", label: "SECURED" },
      { id: "edge-e5", source: "node-usb", target: "node-server", label: "CONTAINED_DATA_FROM" }
    ]
  }
};

export const MOCK_CHUNKS: Record<string, RecallResult[]> = {
  "vance-arson-001": [
    {
      source: "vance_arson_dossier.pdf",
      text: "At approximately 01:49 hours, dispatch received multiple 911 calls regarding an explosion at Vance Logistics HQ. Neighbor Sarah Jenkins reported seeing a dark-colored sedan leaving the rear alleyway shortly before flames became visible.",
      score: 0.94,
      metadata: { page: 3, line: 12 }
    },
    {
      source: "vance_arson_dossier.pdf",
      text: "The lead investigator, Detective Sean Ryan, identified a melted Scepter brand gasoline canister near the rear exit. Chemical testing confirmed the presence of premium 93-octane fuel matching samples later recovered from a Shell station pump.",
      score: 0.91,
      metadata: { page: 5, line: 4 }
    },
    {
      source: "vance_arson_dossier.pdf",
      text: "Vance's alibi states he was asleep at home from 11 PM to 6 AM. However, AT&T network records show Vance's cell phone (IMEI: 359102...) pinged cell tower 402, sector B, which covers the warehouse parking lot, at exactly 01:47:15 AM.",
      score: 0.88,
      metadata: { page: 7, line: 22 }
    }
  ]
};

// -------------------------------------------------------------
// API Client Implementation
// -------------------------------------------------------------
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class CogniVerdictAPI {
  private static isBackendAvailable = false;

  static async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/`, { method: "GET", signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        this.isBackendAvailable = true;
        return true;
      }
    } catch {
      // Backend is offline
    }
    this.isBackendAvailable = false;
    return false;
  }

  static isLive(): boolean {
    return this.isBackendAvailable;
  }

  static async fetchCases(): Promise<Case[]> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      return MOCK_CASES;
    }

    try {
      const res = await fetch(`${BASE_URL}/cases`);
      if (!res.ok) throw new Error("Failed to fetch cases");
      const datasets = await res.json();
      
      return datasets.map((d: any) => {
        // Preserve mock metrics/contradictions details if names align
        const mockMatch = MOCK_CASES.find(
          c => c.name.toLowerCase() === d.name.toLowerCase() || c.id === d.id
        );
        if (mockMatch) {
          return {
            ...mockMatch,
            id: d.id,
            name: d.name,
            uploadedAt: d.createdAt || mockMatch.uploadedAt
          };
        }
        
        return {
          id: d.id,
          name: d.name,
          filename: d.name + ".pdf",
          uploadedAt: d.createdAt || new Date().toISOString(),
          status: "completed",
          sizeBytes: 1024 * 1200,
          entitiesCount: 14,
          relationshipsCount: 19,
          confidenceScore: 75,
          suspectProbability: 60,
          convictionProbability: 50,
          witnesses: [],
          contradictions: []
        };
      });
    } catch (err) {
      console.error("Error fetching cases from backend:", err);
      return MOCK_CASES;
    }
  }

  static async uploadCollection(files: File[], collectionName: string): Promise<any> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      // Mock Success Upload
      console.warn("Using offline mock for collection upload");
      const newId = `mock-case-${Date.now()}`;
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);
      const filenamesStr = files.map(f => f.name).join(", ");
      const newCase: Case = {
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
      
      MOCK_CASES.push(newCase);
      return {
        dataset_id: newId,
        dataset_name: `case_${collectionName.toLowerCase().replace(/\s+/g, "_")}`,
        filename: newCase.filename,
        status: "initiated",
        message: "Offline Mock upload triggered successfully."
      };
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("case_name", collectionName);
    formData.append("run_in_background", "true");

    const res = await fetch(`${BASE_URL}/cases/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) throw new Error("Upload request failed");
    return res.json();
  }

  static async getCaseStatus(datasetId: string): Promise<any> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      const match = MOCK_CASES.find(c => c.id === datasetId);
      if (match) {
        // Mock progression
        if (match.status === "processing") {
          setTimeout(() => {
            match.status = "completed";
            match.entitiesCount = 15;
            match.relationshipsCount = 20;
            match.confidenceScore = 75;
            match.suspectProbability = 60;
            match.convictionProbability = 50;
            MOCK_GRAPHS[datasetId] = {
              nodes: [
                { id: "node-sub", label: "John Doe", type: "Suspect", properties: { role: "Manager" } },
                { id: "node-loc", label: "Office Vault", type: "Location", properties: { sec_level: "High" } }
              ],
              edges: [
                { id: `e-${datasetId}`, source: "node-sub", target: "node-loc", label: "ACCESS" }
              ]
            };
          }, 8000);
        }
        return { dataset_id: datasetId, status: match.status, pipeline_name: "cognify_pipeline" };
      }
      return { dataset_id: datasetId, status: "completed", pipeline_name: "cognify_pipeline" };
    }

    const res = await fetch(`${BASE_URL}/cases/${datasetId}/status`);
    if (!res.ok) throw new Error("Failed to fetch status");
    return res.json();
  }

  static async getCaseGraph(datasetId: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      return MOCK_GRAPHS[datasetId] || { nodes: [], edges: [] };
    }

    const res = await fetch(`${BASE_URL}/cases/${datasetId}/graph`);
    if (!res.ok) throw new Error("Failed to fetch graph");
    return res.json();
  }

  static async getCaseChunks(datasetId: string, query = "*"): Promise<RecallResult[]> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      return MOCK_CHUNKS[datasetId] || [
        { source: "document.txt", text: "Mock snippet description text. Server offline.", score: 0.5 }
      ];
    }

    const res = await fetch(`${BASE_URL}/cases/${datasetId}/chunks?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to fetch chunks");
    return res.json();
  }

  static async getCaseProvenance(datasetId: string): Promise<any> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      const c = MOCK_CASES.find(cs => cs.id === datasetId);
      return {
        dataset_id: datasetId,
        provenance_type: "Case Lineage (Mock)",
        source_files: [{ id: datasetId, name: c?.filename || "case_file.pdf", extension: ".pdf", mimeType: "application/pdf" }],
        pipeline_status: { cognify_pipeline: c?.status || "completed" }
      };
    }

    const res = await fetch(`${BASE_URL}/cases/${datasetId}/provenance`);
    if (!res.ok) throw new Error("Failed to fetch provenance");
    return res.json();
  }

  static async getCaseCitations(datasetId: string): Promise<any[]> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      const c = MOCK_CASES.find(cs => cs.id === datasetId);
      return [{
        citation_index: 1,
        document_id: datasetId,
        document_name: c?.filename || "case_file.pdf",
        format: ".pdf",
        uploaded_at: c?.uploadedAt || new Date().toISOString(),
        reference_key: `[1] ${c?.filename || "case_file.pdf"}`
      }];
    }

    const res = await fetch(`${BASE_URL}/cases/${datasetId}/citations`);
    if (!res.ok) throw new Error("Failed to fetch citations");
    return res.json();
  }

  static async recallMemory(datasetId: string, query: string): Promise<RecallResult[]> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      // Mock Answers
      console.log(`Mocking recall query: "${query}"`);
      const results: RecallResult[] = [];
      const queryLower = query.toLowerCase();
      
      if (queryLower.includes("suspect")) {
        results.push({
          source: "graph_context",
          text: "Marcus Vance is flagged as the primary suspect with 86% probability. Physical evidence (gas canister fingerprint match) and contradiction of his alibi place him at Vance Logistics HQ at the time of ignition.",
          score: 0.95,
          citations: ["vance_arson_dossier.pdf"]
        });
      } else if (queryLower.includes("witness") || queryLower.includes("lied")) {
        results.push({
          source: "witness_testimony_check",
          text: "Marcus Vance has high contradiction count (3). He lied about his alibi (cell tower records confirm he was at the scene) and lied about purchasing gasoline (credit card logs show Shell station purchases matching the canister brand). Neighbor Sarah Jenkins had minor contradictions about the vehicle color (dark blue vs black) but her statement is mostly consistent.",
          score: 0.92,
          citations: ["vance_arson_dossier.pdf"]
        });
      } else if (queryLower.includes("conviction") || queryLower.includes("hold")) {
        results.push({
          source: "legal_reasoning_eval",
          text: "The conviction probability is 78% (Strong). Physical evidence includes an incendiary canister with the defendant's partial fingerprint and circuit component matches. Alibi is debunked by digital forensics. Direct motive includes an insurance claim filed 2 weeks prior for $1.2M.",
          score: 0.89,
          citations: ["vance_arson_dossier.pdf"]
        });
      } else {
        results.push({
          source: "general_search",
          text: `Regarding "${query}": The dossier shows general evidence tracking Vance Logistics HQ. Arson investigator Ryan confirms fire started in the loading bay. Vance denies knowledge but chemical residues were found in his personal sedan.`,
          score: 0.75,
          citations: ["vance_arson_dossier.pdf"]
        });
      }
      return results;
    }

    const res = await fetch(`${BASE_URL}/cases/${datasetId}/recall`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        query: query,
        search_type: "GRAPH_COMPLETION",
        top_k: "10",
        only_context: "false"
      })
    });
    if (!res.ok) throw new Error("Recall failed");
    return res.json();
  }

  static async improveMemory(datasetId: string): Promise<any> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      return { status: "initiated", message: "Mock improvement pipeline triggered." };
    }

    const res = await fetch(`${BASE_URL}/cases/${datasetId}/improve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ run_in_background: true })
    });
    if (!res.ok) throw new Error("Improve request failed");
    return res.json();
  }

  static async forgetMemory(datasetId: string, dataId?: string, memoryOnly = false): Promise<any> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      if (!dataId) {
        const idx = MOCK_CASES.findIndex(c => c.id === datasetId);
        if (idx !== -1) MOCK_CASES.splice(idx, 1);
      }
      return { status: "success", message: "Mock forget completed." };
    }

    const formData = new URLSearchParams();
    if (dataId) formData.append("data_id", dataId);
    formData.append("memory_only", memoryOnly ? "true" : "false");

    const res = await fetch(`${BASE_URL}/cases/${datasetId}/forget`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    });
    if (!res.ok) throw new Error("Forget request failed");
    return res.json();
  }

  static async getCaseReasoning(datasetId: string): Promise<CaseReasoning> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      return MOCK_REASONING[datasetId] || {
        contradictions: [],
        motives: [],
        witness_biases: [],
        signals: {
          contradiction_count: 0,
          corroboration_count: 0,
          bias_score: "low",
          motive_score: "low",
          consistency_score: "high",
          evidence_strength: "weak",
          justification: "Case analysis completed with no major issues found."
        },
        explanation: "No legal issues or contradictions identified in the dossier."
      };
    }

    const res = await fetch(`${BASE_URL}/cases/${datasetId}/reasoning`);
    if (!res.ok) throw new Error("Failed to fetch case reasoning");
    return res.json();
  }

  static async getCaseAnalysis(datasetId: string, bypassCache: boolean = false): Promise<CaseAnalysis> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      // Fallback combining MOCK_REASONING with calculated mock metrics
      const reasoning = MOCK_REASONING[datasetId] || {
        contradictions: [],
        motives: [],
        witness_biases: [],
        signals: {
          contradiction_count: 0,
          corroboration_count: 0,
          bias_score: "low",
          motive_score: "low",
          consistency_score: "high",
          evidence_strength: "weak",
          justification: "Case analysis completed."
        },
        explanation: "No legal issues identified."
      };
      
      const c = MOCK_CASES.find(cs => cs.id === datasetId) || MOCK_CASES[0];
      return {
        reasoning,
        metrics: {
          witness_credibilities: {},
          evidence_weights: {},
          contradiction_severity: { index: 0.1, mappings: [] },
          suspect_probabilities: {},
          conviction_probabilities: {}
        },
        ui_metrics: {
          confidenceScore: c.confidenceScore,
          suspectProbability: c.suspectProbability,
          convictionProbability: c.convictionProbability,
          witnesses: c.witnesses,
          contradictions: c.contradictions
        }
      };
    }

    const url = `${BASE_URL}/cases/${datasetId}/analysis${bypassCache ? "?bypass_cache=true" : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch case analysis");
    return res.json();
  }

  static async submitCaseFeedback(datasetId: string, feedbacks: FeedbackItem[]): Promise<CaseAnalysis> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      return this.getCaseAnalysis(datasetId);
    }

    const res = await fetch(`${BASE_URL}/cases/${datasetId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbacks })
    });
    if (!res.ok) throw new Error("Failed to submit case feedback");
    return res.json();
  }

  static async fetchBenchmarkCases(): Promise<BenchmarkCaseItem[]> {
    const isHealthy = await this.checkBackendHealth();
    if (!isHealthy) {
      return [
        { id: "CASE_001", name: "Case 001", has_benchmark: true },
        { id: "CASE_002", name: "Case 002", has_benchmark: true }
      ];
    }
    try {
      const res = await fetch(`${BASE_URL}/cases/benchmark/list`);
      if (!res.ok) throw new Error("Failed to fetch benchmark cases");
      return res.json();
    } catch (err) {
      console.error("Error fetching benchmark cases:", err);
      return [{ id: "CASE_001", name: "Case 001", has_benchmark: true }];
    }
  }

  static async runCaseBenchmark(caseId: string): Promise<BenchmarkReport> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800000); // 30 min timeout
    try {
      const res = await fetch(`${BASE_URL}/cases/${caseId}/benchmark`, {
        method: "POST",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("Failed to run case benchmark");
      return res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error("Benchmark timed out after 30 minutes. The LLM queries may be taking too long.");
      }
      throw err;
    }
  }

  static async fetchLatestBenchmark(caseId: string): Promise<BenchmarkReport | null> {
    try {
      const res = await fetch(`${BASE_URL}/cases/${caseId}/benchmark`, {
        method: "GET"
      });
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch latest benchmark");
      return res.json();
    } catch (err) {
      console.error("Error fetching latest benchmark:", err);
      return null;
    }
  }

  static async generateBriefs(caseId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/cases/${caseId}/briefs/generate`, {
      method: "POST"
    });
    if (!res.ok) throw new Error("Failed to generate legal briefs");
    return res.json();
  }

  static async fetchBriefs(caseId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/cases/${caseId}/briefs`, {
      method: "GET"
    });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) throw new Error("Failed to fetch legal briefs");
    return res.json();
  }
}

export interface BenchmarkCaseItem {
  id: string;
  name: string;
  has_benchmark: boolean;
}

export interface PredictionVsActual {
  query_id: string;
  question: string;
  category: string;
  expected: string;
  predicted: string;
}

export interface BenchmarkMetrics {
  suspect_accuracy: number;
  retrieval_recall: number;
  contradiction_f1: number;
  witness_accuracy: number;
  conviction_mae: number;
}

export interface BenchmarkReport {
  metrics: BenchmarkMetrics;
  predictions_vs_actual: PredictionVsActual[];
  failure_analysis: string;
  confidence_drift: number;
  is_newly_ingested: boolean;
  dataset_id: string;
  case_id?: string;
  run_id?: number;
}

export interface FeedbackItem {
  feedback_type: "evidence_correction" | "witness_correction" | "contradiction_override" | "theory_dismissal" | "new_evidence_addition";
  target: string;
  action: "mark_false" | "mark_reliable" | "mark_unreliable" | "dismiss" | "add" | "correct";
  reason?: string;
  value?: any;
}

export interface CaseAnalysis {
  reasoning: CaseReasoning;
  metrics: {
    witness_credibilities: Record<string, number>;
    evidence_weights: Record<string, number>;
    contradiction_severity: { index: number; mappings: any[] };
    suspect_probabilities: Record<string, number>;
    conviction_probabilities: Record<string, number>;
  };
  ui_metrics: {
    confidenceScore: number;
    suspectProbability: number;
    convictionProbability: number;
    witnesses: { name: string; credibility: number; role: string; contradictions: number }[];
    contradictions: { id: string; title: string; description: string; severity: "high" | "medium" | "low" }[];
  };
  feedbacks?: FeedbackItem[];
}

const MOCK_REASONING: Record<string, CaseReasoning> = {
  "vance-arson-001": {
    contradictions: [
      {
        contradiction: true,
        type: "timeline",
        severity: "critical",
        reason: "Marcus Vance claims he was at home sleeping, but digital lock logs and parking transponder data place him at the Zenith Wellness Center at 11:15 PM."
      }
    ],
    motives: [
      {
        party: "Marcus Vance",
        motive_type: "revenge",
        evidence: "Text messages show Marcus accusing Zenith Management of wrongful termination two days prior.",
        explanation: "Wrongful termination provides a clear motive of revenge against Zenith Wellness Center."
      }
    ],
    witness_biases: [
      {
        witness_name: "Sarah Vance",
        bias_type: "family_relation",
        credibility_implication: "Credibility is significantly reduced as she is the spouse of the primary suspect.",
        evidence: "Public registry records confirm marriage since 2021."
      }
    ],
    signals: {
      contradiction_count: 1,
      corroboration_count: 2,
      bias_score: "high",
      motive_score: "critical",
      consistency_score: "low",
      evidence_strength: "strong",
      justification: "Critical motive matching a alibi contradiction creates a highly consistent case against Marcus Vance."
    },
    explanation: "Analysis of Marcus Vance's dossier indicates a strong chain of circumstantial evidence. There is a critical motive of revenge originating from a recent termination. Additionally, Marcus's alibi is directly contradicted by automated digital access logs. The only supporting witness statement has high familial bias."
  }
};
