import { supabase } from "@/integrations/supabase/client";
import type { SourceType, SourceFilter, AnalyzedProblem, CuratedProblem, SentimentScores } from "@/types/views";

export type { AnalyzedProblem };

export interface AnalysisSource {
  url: string;
  title: string;
  source?: SourceType;
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalyzedProblem[];
  sources?: AnalysisSource[];
  error?: string;
}

export const analyzeApi = {
  /**
   * Analyze a manual workflow problem using Firecrawl + Gemini
   * @param query - The topic/problem to analyze
   * @param mode - 'solver' for single deep analysis, 'builder' for multiple problem discovery
   * @param sources - Array of sources to search (reddit, twitter, quora)
   */
  async analyzeProblem(
    query: string,
    mode: "solver" | "builder" = "solver",
    sources: SourceType[] = ["reddit"]
  ): Promise<AnalysisResponse> {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-problem", {
        body: { query, mode, sources },
      });

      if (error) {
        console.error("Edge function error:", error);
        return { success: false, error: error.message };
      }

      return data as AnalysisResponse;
    } catch (err) {
      console.error("Analysis API error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to analyze problem",
      };
    }
  },

  /**
   * Fetch all previously analyzed problems from the database
   * @param sourceFilter - Optional filter by source type
   */
  async fetchProblems(sourceFilter?: SourceFilter): Promise<CuratedProblem[]> {
    let query = supabase
      .from("curated_problems")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (sourceFilter && sourceFilter !== "all") {
      query = query.eq("source_type", sourceFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch problems:", error);
      return [];
    }

    // Transform database response to match our types
    return (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      sentiment: item.sentiment as SentimentScores | null,
    })) as CuratedProblem[];
  },
};

/**
 * Export problems as JSON file
 */
export function exportProblemsAsJSON(problems: CuratedProblem[]): void {
  const jsonContent = JSON.stringify(problems, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split("T")[0];
  const filename = `problems-export-${date}.json`;
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export problems as CSV file (includes sentiment data)
 */
export function exportProblemsAsCSV(problems: CuratedProblem[]): void {
  const headers = ["Title", "Domain", "Role", "Overview", "Gap", "Automation", "Action", "Source", "URL", "Frustration", "Urgency", "WTP", "Created"];
  
  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };
  
  const rows = problems.map((p) => [
    escapeCSV(p.title),
    escapeCSV(p.domain),
    escapeCSV(p.role),
    escapeCSV(p.overview),
    escapeCSV(p.gap),
    escapeCSV(p.automation),
    escapeCSV(p.action),
    escapeCSV(p.source_type),
    escapeCSV(p.source_url),
    escapeCSV(p.sentiment?.frustration_level ?? 'N/A'),
    escapeCSV(p.sentiment?.urgency_score ?? 'N/A'),
    escapeCSV(p.sentiment?.willingness_to_pay ?? 'N/A'),
    escapeCSV(p.created_at),
  ].join(","));
  
  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split("T")[0];
  const filename = `problems-export-${date}.csv`;
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
