import Anthropic from '@anthropic-ai/sdk';
import { Obligation, InsertObligation } from '@shared/schema';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Type for the obligation extraction response
interface ExtractedObligationsResponse {
  obligations: {
    text: string; // One sentence summary of the obligation
    type: string;
    start_date?: string;
    due_date?: string;
    responsible_party?: string;
    priority?: string;
    original_text: string; // Exact wording from the contract
    clause_number?: string; // Clause number from the contract
    section_name?: string; // Section name from the contract
    page_number?: number;
    confidence_score: number;
  }[];
}

// Helper function to safely parse JSON with multiple fallback methods
function safeJsonParse(jsonString: string): ExtractedObligationsResponse {
  console.log("Starting to parse JSON response from Anthropic");
  
  // First try: Handle markdown code blocks
  let cleanJson = jsonString;
  if (cleanJson.includes('```json')) {
    cleanJson = cleanJson.replace(/```json\n|\n```/g, '');
  } else if (cleanJson.includes('```')) {
    cleanJson = cleanJson.replace(/```\n|\n```/g, '');
  }
  
  // Extract only content between first { and last }
  const firstBrace = cleanJson.indexOf('{');
  const lastBrace = cleanJson.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
  }
  
  // Fix common JSON syntax issues
  cleanJson = cleanJson
    // Remove trailing commas before closing brackets
    .replace(/,(\s*[\]}])/g, '$1')
    // Remove non-ASCII characters
    .replace(/[^\x00-\x7F]+/g, '')
    // Quote unquoted keys
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
    // Fix mismatched quotes
    .replace(/([{,][^{}:,]*?)"([^"]*?)'([^{}:,]*?:)/g, '$1"$2"$3')
    .replace(/([{,][^{}:,]*?)'([^']*?)"([^{}:,]*?:)/g, '$1"$2"$3');
    
  try {
    // First attempt: direct parsing
    return JSON.parse(cleanJson) as ExtractedObligationsResponse;
  } catch (error) {
    console.log("First parsing attempt failed, trying alternative methods...");
    
    try {
      // Second attempt: Manually extract obligations array pattern
      const obligationsMatch = cleanJson.match(/"obligations"\s*:\s*\[([\s\S]*?)\](?=\s*\})/);
      if (obligationsMatch && obligationsMatch[1]) {
        const obligationsArrayRaw = obligationsMatch[1];
        
        // Try to extract individual obligations by pattern matching
        const obligationObjects: any[] = [];
        let currentObject = '';
        let braceCount = 0;
        let inObject = false;
        
        for (let i = 0; i < obligationsArrayRaw.length; i++) {
          const char = obligationsArrayRaw[i];
          
          if (char === '{') {
            inObject = true;
            braceCount++;
            currentObject += char;
          } else if (char === '}') {
            braceCount--;
            currentObject += char;
            
            if (braceCount === 0 && inObject) {
              try {
                // Try to parse the individual obligation
                const obligation = JSON.parse(currentObject);
                obligationObjects.push(obligation);
                currentObject = '';
                inObject = false;
              } catch (objError) {
                // Skip this object if it can't be parsed
                currentObject = '';
                inObject = false;
              }
            }
          } else if (inObject) {
            currentObject += char;
          }
        }
        
        return { obligations: obligationObjects };
      }
      
      throw new Error("No obligations array found");
    } catch (secError) {
      console.error("Second parsing attempt failed", secError);
      
      // Last resort: Try to use a regex-based approach to extract obligation objects
      try {
        const obligationMatches = cleanJson.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g) || [];
        const obligations = obligationMatches
          .map(objStr => {
            try {
              // Try to fix and parse each potential obligation object
              const fixedStr = objStr
                .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
                .replace(/:\s*'([^']*)'/g, ':"$1"')
                .replace(/,(\s*[\]}])/g, '$1');
              return JSON.parse(fixedStr);
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean)
          .filter(obj => obj.text && obj.type); // Must have at least these fields
        
        if (obligations.length > 0) {
          return { obligations };
        }
        
        throw new Error("Could not extract valid obligations");
      } catch (finalError) {
        console.error("All parsing attempts failed", finalError);
        throw new Error('Failed to parse API response. The JSON structure was invalid.');
      }
    }
  }
}

// Create a simpler version of the safeJsonParse function for single objects
function safeJsonParseSimple(jsonString: string): any {
  console.log("Starting to parse simple JSON response from Anthropic");
  
  // First try: Handle markdown code blocks
  let cleanJson = jsonString;
  if (cleanJson.includes('```json')) {
    cleanJson = cleanJson.replace(/```json\n|\n```/g, '');
  } else if (cleanJson.includes('```')) {
    cleanJson = cleanJson.replace(/```\n|\n```/g, '');
  }
  
  // Extract only content between first { and last }
  const firstBrace = cleanJson.indexOf('{');
  const lastBrace = cleanJson.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
  }
  
  // Fix common JSON syntax issues
  cleanJson = cleanJson
    // Remove trailing commas before closing brackets
    .replace(/,(\s*[\]}])/g, '$1')
    // Remove non-ASCII characters
    .replace(/[^\x00-\x7F]+/g, '')
    // Quote unquoted keys
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
    // Fix mismatched quotes
    .replace(/([{,][^{}:,]*?)"([^"]*?)'([^{}:,]*?:)/g, '$1"$2"$3')
    .replace(/([{,][^{}:,]*?)'([^']*?)"([^{}:,]*?:)/g, '$1"$2"$3');
  
  try {
    // First attempt: direct parsing
    return JSON.parse(cleanJson);
  } catch (error) {
    console.log("First parsing attempt failed, trying alternative methods...");
    
    // Last resort: Rebuild a minimal valid JSON object with the fields we need
    try {
      const typeMatch = cleanJson.match(/"type"\s*:\s*"([^"]*)"/);
      const startDateMatch = cleanJson.match(/"start_date"\s*:\s*"([^"]*)"/);
      const dueDateMatch = cleanJson.match(/"due_date"\s*:\s*"([^"]*)"/);
      const responsiblePartyMatch = cleanJson.match(/"responsible_party"\s*:\s*"([^"]*)"/);
      const priorityMatch = cleanJson.match(/"priority"\s*:\s*"([^"]*)"/);
      const confidenceScoreMatch = cleanJson.match(/"confidence_score"\s*:\s*(\d+)/);
      const clauseNumberMatch = cleanJson.match(/"clause_number"\s*:\s*"([^"]*)"/);
      const sectionNameMatch = cleanJson.match(/"section_name"\s*:\s*"([^"]*)"/);
      
      // Construct a valid minimal object
      const result: any = {
        type: typeMatch ? typeMatch[1] : 'other',
        confidence_score: confidenceScoreMatch ? parseInt(confidenceScoreMatch[1]) : 50
      };
      
      if (startDateMatch) result.start_date = startDateMatch[1];
      if (dueDateMatch) result.due_date = dueDateMatch[1];
      if (responsiblePartyMatch) result.responsible_party = responsiblePartyMatch[1];
      if (priorityMatch) result.priority = priorityMatch[1];
      if (clauseNumberMatch) result.clause_number = clauseNumberMatch[1];
      if (sectionNameMatch) result.section_name = sectionNameMatch[1];
      
      return result;
    } catch (finalError) {
      console.error("All parsing attempts failed", finalError);
      throw new Error('Failed to parse API response. The JSON structure was invalid.');
    }
  }
}

export async function extractObligations(text: string, documentId: number): Promise<InsertObligation[]> {
  if (!text || text.trim() === '') {
    throw new Error('No text provided for obligation extraction');
  }

  try {
    const systemPrompt = `
      You are an expert legal analyst specializing in contract obligation extraction. 
      Your task is to identify and extract key contractual obligations from the provided document.
      
      For each obligation, extract:
      1. Text - A one-sentence summary of the obligation (make this concise and clear)
      2. Type - Categorize as: payment, delivery, reporting, compliance, renewal, termination, or other
      3. Start date - When the obligation starts (if specified)
      4. Due date - When the obligation must be fulfilled (if specified)
      5. Responsible party - Who is responsible for fulfilling the obligation (if specified)
      6. Priority - Classify as high, medium, or low based on importance, deadlines, and consequences
      7. Original text - The EXACT wording from the contract (copy the complete obligation text verbatim)
      8. Clause number - The specific clause number in the contract (if available, e.g., "Section 3.2.1" or "Clause 5")
      9. Section name - The name or title of the section containing this obligation (if available)
      10. Page number - Approximate page number where the obligation appears (if possible to determine)
      11. Confidence score - Your confidence in this extraction on a scale of 0-100
      
      Format your response as a valid JSON object with the following structure:
      {
        "obligations": [
          {
            "text": "string", // One sentence summary
            "type": "payment|delivery|reporting|compliance|renewal|termination|other",
            "start_date": "YYYY-MM-DD", (optional)
            "due_date": "YYYY-MM-DD", (optional)
            "responsible_party": "string", (optional)
            "priority": "high|medium|low",
            "original_text": "string", // Exact wording from contract
            "clause_number": "string", (optional)
            "section_name": "string", (optional)
            "page_number": number, (optional)
            "confidence_score": number (0-100)
          },
          ...
        ]
      }
      
      Focus only on clear, explicit obligations. If dates are mentioned relatively (e.g., "within 30 days"), make your best estimate for an absolute date.
      Include only the JSON in your response, no other text.
    `;

    const userMessage = `Here is the contract document to analyze:\n\n${text}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const contentBlock = response.content[0];
    // Check if it's a text content block
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response format: Not a text content block');
    }
    
    // Use our robust JSON parsing logic
    const extractedData = safeJsonParse(contentBlock.text);
    
    // Convert to InsertObligation objects
    return extractedData.obligations.map(obligation => {
      const insertObligation: InsertObligation = {
        document_id: documentId,
        text: obligation.text, // One sentence summary of the obligation
        type: obligation.type as any,
        original_text: obligation.original_text, // Exact wording from the contract
        confidence_score: obligation.confidence_score,
        priority: (obligation.priority || 'medium') as any,
        status: 'pending',
        created_by: 1, // Default user ID
        modified_by: 1 // Default user ID
      };
      
      // Add optional fields if they exist in the response
      if (obligation.start_date) {
        insertObligation.start_date = new Date(obligation.start_date);
      }
      
      if (obligation.due_date) {
        insertObligation.due_date = new Date(obligation.due_date);
      }
      
      if (obligation.responsible_party) {
        insertObligation.responsible_party = obligation.responsible_party;
      }
      
      if (obligation.page_number) {
        insertObligation.page_number = obligation.page_number;
      }
      
      // Add new fields: clause number and section name
      if (obligation.clause_number) {
        insertObligation.clause_number = obligation.clause_number;
      }
      
      if (obligation.section_name) {
        insertObligation.section_name = obligation.section_name;
      }
      
      return insertObligation;
    });
  } catch (error: any) {
    console.error('Error extracting obligations:', error);
    
    // Check for rate limit errors specifically
    if (error.status === 429) {
      // Extract retry-after header if available
      const retryAfter = error.headers && error.headers['retry-after'] 
        ? parseInt(error.headers['retry-after'], 10) 
        : 60; // Default to 60 seconds
      
      throw new Error(`RATE_LIMIT:${retryAfter}`);
    }
    
    // Handle other types of errors
    throw new Error(`Failed to extract obligations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeSpecificObligation(text: string): Promise<{ 
  type: string;
  start_date?: string;
  due_date?: string;
  responsible_party?: string;
  priority?: string;
  clause_number?: string;
  section_name?: string;
  confidence_score: number;
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      system: `
        Analyze the provided text as a potential contractual obligation. 
        Extract and categorize it with the following fields:
        - type: payment, delivery, reporting, compliance, renewal, termination, or other
        - start_date: when the obligation starts (YYYY-MM-DD format, if specified)
        - due_date: when it must be fulfilled (YYYY-MM-DD format, if specified)
        - responsible_party: who is responsible (if specified)
        - priority: high, medium, or low based on importance and urgency
        - clause_number: the specific clause number in the contract (if available, e.g., "Section 3.2.1" or "Clause 5")
        - section_name: the name or title of the section containing this obligation (if available)
        - confidence_score: your confidence in this analysis (0-100)
        
        Return only JSON in this format without explanations:
        {
          "type": "string",
          "start_date": "string", (optional)
          "due_date": "string", (optional)
          "responsible_party": "string", (optional)
          "priority": "string",
          "clause_number": "string", (optional)
          "section_name": "string", (optional)
          "confidence_score": number
        }
      `,
      messages: [{ role: 'user', content: text }],
    });

    const contentBlock = response.content[0];
    // Check if it's a text content block
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response format: Not a text content block');
    }
    
    // Use our robust JSON parsing logic for single objects
    return safeJsonParseSimple(contentBlock.text);
  } catch (error: any) {
    console.error('Error analyzing obligation:', error);
    
    // Check for rate limit errors specifically
    if (error.status === 429) {
      // Extract retry-after header if available
      const retryAfter = error.headers && error.headers['retry-after'] 
        ? parseInt(error.headers['retry-after'], 10) 
        : 60; // Default to 60 seconds
      
      throw new Error(`RATE_LIMIT:${retryAfter}`);
    }
    
    // Handle other types of errors
    throw new Error(`Failed to analyze obligation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function checkApiStatus(): Promise<boolean> {
  try {
    await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'API check' }],
    });
    return true;
  } catch (error) {
    console.error('Anthropic API status check failed:', error);
    return false;
  }
}
