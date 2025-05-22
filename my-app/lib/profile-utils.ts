import { User } from "./auth";

/**
 * Determines whether a user needs to complete their profile setup
 * based on their profile data and preferences
 */
export function profileSetupStatus(user: User | null, justLoggedIn = false) {
  if (!user) {
    return {
      shouldSetupProfile: false,
      hasSkippedSetup: false,
      hasCompletedSetup: false,
    };
  }

  // Do they actually have the minimal required fields?
  const hasRequiredData =
    user.full_name?.trim() !== "" &&
    user.bio?.trim() !== "" &&
    Array.isArray(user.skills) &&
    user.skills.length > 0;

  // If they lack real data, always prompt
  if (!hasRequiredData) {
    return {
      shouldSetupProfile: true,
      hasSkippedSetup: Boolean(user.profile_setup_skipped),
      hasCompletedSetup: false,
    };
  }

  // At this point they have enough data—so setup is done
  return {
    shouldSetupProfile: false,
    hasSkippedSetup: Boolean(user.profile_setup_skipped),
    hasCompletedSetup: true,
  };
}

/**
 * Checks if a user has just logged in (within the last minute)
 */
export function hasJustLoggedIn(user: User | null): boolean {
  if (!user || !user.last_login_at) {
    return false;
  }

  try {
    const loginTime = new Date(user.last_login_at).getTime();
    const now = new Date().getTime();

    // Consider "just logged in" if within the last minute
    return now - loginTime < 60000;
  } catch (err) {
    // If there's any error parsing the date, return false
    console.error("Error checking login time:", err);
    return false;
  }
}
