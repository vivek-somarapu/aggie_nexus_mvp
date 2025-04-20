// Tests for profile setup flow

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the User type
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  bio: '',
  skills: [],
  profile_setup_skipped: false,
  profile_setup_completed: false,
  last_login_at: null
};

// Mock these dependencies
vi.mock('@/lib/auth', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    isLoading: false
  }))
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  })),
  usePathname: vi.fn(() => '/profile')
}));

// Import after mocks
import { profileSetupStatus, hasJustLoggedIn } from '@/lib/profile-utils';

describe('Profile Setup Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset user state for each test
    mockUser.bio = '';
    mockUser.skills = [];
    mockUser.profile_setup_skipped = false;
    mockUser.profile_setup_completed = false;
    mockUser.last_login_at = null;
  });

  it('should identify a user who needs to complete profile setup', () => {
    const result = profileSetupStatus(mockUser);
    expect(result.shouldSetupProfile).toBe(true);
    expect(result.hasSkippedSetup).toBe(false);
    expect(result.hasCompletedSetup).toBe(false);
  });

  it('should respect the skip preference for returning users', () => {
    mockUser.profile_setup_skipped = true;
    
    // If not just logged in, shouldSetupProfile should be false
    const result = profileSetupStatus(mockUser, false);
    expect(result.shouldSetupProfile).toBe(false);
    expect(result.hasSkippedSetup).toBe(true);
  });

  it('should show profile setup again after login if previously skipped', () => {
    mockUser.profile_setup_skipped = true;
    
    // When justLoggedIn is true, shouldSetupProfile should be true even if skipped
    const result = profileSetupStatus(mockUser, true);
    expect(result.shouldSetupProfile).toBe(true);
    expect(result.hasSkippedSetup).toBe(true);
  });

  it('should not show profile setup if profile is complete', () => {
    mockUser.profile_setup_completed = true;
    
    // When profile is explicitly completed, shouldSetupProfile should be false
    // regardless of other factors
    const result = profileSetupStatus(mockUser, true);
    expect(result.shouldSetupProfile).toBe(false);
    expect(result.hasCompletedSetup).toBe(true);
  });
  
  it('should correctly detect when a user has just logged in', () => {
    // Test with no login timestamp
    expect(hasJustLoggedIn(mockUser)).toBe(false);
    
    // Test with old login timestamp (more than a minute ago)
    const oldDate = new Date();
    oldDate.setMinutes(oldDate.getMinutes() - 5);
    mockUser.last_login_at = oldDate.toISOString();
    expect(hasJustLoggedIn(mockUser)).toBe(false);
    
    // Test with recent login timestamp (less than a minute ago)
    const recentDate = new Date();
    recentDate.setSeconds(recentDate.getSeconds() - 30);
    mockUser.last_login_at = recentDate.toISOString();
    expect(hasJustLoggedIn(mockUser)).toBe(true);
  });
}); 