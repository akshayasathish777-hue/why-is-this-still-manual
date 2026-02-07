import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, AlertTriangle, Zap, ArrowRight, ChevronDown, ChevronUp, CheckCircle2, ExternalLink } from 'lucide-react';
import type { ViewType } from '@/types/views';
import type { AnalyzedProblem } from '@/lib/api/analyze';

interface DashboardProps {
  onViewChange: (view: ViewType) => void;
  analysisResult: AnalyzedProblem | null;
  sources?: Array<{ url: string; title: string; source?: string }>;
}

const Dashboard = ({ onViewChange, analysisResult, sources = [] }: DashboardProps) => {
  const [showFullPlan, setShowFullPlan] = useState(false);

  // Parse text into bullet points
  const parseBulletPoints = (text: string | null): string[] => {
    if (!text) return [];
    
    // Split by common patterns and clean up
    const bullets = text
      // Split by ** headings or bullet markers
      .split(/\*\*[^*]+\*\*:?|\n•|\n-|\n(?=\d+\.)|(?<=\.)\s*(?=[A-Z])/)
      .map(item => item.trim())
      // Remove empty items and ** markers
      .filter(item => item.length > 0)
      .map(item => item.replace(/^\*\*|\*\*$/g, '').trim())
      .filter(item => item.length > 20); // Only keep substantial items
    
    return bullets;
  };

  // Parse Next Steps - try structured parsing first, then fall back to bullets
  const parseNextSteps = (action: string | null): { structured: boolean; steps: Array<{ header?: string; content: string }> } => {
    if (!action) return { structured: false, steps: [] };
    
    // Try structured Day/Week parsing first
    const dayPattern = /\*\*(Day \d+[^:]*|Week \d+[^:]*|This Week|Next Week)\*\*:?/gi;
    const headers = action.match(dayPattern) || [];
    
    if (headers.length >= 2) {
      // Structured format detected
      const parts = action.split(dayPattern);
      const steps = headers.map((header, i) => ({
        header: header.replace(/\*\*/g, '').replace(/:$/, '').trim(),
        content: parts[i + headers.length]?.trim() || parts[i + 1]?.trim() || ''
      })).filter(step => step.content.length > 0);
      
      if (steps.length >= 2) {
        return { structured: true, steps };
      }
    }
    
    // Fall back to bullet point parsing
    const bullets = parseBulletPoints(action);
    return { 
      structured: false, 
      steps: bullets.map(content => ({ content }))
    };
  };

  const gapBullets = parseBulletPoints(analysisResult?.gap);
  const automationBullets = parseBulletPoints(analysisResult?.automation);
  const nextStepsData = parseNextSteps(analysisResult?.action);
  
  // For structured steps, show 2 preview + rest expandable
  // For bullets, show 3 preview + rest expandable
  const previewCount = nextStepsData.structured ? 2 : 3;
  const previewSteps = nextStepsData.steps.slice(0, previewCount);
  const remainingSteps = nextStepsData.steps.slice(previewCount);

  // Format source name for display
  const formatSourceName = (source?: string): string => {
    if (!source) return 'Reddit';
    if (source === 'twitter') return 'Twitter/X';
    return source.charAt(0).toUpperCase() + source.slice(1);
  };

  // Count unique sources
  const uniqueSources = [...new Set(sources.map(s => s.source || 'reddit'))];
  const sourceCountText = sources.length > 0 
    ? `${sources.length} real discussion${sources.length > 1 ? 's' : ''} from ${uniqueSources.map(formatSourceName).join(', ')}`
    : 'real discussions';

  const panels = [
    {
      id: 'overview',
      title: 'Overview',
      icon: Eye,
      borderClass: 'bento-card-overview',
      description: 'What you're dealing with',
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
      description: 'The real barriers keeping this manual',
      content: (
        <ul className="space-y-3">
          {gapBullets.length > 0 ? gapBullets.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-flame-red mt-2 shrink-0 shadow-[0_0_8px_rgba(208,0,0,0.6)]" />
              <span className="text-white/80 leading-relaxed">{item}</span>
            </li>
          )) : (
            <li className="text-white/60">No barriers identified</li>
          )}
        </ul>
      ),
    },
    {
      id: 'opportunity',
      title: 'AI Opportunity',
      icon: Zap,
      borderClass: 'bento-card-opportunity',
      description: 'Specific automation paths',
      content: (
        <ul className="space-y-3">
          {automationBullets.length > 0 ? automationBullets.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-flame-orange mt-2 shrink-0 shadow-[0_0_8px_rgba(232,93,4,0.6)]" />
              <span className="text-white/80 leading-relaxed">{item}</span>
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
      description: 'Your action plan',
      content: (
        <div className="space-y-4">
          {nextStepsData.steps.length > 0 ? (
            <>
              {/* Show Preview Steps */}
              {nextStepsData.structured ? (
                // Structured format with headers
                previewSteps.map((step, i) => (
                  <div key={i} className="p-4 rounded-lg bg-flame-yellow/5 border border-flame-yellow/30">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="w-6 h-6 rounded-full bg-flame-yellow/20 flex items-center justify-center text-flame-yellow text-sm font-bold shrink-0">
                        {i + 1}
                      </span>
                      <h4 className="font-semibold text-flame-yellow">{step.header}</h4>
                    </div>
                    <p className="text-white/80 text-sm ml-9 leading-relaxed">
                      {step.content}
                    </p>
                  </div>
                ))
              ) : (
                // Bullet format
                <ul className="space-y-3">
                  {previewSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-flame-yellow/20 flex items-center justify-center text-flame-yellow text-sm font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-white/80 leading-relaxed">{step.content}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Expandable Section */}
              {remainingSteps.length > 0 && (
                <>
                  <AnimatePresence>
                    {showFullPlan && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 overflow-hidden"
                      >
                        {nextStepsData.structured ? (
                          // Structured format
                          remainingSteps.map((step, i) => (
                            <div key={i + previewCount} className="p-4 rounded-lg bg-flame-yellow/5 border border-flame-yellow/30">
                              <div className="flex items-start gap-3 mb-2">
                                <span className="w-6 h-6 rounded-full bg-flame-yellow/20 flex items-center justify-center text-flame-yellow text-sm font-bold shrink-0">
                                  {i + previewCount + 1}
                                </span>
                                <h4 className="font-semibold text-flame-yellow">{step.header}</h4>
                              </div>
                              <p className="text-white/80 text-sm ml-9 leading-relaxed">
                                {step.content}
                              </p>
                            </div>
                          ))
                        ) : (
                          // Bullet format
                          <ul className="space-y-3">
                            {remainingSteps.map((step, i) => (
                              <li key={i + previewCount} className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-flame-yellow/20 flex items-center justify-center text-flame-yellow text-sm font-bold shrink-0">
                                  {i + previewCount + 1}
                                </span>
                                <span className="text-white/80 leading-relaxed">{step.content}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Toggle Button */}
                  <button
                    onClick={() => setShowFullPlan(!showFullPlan)}
                    className="w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-flame-yellow hover:bg-flame-yellow/10 border border-flame-yellow/30 hover:border-flame-yellow/50"
                  >
                    {showFullPlan ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>Show {remainingSteps.length} More Step{remainingSteps.length > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="text-white/60 text-center py-4">
              No action steps available
            </div>
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
          Here's your automation roadmap with specific tools and action steps
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

      {/* Trust Signal - Source Links */}
      {sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="max-w-6xl mx-auto w-full mt-8 relative z-10"
        >
          <div className="glass-card p-4 flex items-start gap-3 flex-wrap">
            <CheckCircle2 className="w-5 h-5 text-flame-yellow shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-white/70 text-sm block mb-2">
                ✓ Insights grounded in {sourceCountText}
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                {sources.slice(0, 5).map((source, i) => (
                  
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-flame-orange hover:text-flame-yellow text-sm flex items-center gap-1.5 transition-colors group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    <span>{formatSourceName(source.source)} Discussion {i + 1}</span>
                  </a>
                ))}
              </div>
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