import { 
  users, type User, type InsertUser,
  documents, type Document, type InsertDocument,
  obligations, type Obligation, type InsertObligation,
  reminders, type Reminder, type InsertReminder
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(userId?: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Obligation methods
  getObligation(id: number): Promise<Obligation | undefined>;
  getObligations(filters?: {
    documentId?: number;
    type?: string;
    status?: string;
    dueDateStart?: Date;
    dueDateEnd?: Date;
    responsibleParty?: string;
  }): Promise<Obligation[]>;
  getObligationsByDocument(documentId: number): Promise<Obligation[]>;
  createObligation(obligation: InsertObligation): Promise<Obligation>;
  createBatchObligations(obligationsList: InsertObligation[]): Promise<Obligation[]>;
  updateObligation(id: number, obligation: Partial<Obligation>): Promise<Obligation | undefined>;
  deleteObligation(id: number): Promise<boolean>;
  
  // Reminder methods
  getReminder(id: number): Promise<Reminder | undefined>;
  getReminders(userId: number): Promise<Reminder[]>;
  getRemindersByObligation(obligationId: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, reminder: Partial<Reminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        created_at: new Date(),
        last_login: null,
        organization: insertUser.organization ?? null,
        role: insertUser.role ?? 'regular'
      })
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocuments(userId?: number): Promise<Document[]> {
    if (userId !== undefined) {
      return db.select().from(documents).where(eq(documents.user_id, userId)).orderBy(desc(documents.upload_date));
    }
    return db.select().from(documents).orderBy(desc(documents.upload_date));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values({
        ...insertDocument,
        description: insertDocument.description ?? null,
        user_id: insertDocument.user_id ?? null,
        upload_date: new Date(),
        last_modified: new Date(),
        extracted: false,
        extraction_date: null,
        status: 'not_processed' // Add status explicitly
      })
      .returning();
    return document;
  }

  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set({
        ...documentData,
        last_modified: new Date()
      })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    // First delete associated obligations
    await db.delete(obligations).where(eq(obligations.document_id, id));
    // Then delete the document
    await db.delete(documents).where(eq(documents.id, id));
    return true;
  }

  // Obligation methods
  async getObligation(id: number): Promise<Obligation | undefined> {
    const [obligation] = await db.select().from(obligations).where(eq(obligations.id, id));
    return obligation;
  }

  async getObligations(filters?: {
    documentId?: number;
    type?: string;
    status?: string;
    dueDateStart?: Date;
    dueDateEnd?: Date;
    responsibleParty?: string;
  }): Promise<Obligation[]> {
    let query = db.select().from(obligations);
    
    if (filters) {
      const conditions = [];
      
      if (filters.documentId !== undefined) {
        conditions.push(eq(obligations.document_id, filters.documentId));
      }
      
      if (filters.type !== undefined && filters.type !== '') {
        // Using type casting for enums
        conditions.push(eq(obligations.type, filters.type as any));
      }
      
      if (filters.status !== undefined && filters.status !== '') {
        // Using type casting for enums
        conditions.push(eq(obligations.status, filters.status as any));
      }
      
      if (filters.dueDateStart !== undefined) {
        conditions.push(gte(obligations.due_date, filters.dueDateStart));
      }
      
      if (filters.dueDateEnd !== undefined) {
        conditions.push(lte(obligations.due_date, filters.dueDateEnd));
      }
      
      if (filters.responsibleParty !== undefined && filters.responsibleParty !== '') {
        conditions.push(eq(obligations.responsible_party, filters.responsibleParty));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return query.orderBy(obligations.due_date);
  }

  async getObligationsByDocument(documentId: number): Promise<Obligation[]> {
    return db
      .select()
      .from(obligations)
      .where(eq(obligations.document_id, documentId))
      .orderBy(obligations.due_date);
  }

  async createObligation(insertObligation: InsertObligation): Promise<Obligation> {
    const [obligation] = await db
      .insert(obligations)
      .values({
        ...insertObligation,
        created_at: new Date(),
        last_modified: new Date(),
        status: insertObligation.status || 'pending',
        priority: insertObligation.priority || 'medium',
        created_by: insertObligation.created_by ?? null,
        modified_by: insertObligation.modified_by ?? null
      })
      .returning();
    return obligation;
  }

  async createBatchObligations(obligationsList: InsertObligation[]): Promise<Obligation[]> {
    if (obligationsList.length === 0) return [];
    
    // Add created_at and last_modified to each obligation and ensure default values
    const obligationsWithDefaults = obligationsList.map(obligation => ({
      ...obligation,
      created_at: new Date(),
      last_modified: new Date(),
      status: obligation.status || 'pending',
      priority: obligation.priority || 'medium',
      created_by: obligation.created_by ?? null,
      modified_by: obligation.modified_by ?? null
    }));

    return db
      .insert(obligations)
      .values(obligationsWithDefaults)
      .returning();
  }

  async updateObligation(id: number, obligationData: Partial<Obligation>): Promise<Obligation | undefined> {
    const [updatedObligation] = await db
      .update(obligations)
      .set({
        ...obligationData,
        last_modified: new Date()
      })
      .where(eq(obligations.id, id))
      .returning();
    return updatedObligation;
  }

  async deleteObligation(id: number): Promise<boolean> {
    // First delete associated reminders
    await db.delete(reminders).where(eq(reminders.obligation_id, id));
    // Then delete the obligation
    await db.delete(obligations).where(eq(obligations.id, id));
    return true;
  }

  // Reminder methods
  async getReminder(id: number): Promise<Reminder | undefined> {
    const [reminder] = await db.select().from(reminders).where(eq(reminders.id, id));
    return reminder;
  }

  async getReminders(userId: number): Promise<Reminder[]> {
    return db
      .select()
      .from(reminders)
      .where(eq(reminders.user_id, userId))
      .orderBy(reminders.reminder_date);
  }

  async getRemindersByObligation(obligationId: number): Promise<Reminder[]> {
    return db
      .select()
      .from(reminders)
      .where(eq(reminders.obligation_id, obligationId))
      .orderBy(reminders.reminder_date);
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const [reminder] = await db
      .insert(reminders)
      .values({
        ...insertReminder,
        message: insertReminder.message ?? null,
        notification_method: insertReminder.notification_method || 'in-app',
        active: insertReminder.active !== undefined ? insertReminder.active : true
      })
      .returning();
    return reminder;
  }

  async updateReminder(id: number, reminderData: Partial<Reminder>): Promise<Reminder | undefined> {
    const [updatedReminder] = await db
      .update(reminders)
      .set(reminderData)
      .where(eq(reminders.id, id))
      .returning();
    return updatedReminder;
  }

  async deleteReminder(id: number): Promise<boolean> {
    await db.delete(reminders).where(eq(reminders.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
