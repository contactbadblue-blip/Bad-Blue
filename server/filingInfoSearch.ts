import { generateText, createTaskMetadata, UsageContext, TaskPriority, TaskComplexity } from "./aiProvider";
import { rateLimitTracker } from "./rateLimitTracker";
import { isGroqAvailable, generateGroqStructuredResponse } from "./groq";
import { safeJsonParse } from "./jsonParser";

export interface FilingInfo {
  filingFee: number; // in cents
  eFilingPortalUrl: string;
  eFilingPortalName: string;
  filingInstructions: string;
  clerkOfCourtAddress: string; // Physical address when e-filing unavailable
}

export async function searchStateFilingInfo(state: string, city?: string): Promise<FilingInfo> {
  const locationInfo = city ? `${city}, ${state}` : state;

  const prompt = `You are a legal research assistant. Find the current, accurate information for filing a civil rights lawsuit (42 USC 1983) in ${state} state court${city ? ` for cases in ${city}` : ''}.

REQUIRED INFORMATION:
1. Filing fee amount for civil rights cases in ${state} state court (provide exact dollar amount)
2. Official e-filing portal URL for ${state} state courts (must be official .gov website, or empty string if not available)
3. Official name of the e-filing portal system (or empty string if e-filing not available)
4. Step-by-step filing instructions specific to ${state}
5. Physical address of the Clerk of Court for ${locationInfo} (include full mailing address with zip code)

SEARCH REQUIREMENTS:
- Use current ${new Date().getFullYear()} information
- Verify information is from official state court websites (.gov domains)
- Include specific dollar amounts for filing fees
- Provide complete, functional URLs to e-filing portals (or empty string if unavailable)
- If e-filing is not available in ${state}, make sure to provide the complete physical clerk of court address

Return your findings in this EXACT JSON format:
{
  "filingFeeDollars": <number>,
  "eFilingPortalUrl": "<complete URL or empty string>",
  "eFilingPortalName": "<official system name or empty string>",
  "filingInstructions": "<detailed step-by-step instructions>",
  "clerkOfCourtAddress": "<full physical mailing address with zip code>"
}

Be thorough and accurate. Lives depend on this information being correct.`;

  try {
    console.log('[Filing Info Search] Using 4-way AI collaboration');
    
    // Create task metadata for legal research (user-triggered, critical, comprehensive)
    const task = createTaskMetadata(
      'filing-info-search',
      UsageContext.USER,
      TaskPriority.CRITICAL_USER,
      TaskComplexity.COMPREHENSIVE
    );
    
    const response = await generateText(task, prompt);
    
    if (!response.content) {
      throw new Error('Empty response from AI provider');
    }

    console.log(`Filing info search response for ${state}:`, response.content);
    const data = safeJsonParse(response.content, `filing info search for ${state}`);
    
    // Convert dollars to cents
    const filingFeeCents = Math.round((data.filingFeeDollars || 0) * 100);
    
    rateLimitTracker.recordSuccess();
    return {
      filingFee: filingFeeCents,
      eFilingPortalUrl: data.eFilingPortalUrl || '',
      eFilingPortalName: data.eFilingPortalName || '',
      filingInstructions: data.filingInstructions || 'Please consult with a local attorney for filing instructions.',
      clerkOfCourtAddress: data.clerkOfCourtAddress || ''
    };
  } catch (error: any) {
    console.error('[Filing Info Search] AI generation error:', error);
    rateLimitTracker.recordError(error);
    
    // Final fallback: default information
    return {
      filingFee: 0, // Unknown, user should verify
      eFilingPortalUrl: '',
      eFilingPortalName: '',
      filingInstructions: `To file your lawsuit in ${state}, please consult with a local attorney or contact your state court clerk for specific filing requirements, fees, and e-filing portal information.`,
      clerkOfCourtAddress: 'Contact your local court clerk for address information.'
    };
  }
}
