import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  originalText: text("original_text").notNull(),
  questionType: text("question_type").notNull(), // 'math', 'general', 'science', etc.
  answer: text("answer").notNull(),
  steps: text("steps"), // JSON string for step-by-step solutions
  confidence: integer("confidence").default(0), // OCR confidence 0-100
  createdAt: timestamp("created_at").defaultNow(),
  isSaved: boolean("is_saved").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;