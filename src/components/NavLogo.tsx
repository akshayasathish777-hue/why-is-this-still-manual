import { motion } from 'framer-motion';
import Logo from './Logo';

interface NavLogoProps {
  onClick: () => void;
}

const NavLogo = ({ onClick }: NavLogoProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-5 left-5 z-[1000]"
    >
      <Logo size="sm" onClick={onClick} />
    </motion.div>
  );
};

export default NavLogo;
