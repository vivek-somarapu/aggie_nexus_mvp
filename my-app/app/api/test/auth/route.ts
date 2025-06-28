import { NextResponse } from 'next/server';
import { authTester } from '@/lib/auth-testing';

/**
 * Authentication Testing API Endpoint (Phase 5)
 * 
 * Runs comprehensive authentication tests and returns results
 * Useful for CI/CD pipelines and health monitoring
 */
export async function GET() {
  try {
    console.log('🧪 Running authentication test suite via API...');
    
    // Run the comprehensive test suite
    const testSuite = await authTester.runAllTests();
    
    // Determine HTTP status based on test results
    const status = testSuite.failedTests === 0 ? 200 : 500;
    
    return NextResponse.json({
      success: testSuite.failedTests === 0,
      testSuite,
      summary: {
        total: testSuite.totalTests,
        passed: testSuite.passedTests,
        failed: testSuite.failedTests,
        duration: testSuite.totalDuration,
        status: testSuite.failedTests === 0 ? 'healthy' : 'unhealthy'
      }
    }, { status });
    
  } catch (error) {
    console.error('Authentication test suite failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      summary: {
        status: 'error'
      }
    }, { status: 500 });
  }
}

/**
 * Quick health check endpoint
 */
export async function POST() {
  try {
    const { quickAuthTest } = await import('@/lib/auth-testing');
    const result = await quickAuthTest();
    
    return NextResponse.json({
      success: result,
      timestamp: new Date().toISOString(),
      status: result ? 'healthy' : 'unhealthy'
    }, { status: result ? 200 : 500 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }, { status: 500 });
  }
} 