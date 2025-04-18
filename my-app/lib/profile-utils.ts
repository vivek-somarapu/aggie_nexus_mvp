import { User } from './auth';

/**
 * Determines whether a user needs to complete their profile setup
 * based on their profile data and preferences
 */
export function profileSetupStatus(user: User | null, justLoggedIn = false) {
  if (!user) {
    return {
      shouldSetupProfile: false,
      hasSkippedSetup: false,
      hasCompletedSetup: false
    };
  }

  // Check if user has explicitly completed their profile
  if (user.profile_setup_completed) {
    return {
      shouldSetupProfile: false,
      hasSkippedSetup: false,
      hasCompletedSetup: true
    };
  }

  // Check if user has skipped profile setup
  if (user.profile_setup_skipped) {
    // Only prompt again if they just logged in
    return {
      shouldSetupProfile: justLoggedIn,
      hasSkippedSetup: true,
      hasCompletedSetup: false
    };
  }

  // Check if they have sufficient profile data
  const hasRequiredProfileData = !!(
    user.bio && 
    user.skills && 
    user.skills.length > 0
  );

  return {
    shouldSetupProfile: !hasRequiredProfileData,
    hasSkippedSetup: false,
    hasCompletedSetup: hasRequiredProfileData
  };
}

/**
 * Checks if a user has just logged in (within the last minute)
 */
export function hasJustLoggedIn(user: User | null) {
  if (!user || !user.last_login_at) {
    return false;
  }

  const loginTime = new Date(user.last_login_at).getTime();
  const now = new Date().getTime();
  
  // Consider "just logged in" if within the last minute
  return now - loginTime < 60000;
}