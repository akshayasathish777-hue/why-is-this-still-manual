import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, ShoppingBag, Lightbulb, ExternalLink, Play, FileText, Package, ChevronDown, ChevronUp } from 'lucide-react';
import type { ActionPlan } from '@/lib/api/analyze';

interface ActionButtonsProps {
  action: ActionPlan;
  onBuildClick: (query: string) => void;
}

const ActionButtons = ({ action, onBuildClick }: ActionButtonsProps) => {
  const [expandedSection, setExpandedSection] = useState<'diy' | 'existing' | null>(null);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'tutorial': return Play;
      case 'tool': return Package;
      case 'template': return FileText;
      default: return ExternalLink;
    }
  };

  return (
    <div className="space-y-4">
      {/* DIY Path */}
      <div className="glass-card p-4 border border-flame-orange/30">
        <button
          onClick={() => setExpandedSection(expandedSection === 'diy' ? null : 'diy')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-flame-orange/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-flame-orange" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Build It Yourself</h4>
              <p className="text-sm text-white/60">{action.diy.description}</p>
            </div>
          </div>
          {expandedSection === 'diy' ? (
            <ChevronUp className="w-5 h-5 text-white/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/40" />
          )}
        </button>

        <AnimatePresence>
          {expandedSection === 'diy' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3 pl-13"
            >
              {action.diy.resources.map((resource, i) => {
                const Icon = getResourceIcon(resource.type);
                return (
                  <a
                    key={i}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-flame-yellow mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium group-hover:text-flame-yellow transition-colors">
                          {resource.title}
                        </span>
                        <ExternalLink className="w-3 h-3 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {resource.platform && (
                        <span className="text-xs text-white/50">{resource.platform}</span>
                      )}
                      {resource.cost && (
                        <span className="text-xs text-flame-orange ml-2">{resource.cost}</span>
                      )}
                    </div>
                  </a>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Existing Solutions */}
      <div className="glass-card p-4 border border-white/20">
        <button
          onClick={() => setExpandedSection(expandedSection === 'existing' ? null : 'existing')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Ready-Made Solutions</h4>
              <p className="text-sm text-white/60">{action.existing_solutions.length} tools found</p>
            </div>
          </div>
          {expandedSection === 'existing' ? (
            <ChevronUp className="w-5 h-5 text-white/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/40" />
          )}
        </button>

        <AnimatePresence>
          {expandedSection === 'existing' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3 pl-13"
            >
              {action.existing_solutions.map((solution, i) => (
                <a
                  key={i}
                  href={solution.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <Package className="w-4 h-4 text-white mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium group-hover:text-flame-yellow transition-colors">
                        {solution.name}
                      </span>
                      <ExternalLink className="w-3 h-3 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-white/60 mt-1">{solution.description}</p>
                    <span className="text-xs text-flame-orange mt-1 inline-block">{solution.cost}</span>
                  </div>
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Build Opportunity */}
      {action.build_opportunity.viable && (
        <div className="glass-card p-4 border border-flame-yellow/30 bg-flame-yellow/5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-flame-yellow/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-flame-yellow" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-flame-yellow">Product Opportunity</h4>
              <p className="text-sm text-white/80 mt-1">{action.build_opportunity.reason}</p>
            </div>
          </div>
          <button
            onClick={() => onBuildClick(action.build_opportunity.search_query)}
            className="w-full py-3 px-4 rounded-lg bg-flame-yellow/10 hover:bg-flame-yellow/20 text-flame-yellow font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            Explore in Builder Mode
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;