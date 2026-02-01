export type ViewType = 'landing' | 'solver' | 'builder' | 'dashboard';

export interface CuratedProblem {
  id: string;
  title: string;
  domain: string;
  role: string;
  upvotes: number;
  description?: string;
  created_at?: string;
}

export type SourceFilter = 'reddit' | 'app-reviews' | 'curated';
