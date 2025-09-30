import { Profile } from "./auth";

/**
 * Determines whether a user needs to complete their profile setup
 * based on their profile data and preferences
 * 
 * SIMPLIFIED LOGIC (Phase 3):
 * - If user has explicitly completed setup -> no setup needed
 * - If user has explicitly skipped setup -> no setup needed (respects user choice)
 * - If user lacks required data -> setup needed
 * - Otherwise -> no setup needed
 */
export function profileSetupStatus(user: Profile | null) {
  if (!user) {
    return {
      shouldSetupProfile: false,
      hasSkippedSetup: false,
      hasCompletedSetup: false,
    };
  }

  // If user has explicitly completed setup, respect that
  if (user.profile_setup_completed) {
    return {
      shouldSetupProfile: false,
      hasSkippedSetup: Boolean(user.profile_setup_skipped),
      hasCompletedSetup: true,
    };
  }

  // If user has explicitly skipped setup, respect that choice
  // No more "just logged in" override - this was causing infinite loops
  if (user.profile_setup_skipped) {
    return {
      shouldSetupProfile: false,
      hasSkippedSetup: true,
      hasCompletedSetup: false,
    };
  }

  // Check if they have the minimal required fields
  const hasRequiredData =
    user.full_name?.trim() !== "" &&
    user.full_name?.trim() !== "User" &&
    user.bio?.trim() !== "" &&
    user.email?.trim() !== "" &&
    Array.isArray(user.skills) &&
    user.skills.length > 0 && 
    Array.isArray(user.industry) &&
    user.industry.length > 0;

  // If they lack required data and haven't explicitly skipped, prompt for setup
  if (!hasRequiredData) {
    return {
      shouldSetupProfile: true,
      hasSkippedSetup: false,
      hasCompletedSetup: false,
    };
  }

  // If they have required data but haven't explicitly completed, 
  // mark as completed (this handles legacy users)
  return {
    shouldSetupProfile: false,
    hasSkippedSetup: false,
    hasCompletedSetup: true,
  };
}

/**
 * DEPRECATED: Removed unreliable timestamp-based login detection
 * This was causing infinite loops and timing issues
 * 
 * The "just logged in" concept is now handled by:
 * 1. Auth callback setting appropriate flags
 * 2. Profile setup status being determined by explicit user choices
 * 3. Respecting user's skip/complete preferences without override
 */
