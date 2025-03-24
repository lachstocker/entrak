import { pgTable, text, serial, integer, boolean, timestamp, varchar, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const obligationTypeEnum = pgEnum('obligation_type', [
  'payment',
  'delivery',
  'reporting',
  'compliance',
  'renewal',
  'termination',
  'other'
]);

export const obligationStatusEnum = pgEnum('obligation_status', [
  'pending',
  'completed',
  'overdue'
]);

export const obligationPriorityEnum = pgEnum('obligation_priority', [
  'high',
  'medium',
  'low'
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

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  obligations: many(obligations),
  reminders: many(reminders)
}));

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
  extracted: boolean("extracted").default(false).notNull(),
  extraction_date: timestamp("extraction_date")
});

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.user_id],
    references: [users.id]
  }),
  obligations: many(obligations)
}));

// Obligations table
export const obligations = pgTable("obligations", {
  id: serial("id").primaryKey(),
  document_id: integer("document_id").references(() => documents.id).notNull(),
  text: text("text").notNull(),
  type: obligationTypeEnum("type").notNull(),
  start_date: timestamp("start_date"),
  due_date: timestamp("due_date"),
  responsible_party: text("responsible_party"),
  status: obligationStatusEnum("status").default("pending").notNull(),
  priority: obligationPriorityEnum("priority").default("medium").notNull(),
  confidence_score: integer("confidence_score"),
  original_text: text("original_text"),
  page_number: integer("page_number"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_modified: timestamp("last_modified").defaultNow().notNull(),
  created_by: integer("created_by").references(() => users.id),
  modified_by: integer("modified_by").references(() => users.id)
});

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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertObligation = z.infer<typeof insertObligationSchema>;
export type Obligation = typeof obligations.$inferSelect;

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
