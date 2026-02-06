import { motion } from 'framer-motion';
import Logo from './Logo';
import logoImage from '@/assets/logo.png';

interface LoadingOverlayProps {
  message?: string;
  subMessage?: string;
}

const LoadingOverlay = ({ 
  message = "Analyzing your workflow...",
  subMessage = "Currently searching: Reddit"
}: LoadingOverlayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center"
    >
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="flex flex-col items-center"
      >
        <img 
          src={logoImage}
          alt="Loading"
          className="w-20 h-20 object-contain filter drop-shadow-[0_0_30px_rgba(255,186,8,0.6)]"
        />
        <motion.p 
          className="headline-fire mt-6 font-medium text-xl"
          animate={{
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {message}
        </motion.p>
        
        {subMessage && (
          <motion.p 
            className="text-white/50 mt-3 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {subMessage}
          </motion.p>
        )}
      </motion.div>
      
      {/* Intense ambient glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-flame-orange rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-flame-yellow rounded-full blur-[120px]" 
        />
      </div>
    </motion.div>
  );
};

export default LoadingOverlay;
