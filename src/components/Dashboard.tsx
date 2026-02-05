import { motion } from 'framer-motion';
import { ArrowLeft, Eye, AlertTriangle, Zap, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';
import type { ViewType } from '@/types/views';
import type { AnalyzedProblem, AnalysisSource } from '@/lib/api/analyze';

interface DashboardProps {
  onViewChange: (view: ViewType) => void;
  analysisResult: AnalyzedProblem | null;
  sources?: AnalysisSource[];
}

const parseListContent = (text: string | null) => {
  if (!text) return [];
  // Split by newlines or bullet points and filter empty lines
  return text
    .split(/[\n•\-]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
};

const parseSteps = (text: string | null) => {
  if (!text) return [];
  // Try to parse numbered steps or split by newlines
  const steps = text
    .split(/(?:\d+\.\s*|\n)/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
  return steps.slice(0, 3); // Limit to 3 steps
};

const formatSourceName = (source?: string): string => {
  if (!source) return 'Reddit';
  if (source === 'twitter') return 'Twitter/X';
  return source.charAt(0).toUpperCase() + source.slice(1);
};

const Dashboard = ({ onViewChange, analysisResult, sources = [] }: DashboardProps) => {
  const gapItems = parseListContent(analysisResult?.gap);
  const automationItems = parseListContent(analysisResult?.automation);
  const actionSteps = parseSteps(analysisResult?.action);

  // Count unique sources
  const uniqueSources = [...new Set(sources.map(s => s.source || 'reddit'))];
  const sourceCountText = sources.length > 0 
    ? `${sources.length} real discussion${sources.length > 1 ? 's' : ''} from ${uniqueSources.map(formatSourceName).join(', ')}`
    : '1 real Reddit discussion';

  const panels = [
    {
      id: 'overview',
      title: 'Overview',
      icon: Eye,
      borderClass: 'bento-card-overview',
      description: analysisResult?.title || 'Your task analysis summary',
      content: (
        <div className="space-y-4">
          <p className="text-white/80 leading-relaxed">
            {analysisResult?.overview || 'No overview available'}
          </p>
          <div className="flex items-center gap-2 pt-2">
            <span className="px-3 py-1 rounded-full bg-flame-orange/20 text-flame-orange text-sm font-medium">
              {analysisResult?.domain || 'General'}
            </span>
            {analysisResult?.role && (
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-sm">
                {analysisResult.role}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'why-manual',
      title: 'Why Still Manual?',
      icon: AlertTriangle,
      borderClass: 'bento-card-why',
      description: 'Root causes keeping this process manual.',
      content: (
        <ul className="space-y-3">
          {gapItems.length > 0 ? gapItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-flame-red mt-2 shrink-0 shadow-[0_0_8px_rgba(208,0,0,0.6)]" />
              <span className="text-white/80">{item}</span>
            </li>
          )) : (
            <li className="text-white/60">No gaps identified</li>
          )}
        </ul>
      ),
    },
    {
      id: 'opportunity',
      title: 'AI Opportunity',
      icon: Zap,
      borderClass: 'bento-card-opportunity',
      description: 'Where AI can transform this workflow.',
      content: (
        <ul className="space-y-3">
          {automationItems.length > 0 ? automationItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-flame-orange mt-2 shrink-0 shadow-[0_0_8px_rgba(232,93,4,0.6)]" />
              <span className="text-white/80">{item}</span>
            </li>
          )) : (
            <li className="text-white/60">No automation opportunities identified</li>
          )}
        </ul>
      ),
    },
    {
      id: 'next-steps',
      title: 'Next Steps',
      icon: ArrowRight,
      borderClass: 'bento-card-next',
      description: 'Actionable steps to automate this process.',
      content: (
        <div className="space-y-4">
          {actionSteps.length > 0 ? actionSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-flame-yellow/5 border border-flame-yellow/30 shadow-[0_0_15px_rgba(255,186,8,0.1)]">
              <span className="w-6 h-6 rounded-full bg-flame-yellow/20 flex items-center justify-center text-flame-yellow text-sm font-bold shadow-[0_0_10px_rgba(255,186,8,0.3)]">{i + 1}</span>
              <span className="text-white/80">{step}</span>
            </div>
          )) : (
            <p className="text-white/60">No action steps available</p>
          )}
        </div>
      ),
    },
  ];

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
        <span>Start Over</span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 relative z-10"
      >
        <h1 className="headline-fire text-3xl md:text-5xl mb-4">
          Analysis Complete
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Here's what we discovered about your manual process and how to automate it
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {panels.map((panel, index) => (
          <motion.div
            key={panel.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
            whileHover={{ 
              y: -4,
              scale: 1.01,
            }}
            className={`${panel.borderClass} card-interactive`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <panel.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{panel.title}</h2>
                <p className="text-white/50 text-sm">{panel.description}</p>
              </div>
            </div>
            
            <div className="mt-6">
              {panel.content}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust Signal */}
      {(sources.length > 0 || analysisResult?.source_url) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="max-w-6xl mx-auto w-full mt-8 relative z-10"
        >
          <div className="glass-card p-4 flex items-center gap-3 flex-wrap">
            <CheckCircle2 className="w-5 h-5 text-flame-yellow shrink-0" />
            <span className="text-white/70 text-sm">
              ✓ Insights grounded in {sourceCountText}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {sources.length > 0 ? (
                sources.slice(0, 5).map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-flame-orange hover:text-flame-yellow text-sm flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {formatSourceName(source.source)} {i + 1}
                  </a>
                ))
              ) : analysisResult?.source_url ? (
                <a
                  href={analysisResult.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-flame-orange hover:text-flame-yellow text-sm flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View source
                </a>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.04, 0.07, 0.04]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-flame-orange rounded-full blur-[200px]" 
        />
      </div>
    </div>
  );
};

export default Dashboard;
