import { motion } from 'framer-motion';

const sources = [
  { name: 'Reddit', active: true },
  { name: 'Twitter/X', active: true },
  { name: 'Quora', active: true },
];

const LiveSourceBadges = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      className="text-center"
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <motion.span
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-2 h-2 bg-green-500 rounded-full"
        />
        <span className="text-white/50 text-sm">Real-time intelligence from:</span>
      </div>
      
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {sources.map((source) => (
          <span
            key={source.name}
            className="px-4 py-2 rounded-full text-sm font-medium border transition-all hover:scale-105"
            style={{
              backgroundColor: 'rgba(232, 93, 4, 0.2)',
              color: '#e85d04',
              borderColor: '#e85d04',
            }}
          >
            {source.name}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default LiveSourceBadges;
