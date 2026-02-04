export type ViewType = 'landing' | 'solver' | 'builder' | 'dashboard';

export interface CuratedProblem {
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
  created_at?: string;
}

export type SourceFilter = 'all' | 'reddit' | 'app-reviews';
