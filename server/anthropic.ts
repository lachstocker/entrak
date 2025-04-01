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
    responsible_party?: string;
    original_text: string; // All contractual clause wording for the obligation
    clause_number?: string; // Clause number from the contract
    section_name?: string; // Section name from the contract
    page_number?: number;
    // Recurrence information
    is_recurring?: boolean; // Whether the obligation recurs
    recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'ongoing'; // Type of recurrence
    recurrence_interval?: number; // For example, every 2 weeks
    recurrence_day?: number; // Day of month/week (1-31 or 0-6 for Sunday-Saturday)
    recurrence_month?: number; // Month of year (1-12)
    recurrence_custom_text?: string; // Description for custom recurrence patterns
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
    .replace(/([{,][^{}:,]*?)'([^']*?)"([^{}:,]*?:)/g, '$1"$2"$3')
    // Replace single quotes with double quotes
    .replace(/:\s*'([^']*)'/g, ':"$1"');
    
  try {
    // First attempt: direct parsing
    return JSON.parse(cleanJson) as ExtractedObligationsResponse;
  } catch (error) {
    console.log("First parsing attempt failed, trying alternative methods...");
    
    try {
      // Second attempt: Check if the response is missing the obligations wrapper
      // Sometimes the API returns an array directly instead of {obligations: [...]}
      if (cleanJson.trim().startsWith('[') && cleanJson.trim().endsWith(']')) {
        try {
          const directArray = JSON.parse(cleanJson);
          if (Array.isArray(directArray) && directArray.length > 0) {
            return { obligations: directArray };
          }
        } catch (err) {
          console.log("Direct array parsing failed");
        }
      }
      
      // Third attempt: Manually extract obligations array pattern
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
                // If parsing fails, try to fix common issues in this specific object
                try {
                  const fixedStr = currentObject
                    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
                    .replace(/:\s*'([^']*)'/g, ':"$1"')
                    .replace(/,(\s*[\]}])/g, '$1');
                  
                  const fixedObligation = JSON.parse(fixedStr);
                  obligationObjects.push(fixedObligation);
                } catch (fixError) {
                  // Skip this object if it still can't be parsed
                  console.log("Failed to parse individual obligation after fixes");
                }
                
                currentObject = '';
                inObject = false;
              }
            }
          } else if (inObject) {
            currentObject += char;
          }
        }
        
        if (obligationObjects.length > 0) {
          return { obligations: obligationObjects };
        }
      }
      
      // Fourth attempt: Try to identify individual JSON objects in the raw response
      console.log("Attempting to extract obligation objects directly from the raw response");
      const rawObligations = extractPotentialJsonObjects(jsonString);
      if (rawObligations.length > 0) {
        console.log(`Found ${rawObligations.length} potential obligation objects`);
        return { obligations: rawObligations };
      }
      
      throw new Error("No obligations array found");
    } catch (secError) {
      console.error("Alternative parsing methods failed", secError);
      
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
          .filter(obj => obj.text && obj.original_text) // Must have at least these fields
          .map(obj => {
            // Ensure recurrence fields are properly set
            if (obj.is_recurring === undefined) {
              obj.is_recurring = false;
            }
            if (obj.recurrence_type === undefined) {
              obj.recurrence_type = 'none';
            }
            return obj;
          })
        
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

// Helper function to extract potential JSON objects from a string
function extractPotentialJsonObjects(text: string): any[] {
  const results: any[] = [];
  let currentObject = '';
  let depth = 0;
  
  // Remove line breaks to simplify extraction
  text = text.replace(/\n/g, ' ');
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '{') {
      depth++;
      currentObject += char;
    } else if (char === '}') {
      currentObject += char;
      depth--;
      
      if (depth === 0) {
        // We have a complete object, try to parse it
        try {
          // Apply some fixes before parsing
          let fixedObject = currentObject
            .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')  // Quote unquoted keys
            .replace(/:\s*'([^']*)'/g, ':"$1"')            // Replace single quotes with double quotes
            .replace(/,(\s*[\]}])/g, '$1');                // Remove trailing commas
          
          const parsed = JSON.parse(fixedObject);
          // Check if it has the minimum fields we expect for an obligation
          if (parsed.text && typeof parsed.text === 'string' &&
              parsed.original_text && typeof parsed.original_text === 'string') {
            // Ensure recurrence fields are properly set
            if (parsed.is_recurring === undefined) {
              parsed.is_recurring = false;
            }
            if (parsed.recurrence_type === undefined) {
              parsed.recurrence_type = 'none';
            }
            results.push(parsed);
          }
        } catch (e) {
          // Skip this object
        }
        
        currentObject = '';
      }
    } else if (depth > 0) {
      currentObject += char;
    }
  }
  
  return results;
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
      const responsiblePartyMatch = cleanJson.match(/"responsible_party"\s*:\s*"([^"]*)"/);
      const clauseNumberMatch = cleanJson.match(/"clause_number"\s*:\s*"([^"]*)"/);
      const sectionNameMatch = cleanJson.match(/"section_name"\s*:\s*"([^"]*)"/);
      
      // Recurrence fields
      const isRecurringMatch = cleanJson.match(/"is_recurring"\s*:\s*(true|false)/);
      const recurrenceTypeMatch = cleanJson.match(/"recurrence_type"\s*:\s*"([^"]*)"/);
      const recurrenceIntervalMatch = cleanJson.match(/"recurrence_interval"\s*:\s*(\d+)/);
      const recurrenceDayMatch = cleanJson.match(/"recurrence_day"\s*:\s*(\d+)/);
      const recurrenceMonthMatch = cleanJson.match(/"recurrence_month"\s*:\s*(\d+)/);
      const recurrenceCustomTextMatch = cleanJson.match(/"recurrence_custom_text"\s*:\s*"([^"]*)"/);
      
      // Construct a valid minimal object
      const result: any = {};
      
      if (responsiblePartyMatch) result.responsible_party = responsiblePartyMatch[1];
      if (clauseNumberMatch) result.clause_number = clauseNumberMatch[1];
      if (sectionNameMatch) result.section_name = sectionNameMatch[1];
      
      // Add recurrence fields if found
      if (isRecurringMatch) result.is_recurring = isRecurringMatch[1] === 'true';
      if (recurrenceTypeMatch) result.recurrence_type = recurrenceTypeMatch[1];
      if (recurrenceIntervalMatch) result.recurrence_interval = parseInt(recurrenceIntervalMatch[1], 10);
      if (recurrenceDayMatch) result.recurrence_day = parseInt(recurrenceDayMatch[1], 10);
      if (recurrenceMonthMatch) result.recurrence_month = parseInt(recurrenceMonthMatch[1], 10);
      if (recurrenceCustomTextMatch) result.recurrence_custom_text = recurrenceCustomTextMatch[1];
      
      return result;
    } catch (finalError) {
      console.error("All parsing attempts failed", finalError);
      throw new Error('Failed to parse API response. The JSON structure was invalid.');
    }
  }
}

// Helper function to split text into chunks of reasonable size
function splitTextIntoChunks(text: string, chunkSize: number = 20000): string[] {
  const paragraphs = text.split('\n\n');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the chunk size, save current chunk and start a new one
    if (currentChunk.length + paragraph.length + 2 > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      // Otherwise, add the paragraph to the current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
      }
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Process a single chunk of text to extract obligations
async function processChunk(chunk: string, chunkIndex: number, totalChunks: number, documentId: number): Promise<InsertObligation[]> {
  try {
    const systemPrompt = `
      Extract contractual obligations from chunk ${chunkIndex + 1}/${totalChunks}.
      For each obligation, provide:
      - text: One-sentence summary 
      - responsible_party: Who is responsible
      - original_text: All contractual clause wording for the obligation
      - clause_number: If available
      - section_name: If available
      - page_number: If possible
      
      Also analyze if the obligation recurs (weekly, monthly, yearly, etc):
      - is_recurring: true/false (whether the obligation has recurring requirements)
      - recurrence_type: one of [none, daily, weekly, monthly, yearly, custom, ongoing]
      - recurrence_interval: number (e.g., every 2 weeks = 2, every 3 months = 3)
      - recurrence_day: day number if applicable (1-31 for day of month or 0-6 for day of week Sun-Sat)
      - recurrence_month: month number if applicable (1-12)
      - recurrence_custom_text: description of custom recurrence pattern
      
      Return valid JSON only:
      {"obligations":[{"text":"","responsible_party":"","original_text":"","clause_number":"","section_name":"","page_number":0,"is_recurring":false,"recurrence_type":"none"}]}
      No text before or after.
    `;

    const userMessage = `Here is chunk ${chunkIndex + 1} of ${totalChunks} from the contract document to analyze:\n\n${chunk}`;

    console.log(`Processing chunk ${chunkIndex + 1} of ${totalChunks}, size: ${chunk.length} characters`);

    // Standard batch processing 
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000, 
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    
    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response format: Not a text content block');
    }
    
    // Use our robust JSON parsing logic
    const extractedData = safeJsonParse(contentBlock.text);
    
    // Convert to InsertObligation objects
    return extractedData.obligations.map(obligation => {
      // Create the obligation with the required fields
      // Normalize recurrence_type to ensure it's a valid enum value
      let recurrenceType = 'none';
      if (obligation.recurrence_type) {
        // Convert to lowercase to handle case differences
        const type = obligation.recurrence_type.toLowerCase();
        // Check if it's a valid recurrence type from our enum
        if (['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom', 'ongoing'].includes(type)) {
          recurrenceType = type;
        } else {
          // For anything else, default to 'custom' and store the original value in custom_text
          recurrenceType = 'custom';
          obligation.recurrence_custom_text = `Original type: ${obligation.recurrence_type}`;
        }
      }
      
      const insertObligation: InsertObligation = {
        document_id: documentId,
        text: obligation.text, // One sentence summary of the obligation
        original_text: obligation.original_text, // All contractual clause wording for the obligation
        status: 'pending',
        created_by: 1, // Default user ID
        modified_by: 1, // Default user ID
        // Default recurrence to false if not specified
        is_recurring: obligation.is_recurring ?? false,
        recurrence_type: recurrenceType as any
      };
      
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
      
      // Add recurrence fields if present
      if (obligation.recurrence_interval) {
        insertObligation.recurrence_interval = obligation.recurrence_interval;
      }
      
      if (obligation.recurrence_day) {
        insertObligation.recurrence_day = obligation.recurrence_day;
      }
      
      if (obligation.recurrence_month) {
        insertObligation.recurrence_month = obligation.recurrence_month;
      }
      
      if (obligation.recurrence_custom_text) {
        insertObligation.recurrence_custom_text = obligation.recurrence_custom_text;
      }
      
      return insertObligation;
    });
  } catch (error: any) {
    console.error(`Error processing chunk ${chunkIndex + 1}:`, error);
    
    // Check for rate limit errors specifically
    if (error.status === 429) {
      // Extract retry-after header if available
      const retryAfter = error.headers && error.headers['retry-after'] 
        ? parseInt(error.headers['retry-after'], 10) 
        : 60; // Default to 60 seconds
      
      throw new Error(`RATE_LIMIT:${retryAfter}`);
    }
    
    // For non-critical errors, return an empty array instead of failing the entire process
    return [];
  }
}

export async function extractObligations(text: string, documentId: number): Promise<InsertObligation[]> {
  if (!text || text.trim() === '') {
    throw new Error('No text provided for obligation extraction');
  }

  try {
    console.log(`Starting extraction for document ID ${documentId}, text length: ${text.length} characters`);
    
    // For large documents, split into chunks to avoid hitting token limits
    const chunks = splitTextIntoChunks(text);
    console.log(`Split document into ${chunks.length} chunks`);
    
    // Process each chunk in parallel with a concurrency limit
    const allObligations: InsertObligation[] = [];
    const chunkResults: InsertObligation[][] = [];
    
    // Process chunks sequentially to avoid rate limits
    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`Starting to process chunk ${i + 1} of ${chunks.length}`);
        const chunkObligations = await processChunk(chunks[i], i, chunks.length, documentId);
        console.log(`Successfully processed chunk ${i + 1}, found ${chunkObligations.length} obligations`);
        chunkResults.push(chunkObligations);
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        // Continue with next chunk rather than failing the entire process
      }
    }
    
    // Combine all results
    for (const results of chunkResults) {
      allObligations.push(...results);
    }
    
    console.log(`Extraction complete, found ${allObligations.length} total obligations`);
    return allObligations;
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
  responsible_party?: string;
  clause_number?: string;
  section_name?: string;
  is_recurring?: boolean;
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'ongoing';
  recurrence_interval?: number;
  recurrence_day?: number;
  recurrence_month?: number;
  recurrence_custom_text?: string;
}> {
  try {
    // Standard batch processing
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      system: `
        Analyze this text as a contractual obligation.
        Determine if it is recurring (weekly, monthly, yearly, etc.).
        Return JSON only:
        {
          "responsible_party": "who",
          "clause_number": "X.X.X", 
          "section_name": "name",
          "is_recurring": true/false,
          "recurrence_type": "none"/"daily"/"weekly"/"monthly"/"yearly"/"custom"/"ongoing",
          "recurrence_interval": number (e.g., every 2 weeks = 2),
          "recurrence_day": number (day of month/week),
          "recurrence_month": number (month of year 1-12),
          "recurrence_custom_text": "description of pattern"
        }
      `,
      messages: [{ role: 'user', content: text }],
    });
    
    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response format: Not a text content block');
    }
    
    // Use our robust JSON parsing logic for single objects
    const result = safeJsonParseSimple(contentBlock.text);
    
    return result;
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
