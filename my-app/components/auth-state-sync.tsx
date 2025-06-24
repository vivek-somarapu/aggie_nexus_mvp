"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { getClientAuthState } from "@/lib/auth-state-client";

/**
 * Auth State Synchronization Component (Phase 4 - Optimized)
 * 
 * This component monitors auth state consistency between server and client
 * and automatically resolves synchronization issues.
 * 
 * Features:
 * - Detects auth state inconsistencies
 * - Automatically syncs state when mismatches are found
 * - Provides debug information for troubleshooting
 * - Prevents auth state drift
 * - Optimized to avoid interference with user experience
 */
export default function AuthStateSync() {
  const { authUser, profile, isLoading, isAuthReady } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'synced' | 'checking' | 'syncing' | 'error'>('synced');
  const [lastSyncCheck, setLastSyncCheck] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isQuietPeriod, setIsQuietPeriod] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  const syncLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[AUTH SYNC ${timestamp}] ${message}`, data);
    } else {
      console.log(`[AUTH SYNC ${timestamp}] ${message}`);
    }
  };

  const syncErrorLog = (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    if (error) {
      console.error(`[AUTH SYNC ERROR ${timestamp}] ${message}`, error);
    } else {
      console.error(`[AUTH SYNC ERROR ${timestamp}] ${message}`);
    }
  };

  // Track user activity to implement quiet periods
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setIsQuietPeriod(true);
      
      // Clear quiet period after 30 seconds of inactivity
      setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= 30000) {
          setIsQuietPeriod(false);
        }
      }, 30000);
    };

    // Listen for user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  /**
   * Perform simplified auth state synchronization check
   * Only runs during quiet periods to avoid interfering with user experience
   */
  const performSyncCheck = async () => {
    if (isLoading || !isAuthReady || isQuietPeriod) {
      syncLog("Skipping sync check", { 
        isLoading, 
        isAuthReady, 
        isQuietPeriod,
        reason: isLoading ? "auth loading" : !isAuthReady ? "auth not ready" : "quiet period"
      });
      return;
    }

    setSyncStatus('checking');
    setSyncError(null);
    
    try {
      syncLog("Starting optimized auth state sync check");
      
      // Get current client auth state
      const clientAuthState = await getClientAuthState();
      
      // Simple comparison using just IDs and authentication status
      const contextAuthenticated = !!authUser;
      const contextUserId = authUser?.id;
      const contextProfileId = profile?.id;
      
      syncLog("Comparing auth states", {
        clientAuthenticated: clientAuthState.isAuthenticated,
        contextAuthenticated,
        clientUserId: clientAuthState.user?.id,
        contextUserId,
        clientProfileId: clientAuthState.profile?.id,
        contextProfileId
      });
      
      // Only check for major inconsistencies - ignore minor differences
      const hasUserInconsistency = 
        clientAuthState.isAuthenticated !== contextAuthenticated ||
        (clientAuthState.user?.id !== contextUserId && contextAuthenticated && clientAuthState.isAuthenticated);
      
      if (hasUserInconsistency) {
        syncLog("Major auth state inconsistency detected - sync needed");
        setSyncStatus('syncing');
        
        // Force a page reload for major auth inconsistencies
        window.location.reload();
        return;
        
      } else {
        syncLog("Auth states are consistent");
        setSyncStatus('synced');
      }
      
      setLastSyncCheck(new Date().toISOString());
      
    } catch (err) {
      syncErrorLog("Error during sync check", err);
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'Unknown sync error');
    }
  };

  /**
   * Periodic sync check - much less frequent to avoid performance impact
   */
  useEffect(() => {
    if (!isAuthReady) return;
    
    // Initial sync check after component mounts and auth is ready
    const initialTimeout = setTimeout(() => {
      performSyncCheck();
    }, 5000); // Wait 5 seconds after auth ready
    
    // Periodic sync checks every 5 minutes (reduced from 60 seconds)
    const syncInterval = setInterval(() => {
      performSyncCheck();
    }, 300000); // 5 minutes
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(syncInterval);
    };
  }, [isAuthReady]); // Only depend on auth ready state

  // Only show debug info in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${
            syncStatus === 'synced' ? 'bg-green-400' :
            syncStatus === 'checking' ? 'bg-yellow-400' :
            syncStatus === 'syncing' ? 'bg-blue-400' :
            'bg-red-400'
          }`} />
          <span className="font-medium">Auth State</span>
          {isQuietPeriod && <span className="text-xs text-gray-400">(Quiet)</span>}
        </div>
        
        <div className="space-y-1">
          <div>Status: {syncStatus}</div>
          <div>User: {authUser?.id ? `${authUser.id.slice(0, 8)}...` : 'None'}</div>
          <div>Profile: {profile?.id ? `${profile.id.slice(0, 8)}...` : 'None'}</div>
          <div>Ready: {isAuthReady ? 'Yes' : 'No'}</div>
          {lastSyncCheck && (
            <div>Last Check: {new Date(lastSyncCheck).toLocaleTimeString()}</div>
          )}
          {syncError && (
            <div className="text-red-300 text-wrap">Error: {syncError}</div>
          )}
        </div>
        
        <button
          onClick={performSyncCheck}
          className="mt-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
          disabled={syncStatus === 'checking' || syncStatus === 'syncing' || isQuietPeriod}
        >
          {syncStatus === 'checking' ? 'Checking...' : 
           syncStatus === 'syncing' ? 'Syncing...' : 
           isQuietPeriod ? 'Quiet Period' :
           'Check Sync'}
        </button>
      </div>
    </div>
  );
} 