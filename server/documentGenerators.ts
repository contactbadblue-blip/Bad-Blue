// Document Generation Utilities for BadBlue Platform
// Provides functions for generating complaint documents and FOIA letters

interface SubmissionVenueInfo {
  venue: string;
  email: string;
  physicalAddress: string;
  recipients: string[];
}

interface FOIAGenerationResult {
  departmentAddress: string;
  foiaLetter: string;
  stateStatute: string;
  statutoryDeadline: string;
}

/**
 * Determine submission venue for complaints
 */
function determineEnhancedSubmissionVenue(
  state: string,
  city: string | null,
  county: string | null,
  incidentType: string,
): SubmissionVenueInfo {
  const seriousViolations = ["assault", "excessive-force", "misconduct"];

  // City-level routing
  if (city) {
    const cityLower = city.toLowerCase().replace(/\s+/g, "-");
    const stateLower = state.toLowerCase();

    if (seriousViolations.includes(incidentType)) {
      return {
        venue: `Internal Affairs (${city} Police Department), ${city} City Attorney`,
        email: `internalaffairs@${cityLower}pd.gov, cityattorney@${cityLower}.gov`,
        physicalAddress: `${city} Police Department - Internal Affairs Division, ${city}, ${state}`,
        recipients: [
          `Internal Affairs Division - ${city} Police Department`,
          `${city} City Attorney's Office`,
        ],
      };
    }

    if (incidentType === "discrimination" || incidentType === "harassment") {
      return {
        venue: `${city} Police Chief, Internal Affairs`,
        email: `chiefoffice@${cityLower}pd.gov, internalaffairs@${cityLower}pd.gov`,
        physicalAddress: `Office of the Police Chief, ${city} Police Department, ${city}, ${state}`,
        recipients: [
          `Police Chief - ${city} Police Department`,
          `Internal Affairs Division`,
        ],
      };
    }

    return {
      venue: `Internal Affairs (${city} Police Department)`,
      email: `internalaffairs@${cityLower}pd.gov`,
      physicalAddress: `Internal Affairs Division, ${city} Police Department, ${city}, ${state}`,
      recipients: [`Internal Affairs Division - ${city} Police Department`],
    };
  }

  // County-level routing
  if (county) {
    const countyLower = county.toLowerCase().replace(/\s+/g, "-");

    if (seriousViolations.includes(incidentType)) {
      return {
        venue: `County Sheriff Internal Affairs, ${county} County Attorney`,
        email: `sheriff.ia@${countyLower}-county.gov, countyattorney@${countyLower}-county.gov`,
        physicalAddress: `${county} County Sheriff's Office - Internal Affairs, ${county} County, ${state}`,
        recipients: [
          `Internal Affairs - ${county} County Sheriff's Office`,
          `${county} County Attorney's Office`,
        ],
      };
    }

    return {
      venue: `${county} County Sheriff`,
      email: `sheriff@${countyLower}-county.gov`,
      physicalAddress: `${county} County Sheriff's Office, ${county} County, ${state}`,
      recipients: [`${county} County Sheriff's Office`],
    };
  }

  // State-level routing
  const stateLower = state.toLowerCase().replace(/\s+/g, "");
  return {
    venue: `State Police Internal Affairs, ${state} Attorney General`,
    email: `statepolice.ia@${stateLower}.gov, ag.office@${stateLower}.gov`,
    physicalAddress: `State Police Internal Affairs Division, ${state}`,
    recipients: [
      `State Police Internal Affairs Division`,
      `Office of the Attorney General`,
    ],
  };
}

/**
 * Get state statutes for complaints
 */
function getStateStatutes(
  state: string,
  complaintType: string,
): { statutes: string[]; description: string } {
  // Default federal statutes that apply nationwide
  const federalStatutes = ["42 U.S.C. § 1983", "Fourth Amendment", "Fourteenth Amendment"];
  
  // Basic state-agnostic description based on complaint type
  const descriptions: Record<string, string> = {
    "assault": "Assault by peace officer, civil rights violation",
    "excessive-force": "Excessive use of force, federal civil rights claim",
    "discrimination": "Unlawful discrimination, civil rights violation",
    "harassment": "Harassment under color of law",
    "misconduct": "Official misconduct, abuse of authority",
    "false-arrest": "False arrest, unlawful detention",
    "illegal-search": "Fourth Amendment violation, illegal search and seizure"
  };

  return {
    statutes: federalStatutes,
    description: descriptions[complaintType] || "Civil rights violation under color of law"
  };
}

/**
 * Generate a formal complaint document
 */
export function generateComplaintDocument(
  state: string,
  complaintType: string,
  officerName: string,
  officerBadge: string | null,
  officerDepartment: string,
  incidentDescription: string,
  incidentDate: Date,
  city: string,
  county: string | null,
  complainantName: string | null,
  complainantAddress: string | null,
): string {
  const { statutes, description } = getStateStatutes(state, complaintType);
  const venueInfo = determineEnhancedSubmissionVenue(
    state,
    city,
    county,
    complaintType,
  );

  const dateStr = incidentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
FORMAL COMPLAINT


Name of Complainant: ${complainantName || "[Your Name]"}
Address of Complainant: ${complainantAddress || "[Your Address]"}


This is a formal complaint relating to the conduct of members of ${officerDepartment}.


1.) FACTUAL BACKGROUND:

Date of Incident: ${dateStr}
Location: ${city}, ${county ? `${county} County, ` : ""}${state}

Officer Information:
• Name: ${officerName}
${officerBadge ? `• Badge Number: ${officerBadge}` : ""}
• Department: ${officerDepartment}

Legal Framework:
This complaint is filed in accordance with the following statutes and legal provisions:
${statutes.map((s) => `• ${s}`).join("\n")}

Legal Basis: ${description}


2.) COMPLAINT:

Incident Type: ${complaintType.replace(/-/g, " ").toUpperCase()}

On ${dateStr}, the following incident occurred:

${incidentDescription}

The conduct described above constitutes a violation of department policies, professional standards, and potentially violates the following legal provisions:
${statutes.map((s) => `• ${s}`).join("\n")}

${description}


3.) Please contact me if you require any further information.


4.) SIGNATURE BLOCK

Electronically Signed By: ${complainantName || "[Your Name]"}

Date: ${new Date().toLocaleDateString("en-US")}

Contact Information:
${complainantAddress || "[Your Address]"}
[Your Phone Number]
[Your Email Address]


---

SUBMISSION INFORMATION:

This complaint should be submitted to the following authorities:
${venueInfo.recipients.map((r) => `• ${r}`).join("\n")}

Submission Details:
• Email: ${venueInfo.email}
• Physical Address: ${venueInfo.physicalAddress}
• Primary Venue: ${venueInfo.venue}

---

NOTICE: This complaint document has been automatically generated based on your submission. Please review carefully and ensure all information is accurate before submitting to the appropriate authorities. Add your phone number and email address to the contact information section above.
`;
}

/**
 * Generate a FOIA letter (simplified version without external API dependencies)
 */
export async function generateFOIALetter(
  state: string,
  agencyType: string,
  departmentName: string,
  officerName: string,
  recordsDescription: string,
  userFullName: string,
  userEmail: string,
  mailingAddress: string,
  incidentDate?: string,
  incidentTime?: string,
  incidentLocation?: string
): Promise<FOIAGenerationResult> {
  // Simplified version - generate standard department address format
  const departmentAddress = `${departmentName}
FOIA/Records Division
${state}`;

  // Standard state FOIA information (simplified)
  const stateStatutes: Record<string, { statute: string; deadline: string }> = {
    "CA": { statute: "Cal. Gov't Code § 6250 et seq.", deadline: "10 business days" },
    "TX": { statute: "Texas Gov't Code Ch. 552", deadline: "10 business days" },
    "FL": { statute: "Fla. Stat. § 119.01 et seq.", deadline: "reasonable time" },
    "NY": { statute: "N.Y. Pub. Off. Law § 84-90", deadline: "5 business days" },
    // Add more states as needed
  };

  const stateInfo = stateStatutes[state.toUpperCase()] || {
    statute: `${state} Open Records Act`,
    deadline: "statutory deadline"
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const foiaLetter = `${today}

${departmentAddress}

RE: PUBLIC RECORDS REQUEST UNDER ${stateInfo.statute}

To Whom It May Concern:

Pursuant to ${stateInfo.statute}, I hereby request the following records:

OFFICER INFORMATION:
• Officer Name: ${officerName}
• Department: ${departmentName}
${incidentDate ? `• Incident Date: ${incidentDate}` : ""}
${incidentTime ? `• Incident Time: ${incidentTime}` : ""}
${incidentLocation ? `• Incident Location: ${incidentLocation}` : ""}

RECORDS REQUESTED:
${recordsDescription}

Specifically, I am requesting:
• All complaints filed against ${officerName}
• All use of force reports involving ${officerName}
• Training records for ${officerName}
• Disciplinary records for ${officerName}
• Body camera footage ${incidentDate ? `from ${incidentDate}` : "involving this officer"}
• Incident reports ${incidentDate ? `from ${incidentDate}` : "involving this officer"}
• Any other records related to the above-described incident or officer

FORMAT PREFERENCE:
I prefer to receive these records in electronic format via email at ${userEmail}. If electronic format is not available, please send copies to:

${userFullName}
${mailingAddress}

FEE WAIVER REQUEST:
I request a waiver of all fees for this request. Disclosure of the requested information is in the public interest and will contribute significantly to public understanding of police operations and accountability.

If my request is denied in whole or part, I ask that you justify all deletions by reference to specific exemptions of the open records act. I will also expect you to release all segregable portions of otherwise exempt material.

Please acknowledge receipt of this request within the statutory timeframe of ${stateInfo.deadline}. I look forward to your response.

Thank you for your assistance.

Sincerely,

${userFullName}
${userEmail}
${mailingAddress}`;

  return {
    departmentAddress,
    foiaLetter,
    stateStatute: stateInfo.statute,
    statutoryDeadline: stateInfo.deadline
  };
}