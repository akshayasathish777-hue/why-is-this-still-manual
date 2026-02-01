import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay = ({ message = "Analyzing your workflow..." }: LoadingOverlayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center"
    >
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          filter: [
            "drop-shadow(0 0 5px hsl(45 100% 51%))",
            "drop-shadow(0 0 20px hsl(24 95% 46%))",
            "drop-shadow(0 0 5px hsl(45 100% 51%))"
          ]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="flex flex-col items-center"
      >
        <Flame size={64} className="text-flame-yellow" />
        <p className="text-flame-yellow mt-4 font-medium text-lg">
          {message}
        </p>
      </motion.div>
      
      {/* Ambient glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-flame-orange/10 rounded-full blur-[100px]" />
      </div>
    </motion.div>
  );
};

export default LoadingOverlay;
