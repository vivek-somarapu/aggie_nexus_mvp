"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Play,
  Database,
  Shield,
  Users
} from 'lucide-react';
import { authTester, authMonitor, type AuthTestSuite } from '@/lib/auth-testing';
import { useAuth } from '@/lib/auth';

/**
 * Authentication Monitoring Dashboard (Phase 5)
 * 
 * Comprehensive dashboard for monitoring authentication system health,
 * running tests, and viewing system metrics.
 */
export default function AuthMonitoringDashboard() {
  const { authUser, profile, isLoading } = useAuth();
  const [testSuite, setTestSuite] = useState<AuthTestSuite | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [lastTestRun, setLastTestRun] = useState<Date | null>(null);
  const [monitoringData, setMonitoringData] = useState<any>(null);

  /**
   * Run authentication tests
   */
  const runTests = async () => {
    setIsRunningTests(true);
    try {
      const suite = await authTester.runAllTests();
      setTestSuite(suite);
      setLastTestRun(new Date());
      
      // Record metrics
      authMonitor.recordMetric('test_suite_duration', suite.totalDuration);
      authMonitor.recordMetric('test_success_rate', (suite.passedTests / suite.totalTests) * 100);
      
      if (suite.failedTests > 0) {
        authMonitor.recordError(`${suite.failedTests} tests failed`, 'test_suite');
      }
    } catch (error) {
      authMonitor.recordError(
        error instanceof Error ? error.message : 'Unknown test error',
        'test_runner'
      );
    } finally {
      setIsRunningTests(false);
    }
  };

  /**
   * Update monitoring data
   */
  const updateMonitoringData = () => {
    const report = authMonitor.generateReport();
    setMonitoringData(report);
  };

  /**
   * Run quick API test
   */
  const runQuickTest = async () => {
    try {
      const response = await fetch('/api/test/auth', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        authMonitor.recordMetric('api_health_check', 1);
      } else {
        authMonitor.recordError('API health check failed', 'api_test');
      }
      
      updateMonitoringData();
    } catch (error) {
      authMonitor.recordError(
        error instanceof Error ? error.message : 'API test failed',
        'api_test'
      );
      updateMonitoringData();
    }
  };

  // Auto-update monitoring data
  useEffect(() => {
    updateMonitoringData();
    const interval = setInterval(updateMonitoringData, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Record auth state metrics
  useEffect(() => {
    if (!isLoading) {
      authMonitor.recordMetric('auth_user_present', authUser ? 1 : 0);
      authMonitor.recordMetric('profile_present', profile ? 1 : 0);
      authMonitor.recordMetric('auth_loading_time', Date.now());
    }
  }, [authUser, profile, isLoading]);

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Authentication Monitoring</h1>
          <p className="text-muted-foreground">Phase 5: Testing and Monitoring Dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runQuickTest} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Quick Test
          </Button>
          <Button onClick={runTests} disabled={isRunningTests}>
            {isRunningTests ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Full Tests
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Auth Status</p>
                <p className="text-2xl font-bold">
                  {authUser ? 'Active' : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Profile</p>
                <p className="text-2xl font-bold">
                  {profile ? 'Loaded' : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">System</p>
                <p className="text-2xl font-bold">
                  {monitoringData?.status === 'healthy' ? 'Healthy' : 'Issues'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Last Test</p>
                <p className="text-sm">
                  {lastTestRun ? lastTestRun.toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication State
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>User Authenticated</span>
                  <Badge variant={authUser ? "default" : "secondary"}>
                    {authUser ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Profile Loaded</span>
                  <Badge variant={profile ? "default" : "secondary"}>
                    {profile ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Loading State</span>
                  <Badge variant={isLoading ? "secondary" : "default"}>
                    {isLoading ? "Loading" : "Ready"}
                  </Badge>
                </div>
                {authUser && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      User ID: {authUser.id.slice(0, 8)}...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: {authUser.email}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Overall Status</span>
                  <Badge variant={monitoringData?.status === 'healthy' ? "default" : "destructive"}>
                    {monitoringData?.status || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Recent Errors</span>
                  <Badge variant={monitoringData?.recentErrors === 0 ? "default" : "destructive"}>
                    {monitoringData?.recentErrors || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Updated</span>
                  <span className="text-sm text-muted-foreground">
                    {monitoringData?.timestamp ? 
                      new Date(monitoringData.timestamp).toLocaleTimeString() : 
                      'Never'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Test Suite Results
                {testSuite && (
                  <Badge variant={testSuite.failedTests === 0 ? "default" : "destructive"}>
                    {testSuite.passedTests}/{testSuite.totalTests} passed
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!testSuite ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tests run yet</p>
                  <Button onClick={runTests} className="mt-4">
                    <Play className="h-4 w-4 mr-2" />
                    Run Tests
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Duration: {testSuite.totalDuration}ms</span>
                    <span>Run at: {lastTestRun?.toLocaleString()}</span>
                  </div>
                  <div className="space-y-2">
                    {testSuite.results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">{result.testName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {result.duration}ms
                          </span>
                          {!result.passed && result.error && (
                            <Badge variant="destructive" className="text-xs">
                              {result.error}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {monitoringData?.metrics ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(monitoringData.metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-2 border rounded">
                      <span className="font-medium">{key.replace(/_/g, ' ')}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No metrics available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monitoringData?.errors && monitoringData.errors.length > 0 ? (
                <div className="space-y-2">
                  {monitoringData.errors.map((error: any, index: number) => (
                    <div key={index} className="p-3 border rounded bg-red-50 dark:bg-red-900/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-red-700 dark:text-red-300">
                            {error.context}
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {error.error}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No recent errors</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 