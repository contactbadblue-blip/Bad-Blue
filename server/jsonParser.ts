/**
 * Shared JSON parsing utility with auto-correction for common AI response issues
 * Handles:
 * - JSON wrapped in markdown code blocks
 * - Extra text before/after JSON
 * - Unterminated strings (attempts fix)
 */
export function safeJsonParse<T = any>(rawJson: string, errorContext: string): T {
  if (!rawJson || !rawJson.trim()) {
    throw new Error(`${errorContext}: Empty response`);
  }

  // Try direct parse first
  try {
    return JSON.parse(rawJson);
  } catch (firstError: any) {
    console.log(`[JSON Parser] Direct JSON parse failed for ${errorContext}, attempting recovery...`);
    
    // Try to extract JSON from markdown code blocks
    let cleanedJson = rawJson.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    // Try to find JSON object boundaries
    const firstBrace = cleanedJson.indexOf('{');
    const lastBrace = cleanedJson.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
      
      try {
        return JSON.parse(cleanedJson);
      } catch (secondError: any) {
        // Last attempt: try to fix unterminated strings by closing them
        const fixedJson = cleanedJson.replace(/"([^"]*?)$/gm, '"$1"');
        try {
          return JSON.parse(fixedJson);
        } catch (finalError: any) {
          console.error(`[JSON Parser] All recovery attempts failed for ${errorContext}`);
          console.error(`Original response: ${rawJson.substring(0, 200)}...`);
          throw new Error(`${errorContext}: Failed to parse JSON - ${firstError.message}`);
        }
      }
    }
    
    console.error(`[JSON Parser] No JSON boundaries found in ${errorContext}`);
    console.error(`Original response: ${rawJson.substring(0, 200)}...`);
    throw new Error(`${errorContext}: No valid JSON found - ${firstError.message}`);
  }
}
