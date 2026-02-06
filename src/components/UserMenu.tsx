import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bookmark, Bell, LogOut, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface UserMenuProps {
  onShowSavedSearches: () => void;
  onShowEmailPreferences: () => void;
}

const UserMenu = ({ onShowSavedSearches, onShowEmailPreferences }: UserMenuProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsOpen(false);
      toast({
        title: 'Signed out',
        description: 'See you next time!',
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) return null;

  const initial = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 p-1 rounded-full border-2 border-flame-yellow/50 hover:border-flame-yellow transition-colors"
        style={{
          boxShadow: '0 0 15px rgba(255, 186, 8, 0.3)',
        }}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-flame-orange to-flame-yellow flex items-center justify-center text-white font-semibold text-sm">
          {initial}
        </div>
        <ChevronDown className={`w-4 h-4 text-flame-yellow transition-transform mr-1 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-56 glass-card p-2 z-50"
            >
              <div className="px-3 py-2 border-b border-white/10 mb-2">
                <p className="text-white/60 text-xs truncate">{user.email}</p>
              </div>

              <button
                onClick={() => {
                  onShowSavedSearches();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
              >
                <Bookmark className="w-4 h-4 text-flame-yellow" />
                My Saved Searches
              </button>

              <button
                onClick={() => {
                  onShowEmailPreferences();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
              >
                <Bell className="w-4 h-4 text-flame-yellow" />
                Email Preferences
              </button>

              <div className="border-t border-white/10 mt-2 pt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
