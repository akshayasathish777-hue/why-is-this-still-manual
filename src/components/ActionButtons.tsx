import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, ShoppingBag, Lightbulb, ExternalLink, Play, FileText, Package, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import type { ActionPlan } from '@/lib/api/analyze';

interface ActionButtonsProps {
  action: ActionPlan | string;
  onBuildClick: (query: string) => void;
}

const ActionButtons = ({ action, onBuildClick }: ActionButtonsProps) => {
  const [expandedSection, setExpandedSection] = useState<'diy' | 'existing' | null>(null);

  // Parse action if it's a string (JSON)
  const parsedAction: ActionPlan | null = (() => {
    if (typeof action === 'object' && action !== null) {
      return action as ActionPlan;
    }
    if (typeof action === 'string') {
      try {
        return JSON.parse(action) as ActionPlan;
      } catch {
        return null;
      }
    }
    return null;
  })();

  // If we couldn't parse, show fallback
  if (!parsedAction) {
    return (
      <div className="text-white/60 text-center py-4">
        <p>Action plan format not recognized</p>
      </div>
    );
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'tutorial': return Play;
      case 'tool': return Package;
      case 'template': return FileText;
      default: return ExternalLink;
    }
  };

  const { diy, existing_solutions, build_opportunity } = parsedAction;

  return (
    <div className="space-y-4">
      {/* DIY Path */}
      {diy && (
        <div className="glass-card p-4 border border-flame-orange/30 rounded-lg">
          <button
            onClick={() => setExpandedSection(expandedSection === 'diy' ? null : 'diy')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-flame-orange/20 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-flame-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white">Build It Yourself</h4>
                <p className="text-sm text-white/60 line-clamp-2">{diy.description}</p>
              </div>
            </div>
            {expandedSection === 'diy' ? (
              <ChevronUp className="w-5 h-5 text-white/40 shrink-0 ml-2" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/40 shrink-0 ml-2" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === 'diy' && diy.resources && diy.resources.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3 overflow-hidden"
              >
                {diy.resources.map((resource, i) => {
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white text-sm font-medium group-hover:text-flame-yellow transition-colors">
                            {resource.title}
                          </span>
                          <ExternalLink className="w-3 h-3 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {resource.platform && (
                            <span className="text-xs text-white/50">{resource.platform}</span>
                          )}
                          {resource.cost && (
                            <span className="text-xs text-flame-orange">{resource.cost}</span>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Existing Solutions */}
      {existing_solutions && existing_solutions.length > 0 && (
        <div className="glass-card p-4 border border-white/20 rounded-lg">
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
                <p className="text-sm text-white/60">{existing_solutions.length} tool{existing_solutions.length > 1 ? 's' : ''} found</p>
              </div>
            </div>
            {expandedSection === 'existing' ? (
              <ChevronUp className="w-5 h-5 text-white/40 shrink-0 ml-2" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/40 shrink-0 ml-2" />
            )}
          </button>

          <AnimatePresence>
            {expandedSection === 'existing' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3 overflow-hidden"
              >
                {existing_solutions.map((solution, i) => (
                  <a
                    key={i}
                    href={solution.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group block"
                  >
                    <Package className="w-4 h-4 text-white mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium group-hover:text-flame-yellow transition-colors">
                          {solution.name}
                        </span>
                        <ExternalLink className="w-3 h-3 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <p className="text-xs text-white/60 mt-1 line-clamp-2">{solution.description}</p>
                      <span className="text-xs text-flame-orange mt-1 inline-block">{solution.cost}</span>
                    </div>
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Build Opportunity */}
      {build_opportunity && (
        <div className={`glass-card p-4 border rounded-lg ${build_opportunity.viable ? 'border-flame-yellow/30 bg-flame-yellow/5' : 'border-white/10 bg-white/5'}`}>
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${build_opportunity.viable ? 'bg-flame-yellow/20' : 'bg-white/10'}`}>
              {build_opportunity.viable ? (
                <Lightbulb className="w-5 h-5 text-flame-yellow" />
              ) : (
                <XCircle className="w-5 h-5 text-white/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold ${build_opportunity.viable ? 'text-flame-yellow' : 'text-white/70'}`}>
                  Product Opportunity
                </h4>
                {build_opportunity.viable ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <p className="text-sm text-white/80 mt-1">{build_opportunity.reason}</p>
            </div>
          </div>
          {build_opportunity.viable && build_opportunity.search_query && (
            <button
              onClick={() => onBuildClick(build_opportunity.search_query)}
              className="w-full py-3 px-4 rounded-lg bg-flame-yellow/10 hover:bg-flame-yellow/20 text-flame-yellow font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              Explore in Builder Mode
            </button>
          )}
        </div>
      )}

      {/* Empty state if no sections */}
      {!diy && (!existing_solutions || existing_solutions.length === 0) && !build_opportunity && (
        <div className="text-white/60 text-center py-4">
          No action plan details available
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
