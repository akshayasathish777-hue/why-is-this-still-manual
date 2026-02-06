import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Loader2, RefreshCw, Trash2, Bell, BellOff, Calendar, Bookmark } from 'lucide-react';
import { savedSearchesApi, type SavedSearch } from '@/lib/api/savedSearches';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SourceType } from '@/types/views';
import Logo from './Logo';

interface SavedSearchesProps {
  onBack: () => void;
  onRunSearch: (query: string, sources: SourceType[], searchType: 'solver' | 'builder') => void;
}

const SavedSearches = ({ onBack, onRunSearch }: SavedSearchesProps) => {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSearches = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await savedSearchesApi.getAll(user.id);
        setSearches(data);
      }
    } catch (error) {
      console.error('Failed to fetch saved searches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const handleDelete = async (searchId: string) => {
    setDeletingId(searchId);
    try {
      await savedSearchesApi.delete(searchId);
      setSearches((prev) => prev.filter((s) => s.id !== searchId));
      toast({
        title: 'Search deleted',
        description: 'Your saved search has been removed.',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Could not delete the search.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAlert = async (search: SavedSearch) => {
    try {
      const newEnabled = !search.alert_enabled;
      await savedSearchesApi.update(search.id, { alert_enabled: newEnabled });
      setSearches((prev) =>
        prev.map((s) => (s.id === search.id ? { ...s, alert_enabled: newEnabled } : s))
      );
      toast({
        title: newEnabled ? 'Alerts enabled' : 'Alerts disabled',
        description: newEnabled
          ? `You'll receive ${search.alert_frequency} updates for this search.`
          : 'You will no longer receive alerts for this search.',
      });
    } catch (error) {
      console.error('Toggle alert error:', error);
    }
  };

  const handleRerun = async (search: SavedSearch) => {
    await savedSearchesApi.updateLastRun(search.id);
    onRunSearch(search.query, search.sources, search.search_type);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 relative">
      <div className="mesh-gradient-bg" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8 relative z-10"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 relative z-10"
      >
        <div className="flex justify-center mb-4">
          <Logo size="md" />
        </div>
        <h1 className="headline-fire text-3xl md:text-4xl mb-2">My Saved Searches</h1>
        <p className="text-white/60">Re-run, edit, or manage alerts for your bookmarked searches</p>
      </motion.div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-flame-yellow animate-spin" />
          </div>
        ) : searches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Bookmark className="w-16 h-16 text-flame-yellow/30 mx-auto mb-4" />
            <h3 className="text-white/80 text-xl mb-2">No saved searches yet</h3>
            <p className="text-white/50 mb-6">Run a search and click 'Save' to bookmark it for later</p>
            <button
              onClick={onBack}
              className="btn-fire-gradient px-6 py-3 rounded-lg font-medium"
            >
              Start Searching
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {searches.map((search, index) => (
                <motion.div
                  key={search.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Search className="w-4 h-4 text-flame-yellow" />
                        <span className="text-white font-medium">"{search.query}"</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            search.search_type === 'solver'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {search.search_type === 'solver' ? 'Solver' : 'Builder'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created {formatDate(search.created_at)}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{search.sources.join(', ')}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {search.alert_enabled ? (
                            <>
                              <Bell className="w-3 h-3 text-flame-yellow" />
                              {search.alert_frequency} alerts
                            </>
                          ) : (
                            <>
                              <BellOff className="w-3 h-3" />
                              Alerts OFF
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRerun(search)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-flame-yellow/10 text-flame-yellow hover:bg-flame-yellow/20 transition-colors text-sm font-medium"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Re-run
                      </button>

                      <button
                        onClick={() => handleToggleAlert(search)}
                        className={`p-2 rounded-lg transition-colors ${
                          search.alert_enabled
                            ? 'bg-flame-yellow/20 text-flame-yellow'
                            : 'bg-white/5 text-white/50 hover:text-white'
                        }`}
                        title={search.alert_enabled ? 'Disable alerts' : 'Enable alerts'}
                      >
                        {search.alert_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDelete(search.id)}
                        disabled={deletingId === search.id}
                        className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      >
                        {deletingId === search.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedSearches;
