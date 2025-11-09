/**
 * Tort Notice Requirements Service
 * 
 * Determines whether a state requires tort claim notice before filing
 * a lawsuit against a government entity or law enforcement officer.
 */

interface TortNoticeRequirement {
  required: boolean;
  deadlineDays: number; // Days within which notice must be filed after incident
  recipientAgency: string; // Agency to send notice to
  recipientEmail?: string; // Email address if available
  notes: string;
}

/**
 * State-specific tort claim notice requirements
 * Many states require notice before suing government entities
 */
const STATE_TORT_REQUIREMENTS: Record<string, TortNoticeRequirement> = {
  // States with tort claim notice requirements
  CA: {
    required: true,
    deadlineDays: 180, // 6 months for California Government Claims Act
    recipientAgency: "State Board of Control / County/City Clerk",
    notes: "California requires filing a Government Claim Form before lawsuit. Claim must be filed within 6 months of incident for personal injury.",
  },
  NY: {
    required: true,
    deadlineDays: 90,
    recipientAgency: "City Comptroller / County Attorney",
    notes: "New York requires Notice of Claim within 90 days for claims against municipalities.",
  },
  TX: {
    required: true,
    deadlineDays: 180,
    recipientAgency: "City Attorney / County Attorney",
    notes: "Texas Tort Claims Act requires notice within 6 months for claims against governmental units.",
  },
  FL: {
    required: true,
    deadlineDays: 180,
    recipientAgency: "State Attorney General / City/County Attorney",
    notes: "Florida Tort Claims Act requires written notice within 3 years, but 180 days recommended.",
  },
  IL: {
    required: true,
    deadlineDays: 365,
    recipientAgency: "City/County Clerk",
    notes: "Illinois Local Governmental and Governmental Employees Tort Immunity Act requires notice within 1 year.",
  },
  WA: {
    required: true,
    deadlineDays: 120,
    recipientAgency: "City/County Attorney",
    notes: "Washington requires notice within 120 days for claims against local governments.",
  },
  NJ: {
    required: true,
    deadlineDays: 90,
    recipientAgency: "Public Entity",
    notes: "New Jersey Tort Claims Act requires notice within 90 days.",
  },
  GA: {
    required: true,
    deadlineDays: 365,
    recipientAgency: "Governing Authority",
    notes: "Georgia requires ante litem notice within 12 months for claims against local governments.",
  },
  OH: {
    required: true,
    deadlineDays: 180,
    recipientAgency: "Political Subdivision",
    notes: "Ohio requires written notice within 180 days for claims against political subdivisions.",
  },
  MI: {
    required: true,
    deadlineDays: 120,
    recipientAgency: "Governmental Agency",
    notes: "Michigan requires notice within 120 days for highway defect claims and other governmental liability claims.",
  },

  // States without specific tort claim notice requirements (or not strict)
  AZ: {
    required: false,
    deadlineDays: 0,
    recipientAgency: "N/A",
    notes: "Arizona does not require pre-lawsuit tort claim notice for most claims.",
  },
  CO: {
    required: false,
    deadlineDays: 0,
    recipientAgency: "N/A",
    notes: "Colorado Governmental Immunity Act does not require advance notice.",
  },
  // Add more states as needed
};

/**
 * Determine if tort claim notice is required for a lawsuit
 */
export function isTortNoticeRequired(state: string): TortNoticeRequirement {
  const stateCode = state.toUpperCase();

  // Return state-specific requirement if exists
  if (STATE_TORT_REQUIREMENTS[stateCode]) {
    return STATE_TORT_REQUIREMENTS[stateCode];
  }

  // Default: assume notice may be required (conservative approach)
  return {
    required: true,
    deadlineDays: 180,
    recipientAgency: "City/County Attorney or State Attorney General",
    notes: `${state} tort claim notice requirements not fully documented. Consult with a local attorney to determine if notice is required before filing lawsuit.`,
  };
}

/**
 * Determine the agency email to send tort notice to
 * This attempts to find the appropriate agency based on the jurisdiction
 */
export function determineTortNoticeRecipient(
  state: string,
  city: string,
  county: string | null,
  agencyType: 'police' | 'sheriff' | 'trooper'
): { agency: string; email?: string } {
  const requirement = isTortNoticeRequired(state);

  if (!requirement.required) {
    return {
      agency: 'N/A - Tort notice not required',
    };
  }

  // Construct agency name based on type
  let agency = '';
  if (agencyType === 'sheriff') {
    agency = `${county || city} County Attorney / County Clerk`;
  } else if (agencyType === 'trooper') {
    agency = `${state} Attorney General`;
  } else {
    agency = `${city} City Attorney / City Clerk`;
  }

  return {
    agency,
    // Email will be determined via jurisdiction lookup in the database
  };
}