import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from '@/components/LandingPage';
import ProblemSolver from '@/components/ProblemSolver';
import CuriousBuilder from '@/components/CuriousBuilder';
import Dashboard from '@/components/Dashboard';
import LoadingOverlay from '@/components/LoadingOverlay';
import AuthModal from '@/components/AuthModal';
import { analyzeApi, type AnalyzedProblem, type AnalysisSource } from '@/lib/api/analyze';
import { supabase } from '@/integrations/supabase/client';
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
  const [builderQuery, setBuilderQuery] = useState<string>(''); // Track the search query
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const pendingAuthedActionRef = useRef<null | (() => void)>(null);
  const { toast } = useToast();

  const openAuthAndDefer = useCallback(
    (actionAfterAuth: () => void) => {
      pendingAuthedActionRef.current = actionAfterAuth;
      setIsAuthOpen(true);
      toast({
        title: 'Sign in required',
        description: 'Please sign in to run an analysis.',
      });
    },
    [toast]
  );

  const hasSession = useCallback(async (): Promise<boolean> => {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  }, []);

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
    return sources
      .map((s) => {
        if (s === 'twitter') return 'Twitter/X';
        return s.charAt(0).toUpperCase() + s.slice(1);
      })
      .join(', ');
  };

  const handleViewChange = (view: ViewType, query?: string) => {
    if (view === 'builder' && query) {
      setBuilderQuery(query);
    }
    setCurrentView(view);
  };

  const runDiscoverProblems = useCallback(
    async (query: string, sources: SourceType[]) => {
      setIsProblemsLoading(true);
      setBuilderQuery(query); // Sync the query state during discovery
      try {
        const response = await analyzeApi.analyzeProblem(query, 'builder', sources);
        if (response.success && response.data) {
          await fetchProblems();
          toast({
            title: 'Problems discovered!',
            description: `Found ${response.data.length} new workflow problems.`,
          });
        } else {
          toast({
            title: 'Discovery failed',
            description: response.error || 'Could not find problems for this topic.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Discovery error:', error);
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsProblemsLoading(false);
      }
    },
    [fetchProblems, toast]
  );

  // Discover new problems in builder mode (requires auth)
  const handleDiscoverProblems = useCallback(
    async (query: string, sources: SourceType[]) => {
      if (!(await hasSession())) {
        openAuthAndDefer(() => {
          void runDiscoverProblems(query, sources);
        });
        return;
      }

      await runDiscoverProblems(query, sources);
    },
    [hasSession, openAuthAndDefer, runDiscoverProblems]
  );

  const runAnalyze = useCallback(
    async (description: string, role: string, sources: SourceType[]) => {
      setCurrentView('loading');

      const sourceNames = formatSourceNames(sources);
      setLoadingMessage(`Scanning ${sourceNames} discussions...`);

      try {
        const [response] = await Promise.all([
          analyzeApi.analyzeProblem(description, 'solver', sources),
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ]);

        if (response.success && response.data && response.data.length > 0) {
          setAnalysisResult(response.data[0]);
          setAnalysisSources(response.sources || []);
          setCurrentView('dashboard');
        } else {
          console.error('Analysis failed:', response.error);
          toast({
            title: 'Analysis failed',
            description: response.error || 'Could not analyze this workflow.',
            variant: 'destructive',
          });
          setCurrentView('solver');
        }
      } catch (error) {
        console.error('Analysis error:', error);
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
        setCurrentView('solver');
      }
    },
    [toast]
  );

  // Analyze workflow problem (Solver mode) (requires auth)
  const handleAnalyze = useCallback(
    async (description: string, role: string, sources: SourceType[]) => {
      if (!(await hasSession())) {
        openAuthAndDefer(() => {
          void runAnalyze(description, role, sources);
        });
        return;
      }

      await runAnalyze(description, role, sources);
    },
    [hasSession, openAuthAndDefer, runAnalyze]
  );

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {currentView === 'loading' && (
          <motion.div
            key="loading"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <LoadingOverlay message={loadingMessage} />
          </motion.div>
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
            <ProblemSolver onViewChange={handleViewChange} onAnalyze={handleAnalyze} />
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
              initialQuery={builderQuery}
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
            <Dashboard onViewChange={handleViewChange} analysisResult={analysisResult} sources={analysisSources} />
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          pendingAuthedActionRef.current = null;
        }}
        onSuccess={() => {
          setIsAuthOpen(false);
          const action = pendingAuthedActionRef.current;
          pendingAuthedActionRef.current = null;
          action?.();
        }}
      />
    </div>
  );
};

export default Index;
