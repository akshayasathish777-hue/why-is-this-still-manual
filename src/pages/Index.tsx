import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from '@/components/LandingPage';
import ProblemSolver from '@/components/ProblemSolver';
import CuriousBuilder from '@/components/CuriousBuilder';
import Dashboard from '@/components/Dashboard';
import LoadingOverlay from '@/components/LoadingOverlay';
import type { ViewType, CuratedProblem } from '@/types/views';

// Mock data for now - will be replaced with Supabase data
const mockProblems: CuratedProblem[] = [
  {
    id: '1',
    title: 'Manually copying invoice data to spreadsheets',
    domain: 'Finance',
    role: 'Accountant',
    upvotes: 234,
  },
  {
    id: '2',
    title: 'Scheduling social media posts across platforms',
    domain: 'Marketing',
    role: 'Social Media Manager',
    upvotes: 189,
  },
  {
    id: '3',
    title: 'Tracking student attendance in paper logs',
    domain: 'Education',
    role: 'Teacher',
    upvotes: 156,
  },
  {
    id: '4',
    title: 'Compiling weekly sales reports from emails',
    domain: 'Sales',
    role: 'Sales Manager',
    upvotes: 142,
  },
  {
    id: '5',
    title: 'Manually sorting customer support tickets',
    domain: 'Support',
    role: 'Support Lead',
    upvotes: 128,
  },
  {
    id: '6',
    title: 'Updating inventory counts by hand',
    domain: 'Retail',
    role: 'Store Manager',
    upvotes: 115,
  },
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [isLoading, setIsLoading] = useState(false);
  const [problems] = useState<CuratedProblem[]>(mockProblems);
  const [isProblemsLoading] = useState(false);

  const handleAnalyze = () => {
    setIsLoading(true);
    // Artificial delay to show loading animation
    setTimeout(() => {
      setIsLoading(false);
      setCurrentView('dashboard');
    }, 2500);
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {isLoading && <LoadingOverlay key="loading" />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentView === 'landing' && (
          <motion.div
            key="landing"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <LandingPage onViewChange={handleViewChange} />
          </motion.div>
        )}

        {currentView === 'solver' && (
          <motion.div
            key="solver"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ProblemSolver 
              onViewChange={handleViewChange} 
              onAnalyze={handleAnalyze}
            />
          </motion.div>
        )}

        {currentView === 'builder' && (
          <motion.div
            key="builder"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <CuriousBuilder 
              onViewChange={handleViewChange}
              problems={problems}
              isLoading={isProblemsLoading}
            />
          </motion.div>
        )}

        {currentView === 'dashboard' && (
          <motion.div
            key="dashboard"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Dashboard onViewChange={handleViewChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
