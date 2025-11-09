
import { GoogleGenAI } from "@google/genai";
import { rateLimitTracker } from "./rateLimitTracker";
import { isGroqAvailable, generateGroqLegalDocument } from "./groq";

let gemini: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!gemini) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return gemini;
}

export interface TortNoticeData {
  state: string;
  claimantName: string;
  claimantAddress: string;
  claimantEmail: string;
  officerName: string;
  officerBadge: string;
  department: string;
  city: string;
  county: string | null;
  incidentDate: Date;
  incidentDescription: string;
  damagesAmount?: number;
  injuryDetails?: string;
}

/**
 * Generate a legally-formatted tort claim notice using Gemini (primary) with Groq fallback
 */
export async function generateTortNotice(data: TortNoticeData): Promise<string> {
  const incidentDateStr = data.incidentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const damagesFormatted = data.damagesAmount 
    ? `$${data.damagesAmount.toLocaleString('en-US')}`
    : 'To be determined';

  const context = {
    state: data.state,
    claimantName: data.claimantName,
    claimantAddress: data.claimantAddress,
    claimantEmail: data.claimantEmail,
    incidentDate: incidentDateStr,
    location: `${data.city}${data.county ? `, ${data.county} County` : ''}, ${data.state}`,
    officerName: data.officerName,
    officerBadge: data.officerBadge,
    department: data.department,
    incidentDescription: data.incidentDescription,
    injuryDetails: data.injuryDetails || 'N/A',
    damagesClaimed: damagesFormatted,
  };

  const instructions = `Use proper legal format for ${data.state} tort claim notices. Include all required elements per ${data.state} state law. Use professional, formal legal language. Clearly state the claim and basis for liability. Reference relevant ${data.state} tort claim act provisions. Include proper notice language and deadlines. Include demand for relief/damages and signature line for claimant.`;

  // Smart provider selection: Use Groq if Gemini is near rate limit
  const shouldUseGroq = rateLimitTracker.shouldUseGroq() && isGroqAvailable();

  if (shouldUseGroq) {
    try {
      console.log('[Tort Notice] Using Groq (Gemini near limit or experiencing errors)');
      const result = await generateGroqLegalDocument('Tort Claim Notice', context, instructions);
      return result;
    } catch (groqError) {
      console.error('[Tort Notice] Groq error, falling back to Gemini:', groqError);
      // Fall through to Gemini
    }
  }

  // Try Gemini (primary)
  try {
    console.log('[Tort Notice] Using Gemini');
    const client = getGeminiClient();
    const prompt = `Generate a formal tort claim notice for filing with a government entity in ${data.state}.

CLAIMANT INFORMATION:
Name: ${data.claimantName}
Address: ${data.claimantAddress}
Email: ${data.claimantEmail}

INCIDENT DETAILS:
Date of Incident: ${incidentDateStr}
Location: ${data.city}${data.county ? `, ${data.county} County` : ''}, ${data.state}
Involved Officer: ${data.officerName}, Badge #${data.officerBadge}
Department: ${data.department}

INCIDENT DESCRIPTION:
${data.incidentDescription}

${data.injuryDetails ? `INJURIES SUSTAINED:\n${data.injuryDetails}\n` : ''}
DAMAGES CLAIMED: ${damagesFormatted}

REQUIREMENTS:
1. Use proper legal format for ${data.state} tort claim notices
2. Include all required elements per ${data.state} state law
3. Professional, formal legal language
4. Clearly state the claim and basis for liability
5. Reference relevant ${data.state} tort claim act provisions
6. Include proper notice language and deadlines
7. Demand for relief/damages
8. Signature line for claimant

Generate a complete, legally-formatted tort claim notice document that meets ${data.state} requirements.`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        temperature: 0.3,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = response.text;
    
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    rateLimitTracker.recordSuccess();
    return text;
  } catch (geminiError: any) {
    console.error('[Tort Notice] Gemini error:', geminiError);
    rateLimitTracker.recordError(geminiError);
    
    // Fallback to Groq if available
    if (isGroqAvailable()) {
      try {
        console.log('[Tort Notice] Falling back to Groq');
        const result = await generateGroqLegalDocument('Tort Claim Notice', context, instructions);
        return result;
      } catch (groqError) {
        console.error('[Tort Notice] Groq fallback also failed:', groqError);
      }
    }
    
    // Final fallback: basic template
    return generateBasicTortNotice(data);
  }
}

/**
 * Generate a basic tort notice as fallback
 */
function generateBasicTortNotice(data: TortNoticeData): string {
  const incidentDateStr = data.incidentDate.toLocaleDateString('en-US');
  const damagesFormatted = data.damagesAmount 
    ? `$${data.damagesAmount.toLocaleString('en-US')}`
    : 'To be determined';

  return `
NOTICE OF TORT CLAIM

TO: ${data.department}
${data.city}${data.county ? `, ${data.county} County` : ''}, ${data.state}

FROM: ${data.claimantName}
${data.claimantAddress}
${data.claimantEmail}

DATE: ${new Date().toLocaleDateString('en-US')}

NOTICE IS HEREBY GIVEN that the undersigned claimant intends to file a claim against ${data.department} for damages arising from an incident that occurred on ${incidentDateStr}.

INCIDENT DETAILS:
Date: ${incidentDateStr}
Location: ${data.city}, ${data.state}
Officer(s) Involved: ${data.officerName}, Badge #${data.officerBadge}

DESCRIPTION OF INCIDENT:
${data.incidentDescription}

${data.injuryDetails ? `INJURIES SUSTAINED:\n${data.injuryDetails}\n` : ''}

DAMAGES CLAIMED: ${damagesFormatted}

This notice is provided in accordance with ${data.state} tort claim notice requirements. The claimant reserves all rights and remedies available under law.

Respectfully submitted,

_____________________________
${data.claimantName}
Date: _______________
`;
}
