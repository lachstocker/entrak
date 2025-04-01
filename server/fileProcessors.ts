// Import required modules
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

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

// Convert DOCX to HTML
export async function convertDocxToHtml(filePath: string): Promise<string> {
  try {
    const result = await mammoth.convertToHtml({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Error converting DOCX to HTML:', error);
    throw new Error(`Failed to convert DOCX to HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convert PDF to HTML using PDF.js
export async function convertPdfToHtml(filePath: string): Promise<string> {
  try {
    // In this approach, we'll extract the text and wrap it in basic HTML formatting
    const pdfjs = await import('pdfjs-dist');
    
    // Node.js environment
    if (typeof window === 'undefined') {
      // Configure the PDF.js library for Node.js environment
      const pdfjsGlobal = pdfjs as any;
      if (pdfjsGlobal.GlobalWorkerOptions) {
        pdfjsGlobal.GlobalWorkerOptions.workerSrc = '';
      }
      
      // Get PDF document
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(fs.readFileSync(filePath)),
        disableFontFace: true,
        disableRange: true
      });
      
      const pdf = await loadingTask.promise;
      let htmlContent = '<div class="pdf-document">';
      
      // Iterate through each page
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          htmlContent += `<div class="pdf-page" data-page="${i}">`;
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          
          // Build page content
          htmlContent += `<h2 class="pdf-page-header">Page ${i}</h2>`;
          htmlContent += '<div class="pdf-page-content">';
          
          // Convert text items to paragraphs
          let currentY = null;
          let currentParagraph = '';
          
          for (const item of content.items) {
            const textItem = item as any;
            if (currentY !== null && Math.abs(textItem.transform[5] - currentY) > 5) {
              // New line detected
              if (currentParagraph.trim()) {
                htmlContent += `<p>${currentParagraph}</p>`;
              }
              currentParagraph = textItem.str || '';
            } else {
              // Same line, append text
              currentParagraph += textItem.str || '';
            }
            currentY = textItem.transform[5];
          }
          
          // Add the last paragraph
          if (currentParagraph.trim()) {
            htmlContent += `<p>${currentParagraph}</p>`;
          }
          
          htmlContent += '</div></div>';
        } catch (pageError) {
          console.warn(`Warning: Could not extract content from page ${i}:`, pageError);
          htmlContent += `<div class="pdf-error">Error loading page ${i}</div>`;
        }
      }
      
      htmlContent += '</div>';
      return htmlContent;
    }
    
    // Browser environment (should not be reached in this app)
    return '<div>PDF to HTML conversion in browser not implemented</div>';
  } catch (error) {
    console.error('Error converting PDF to HTML:', error);
    throw new Error(`Failed to convert PDF to HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convert TXT to HTML
export async function convertTxtToHtml(filePath: string): Promise<string> {
  try {
    // Read text file
    const text = fs.readFileSync(filePath, 'utf8');
    
    // Simple conversion: replace newlines with <br> and wrap in div
    const htmlContent = `<div class="txt-document">
      <pre>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>`;
    
    return htmlContent;
  } catch (error) {
    console.error('Error converting TXT to HTML:', error);
    throw new Error(`Failed to convert TXT to HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convert any supported file to HTML
export async function convertToHtml(filePath: string, fileType: 'pdf' | 'docx' | 'txt'): Promise<string> {
  switch (fileType) {
    case 'pdf':
      return convertPdfToHtml(filePath);
    case 'docx':
      return convertDocxToHtml(filePath);
    case 'txt':
      return convertTxtToHtml(filePath);
    default:
      throw new Error(`Unsupported file type for HTML conversion: ${fileType}`);
  }
}
