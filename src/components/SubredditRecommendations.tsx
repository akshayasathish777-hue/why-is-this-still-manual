import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import type { CuratedProblem } from '@/types/views';

interface SubredditRecommendationsProps {
  problems: CuratedProblem[];
}

function extractSubreddits(problems: CuratedProblem[]): { name: string; count: number }[] {
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

const SubredditRecommendations = ({ problems }: SubredditRecommendationsProps) => {
  const subreddits = extractSubreddits(problems);

  if (subreddits.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <h3 className="text-flame-yellow font-semibold text-lg mb-4 flex items-center gap-2">
        📍 Top Subreddits Discussing This
      </h3>
      
      <div className="flex flex-wrap gap-3">
        {subreddits.map((sub) => (
          <motion.a
            key={sub.name}
            href={`https://reddit.com/r/${sub.name}`}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, y: -2 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
            style={{
              background: 'rgba(255, 186, 8, 0.1)',
              border: '1px solid rgba(255, 186, 8, 0.3)',
            }}
          >
            <span className="text-flame-yellow font-medium">r/{sub.name}</span>
            <span className="text-white/40 text-sm">({sub.count})</span>
            <ExternalLink className="w-3 h-3 text-flame-yellow/50" />
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
};

export default SubredditRecommendations;
