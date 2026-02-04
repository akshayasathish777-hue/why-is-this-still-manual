import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from '@/components/LandingPage';
import ProblemSolver from '@/components/ProblemSolver';
import CuriousBuilder from '@/components/CuriousBuilder';
import Dashboard from '@/components/Dashboard';
import LoadingOverlay from '@/components/LoadingOverlay';
import { analyzeApi, type AnalyzedProblem } from '@/lib/api/analyze';
import { useToast } from '@/hooks/use-toast';
import type { ViewType, CuratedProblem } from '@/types/views';

// Mock data for CuriousBuilder - will be replaced with Supabase data
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
  const [analysisResult, setAnalysisResult] = useState<AnalyzedProblem | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async (description: string, role: string) => {
    setIsLoading(true);
    
    try {
      // Call the real API
      const response = await analyzeApi.analyzeProblem(description, 'solver');
      
      // Ensure minimum 2.5s loading for cinematic effect
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      if (response.success && response.data && response.data.length > 0) {
        setAnalysisResult(response.data[0]);
        setCurrentView('dashboard');
      } else {
        toast({
          title: "Analysis failed",
          description: response.error || "Could not analyze your workflow. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            <Dashboard onViewChange={handleViewChange} analysisResult={analysisResult} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
