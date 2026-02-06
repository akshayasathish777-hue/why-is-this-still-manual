import { supabase } from "@/integrations/supabase/client";
import type { SourceType, CuratedProblem } from "@/types/views";

export interface SavedSearch {
  id: string;
  user_id: string;
  search_type: 'solver' | 'builder';
  query: string;
  sources: SourceType[];
  created_at: string;
  last_run_at: string | null;
  alert_enabled: boolean;
  alert_frequency: 'daily' | 'weekly' | 'never';
}

export const savedSearchesApi = {
  async save(
    userId: string,
    searchType: 'solver' | 'builder',
    query: string,
    sources: SourceType[],
    alertEnabled: boolean = false,
    alertFrequency: 'daily' | 'weekly' | 'never' = 'never'
  ): Promise<SavedSearch> {
    const { data, error } = await supabase
      .from('saved_searches')
      .insert([{
        user_id: userId,
        search_type: searchType,
        query,
        sources,
        alert_enabled: alertEnabled,
        alert_frequency: alertFrequency,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as SavedSearch;
  },

  async getAll(userId: string): Promise<SavedSearch[]> {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SavedSearch[];
  },

  async delete(searchId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', searchId);

    if (error) throw error;
  },

  async update(
    searchId: string,
    updates: Partial<Pick<SavedSearch, 'alert_enabled' | 'alert_frequency' | 'query' | 'sources'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .update(updates)
      .eq('id', searchId);

    if (error) throw error;
  },

  async updateLastRun(searchId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', searchId);

    if (error) throw error;
  },
};

// Extract subreddits from problem source URLs
export function extractSubreddits(problems: CuratedProblem[]): { name: string; count: number }[] {
  const subredditMap = new Map<string, number>();

  problems.forEach((problem) => {
    if (problem.source_type === 'reddit' && problem.source_url) {
      const match = problem.source_url.match(/reddit\.com\/r\/([^\/]+)/);
      if (match) {
        const subreddit = match[1];
        subredditMap.set(subreddit, (subredditMap.get(subreddit) || 0) + 1);
      }
    }
  });

  return Array.from(subredditMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
