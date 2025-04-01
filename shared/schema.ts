import { pgTable, text, serial, integer, boolean, timestamp, varchar, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const obligationStatusEnum = pgEnum('obligation_status', [
  'pending',
  'completed',
  'overdue'
]);

export const notificationMethodEnum = pgEnum('notification_method', [
  'email',
  'in-app',
  'both'
]);

export const fileTypeEnum = pgEnum('file_type', [
  'pdf',
  'docx',
  'txt'
]);

export const recurrenceTypeEnum = pgEnum('recurrence_type', [
  'none',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'custom'
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  organization: text("organization"),
  role: text("role").default('regular').notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_login: timestamp("last_login")
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_modified: timestamp("last_modified").defaultNow().notNull(),
  user_id: integer("user_id").references(() => users.id)
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  file_path: text("file_path").notNull(),
  file_type: fileTypeEnum("file_type").notNull(),
  upload_date: timestamp("upload_date").defaultNow().notNull(),
  last_modified: timestamp("last_modified").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
  user_id: integer("user_id").references(() => users.id),
  project_id: integer("project_id").references(() => projects.id),
  extracted: boolean("extracted").default(false).notNull(),
  extraction_date: timestamp("extraction_date"),
  status: text("status").default('not_processed').notNull()
});

// Obligations table
export const obligations = pgTable("obligations", {
  id: serial("id").primaryKey(),
  document_id: integer("document_id").references(() => documents.id).notNull(),
  text: text("text").notNull(), // One sentence summary of the obligation
  responsible_party: text("responsible_party"),
  status: obligationStatusEnum("status").default("pending").notNull(),
  original_text: text("original_text"), // All contractual clause wording for the obligation
  clause_number: text("clause_number"), // Clause number from the contract
  section_name: text("section_name"), // Section name from the contract
  page_number: integer("page_number"),
  // Recurrence fields
  is_recurring: boolean("is_recurring").default(false).notNull(),
  recurrence_type: recurrenceTypeEnum("recurrence_type").default("none").notNull(),
  recurrence_interval: integer("recurrence_interval"), // For example, every 2 weeks
  recurrence_day: integer("recurrence_day"), // Day of month/week (1-31 or 0-6 for Sunday-Saturday)
  recurrence_month: integer("recurrence_month"), // Month of year (1-12)
  recurrence_end_date: timestamp("recurrence_end_date"), // When recurrence ends, if applicable
  recurrence_custom_text: text("recurrence_custom_text"), // Description for custom recurrence patterns
  // Standard fields
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_modified: timestamp("last_modified").defaultNow().notNull(),
  created_by: integer("created_by").references(() => users.id),
  modified_by: integer("modified_by").references(() => users.id)
});

// Reminders table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  obligation_id: integer("obligation_id").references(() => obligations.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  reminder_date: timestamp("reminder_date").notNull(),
  notification_method: notificationMethodEnum("notification_method").default("in-app").notNull(),
  message: text("message"),
  active: boolean("active").default(true).notNull()
});

// Define relations after all tables are defined
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  obligations: many(obligations),
  reminders: many(reminders),
  projects: many(projects)
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.user_id],
    references: [users.id]
  }),
  documents: many(documents)
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.user_id],
    references: [users.id]
  }),
  project: one(projects, {
    fields: [documents.project_id],
    references: [projects.id]
  }),
  obligations: many(obligations)
}));

export const obligationsRelations = relations(obligations, ({ one, many }) => ({
  document: one(documents, {
    fields: [obligations.document_id],
    references: [documents.id]
  }),
  creator: one(users, {
    fields: [obligations.created_by],
    references: [users.id]
  }),
  modifier: one(users, {
    fields: [obligations.modified_by],
    references: [users.id]
  }),
  reminders: many(reminders)
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  obligation: one(obligations, {
    fields: [reminders.obligation_id],
    references: [obligations.id]
  }),
  user: one(users, {
    fields: [reminders.user_id],
    references: [users.id]
  })
}));

// Zod validation schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  last_login: true
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  upload_date: true,
  last_modified: true,
  extracted: true,
  extraction_date: true
});

export const insertObligationSchema = createInsertSchema(obligations).omit({
  id: true,
  created_at: true,
  last_modified: true
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  created_at: true,
  last_modified: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertObligation = z.infer<typeof insertObligationSchema>;
export type Obligation = typeof obligations.$inferSelect;

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
