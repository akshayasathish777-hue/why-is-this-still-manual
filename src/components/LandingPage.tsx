import { motion } from 'framer-motion';
import { Puzzle, Rocket, Flame } from 'lucide-react';
import type { ViewType } from '@/types/views';

interface LandingPageProps {
  onViewChange: (view: ViewType) => void;
}

const LandingPage = ({ onViewChange }: LandingPageProps) => {
  const cards = [
    {
      icon: Puzzle,
      title: "I Have a Problem",
      subtitle: "Validate my struggle + see the unlock",
      view: 'solver' as ViewType,
    },
    {
      icon: Rocket,
      title: "I Want to Build Something",
      subtitle: "Discover what people are begging for",
      view: 'builder' as ViewType,
    },
  ];

  const sourceBadges = [
    { name: 'Reddit', active: true },
    { name: 'Twitter/X', active: true },
    { name: 'Quora', active: true },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Animated Mesh Gradient Background */}
      <div className="mesh-gradient-bg" />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 relative z-10"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <Flame className="w-10 h-10 text-flame-yellow flame-bloom" />
        </motion.div>
        
        <h1 className="headline-fire text-4xl md:text-6xl lg:text-7xl mb-4">
          Why Is This Still Manual?
        </h1>
        <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
          Discover automation opportunities hiding in your daily workflows
        </p>
      </motion.div>

      {/* Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        {cards.map((card, index) => (
          <motion.button
            key={card.view}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            whileHover={{ 
              y: -8, 
              scale: 1.01,
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onViewChange(card.view)}
            className="glass-card card-interactive p-8 md:p-10 text-left group cursor-pointer relative overflow-hidden"
          >
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-flame-orange/0 to-flame-orange/0 group-hover:from-flame-orange/10 group-hover:to-transparent transition-all duration-500" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-xl bg-flame-orange/10 flex items-center justify-center mb-6 group-hover:bg-flame-orange/20 transition-colors duration-300">
                <card.icon className="w-7 h-7 text-flame-orange group-hover:flame-bloom transition-all duration-300" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-flame-yellow group-hover:text-glow-fire transition-all duration-300">
                {card.title}
              </h2>
              
              <p className="text-white/60 text-lg group-hover:text-white/80 transition-colors duration-300">
                {card.subtitle}
              </p>
            </div>

            {/* Corner accent glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-flame-orange/20 to-transparent rounded-bl-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          </motion.button>
        ))}
      </div>

      {/* Multi-source indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-10 text-center relative z-10"
      >
        <p className="text-white/50 text-sm mb-3">Searching across multiple sources:</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {sourceBadges.map((badge) => (
            <span
              key={badge.name}
              className="px-3 py-1 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: 'rgba(232, 93, 4, 0.2)',
                color: '#e85d04',
                borderColor: '#e85d04',
              }}
            >
              {badge.name}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Ambient background glow elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.08, 0.05]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-flame-orange rounded-full blur-[200px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.04, 0.07, 0.04]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-flame-yellow rounded-full blur-[250px]" 
        />
      </div>
    </div>
  );
};

export default LandingPage;
