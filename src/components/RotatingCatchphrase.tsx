import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const catchphrases = [
  "Validate YOUR manual task. Discover what OTHERS are struggling with.",
  "Stop guessing. Start building what people actually need.",
  "Turn pain points into product gold.",
  "From manual chaos to AI-powered clarity.",
  "Build solutions, not assumptions.",
];

const RotatingCatchphrase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % catchphrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-20 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="text-white/70 text-lg md:text-xl lg:text-2xl text-center max-w-3xl"
        >
          {catchphrases[currentIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

export default RotatingCatchphrase;
