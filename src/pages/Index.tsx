import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from '@/components/LandingPage';
import ProblemSolver from '@/components/ProblemSolver';
import CuriousBuilder from '@/components/CuriousBuilder';
import Dashboard from '@/components/Dashboard';
import LoadingOverlay from '@/components/LoadingOverlay';
import { analyzeApi, type AnalyzedProblem, type AnalysisSource } from '@/lib/api/analyze';
import { useToast } from '@/hooks/use-toast';
import type { ViewType, CuratedProblem, SourceType } from '@/types/views';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

type AppView = ViewType | 'loading';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your workflow...');
  const [problems, setProblems] = useState<CuratedProblem[]>([]);
  const [isProblemsLoading, setIsProblemsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedProblem | null>(null);
  const [analysisSources, setAnalysisSources] = useState<AnalysisSource[]>([]);
  const { toast } = useToast();

  // Fetch problems from database
  const fetchProblems = useCallback(async () => {
    setIsProblemsLoading(true);
    try {
      const data = await analyzeApi.fetchProblems();
      setProblems(data as CuratedProblem[]);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    } finally {
      setIsProblemsLoading(false);
    }
  }, []);

  // Load problems when entering builder view
  useEffect(() => {
    if (currentView === 'builder') {
      fetchProblems();
    }
  }, [currentView, fetchProblems]);

  // Format source names for display
  const formatSourceNames = (sources: SourceType[]): string => {
    return sources.map(s => {
      if (s === 'twitter') return 'Twitter/X';
      return s.charAt(0).toUpperCase() + s.slice(1);
    }).join(', ');
  };

  // Discover new problems in builder mode
  const handleDiscoverProblems = async (query: string, sources: SourceType[]) => {
    setIsProblemsLoading(true);
    try {
      const response = await analyzeApi.analyzeProblem(query, 'builder', sources);
      if (response.success && response.data) {
        await fetchProblems();
        toast({
          title: "Problems discovered!",
          description: `Found ${response.data.length} new workflow problems.`,
        });
      } else {
        toast({
          title: "Discovery failed",
          description: response.error || "Could not find problems for this topic.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Discovery error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProblemsLoading(false);
    }
  };

  // Analyze workflow problem (Solver mode)
  const handleAnalyze = async (description: string, role: string, sources: SourceType[]) => {
    setCurrentView("loading");
    
    const sourceNames = formatSourceNames(sources);
    setLoadingMessage(`Scanning ${sourceNames} discussions...`);

    try {
      const [response] = await Promise.all([
        analyzeApi.analyzeProblem(description, "solver", sources),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);

      if (response.success && response.data && response.data.length > 0) {
        setAnalysisResult(response.data[0]);
        setAnalysisSources(response.sources || []);
        setCurrentView("dashboard");
      } else {
        console.error("Analysis failed:", response.error);
        toast({
          title: "Analysis failed",
          description: response.error || "Could not analyze this workflow.",
          variant: "destructive",
        });
        setCurrentView("solver");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setCurrentView("solver");
    }
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <AnimatePresence mode="wait">
        {currentView === 'loading' && (
          <LoadingOverlay 
            key="loading" 
            message={loadingMessage}
          />
        )}

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
              onDiscoverProblems={handleDiscoverProblems}
              onSelectProblem={(problem) => {
                setAnalysisResult(problem as AnalyzedProblem);
                setCurrentView('dashboard');
              }}
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
            <Dashboard 
              onViewChange={handleViewChange} 
              analysisResult={analysisResult}
              sources={analysisSources}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;