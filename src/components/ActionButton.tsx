import { ExternalLink, Wrench, Package, Rocket, CheckCircle2, XCircle, Search } from 'lucide-react';
import type { ActionPlan } from '@/lib/api/analyze';

interface ActionButtonsProps {
  action: ActionPlan;
  onBuildClick?: (query: string) => void;
}

const ActionButtons = ({ action, onBuildClick }: ActionButtonsProps) => {
  return (
    <div className="space-y-6">
      {/* DIY Section */}
      {action.diy && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-5 h-5 text-flame-yellow" />
            <h3 className="text-lg font-semibold text-flame-yellow">🛠️ DIY Approach</h3>
          </div>
          
          {action.diy.description && (
            <p className="text-white/80 text-sm leading-relaxed mb-3">
              {action.diy.description}
            </p>
          )}
          
          {action.diy.resources && action.diy.resources.length > 0 && (
            <div className="space-y-2">
              {action.diy.resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-flame-yellow/50 transition-all group"
                >
                  <ExternalLink className="w-4 h-4 text-flame-yellow shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{resource.title}</span>
                      {resource.platform && (
                        <span className="px-2 py-0.5 rounded text-xs bg-flame-yellow/20 text-flame-yellow">
                          {resource.platform}
                        </span>
                      )}
                      {resource.cost && (
                        <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/70">
                          {resource.cost}
                        </span>
                      )}
                    </div>
                    {resource.type && (
                      <span className="text-white/50 text-xs capitalize">{resource.type}</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Existing Solutions Section */}
      {action.existing_solutions && action.existing_solutions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-flame-orange" />
            <h3 className="text-lg font-semibold text-flame-orange">💼 Existing Solutions</h3>
          </div>
          
          <div className="space-y-2">
            {action.existing_solutions.map((solution, i) => (
              <a
                key={i}
                href={solution.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-flame-orange/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold group-hover:text-flame-orange transition-colors">
                      {solution.name}
                    </span>
                    <ExternalLink className="w-4 h-4 text-flame-orange shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  {solution.cost && (
                    <span className="px-3 py-1 rounded-full bg-flame-orange/20 text-flame-orange text-sm font-medium shrink-0">
                      {solution.cost}
                    </span>
                  )}
                </div>
                {solution.description && (
                  <p className="text-white/70 text-sm leading-relaxed">
                    {solution.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Build Opportunity Section */}
      {action.build_opportunity && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="w-5 h-5 text-flame-red" />
            <h3 className="text-lg font-semibold text-flame-red">🚀 Build Opportunity</h3>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            action.build_opportunity.viable 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-start gap-3 mb-3">
              {action.build_opportunity.viable ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-semibold ${
                    action.build_opportunity.viable ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {action.build_opportunity.viable ? 'Worth Building' : 'Not Recommended'}
                  </span>
                </div>
                {action.build_opportunity.reason && (
                  <p className="text-white/80 text-sm leading-relaxed">
                    {action.build_opportunity.reason}
                  </p>
                )}
              </div>
            </div>
            
            {action.build_opportunity.viable && action.build_opportunity.search_query && onBuildClick && (
              <button
                onClick={() => onBuildClick(action.build_opportunity.search_query)}
                className="w-full mt-3 py-2.5 px-4 rounded-lg bg-flame-red hover:bg-flame-red/80 text-white font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Search className="w-4 h-4" />
                <span>Explore Similar Problems</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;