import { useState, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Sparkles, ExternalLink, Download } from 'lucide-react';
import type { ViewType, SourceFilter, SourceType, CuratedProblem } from '@/types/views';
import { exportProblemsAsJSON, exportProblemsAsCSV } from '@/lib/api/analyze';

interface CuriousBuilderProps {
  onViewChange: (view: ViewType) => void;
  problems: CuratedProblem[];
  isLoading: boolean;
  onDiscoverProblems: (query: string, sources: SourceType[]) => Promise<void>;
  onSelectProblem: (problem: CuratedProblem) => void;
}

const sourceOptions: { id: SourceType; label: string }[] = [
  { id: 'reddit', label: 'Reddit' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'quora', label: 'Quora' },
];

const filterOptions: { id: SourceFilter; label: string }[] = [
  { id: 'all', label: 'All Sources' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'quora', label: 'Quora' },
];

const CuriousBuilder = ({ onViewChange, problems, isLoading, onDiscoverProblems, onSelectProblem }: CuriousBuilderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSource, setActiveSource] = useState<SourceFilter>('all');
  const [selectedSearchSources, setSelectedSearchSources] = useState<SourceType[]>(['reddit']);

  const toggleSearchSource = (source: SourceType) => {
    setSelectedSearchSources((prev) => {
      if (prev.length === 1 && prev.includes(source)) {
        return prev;
      }
      if (prev.includes(source)) {
        return prev.filter((s) => s !== source);
      }
      return [...prev, source];
    });
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = activeSource === 'all' || problem.source_type === activeSource;
    return matchesSearch && matchesSource;
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onDiscoverProblems(searchQuery.trim(), selectedSearchSources);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 md:py-12 relative">
      {/* Animated Mesh Gradient Background */}
      <div className="mesh-gradient-bg" />

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => onViewChange('landing')}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 w-fit group relative z-10"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 max-w-3xl mx-auto relative z-10"
      >
        <h1 className="headline-fire text-3xl md:text-5xl mb-4">
          Explore Real-World Problems
        </h1>
        <p className="text-white/70 text-lg">
          Discover pain points from the community and find your next build opportunity
        </p>
      </motion.div>

      {/* Search & Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="max-w-3xl mx-auto w-full mb-8 space-y-4 relative z-10"
      >
        {/* Search Bar */}
        <div className="glass-card p-2 flex items-center gap-2">
          <Search className="w-5 h-5 text-flame-orange ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter topic to discover problems..."
            className="fire-input flex-1 px-2"
            disabled={isLoading}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="fire-button px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Discover</span>
          </button>
        </div>

        {/* Source Selection for Search */}
        <div className="glass-card p-4">
          <label className="text-flame-yellow text-sm font-medium mb-3 block">
            Search in (select at least one):
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {sourceOptions.map((source) => {
              const isActive = selectedSearchSources.includes(source.id);
              return (
                <button
                  key={source.id}
                  onClick={() => toggleSearchSource(source.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-flame-orange to-flame-yellow text-white'
                      : 'bg-flame-yellow/10 text-flame-yellow border border-flame-yellow/30 hover:bg-flame-yellow/20'
                  }`}
                >
                  {source.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Pills + Export Buttons */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 flex-wrap justify-center w-full">
            <div className="flex items-center gap-3 flex-wrap justify-center flex-1">
              {filterOptions.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveSource(filter.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeSource === filter.id
                      ? 'bg-gradient-to-r from-flame-orange to-flame-yellow text-white'
                      : 'bg-flame-yellow/10 text-flame-yellow border border-flame-yellow/30 hover:bg-flame-yellow/20'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* Export Buttons */}
            {filteredProblems.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportProblemsAsJSON(filteredProblems)}
                  className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 bg-flame-yellow/10 text-flame-yellow border border-flame-yellow/30 hover:bg-flame-yellow/20 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">JSON</span>
                </button>
                <button
                  onClick={() => exportProblemsAsCSV(filteredProblems)}
                  className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 bg-flame-yellow/10 text-flame-yellow border border-flame-yellow/30 hover:bg-flame-yellow/20 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            )}
          </div>
          <p className="text-white/40 text-xs">
            Currently searching: <span className="text-flame-orange">{selectedSearchSources.map(s => s === 'twitter' ? 'Twitter/X' : s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}</span>
          </p>
        </div>
      </motion.div>

      {/* Problems Grid */}
      <div className="max-w-5xl mx-auto w-full flex-1 relative z-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-3/4 mb-4" />
                <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
                <div className="h-4 bg-white/10 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredProblems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProblems.map((problem, index) => (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.01,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectProblem(problem)}
                className="glass-card card-interactive p-6 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-white group-hover:text-flame-yellow group-hover:text-glow-fire transition-all duration-300 pr-4 line-clamp-2">
                    {problem.title}
                  </h3>
                  {problem.source_url && (
                    <a 
                      href={problem.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-white/40 hover:text-flame-orange transition-colors shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                
                {problem.overview && (
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {problem.overview}
                  </p>
                )}
                
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-flame-orange/10 text-flame-orange text-sm border border-flame-orange/20">
                    {problem.domain}
                  </span>
                  {problem.role && (
                    <span className="text-white/50 text-sm">
                      {problem.role}
                    </span>
                  )}
                  {problem.source_type && (
                    <span className="text-white/30 text-xs capitalize">
                      via {problem.source_type === 'twitter' ? 'Twitter/X' : problem.source_type}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-white/50 text-lg">
              {searchQuery ? 'No problems found matching your search' : 'No problems available yet. Enter a topic and click Discover!'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.06, 0.03]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-flame-yellow rounded-full blur-[200px]" 
        />
      </div>
    </div>
  );
};

export default CuriousBuilder;
