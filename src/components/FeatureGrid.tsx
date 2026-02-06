import { motion } from 'framer-motion';

const features = [
  {
    emoji: '🔥',
    title: 'Multi-Source Validation',
    description: "Don't trust one platform. We cross-reference Reddit, Twitter, and Quora.",
  },
  {
    emoji: '🧠',
    title: 'AI-Powered Insights',
    description: 'Gemini analyzes why it\'s manual and suggests the automation unlock.',
  },
  {
    emoji: '📊',
    title: 'Trend Detection',
    description: 'See if problems are growing, stable, or dying. Time your entry perfectly.',
  },
  {
    emoji: '💾',
    title: 'Saved Searches',
    description: 'Bookmark queries and get alerted when new discussions emerge.',
  },
  {
    emoji: '📈',
    title: 'Sentiment Analysis',
    description: 'Export with emotional intensity scores. Know which problems hurt most.',
  },
  {
    emoji: '⚡',
    title: 'Instant Export',
    description: 'One click to CSV, JSON, or send directly to Notion/Airtable.',
  },
];

const FeatureGrid = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="w-full max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + index * 0.05, duration: 0.4 }}
            whileHover={{ y: -4 }}
            className="p-6 rounded-xl backdrop-blur-xl transition-all duration-300 group"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 186, 8, 0.15)',
            }}
          >
            <div className="text-3xl mb-3">{feature.emoji}</div>
            <h3 className="text-flame-yellow font-semibold text-lg mb-2 group-hover:text-glow-fire transition-all">
              {feature.title}
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default FeatureGrid;
