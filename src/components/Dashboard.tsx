import { motion } from 'framer-motion';
import { ArrowLeft, Eye, AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import type { ViewType } from '@/types/views';

interface DashboardProps {
  onViewChange: (view: ViewType) => void;
}

const panels = [
  {
    id: 'overview',
    title: 'Overview',
    icon: Eye,
    borderClass: 'bento-card-overview',
    description: 'Your task analysis summary and key insights at a glance.',
    content: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white/60">Time spent weekly</span>
          <span className="text-white font-semibold">~8 hours</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60">Automation potential</span>
          <span className="text-flame-yellow font-semibold text-glow-fire">High</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60">Complexity</span>
          <span className="text-flame-orange font-semibold">Medium</span>
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
        <li className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-flame-red mt-2 shrink-0 shadow-[0_0_8px_rgba(208,0,0,0.6)]" />
          <span className="text-white/80">Data scattered across multiple systems</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-flame-red mt-2 shrink-0 shadow-[0_0_8px_rgba(208,0,0,0.6)]" />
          <span className="text-white/80">No standardized input format</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-flame-red mt-2 shrink-0 shadow-[0_0_8px_rgba(208,0,0,0.6)]" />
          <span className="text-white/80">Legacy tools lack API integrations</span>
        </li>
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
        <li className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-flame-orange mt-2 shrink-0 shadow-[0_0_8px_rgba(232,93,4,0.6)]" />
          <span className="text-white/80">Auto-extract data from emails using NLP</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-flame-orange mt-2 shrink-0 shadow-[0_0_8px_rgba(232,93,4,0.6)]" />
          <span className="text-white/80">Smart categorization and formatting</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-flame-orange mt-2 shrink-0 shadow-[0_0_8px_rgba(232,93,4,0.6)]" />
          <span className="text-white/80">Automated report generation</span>
        </li>
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
        <div className="flex items-center gap-3 p-3 rounded-lg bg-flame-yellow/5 border border-flame-yellow/30 shadow-[0_0_15px_rgba(255,186,8,0.1)]">
          <span className="w-6 h-6 rounded-full bg-flame-yellow/20 flex items-center justify-center text-flame-yellow text-sm font-bold shadow-[0_0_10px_rgba(255,186,8,0.3)]">1</span>
          <span className="text-white/80">Set up email parsing integration</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-flame-yellow/5 border border-flame-yellow/30 shadow-[0_0_15px_rgba(255,186,8,0.1)]">
          <span className="w-6 h-6 rounded-full bg-flame-yellow/20 flex items-center justify-center text-flame-yellow text-sm font-bold shadow-[0_0_10px_rgba(255,186,8,0.3)]">2</span>
          <span className="text-white/80">Configure data templates</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-flame-yellow/5 border border-flame-yellow/30 shadow-[0_0_15px_rgba(255,186,8,0.1)]">
          <span className="w-6 h-6 rounded-full bg-flame-yellow/20 flex items-center justify-center text-flame-yellow text-sm font-bold shadow-[0_0_10px_rgba(255,186,8,0.3)]">3</span>
          <span className="text-white/80">Deploy automation workflow</span>
        </div>
      </div>
    ),
  },
];

const Dashboard = ({ onViewChange }: DashboardProps) => {
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
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 relative z-10">
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
