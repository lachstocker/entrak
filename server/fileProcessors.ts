// Import pdfjs dynamically to avoid issues with different import styles
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

// Extract text from a PDF file
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // In this older version, Node.js doesn't handle this well, so let's import it dynamically
    const pdfjs = await import('pdfjs-dist');
    
    // Node.js environment
    if (typeof window === 'undefined') {
      // Configure the PDF.js library for Node.js environment
      const pdfjsGlobal = pdfjs as any;
      if (pdfjsGlobal.GlobalWorkerOptions) {
        pdfjsGlobal.GlobalWorkerOptions.workerSrc = '';
      }
      
      // Fully disable font handling to prevent errors
      // We're only extracting text, so fonts aren't needed
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(fs.readFileSync(filePath)),
        disableFontFace: true,  // Disable font face loading
        disableRange: true     // Disable range requests
      });
      
      const pdf = await loadingTask.promise;
      let textContent = '';
      
      // Iterate through each page
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          
          // Extract text from the page
          const pageText = content.items
            .map((item: any) => item.str || '')
            .join(' ');
          
          textContent += pageText + '\n\n';
        } catch (pageError) {
          console.warn(`Warning: Could not extract text from page ${i}:`, pageError);
          textContent += `[Page ${i} extraction error]\n\n`;
        }
      }
      
      return textContent;
    }
    
    // Browser environment (should not be reached in this app)
    return 'PDF processing in browser not implemented';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract text from a DOCX file
export async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract text from a TXT file
export async function extractTextFromTXT(filePath: string): Promise<string> {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error extracting text from TXT:', error);
    throw new Error(`Failed to extract text from TXT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Detect file type from file path or mime type
export function getFileType(filePath: string, mimeType?: string): 'pdf' | 'docx' | 'txt' | null {
  if (mimeType) {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if (mimeType === 'text/plain') return 'txt';
  }
  
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx') return 'docx';
  if (ext === '.txt') return 'txt';
  
  return null;
}

// Process file based on its type
export async function processFile(filePath: string, fileType: 'pdf' | 'docx' | 'txt'): Promise<string> {
  switch (fileType) {
    case 'pdf':
      return extractTextFromPDF(filePath);
    case 'docx':
      return extractTextFromDOCX(filePath);
    case 'txt':
      return extractTextFromTXT(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
