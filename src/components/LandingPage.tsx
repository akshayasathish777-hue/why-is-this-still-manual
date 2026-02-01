import { motion } from "framer-motion";
import { Puzzle, Rocket, Flame } from "lucide-react";
import type { ViewType } from "@/types/views";

interface LandingPageProps {
  onViewChange: (view: ViewType) => void;
}

const LandingPage = ({ onViewChange }: LandingPageProps) => {
  const cards = [
    {
      icon: Puzzle,
      title: "I Have a Problem",
      subtitle: "Analyze my manual task",
      view: "solver" as ViewType,
    },
    {
      icon: Rocket,
      title: "I Want to Build Something",
      subtitle: "Explore real-world problems",
      view: "builder" as ViewType,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative text-white">
      {/* Animated Background */}
      <div className="mesh-gradient-bg" />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 relative z-10 max-w-2xl"
      >
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-[#ffba08]">
          Why Is This Still Manual?
        </h1>
        <p className="text-white/80 text-lg md:text-xl mb-8">
          Discover automation opportunities hiding in your daily workflows
        </p>

        {/* Hero Benefits Section - clean, stacked text */}
        <motion.div
          className="space-y-6 md:space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {benefitsText.map((text, index) => (
            <motion.h3
              key={text}
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
            >
              {text}
            </motion.h3>
          ))}
        </motion.div>
      </motion.div>

      {/* Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        {cards.map((card, index) => (
          <motion.button
            key={card.view}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
            whileHover={{
              y: -8,
              scale: 1.01,
              boxShadow: "0px 0px 20px rgba(232,93,4,0.3)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onViewChange(card.view)}
            className="glass-card p-8 md:p-10 text-left relative group cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-flame-orange/0 to-flame-orange/0 group-hover:from-flame-orange/10 transition-all duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-xl bg-flame-orange/10 flex items-center justify-center mb-6">
                <card.icon className="w-7 h-7 text-flame-orange group-hover:text-flame-yellow transition-all duration-300" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {card.title}
              </h2>
              <p className="text-white/60 text-lg">{card.subtitle}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
  const benefitsText = ["Act fast, build smarter"];
};

export default LandingPage;
