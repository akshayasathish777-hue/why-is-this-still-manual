import { motion } from 'framer-motion';

const stats = [
  { value: '10,000+', label: 'Problems Discovered' },
  { value: '3 Sources', label: 'Scanned' },
  { value: '<1s', label: 'Search Speed' },
];

const SocialProofBar = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div 
        className="grid grid-cols-3 gap-4 p-6 md:p-8 rounded-2xl"
        style={{
          background: 'rgba(255, 186, 8, 0.05)',
          border: '1px solid rgba(255, 186, 8, 0.2)',
        }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
            className="text-center"
          >
            <p className="text-flame-yellow text-2xl md:text-4xl font-bold mb-1">
              {stat.value}
            </p>
            <p className="text-white/50 text-xs md:text-sm">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SocialProofBar;
