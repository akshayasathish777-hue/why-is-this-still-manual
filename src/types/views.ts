// Source types for multi-platform search
export type SourceType = 'reddit' | 'twitter' | 'quora';
export type SourceFilter = SourceType | 'all';

export type ViewType = 'landing' | 'solver' | 'builder' | 'dashboard';

// Sentiment analysis scores
export interface SentimentScores {
  frustration_level: number;
  urgency_score: number;
  willingness_to_pay: number;
}

// Base problem data structure
export interface ProblemData {
  id: string;
  title: string;
  domain: string;
  role: string | null;
  overview: string | null;
  gap: string | null;
  automation: string | null;
  action: string | null;
  source_type: SourceType | null;
  source_url: string | null;
  search_query?: string | null;
  created_at?: string;
  mode?: 'solver' | 'builder';
  upvotes?: number;
  is_saved?: boolean;
  saved_at?: string;
  sentiment?: SentimentScores | null;
}

// Firecrawl search result
export interface FirecrawlSearchResult {
  title: string;
  url: string;
  snippet: string;
  upvotes?: number;
  source: SourceType;
}

// Gemini AI response structure
export interface GeminiResponse {
  title: string;
  domain: string;
  role: string;
  overview: string;
  gap: string;
  automation: string;
  action: string;
  source_url?: string;
  sentiment?: SentimentScores;
}

// Saved problem extends base with user data
export interface SavedProblem extends ProblemData {
  user_id: string;
  saved_at: string;
}

// Type aliases for backward compatibility
export type CuratedProblem = ProblemData;

// AnalyzedProblem is what comes back from the API (has all fields)
export type AnalyzedProblem = ProblemData;
