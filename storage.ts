import { users, questions, type User, type InsertUser, type Question, type InsertQuestion } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByUser(userId?: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  toggleSaveQuestion(id: number): Promise<Question | undefined>;
  getRecentQuestions(limit?: number): Promise<Question[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questions: Map<number, Question>;
  private currentUserId: number;
  private currentQuestionId: number;

  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.currentUserId = 1;
    this.currentQuestionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentQuestionId++;
    const question: Question = {
      ...insertQuestion,
      id,
      createdAt: new Date(),
      userId: insertQuestion.userId || null,
      steps: insertQuestion.steps || null,
      confidence: insertQuestion.confidence || null,
      isSaved: insertQuestion.isSaved || false,
    };
    this.questions.set(id, question);
    return question;
  }

  async getQuestionsByUser(userId?: number): Promise<Question[]> {
    const allQuestions = Array.from(this.questions.values());
    if (userId) {
      return allQuestions.filter(q => q.userId === userId);
    }
    return allQuestions;
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async toggleSaveQuestion(id: number): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (question) {
      question.isSaved = !question.isSaved;
      this.questions.set(id, question);
      return question;
    }
    return undefined;
  }

  async getRecentQuestions(limit: number = 10): Promise<Question[]> {
    const allQuestions = Array.from(this.questions.values());
    return allQuestions
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }
}

export const storage = new MemStorage();