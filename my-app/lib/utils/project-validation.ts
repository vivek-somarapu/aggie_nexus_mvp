import { canUserClaimProgram, getAvailableProgramsForUser } from '@/lib/constants';

/**
 * Validates if a user can claim their project is part of specific incubator/accelerator programs
 * based on their organization affiliations
 */
export interface ProjectValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  availablePrograms: string[];
}

/**
 * Validates project incubator/accelerator claims against user organizations
 */
export const validateProjectPrograms = (
  userOrganizations: string[],
  projectPrograms: string[]
): ProjectValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const availablePrograms = getAvailableProgramsForUser(userOrganizations);

  // Check each program the user is trying to claim
  for (const program of projectPrograms) {
    if (!canUserClaimProgram(userOrganizations, program)) {
      errors.push(
        `You cannot claim "${program}" because you are not affiliated with the required organization. ` +
        `Please update your profile to include the necessary organization affiliation.`
      );
    }
  }

  // Warn if user has available programs they're not using
  const unusedPrograms = availablePrograms.filter(
    program => !projectPrograms.includes(program)
  );
  
  if (unusedPrograms.length > 0 && projectPrograms.length === 0) {
    warnings.push(
      `You are eligible to claim these programs: ${unusedPrograms.join(', ')}. ` +
      `Consider adding them to showcase your project's affiliations.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    availablePrograms
  };
};

/**
 * Gets a user-friendly message explaining why a program cannot be claimed
 */
export const getProgramClaimExplanation = (program: string): string => {
  const explanations: Record<string, string> = {
    'Aggies Create Incubator': 'To claim "Aggies Create Incubator", you must be affiliated with "Aggies Create" in your profile.',
    'AggieX Accelerator': 'To claim "AggieX Accelerator", you must be affiliated with "AggieX" in your profile.',
    'Startup Aggieland': 'To claim "Startup Aggieland", you must be affiliated with "Startup Aggieland" in your profile.',
    'Texas A&M Innovation': 'To claim "Texas A&M Innovation", you must be affiliated with "Texas A&M Innovation" in your profile.',
    'Mays Business School Programs': 'To claim "Mays Business School Programs", you must be affiliated with "Mays Business School" in your profile.',
    'Engineering Entrepreneurship Programs': 'To claim "Engineering Entrepreneurship Programs", you must be affiliated with "Engineering Entrepreneurship" in your profile.'
  };

  return explanations[program] || `To claim "${program}", you must be affiliated with the required organization in your profile.`;
};

/**
 * Validates project data before submission
 */
export const validateProjectSubmission = (
  projectData: any,
  userOrganizations: string[]
): ProjectValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate incubator/accelerator programs
  if (projectData.incubator_accelerator && projectData.incubator_accelerator.length > 0) {
    const programValidation = validateProjectPrograms(userOrganizations, projectData.incubator_accelerator);
    errors.push(...programValidation.errors);
    warnings.push(...programValidation.warnings);
  }

  // Validate organizations
  if (projectData.organizations && projectData.organizations.length > 0) {
    // Check if project organizations match user organizations
    const userOrgSet = new Set(userOrganizations);
    const projectOrgs = projectData.organizations.filter((org: string) => !userOrgSet.has(org));
    
    if (projectOrgs.length > 0) {
      warnings.push(
        `You're claiming project affiliation with organizations not in your profile: ${projectOrgs.join(', ')}. ` +
        `Consider updating your profile to include these organizations.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    availablePrograms: getAvailableProgramsForUser(userOrganizations)
  };
}; 