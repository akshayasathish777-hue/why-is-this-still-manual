import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, TrendingUp } from 'lucide-react';
import type { ViewType, SourceFilter, CuratedProblem } from '@/types/views';

interface CuriousBuilderProps {
  onViewChange: (view: ViewType) => void;
  problems: CuratedProblem[];
  isLoading: boolean;
}

const sourceFilters: { id: SourceFilter; label: string }[] = [
  { id: 'reddit', label: 'Reddit' },
  { id: 'app-reviews', label: 'App Reviews' },
  { id: 'curated', label: 'Curated Problems' },
];

const CuriousBuilder = ({ onViewChange, problems, isLoading }: CuriousBuilderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSource, setActiveSource] = useState<SourceFilter>('curated');

  const filteredProblems = problems.filter(problem =>
    problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="max-w-3xl mx-auto w-full mb-8 space-y-4 relative z-10"
      >
        {/* Search Bar */}
        <div className="glass-card p-2 flex items-center gap-3">
          <Search className="w-5 h-5 text-flame-orange ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter topic, app name, or pain area..."
            className="fire-input flex-1 px-2"
          />
        </div>

        {/* Source Toggle Pills */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {sourceFilters.map((source) => (
            <button
              key={source.id}
              onClick={() => setActiveSource(source.id)}
              className={`pill-toggle ${activeSource === source.id ? 'pill-toggle-active' : ''}`}
            >
              {source.label}
            </button>
          ))}
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
                className="glass-card card-interactive p-6 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white group-hover:text-flame-yellow group-hover:text-glow-fire transition-all duration-300 pr-4">
                    {problem.title}
                  </h3>
                  <div className="flex items-center gap-1 text-flame-orange shrink-0">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">{problem.upvotes}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-flame-orange/10 text-flame-orange text-sm border border-flame-orange/20">
                    {problem.domain}
                  </span>
                  <span className="text-white/50 text-sm">
                    {problem.role}
                  </span>
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
              {searchQuery ? 'No problems found matching your search' : 'No problems available yet'}
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
