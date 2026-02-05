import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, ChevronDown } from 'lucide-react';
import type { ViewType, SourceType } from '@/types/views';

interface ProblemSolverProps {
  onViewChange: (view: ViewType) => void;
  onAnalyze: (description: string, role: string, sources: SourceType[]) => void;
}

const roles = ['Business Owner', 'Student', 'Founder', 'Developer', 'Other'];

const sourceOptions: { id: SourceType; label: string }[] = [
  { id: 'reddit', label: 'Reddit' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'quora', label: 'Quora' },
];

const ProblemSolver = ({ onViewChange, onAnalyze }: ProblemSolverProps) => {
  const [description, setDescription] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState<SourceType[]>(['reddit']);

  const toggleSource = (source: SourceType) => {
    setSelectedSources((prev) => {
      // If it's the only selected source, don't deselect it
      if (prev.length === 1 && prev.includes(source)) {
        return prev;
      }
      // Toggle the source
      if (prev.includes(source)) {
        return prev.filter((s) => s !== source);
      }
      return [...prev, source];
    });
  };

  const handleAnalyze = () => {
    if (description.trim()) {
      onAnalyze(description, selectedRole, selectedSources);
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="headline-fire text-3xl md:text-5xl mb-4">
            Describe Your Manual Task
          </h1>
          <p className="text-white/70 text-lg">
            Tell us what's eating up your time, and we'll find the automation opportunity
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="w-full space-y-6"
        >
          {/* Textarea */}
          <div className="glass-card p-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your manual task... 

For example: Every morning I spend 30 minutes copying data from emails into a spreadsheet, then formatting it, and sending summaries to my team..."
              className="fire-textarea w-full min-h-[200px] bg-transparent"
            />
          </div>

          {/* Role Dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="glass-card w-full p-4 flex items-center justify-between text-left"
            >
              <span className={selectedRole ? 'text-white' : 'text-gray-500'}>
                {selectedRole || 'Select your role...'}
              </span>
              <ChevronDown 
                className={`w-5 h-5 text-flame-orange transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </motion.button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 glass-card overflow-hidden z-50"
              >
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setSelectedRole(role);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-flame-orange/10 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {role}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Source Selection */}
          <div className="glass-card p-4">
            <label className="text-flame-yellow text-sm font-medium mb-3 block">
              Search in (select at least one):
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {sourceOptions.map((source) => {
                const isActive = selectedSources.includes(source.id);
                return (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
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

          {/* CTA Button with Gradient and Pulse */}
          <motion.button
            onClick={handleAnalyze}
            disabled={!description.trim()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
              description.trim()
                ? 'btn-fire-gradient'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <Flame className={`w-5 h-5 ${description.trim() ? 'flame-bloom' : ''}`} />
            Validate & Unlock
          </motion.button>
        </motion.div>
      </div>

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.04, 0.07, 0.04]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-flame-orange rounded-full blur-[180px]" 
        />
      </div>
    </div>
  );
};

export default ProblemSolver;
