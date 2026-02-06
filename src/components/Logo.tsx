import { motion } from 'framer-motion';
import logoImage from '@/assets/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  animate?: boolean;
}

const sizeMap = {
  sm: 'w-10 h-10',
  md: 'w-20 h-20',
  lg: 'w-[120px] h-[120px]',
};

const Logo = ({ size = 'md', onClick, animate = false }: LogoProps) => {
  const sizeClass = sizeMap[size];
  
  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { scale: 1.1 } : undefined}
      animate={animate ? {
        scale: [1, 1.05, 1],
      } : undefined}
      transition={animate ? {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      } : undefined}
      className={`relative cursor-pointer ${onClick ? 'cursor-pointer' : ''}`}
    >
      <img 
        src={logoImage} 
        alt="Why Is This Still Manual?" 
        className={`${sizeClass} object-contain filter drop-shadow-[0_0_20px_rgba(255,186,8,0.5)]`}
      />
      {/* Ambient glow behind logo */}
      <div 
        className={`absolute inset-0 bg-gradient-radial from-flame-yellow/30 to-transparent rounded-full blur-xl -z-10 scale-150`}
      />
    </motion.div>
  );
};

export default Logo;
