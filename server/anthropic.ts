import Anthropic from '@anthropic-ai/sdk';
import { Obligation, InsertObligation } from '@shared/schema';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Type for the obligation extraction response
interface ExtractedObligationsResponse {
  obligations: {
    text: string;
    type: string;
    start_date?: string;
    due_date?: string;
    responsible_party?: string;
    priority?: string;
    original_text: string;
    page_number?: number;
    confidence_score: number;
  }[];
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
      1. Text - A clear, concise description of the obligation
      2. Type - Categorize as: payment, delivery, reporting, compliance, renewal, termination, or other
      3. Start date - When the obligation starts (if specified)
      4. Due date - When the obligation must be fulfilled (if specified)
      5. Responsible party - Who is responsible for fulfilling the obligation (if specified)
      6. Priority - Classify as high, medium, or low based on importance, deadlines, and consequences
      7. Original text - The exact text from the document that describes this obligation
      8. Page number - Approximate page number where the obligation appears (if possible to determine)
      9. Confidence score - Your confidence in this extraction on a scale of 0-100
      
      Format your response as a valid JSON object with the following structure:
      {
        "obligations": [
          {
            "text": "string",
            "type": "payment|delivery|reporting|compliance|renewal|termination|other",
            "start_date": "YYYY-MM-DD", (optional)
            "due_date": "YYYY-MM-DD", (optional)
            "responsible_party": "string", (optional)
            "priority": "high|medium|low",
            "original_text": "string",
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
    
    let responseContent = contentBlock.text;
    
    // Clean up the response content to extract just the JSON
    // Handle case where response is wrapped in markdown code blocks
    if (responseContent.includes('```json')) {
      responseContent = responseContent.replace(/```json\n|\n```/g, '');
    } else if (responseContent.includes('```')) {
      responseContent = responseContent.replace(/```\n|\n```/g, '');
    }
    
    // Parse the JSON response
    const extractedData = JSON.parse(responseContent) as ExtractedObligationsResponse;
    
    // Convert to InsertObligation objects
    return extractedData.obligations.map(obligation => {
      const insertObligation: InsertObligation = {
        document_id: documentId,
        text: obligation.text,
        type: obligation.type as any,
        original_text: obligation.original_text,
        confidence_score: obligation.confidence_score,
        priority: (obligation.priority || 'medium') as any,
        status: 'pending',
        created_by: 1, // Default user ID
        modified_by: 1 // Default user ID
      };
      
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
      
      return insertObligation;
    });
  } catch (error) {
    console.error('Error extracting obligations:', error);
    throw new Error(`Failed to extract obligations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeSpecificObligation(text: string): Promise<{ 
  type: string;
  start_date?: string;
  due_date?: string;
  responsible_party?: string;
  priority?: string;
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
        - confidence_score: your confidence in this analysis (0-100)
        
        Return only JSON in this format without explanations:
        {
          "type": "string",
          "start_date": "string", (optional)
          "due_date": "string", (optional)
          "responsible_party": "string", (optional)
          "priority": "string",
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
    
    let responseContent = contentBlock.text;
    
    // Clean up the response content to extract just the JSON
    // Handle case where response is wrapped in markdown code blocks
    if (responseContent.includes('```json')) {
      responseContent = responseContent.replace(/```json\n|\n```/g, '');
    } else if (responseContent.includes('```')) {
      responseContent = responseContent.replace(/```\n|\n```/g, '');
    }
    
    return JSON.parse(responseContent);
  } catch (error) {
    console.error('Error analyzing obligation:', error);
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
