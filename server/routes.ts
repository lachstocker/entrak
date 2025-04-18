import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { 
  insertDocumentSchema, 
  insertObligationSchema, 
  insertReminderSchema,
  insertUserSchema,
  insertProjectSchema,
  obligations
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { 
  extractObligations, 
  analyzeSpecificObligation, 
  checkApiStatus 
} from "./anthropic";
import { 
  processFile, 
  getFileType,
  convertToHtml
} from "./fileProcessors";

// File upload configuration
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    
    // Create the uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename to prevent collisions
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: storage_config,
  fileFilter: (req, file, cb) => {
    // Accept only the specified file types
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Document routes
  app.post('/api/documents', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const { title, description, projectId } = req.body;
      
      // Validate required fields
      if (!title) {
        return res.status(400).json({ message: 'Document title is required' });
      }
      
      const fileType = getFileType(req.file.path, req.file.mimetype);
      
      if (!fileType) {
        return res.status(400).json({ message: 'Unsupported file type' });
      }
      
      // Check if project exists when projectId is provided
      if (projectId) {
        const projectIdNum = parseInt(projectId as string);
        const project = await storage.getProject(projectIdNum);
        if (!project) {
          return res.status(400).json({ message: 'Project not found' });
        }
      }
      
      // Create document in database
      const document = await storage.createDocument({
        title,
        description: description || '',
        file_path: req.file.path,
        file_type: fileType,
        version: 1,
        user_id: 1, // Default user ID for now
        project_id: projectId ? parseInt(projectId as string) : undefined
      });
      
      res.status(201).json(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ 
        message: 'Failed to upload document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/documents', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const documents = await storage.getDocuments(userId, projectId);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ 
        message: 'Failed to fetch documents',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ 
        message: 'Failed to fetch document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.put('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { title, description, projectId } = req.body;
      
      // Validate the document exists
      const existingDocument = await storage.getDocument(id);
      if (!existingDocument) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Check if project exists when projectId is provided
      if (projectId !== undefined) {
        if (projectId === null) {
          // Allow removing a document from a project
        } else {
          const projectIdNum = parseInt(projectId as string);
          const project = await storage.getProject(projectIdNum);
          if (!project) {
            return res.status(400).json({ message: 'Project not found' });
          }
        }
      }
      
      // Update document
      const updatedDocument = await storage.updateDocument(id, {
        title: title || existingDocument.title,
        description: description ?? existingDocument.description,
        project_id: projectId === null ? null : (projectId ? parseInt(projectId as string) : existingDocument.project_id)
      });
      
      res.json(updatedDocument);
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({ 
        message: 'Failed to update document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.delete('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if document exists
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Delete the file
      if (document.file_path && fs.existsSync(document.file_path)) {
        fs.unlinkSync(document.file_path);
      }
      
      // Delete document from storage
      await storage.deleteDocument(id);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ 
        message: 'Failed to delete document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.post('/api/documents/:id/extract', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if document exists
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Extract text from document
      const text = await processFile(document.file_path, document.file_type);
      
      // Extract obligations using Anthropic API
      const obligations = await extractObligations(text, id);
      
      // Save obligations to database
      const savedObligations = await storage.createBatchObligations(obligations);
      
      // Update document status to processing at start
      await storage.updateDocument(id, {
        extracted: false,
        status: 'processing'
      });

      // After processing, update to extracted
      await storage.updateDocument(id, {
        extracted: true,
        extraction_date: new Date(),
        status: 'processed'
      });
      
      res.json({
        message: 'Obligations extracted successfully',
        count: savedObligations.length,
        obligations: savedObligations
      });
    } catch (error) {
      console.error('Error extracting obligations:', error);
      
      // Check for rate limit errors
      if (error instanceof Error && error.message.startsWith('RATE_LIMIT:')) {
        // Extract the retry seconds from the error message
        const retrySeconds = parseInt(error.message.split(':')[1], 10) || 60;
        const retryMinutes = Math.ceil(retrySeconds / 60);
        
        return res.status(429).json({
          message: `API rate limit exceeded. Please try again in approximately ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''}.`,
          retryAfter: retrySeconds,
          error: 'RATE_LIMIT'
        });
      }
      
      // Handle other errors
      res.status(500).json({ 
        message: 'Failed to extract obligations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/documents/:id/download', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if document exists
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Check if file exists
      if (!document.file_path || !fs.existsSync(document.file_path)) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Determine content type
      let contentType = 'application/octet-stream';
      if (document.file_type === 'pdf') {
        contentType = 'application/pdf';
      } else if (document.file_type === 'docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (document.file_type === 'txt') {
        contentType = 'text/plain';
      }
      
      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(document.file_path)}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(document.file_path);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({ 
        message: 'Failed to download document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.post('/api/documents/:id/version', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Check if document exists
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      const fileType = getFileType(req.file.path, req.file.mimetype);
      
      if (!fileType) {
        return res.status(400).json({ message: 'Unsupported file type' });
      }
      
      // Delete old file if it exists
      if (document.file_path && fs.existsSync(document.file_path)) {
        fs.unlinkSync(document.file_path);
      }
      
      // Update document with new file and version
      const updatedDocument = await storage.updateDocument(id, {
        file_path: req.file.path,
        file_type: fileType,
        version: document.version + 1,
        extracted: false,
        extraction_date: null
      });
      
      res.json(updatedDocument);
    } catch (error) {
      console.error('Error uploading new version:', error);
      res.status(500).json({ 
        message: 'Failed to upload new version',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Generate and retrieve HTML content for a document
  app.get('/api/documents/:id/html', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // If HTML content is already cached, return it
      if (document.html_content) {
        return res.json({ html_content: document.html_content });
      }
      
      const filePath = document.file_path;
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Document file not found on server' });
      }
      
      try {
        // Generate HTML content based on file type
        const fileType = document.file_type;
        const htmlContent = await convertToHtml(filePath, fileType);
        
        // Update document with HTML content
        const updatedDocument = await storage.updateDocument(id, {
          html_content: htmlContent,
          html_generated_date: new Date()
        });
        
        res.json({ html_content: htmlContent });
      } catch (error) {
        console.error('Error generating HTML:', error);
        res.status(500).json({ 
          message: 'Failed to generate HTML content',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Error retrieving HTML content:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve HTML content',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Anthropic AI Integration routes
  app.post('/api/ai/extract', async (req: Request, res: Response) => {
    try {
      const { text, documentId } = req.body;
      
      if (!text || !documentId) {
        return res.status(400).json({ message: 'Text and documentId are required' });
      }
      
      const obligations = await extractObligations(text, documentId);
      
      res.json({
        message: 'Text analyzed successfully',
        obligations
      });
    } catch (error) {
      console.error('Error analyzing text:', error);
      
      // Check for rate limit errors
      if (error instanceof Error && error.message.startsWith('RATE_LIMIT:')) {
        // Extract the retry seconds from the error message
        const retrySeconds = parseInt(error.message.split(':')[1], 10) || 60;
        const retryMinutes = Math.ceil(retrySeconds / 60);
        
        return res.status(429).json({
          message: `API rate limit exceeded. Please try again in approximately ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''}.`,
          retryAfter: retrySeconds,
          error: 'RATE_LIMIT'
        });
      }
      
      // Handle other errors
      res.status(500).json({ 
        message: 'Failed to analyze text',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.post('/api/ai/analyze', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: 'Text is required' });
      }
      
      const analysis = await analyzeSpecificObligation(text);
      
      res.json({
        message: 'Text analyzed successfully',
        analysis
      });
    } catch (error) {
      console.error('Error analyzing specific text:', error);
      
      // Check for rate limit errors
      if (error instanceof Error && error.message.startsWith('RATE_LIMIT:')) {
        // Extract the retry seconds from the error message
        const retrySeconds = parseInt(error.message.split(':')[1], 10) || 60;
        const retryMinutes = Math.ceil(retrySeconds / 60);
        
        return res.status(429).json({
          message: `API rate limit exceeded. Please try again in approximately ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''}.`,
          retryAfter: retrySeconds,
          error: 'RATE_LIMIT'
        });
      }
      
      // Handle other errors
      res.status(500).json({ 
        message: 'Failed to analyze text',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/ai/status', async (req: Request, res: Response) => {
    try {
      const isAvailable = await checkApiStatus();
      
      res.json({
        status: isAvailable ? 'available' : 'unavailable'
      });
    } catch (error) {
      console.error('Error checking API status:', error);
      res.status(500).json({ 
        message: 'Failed to check API status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Obligations routes
  app.get('/api/obligations', async (req: Request, res: Response) => {
    try {
      // Parse query parameters
      const filters: {
        documentId?: number;
        projectId?: number;
        status?: string;
        responsibleParty?: string;
        isRecurring?: boolean;
      } = {};
      
      if (req.query.documentId) {
        filters.documentId = parseInt(req.query.documentId as string);
      }
      
      if (req.query.projectId) {
        filters.projectId = parseInt(req.query.projectId as string);
      }
      
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      
      // Removed dueDateStart and dueDateEnd filters since due_date field was removed
      
      if (req.query.responsibleParty) {
        filters.responsibleParty = req.query.responsibleParty as string;
      }

      if (req.query.isRecurring !== undefined) {
        filters.isRecurring = req.query.isRecurring === 'true';
      }
      
      const obligations = await storage.getObligations(filters);
      
      res.json(obligations);
    } catch (error) {
      console.error('Error fetching obligations:', error);
      res.status(500).json({ 
        message: 'Failed to fetch obligations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/obligations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate ID is a valid number
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: `Invalid obligation ID: ${req.params.id}` });
      }
      
      const obligation = await storage.getObligation(id);
      
      if (!obligation) {
        return res.status(404).json({ message: 'Obligation not found' });
      }
      
      res.json(obligation);
    } catch (error) {
      console.error('Error fetching obligation:', error);
      res.status(500).json({ 
        message: 'Failed to fetch obligation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.put('/api/obligations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate ID is a valid number
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: `Invalid obligation ID: ${req.params.id}` });
      }
      
      // Validate request body
      const validationResult = insertObligationSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid obligation data', 
          errors: validationResult.error.errors 
        });
      }
      
      // Check if obligation exists
      const existingObligation = await storage.getObligation(id);
      if (!existingObligation) {
        return res.status(404).json({ message: 'Obligation not found' });
      }
      
      // Update obligation
      const updatedObligation = await storage.updateObligation(id, {
        ...validationResult.data,
        modified_by: 1 // Default user ID for now
      });
      
      res.json(updatedObligation);
    } catch (error) {
      console.error('Error updating obligation:', error);
      res.status(500).json({ 
        message: 'Failed to update obligation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.delete('/api/obligations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate ID is a valid number
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: `Invalid obligation ID: ${req.params.id}` });
      }
      
      // Check if obligation exists
      const obligation = await storage.getObligation(id);
      if (!obligation) {
        return res.status(404).json({ message: 'Obligation not found' });
      }
      
      // Delete obligation
      await storage.deleteObligation(id);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting obligation:', error);
      res.status(500).json({ 
        message: 'Failed to delete obligation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.post('/api/obligations/batch', async (req: Request, res: Response) => {
    try {
      const { obligations } = req.body;
      
      if (!Array.isArray(obligations) || obligations.length === 0) {
        return res.status(400).json({ message: 'Obligations array is required' });
      }
      
      // Validate each obligation
      const validationSchema = z.array(insertObligationSchema);
      const validationResult = validationSchema.safeParse(obligations);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid obligations data', 
          errors: validationResult.error.errors 
        });
      }
      
      // Create batch obligations
      const createdObligations = await storage.createBatchObligations(validationResult.data);
      
      res.status(201).json({
        message: 'Obligations created successfully',
        count: createdObligations.length,
        obligations: createdObligations
      });
    } catch (error) {
      console.error('Error creating batch obligations:', error);
      res.status(500).json({ 
        message: 'Failed to create batch obligations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Endpoint to get all unique responsible parties from obligations
  app.get('/api/obligations/responsible-parties', async (req: Request, res: Response) => {
    try {
      // Get all unique responsible parties from the database
      const result = await db
        .selectDistinct({ responsibleParty: obligations.responsible_party })
        .from(obligations)
        .where(sql`${obligations.responsible_party} IS NOT NULL AND ${obligations.responsible_party} != ''`)
        .orderBy(obligations.responsible_party);
      
      // Extract just the string values and ensure they're valid
      const responsibleParties = result
        .map(item => item.responsibleParty)
        .filter(party => party && typeof party === 'string' && party.trim() !== ''); 
      
      console.log('Fetched responsible parties:', responsibleParties);
      res.json(responsibleParties);
    } catch (error) {
      console.error('Error fetching responsible parties:', error);
      res.status(500).json({ 
        message: 'Failed to fetch responsible parties',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/documents/:id/obligations', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if document exists
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Get obligations for document
      const obligations = await storage.getObligationsByDocument(id);
      
      res.json(obligations);
    } catch (error) {
      console.error('Error fetching document obligations:', error);
      res.status(500).json({ 
        message: 'Failed to fetch document obligations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Reminders routes
  app.post('/api/reminders', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = insertReminderSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid reminder data', 
          errors: validationResult.error.errors 
        });
      }
      
      // Create reminder
      const reminder = await storage.createReminder(validationResult.data);
      
      res.status(201).json(reminder);
    } catch (error) {
      console.error('Error creating reminder:', error);
      res.status(500).json({ 
        message: 'Failed to create reminder',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/reminders', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1; // Default user ID for now
      
      const reminders = await storage.getReminders(userId);
      
      res.json(reminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      res.status(500).json({ 
        message: 'Failed to fetch reminders',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/reminders/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const reminder = await storage.getReminder(id);
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }
      
      res.json(reminder);
    } catch (error) {
      console.error('Error fetching reminder:', error);
      res.status(500).json({ 
        message: 'Failed to fetch reminder',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.put('/api/reminders/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate request body
      const validationResult = insertReminderSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid reminder data', 
          errors: validationResult.error.errors 
        });
      }
      
      // Check if reminder exists
      const reminder = await storage.getReminder(id);
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }
      
      // Update reminder
      const updatedReminder = await storage.updateReminder(id, validationResult.data);
      
      res.json(updatedReminder);
    } catch (error) {
      console.error('Error updating reminder:', error);
      res.status(500).json({ 
        message: 'Failed to update reminder',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.delete('/api/reminders/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if reminder exists
      const reminder = await storage.getReminder(id);
      if (!reminder) {
        return res.status(404).json({ message: 'Reminder not found' });
      }
      
      // Delete reminder
      await storage.deleteReminder(id);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      res.status(500).json({ 
        message: 'Failed to delete reminder',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Projects routes
  app.post('/api/projects', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = insertProjectSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid project data', 
          errors: validationResult.error.errors 
        });
      }
      
      const project = await storage.createProject(validationResult.data);
      res.status(201).json(project);
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ 
        message: 'Failed to create project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/projects', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ 
        message: 'Failed to fetch projects',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ 
        message: 'Failed to fetch project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.put('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate request body
      const validationResult = insertProjectSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid project data', 
          errors: validationResult.error.errors 
        });
      }
      
      // Check if project exists
      const existingProject = await storage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Update project
      const updatedProject = await storage.updateProject(id, validationResult.data);
      res.json(updatedProject);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ 
        message: 'Failed to update project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.delete('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if project exists
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Delete the project (this will also update associated documents)
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ 
        message: 'Failed to delete project',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/projects/:id/documents', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if project exists
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Get documents for this project
      const documents = await storage.getDocumentsByProject(id);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching project documents:', error);
      res.status(500).json({ 
        message: 'Failed to fetch project documents',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/projects/:id/obligations', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if project exists
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Get obligations for this project
      const obligations = await storage.getObligationsByProject(id);
      res.json(obligations);
    } catch (error) {
      console.error('Error fetching project obligations:', error);
      res.status(500).json({ 
        message: 'Failed to fetch project obligations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Analytics routes
  app.get('/api/analytics/obligations', async (req: Request, res: Response) => {
    try {
      const obligations = await storage.getObligations();
      
      // Count obligations by status
      const statusCountsMap: Record<string, number> = {};
      obligations.forEach(obligation => {
        if (obligation.status) {
          statusCountsMap[obligation.status] = (statusCountsMap[obligation.status] || 0) + 1;
        }
      });
      
      res.json({
        total: obligations.length,
        statusCounts: statusCountsMap
      });
    } catch (error) {
      console.error('Error fetching obligation analytics:', error);
      res.status(500).json({ 
        message: 'Failed to fetch obligation analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.get('/api/analytics/deadlines', async (req: Request, res: Response) => {
    try {
      // Since due_date field is removed, we just return all obligations
      const obligations = await storage.getObligations();
      
      res.json({
        upcoming: obligations
      });
    } catch (error) {
      console.error('Error fetching deadline analytics:', error);
      res.status(500).json({ 
        message: 'Failed to fetch deadline analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  return httpServer;
}
