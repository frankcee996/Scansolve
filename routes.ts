import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuestionSchema } from "@shared/schema";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your_openai_api_key_here"
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Process question with AI
  app.post("/api/questions/process", async (req, res) => {
    try {
      const { text, questionType } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Question text is required" });
      }

      let systemPrompt = "";
      let userPrompt = "";

      if (questionType === "math") {
        systemPrompt = `You are a math tutor that provides step-by-step solutions. For any math problem, provide:
1. The final answer
2. Step-by-step solution with explanations
3. Each step should be clear and educational

Respond with JSON in this exact format:
{
  "answer": "final answer here",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "explanation": "What we're doing in this step",
      "calculation": "The mathematical operation",
      "result": "Result of this step"
    }
  ],
  "questionType": "math"
}`;
        
        userPrompt = `Solve this math problem step by step: ${text}`;
      } else {
        systemPrompt = `You are a knowledgeable assistant that answers questions clearly and concisely. Provide accurate, helpful information.

Respond with JSON in this exact format:
{
  "answer": "your detailed answer here",
  "steps": [],
  "questionType": "general"
}`;
        
        userPrompt = `Answer this question: ${text}`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Save question to storage
      const question = await storage.createQuestion({
        userId: null,
        originalText: text,
        questionType: result.questionType || questionType || "general",
        answer: result.answer,
        steps: JSON.stringify(result.steps || []),
        confidence: 95, // Default confidence for manual input
        isSaved: false,
      });

      res.json({
        id: question.id,
        answer: result.answer,
        steps: result.steps || [],
        questionType: result.questionType || questionType,
      });

    } catch (error) {
      console.error("Error processing question:", error);
      res.status(500).json({ message: "Failed to process question" });
    }
  });

  // Get recent questions
  app.get("/api/questions/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const questions = await storage.getRecentQuestions(limit);
      
      const formattedQuestions = questions.map(q => ({
        id: q.id,
        originalText: q.originalText,
        answer: q.answer,
        questionType: q.questionType,
        createdAt: q.createdAt,
        isSaved: q.isSaved,
      }));
      
      res.json(formattedQuestions);
    } catch (error) {
      console.error("Error fetching recent questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Toggle save question
  app.patch("/api/questions/:id/toggle-save", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedQuestion = await storage.toggleSaveQuestion(id);
      
      if (!updatedQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json({
        id: updatedQuestion.id,
        isSaved: updatedQuestion.isSaved,
      });
    } catch (error) {
      console.error("Error toggling save status:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  // Get saved questions
  app.get("/api/questions/saved", async (req, res) => {
    try {
      const allQuestions = await storage.getQuestionsByUser();
      const savedQuestions = allQuestions.filter(q => q.isSaved);
      
      const formattedQuestions = savedQuestions.map(q => ({
        id: q.id,
        originalText: q.originalText,
        answer: q.answer,
        questionType: q.questionType,
        createdAt: q.createdAt,
        isSaved: q.isSaved,
      }));
      
      res.json(formattedQuestions);
    } catch (error) {
      console.error("Error fetching saved questions:", error);
      res.status(500).json({ message: "Failed to fetch saved questions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}