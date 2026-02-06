import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from '@/components/LandingPage';
import ProblemSolver from '@/components/ProblemSolver';
import CuriousBuilder from '@/components/CuriousBuilder';
import Dashboard from '@/components/Dashboard';
import LoadingOverlay from '@/components/LoadingOverlay';
import NavLogo from '@/components/NavLogo';
import UserMenu from '@/components/UserMenu';
import AuthModal from '@/components/AuthModal';
import SavedSearches from '@/components/SavedSearches';
import { analyzeApi, type AnalyzedProblem, type AnalysisSource } from '@/lib/api/analyze';
import { savedSearchesApi } from '@/lib/api/savedSearches';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ViewType, CuratedProblem, SourceType } from '@/types/views';
import type { User } from '@supabase/supabase-js';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

type AppView = ViewType | 'savedSearches' | 'emailPreferences';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your workflow...');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');
  const [problems, setProblems] = useState<CuratedProblem[]>([]);
  const [isProblemsLoading, setIsProblemsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedProblem | null>(null);
  const [analysisSources, setAnalysisSources] = useState<AnalysisSource[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
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
    return sources.map(s => {
      if (s === 'twitter') return 'Twitter/X';
      return s.charAt(0).toUpperCase() + s.slice(1);
    }).join(', ');
  };

  // Require auth wrapper
  const requireAuth = (action: () => void) => {
    if (user) {
      action();
    } else {
      setPendingAction(() => action);
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Save search handler
  const handleSaveSearch = async (
    query: string,
    sources: SourceType[],
    searchType: 'solver' | 'builder'
  ) => {
    requireAuth(async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        await savedSearchesApi.save(currentUser.id, searchType, query, sources);
        toast({
          title: 'Search saved!',
          description: 'You can access it from your profile menu.',
        });
      } catch (error) {
        console.error('Save search error:', error);
        toast({
          title: 'Failed to save',
          description: 'Could not save this search.',
          variant: 'destructive',
        });
      }
    });
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

  const handleAnalyze = async (description: string, role: string, sources: SourceType[]) => {
    setIsLoading(true);
    const sourceNames = formatSourceNames(sources);
    setLoadingMessage(`Scanning ${sourceNames} discussions...`);
    setLoadingSubMessage(`Currently searching: ${sourceNames}`);
    
    try {
      const response = await analyzeApi.analyzeProblem(description, 'solver', sources);
      
      // Ensure minimum 2.5s loading for cinematic effect
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      if (response.success && response.data && response.data.length > 0) {
        setAnalysisResult(response.data[0]);
        setAnalysisSources(response.sources || []);
        setCurrentView('dashboard');
      } else {
        toast({
          title: "No discussions found",
          description: response.error || "Try different keywords.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis timed out",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleRunSavedSearch = (query: string, sources: SourceType[], searchType: 'solver' | 'builder') => {
    if (searchType === 'solver') {
      setCurrentView('solver');
      // The solver component will handle the actual search
    } else {
      setCurrentView('builder');
      handleDiscoverProblems(query, sources);
    }
  };

  const showNavLogo = currentView !== 'landing';

  return (
    <div className="min-h-screen bg-background">
      {/* Nav Logo - shows on all pages except landing */}
      {showNavLogo && (
        <NavLogo onClick={() => setCurrentView('landing')} />
      )}

      {/* User Menu - shows when logged in */}
      {user && currentView !== 'savedSearches' && currentView !== 'emailPreferences' && (
        <div className="fixed top-5 right-5 z-[1000]">
          <UserMenu
            onShowSavedSearches={() => setCurrentView('savedSearches')}
            onShowEmailPreferences={() => {
              toast({
                title: 'Email Preferences',
                description: 'Coming soon! Manage your alert settings.',
              });
            }}
          />
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
        }}
        onSuccess={handleAuthSuccess}
      />

      {/* Loading Overlay */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingOverlay 
            key="loading" 
            message={loadingMessage}
            subMessage={loadingSubMessage}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
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
              onDiscoverProblems={handleDiscoverProblems}
              onSelectProblem={(problem) => {
                setAnalysisResult(problem as AnalyzedProblem);
                setCurrentView('dashboard');
              }}
              onSaveSearch={(query, sources) => handleSaveSearch(query, sources, 'builder')}
              user={user}
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

        {currentView === 'savedSearches' && (
          <motion.div
            key="savedSearches"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <SavedSearches
              onBack={() => setCurrentView('landing')}
              onRunSearch={handleRunSavedSearch}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
