import { supabase } from "@/integrations/supabase/client";

export interface AnalyzedProblem {
  id: string;
  title: string;
  domain: string;
  role: string | null;
  overview: string | null;
  gap: string | null;
  automation: string | null;
  action: string | null;
  source_type: string | null;
  source_url: string | null;
  search_query: string | null;
  created_at: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalyzedProblem[];
  sources?: { url: string; title: string }[];
  error?: string;
}

export const analyzeApi = {
  /**
   * Analyze a manual workflow problem using Firecrawl + Gemini
   * @param query - The topic/problem to analyze (e.g., "expense report processing")
   * @param mode - 'solver' for single deep analysis, 'builder' for multiple problem discovery
   */
  async analyzeProblem(
    query: string,
    mode: "solver" | "builder" = "solver"
  ): Promise<AnalysisResponse> {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-problem", {
        body: { query, mode },
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
   */
  async fetchProblems(): Promise<AnalyzedProblem[]> {
    const { data, error } = await supabase
      .from("curated_problems")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch problems:", error);
      return [];
    }

    return (data as AnalyzedProblem[]) || [];
  },
};
