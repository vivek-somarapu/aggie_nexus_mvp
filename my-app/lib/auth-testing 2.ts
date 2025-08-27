/**
 * Authentication Testing and Monitoring System (Phase 5)
 * 
 * Comprehensive testing utilities for authentication flows
 * and monitoring capabilities for production environments.
 */

import { createClient } from './supabase/client';
import { createClient as createServerClient } from './supabase/server';
import type { AuthState } from './auth-state-client';
import type { Profile } from './auth';

// Test result interface
export interface AuthTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

// Test suite interface
export interface AuthTestSuite {
  suiteName: string;
  results: AuthTestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

/**
 * Comprehensive authentication test runner
 */
export class AuthTester {
  private results: AuthTestResult[] = [];
  
  /**
   * Run a single test with timing and error handling
   */
  private async runTest(
    testName: string, 
    testFn: () => Promise<void>
  ): Promise<AuthTestResult> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      const result: AuthTestResult = {
        testName,
        passed: true,
        duration
      };
      
      this.results.push(result);
      console.log(`✅ ${testName} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const result: AuthTestResult = {
        testName,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      };
      
      this.results.push(result);
      console.error(`❌ ${testName} (${duration}ms): ${result.error}`);
      return result;
    }
  }

  /**
   * Test Supabase client creation
   */
  async testClientCreation(): Promise<AuthTestResult> {
    return this.runTest('Client Creation', async () => {
      const client = createClient();
      if (!client) {
        throw new Error('Failed to create Supabase client');
      }
      
      // Test client methods exist
      if (!client.auth || !client.from) {
        throw new Error('Client missing required methods');
      }
    });
  }

  /**
   * Test environment variables
   */
  async testEnvironmentVariables(): Promise<AuthTestResult> {
    return this.runTest('Environment Variables', async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        throw new Error('Missing required environment variables');
      }
      
      if (!url.startsWith('https://')) {
        throw new Error('Invalid Supabase URL format');
      }
      
      if (key.length < 100) {
        throw new Error('Supabase anon key appears invalid');
      }
    });
  }

  /**
   * Test database connectivity
   */
  async testDatabaseConnectivity(): Promise<AuthTestResult> {
    return this.runTest('Database Connectivity', async () => {
      const client = createClient();
      
      // Test a simple query to verify database connectivity
      const { count, error } = await client
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      if (typeof count !== 'number') {
        throw new Error('Database query returned invalid count');
      }
    });
  }

  /**
   * Test authentication flow (without actual login)
   */
  async testAuthFlow(): Promise<AuthTestResult> {
    return this.runTest('Auth Flow Structure', async () => {
      const client = createClient();
      
      // Test that auth methods exist
      if (!client.auth.signInWithPassword) {
        throw new Error('signInWithPassword method missing');
      }
      
      if (!client.auth.signUp) {
        throw new Error('signUp method missing');
      }
      
      if (!client.auth.signOut) {
        throw new Error('signOut method missing');
      }
      
      if (!client.auth.getUser) {
        throw new Error('getUser method missing');
      }
      
      if (!client.auth.getSession) {
        throw new Error('getSession method missing');
      }
    });
  }

  /**
   * Test session management
   */
  async testSessionManagement(): Promise<AuthTestResult> {
    return this.runTest('Session Management', async () => {
      const client = createClient();
      
      // Test getting current session (should work even if no user)
      const { data, error } = await client.auth.getSession();
      
      if (error) {
        throw new Error(`Session retrieval failed: ${error.message}`);
      }
      
      // Session can be null if no user is logged in, that's ok
      if (data.session && !data.session.user) {
        throw new Error('Session exists but user is missing');
      }
    });
  }

  /**
   * Test profile utilities
   */
  async testProfileUtilities(): Promise<AuthTestResult> {
    return this.runTest('Profile Utilities', async () => {
      // Import profile utilities
      const { profileSetupStatus } = await import('./profile-utils');
      
      // Test with null profile
      const nullResult = profileSetupStatus(null);
      if (nullResult.shouldSetupProfile !== false) {
        throw new Error('Null profile should not require setup');
      }
      
      // Test with complete profile
      const completeProfile: Profile = {
        id: 'test',
        email: 'test@example.com',
        full_name: 'Test User',
        bio: 'Test bio',
        skills: ['JavaScript'],
        industry: ['Tech'],
        profile_setup_completed: true
      };
      
      const completeResult = profileSetupStatus(completeProfile);
      if (completeResult.shouldSetupProfile !== false) {
        throw new Error('Complete profile should not require setup');
      }
    });
  }

  /**
   * Test API endpoints
   */
  async testAPIEndpoints(): Promise<AuthTestResult> {
    return this.runTest('API Endpoints', async () => {
      // Test debug endpoint
      const debugResponse = await fetch('/api/debug');
      if (!debugResponse.ok) {
        throw new Error(`Debug API returned ${debugResponse.status}`);
      }
      
      const debugData = await debugResponse.json();
      if (debugData.status !== 'ok') {
        throw new Error(`Debug API status: ${debugData.status}`);
      }
    });
  }

  /**
   * Run all authentication tests
   */
  async runAllTests(): Promise<AuthTestSuite> {
    console.log('🧪 Starting Authentication Test Suite...\n');
    
    this.results = []; // Reset results
    const startTime = Date.now();
    
    // Run all tests
    await this.testEnvironmentVariables();
    await this.testClientCreation();
    await this.testDatabaseConnectivity();
    await this.testAuthFlow();
    await this.testSessionManagement();
    await this.testProfileUtilities();
    
    // Only test API endpoints if we're in a browser environment
    if (typeof window !== 'undefined') {
      await this.testAPIEndpoints();
    }
    
    const totalDuration = Date.now() - startTime;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    
    const suite: AuthTestSuite = {
      suiteName: 'Authentication System',
      results: this.results,
      totalTests: this.results.length,
      passedTests,
      failedTests,
      totalDuration
    };
    
    console.log(`\n📊 Test Results: ${passedTests}/${suite.totalTests} passed (${totalDuration}ms)`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.testName}: ${result.error}`);
      });
    }
    
    return suite;
  }
}

/**
 * Authentication monitoring utilities
 */
export class AuthMonitor {
  private metrics: Map<string, number> = new Map();
  private errors: Array<{ timestamp: Date; error: string; context: string }> = [];
  
  /**
   * Record a metric
   */
  recordMetric(name: string, value: number) {
    this.metrics.set(name, value);
    console.log(`📈 Metric recorded: ${name} = ${value}`);
  }
  
  /**
   * Record an error
   */
  recordError(error: string, context: string) {
    this.errors.push({
      timestamp: new Date(),
      error,
      context
    });
    console.error(`🚨 Auth Error [${context}]: ${error}`);
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
  
  /**
   * Get recent errors
   */
  getRecentErrors(minutes: number = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errors.filter(e => e.timestamp > cutoff);
  }
  
  /**
   * Generate monitoring report
   */
  generateReport() {
    const recentErrors = this.getRecentErrors();
    
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      recentErrors: recentErrors.length,
      errors: recentErrors,
      status: recentErrors.length === 0 ? 'healthy' : 'issues'
    };
  }
}

// Export singleton instances
export const authTester = new AuthTester();
export const authMonitor = new AuthMonitor();

/**
 * Quick test function for development
 */
export async function quickAuthTest() {
  console.log('🔍 Running quick authentication test...');
  
  try {
    const client = createClient();
    const { data, error } = await client.auth.getSession();
    
    if (error) {
      console.error('❌ Auth test failed:', error.message);
      return false;
    }
    
    console.log('✅ Auth test passed - session retrieval works');
    console.log('📊 Current session:', data.session ? 'Active' : 'None');
    
    return true;
  } catch (error) {
    console.error('❌ Auth test exception:', error);
    return false;
  }
} 