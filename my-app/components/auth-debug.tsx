// Create this file at components/auth-debug.tsx
"use client";

import { useAuth } from "@/lib/auth";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye, EyeOff } from "lucide-react";

/**
 * Auth debugging component
 * Add this temporarily to your app when troubleshooting auth issues
 * <AuthDebug /> - place it in a layout or page component
 */
export default function AuthDebug() {
  const { authUser, profile, isLoading, error, refreshProfile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const logsRef = useRef<string[]>([]);

  // Capture console logs for auth-related messages using a ref to avoid render issues
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    const logCapture = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('[AUTH') || message.includes('[CLIENT LAYOUT') || 
          message.includes('[LOGIN PAGE') || message.includes('[SUPABASE CLIENT')) {
        // Use ref to avoid setState during render
        logsRef.current = [...logsRef.current.slice(-49), `${new Date().toLocaleTimeString()}: ${message}`];
        // Update state in next tick to avoid render cycle issues
        setTimeout(() => {
          setLogs([...logsRef.current]);
          setLastUpdate(new Date());
        }, 0);
      }
      originalLog(...args);
    };

    const errorCapture = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('[AUTH') || message.includes('[CLIENT LAYOUT') || 
          message.includes('[LOGIN PAGE') || message.includes('[SUPABASE CLIENT')) {
        // Use ref to avoid setState during render
        logsRef.current = [...logsRef.current.slice(-49), `${new Date().toLocaleTimeString()}: ERROR: ${message}`];
        // Update state in next tick to avoid render cycle issues
        setTimeout(() => {
          setLogs([...logsRef.current]);
          setLastUpdate(new Date());
        }, 0);
      }
      originalError(...args);
    };

    console.log = logCapture;
    console.error = errorCapture;

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          Show Auth Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden">
      <Card className="bg-background/95 backdrop-blur-sm border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Auth Debug</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshProfile}
                disabled={isLoading}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Auth State */}
          <div>
            <div className="font-medium mb-1">Auth State:</div>
            <div className="flex flex-wrap gap-1">
              <Badge variant={isLoading ? "secondary" : "outline"}>
                Loading: {isLoading ? "Yes" : "No"}
              </Badge>
              <Badge variant={authUser ? "default" : "destructive"}>
                User: {authUser ? "Yes" : "No"}
              </Badge>
              <Badge variant={profile ? "default" : "secondary"}>
                Profile: {profile ? "Yes" : "No"}
              </Badge>
              <Badge variant={error ? "destructive" : "outline"}>
                Error: {error ? "Yes" : "No"}
              </Badge>
            </div>
          </div>

          {/* User Info */}
          {authUser && (
            <div>
              <div className="font-medium mb-1">User Info:</div>
              <div className="text-xs space-y-1 font-mono bg-muted p-2 rounded">
                <div>ID: {authUser.id.slice(-8)}</div>
                <div>Email: {authUser.email}</div>
              </div>
            </div>
          )}

          {/* Profile Info */}
          {profile && (
            <div>
              <div className="font-medium mb-1">Profile Info:</div>
              <div className="text-xs space-y-1 font-mono bg-muted p-2 rounded">
                <div>Name: {profile.full_name || "N/A"}</div>
                <div>Bio: {profile.bio ? "Yes" : "No"}</div>
                <div>Skills: {profile.skills?.length || 0}</div>
                <div>Manager: {profile.role === 'admin' ? "Yes" : "No"}</div>
              </div>
            </div>
          )}

          {/* Error Info */}
          {error && (
            <div>
              <div className="font-medium mb-1 text-red-600">Error:</div>
              <div className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          )}

          {/* Recent Logs */}
          <div>
            <div className="font-medium mb-1">Recent Logs ({logs.length}/50):</div>
            <div className="text-xs bg-muted p-2 rounded max-h-32 overflow-y-auto font-mono">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">No auth logs yet...</div>
              ) : (
                logs.slice(-10).map((log, index) => (
                  <div 
                    key={index} 
                    className={`mb-1 ${log.includes('ERROR') ? 'text-red-600 dark:text-red-400' : ''}`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLogs([]);
                logsRef.current = [];
              }}
              className="text-xs h-6"
            >
              Clear Logs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const data = {
                  authUser,
                  profile,
                  isLoading,
                  error,
                  logs: logs.slice(-20)
                };
                console.log("Auth Debug Export:", data);
                navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
              }}
              className="text-xs h-6"
            >
              Export State
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
