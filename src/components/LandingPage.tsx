import { motion } from 'framer-motion';
import { Puzzle, Rocket, ArrowRight, Flame } from 'lucide-react';
import type { ViewType } from '@/types/views';
import RotatingCatchphrase from './RotatingCatchphrase';
import LiveSourceBadges from './LiveSourceBadges';

interface LandingPageProps {
  onViewChange: (view: ViewType) => void;
}

const LandingPage = ({ onViewChange }: LandingPageProps) => {
  const cards = [
    {
      number: '01',
      icon: Puzzle,
      title: "I Have a Problem",
      subtitle: "Validate my struggle + see the unlock",
      view: 'solver' as ViewType,
    },
    {
      number: '02',
      icon: Rocket,
      title: "I Want to Build Something",
      subtitle: "Discover what people are begging for",
      view: 'builder' as ViewType,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12 relative overflow-x-hidden">
      {/* Animated Mesh Gradient Background */}
      <div className="mesh-gradient-bg" />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 relative z-10 max-w-5xl mx-auto"
      >
        {/* Flame Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <Flame 
              className="w-[120px] h-[120px] text-flame-orange"
              style={{
                filter: 'drop-shadow(0 0 40px rgba(255,186,8,0.6))'
              }}
            />
            {/* Ambient glow behind flame */}
            <div 
              className="absolute inset-0 bg-gradient-radial from-flame-yellow/30 to-transparent rounded-full blur-xl -z-10 scale-150"
            />
          </motion.div>
        </motion.div>
        
        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold mb-6 tracking-tight"
          style={{
            color: '#ffba08',
            textShadow: '0 0 20px #ffba08, 0 0 40px #e85d04',
            letterSpacing: '-0.02em',
          }}
        >
          Why Is This Still Manual?
        </motion.h1>

        {/* Rotating Catchphrase */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <RotatingCatchphrase />
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-white/50 text-base md:text-lg mt-4"
        >
          AI-Powered Problem Discovery • Multi-Source Intelligence • Built for Builders
        </motion.p>
      </motion.div>

      {/* Choice Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10 mb-12"
      >
        {cards.map((card, index) => (
          <motion.button
            key={card.view}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
            whileHover={{ 
              y: -12, 
              scale: 1.02,
              rotateY: 2,
              rotateX: 2,
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onViewChange(card.view)}
            className="glass-card card-interactive p-8 md:p-10 text-left group cursor-pointer relative overflow-hidden"
            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
          >
            {/* Number badge */}
            <span className="absolute top-4 left-4 text-flame-yellow/30 text-sm font-bold">
              {card.number}
            </span>

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

            {/* Arrow on hover */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowRight className="w-6 h-6 text-flame-yellow" />
            </div>

            {/* Corner accent glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-flame-orange/20 to-transparent rounded-bl-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          </motion.button>
        ))}
      </motion.div>

      {/* Live Source Badges */}
      <div className="relative z-10 mb-8">
        <LiveSourceBadges />
      </div>

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
