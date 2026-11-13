import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // 1. AI Study Plan Generator (Structured JSON)
  app.post("/api/copilot/plan", async (req, res) => {
    try {
      const { subject, topic, duration, partnerName, userLevel } = req.body ?? {};
      if (!subject || !topic) {
        return res.status(400).json({ error: "Subject and topic are required." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured in environment secrets.",
          code: "MISSING_API_KEY",
        });
      }

      const mins = Number(duration) || 45;
      const partnerContext = partnerName
        ? `with study partner ${partnerName}`
        : "for a collaborative peer study session";

      const prompt = `Create a structured ${mins}-minute collaborative study plan for ${subject} focused on "${topic}" (${userLevel || "Intermediate"} level) ${partnerContext}.

Requirements:
1. "agenda": Exactly 5 timed blocks whose minute durations sum strictly to ${mins} minutes (format time as "X min"). Each block must include a concise title and actionable collaborative detail for two peers.
2. "questions": Exactly 3 practice questions specifically about "${topic}" in ${subject} at an ${userLevel || "Intermediate"} level. Each question must include a subtle hint and a clear, accurate answer.
3. "recap": A concise 1-2 sentence takeaway summarizing how the students should reinforce "${topic}" after the session.`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "You are StudyBuddy Copilot, a collaborative peer-learning coach. Produce practical, academically accurate, plain-English study agendas and practice questions for students.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              agenda: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    title: { type: Type.STRING },
                    detail: { type: Type.STRING },
                  },
                  required: ["time", "title", "detail"],
                },
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    q: { type: Type.STRING },
                    hint: { type: Type.STRING },
                    a: { type: Type.STRING },
                  },
                  required: ["q", "hint", "a"],
                },
              },
              recap: { type: Type.STRING },
            },
            required: ["agenda", "questions", "recap"],
          },
        },
      });

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        return res.status(502).json({ error: "Empty response received from Gemini." });
      }

      const parsed = JSON.parse(rawText);
      return res.json({
        id: Date.now(),
        subject,
        topic,
        duration: mins,
        partnerName: partnerName || "",
        agenda: Array.isArray(parsed.agenda) ? parsed.agenda : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        recap: typeof parsed.recap === "string" ? parsed.recap : "",
        source: "gemini",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate study plan.";
      return res.status(500).json({ error: message });
    }
  });

  // 2. AI Practice Answer Evaluator (Structured JSON)
  app.post("/api/copilot/evaluate", async (req, res) => {
    try {
      const { subject, topic, question, expectedAnswer, studentAttempt } = req.body ?? {};
      if (!question || !studentAttempt) {
        return res.status(400).json({ error: "Question and student attempt are required." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured in environment secrets.",
          code: "MISSING_API_KEY",
        });
      }

      const prompt = `Subject: ${subject || "General"}
Topic: ${topic || "Study Session"}
Question: ${question}
Reference Answer: ${expectedAnswer || ""}
Student Attempt: ${studentAttempt}

Evaluate the student's attempt fairly and constructively. Return JSON with:
- "status": one of "Strong Mastery", "Good Progress", or "Needs Review"
- "feedback": 1-2 encouraging sentences explaining what they got right and how to sharpen their understanding
- "keyTakeaway": 1 short sentence highlighting the single most important concept to remember.`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "You are a supportive academic tutor checking a student's practice response. Be clear, accurate, and encouraging.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              feedback: { type: Type.STRING },
              keyTakeaway: { type: Type.STRING },
            },
            required: ["status", "feedback", "keyTakeaway"],
          },
        },
      });

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        return res.status(502).json({ error: "Empty evaluation received from Gemini." });
      }

      return res.json(JSON.parse(rawText));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to evaluate answer.";
      return res.status(500).json({ error: message });
    }
  });

  // 3. Streaming Follow-Up Q&A (SSE)
  app.post("/api/copilot/chat-stream", async (req, res) => {
    try {
      const { subject, topic, question, partnerName, history } = req.body ?? {};
      if (!question || !subject || !topic) {
        return res.status(400).json({ error: "Subject, topic, and question are required." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured in environment secrets.",
          code: "MISSING_API_KEY",
        });
      }

      const historyText = Array.isArray(history)
        ? history
            .slice(-6)
            .map((m: { role: string; text: string }) => `${m.role === "user" ? "Student" : "Copilot"}: ${m.text}`)
            .join("\n")
        : "";

      const prompt = `Subject: ${subject}
Topic: ${topic}
${partnerName ? `Study Partner: ${partnerName}` : ""}
${historyText ? `Recent conversation:\n${historyText}\n` : ""}
Student follow-up question: ${question}

Answer clearly in 2-4 concise sentences, keeping it practical for two peers studying together.`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await ai.models.generateContentStream({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "You are StudyBuddy Copilot, helping two students study together. Give clear, accurate, concise explanations and collaborative study tips in plain prose without markdown clutter.",
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text ?? "";
        if (text) {
          res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to stream response.";
      if (!res.headersSent) {
        return res.status(500).json({ error: message });
      }
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      return res.end();
    }
  });

  // 4. AI Match Insights for Top Candidates (Structured JSON)
  app.post("/api/ai/match-insights", async (req, res) => {
    try {
      const { user, candidates } = req.body ?? {};
      if (!user || !Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({ error: "User profile and candidates are required." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured in environment secrets.",
          code: "MISSING_API_KEY",
        });
      }

      const prompt = `Student Profile:
- Name: ${user.name || "Student"}
- Subjects: ${(user.subjects || []).join(", ")}
- Level: ${user.level}
- Availability: ${(user.availability || []).join(", ")}
- Format: ${user.meetingPreference}
- Goal: ${user.goal || "Consistent peer study"}

Candidate Partners:
${candidates
  .map(
    (c: {
      id: string;
      name: string;
      subjects: string[];
      level: string;
      availability: string[];
      meetingPreference: string;
      goal: string;
      score: number;
    }) =>
      `- ID ${c.id} (${c.name}): Subjects [${c.subjects.join(", ")}], Level ${c.level}, Free [${c.availability.join(", ")}], Format ${c.meetingPreference}, Goal "${c.goal}", Compatibility ${c.score}%`
  )
  .join("\n")}

For each candidate ID, provide:
- "partnerId": exact ID
- "insight": 1 concise, natural sentence explaining why their academic focus, level, or schedule pairs well with the student
- "sessionIdea": 1 specific 45-minute collaborative activity idea they could do together on a shared subject (under 15 words).`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "You are StudyBuddy's academic match advisor. Base insights strictly on subjects, study level, schedule overlap, meeting format, and study goals.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                partnerId: { type: Type.STRING },
                insight: { type: Type.STRING },
                sessionIdea: { type: Type.STRING },
              },
              required: ["partnerId", "insight", "sessionIdea"],
            },
          },
        },
      });

      const rawText = (response.text ?? "[]").trim();
      return res.json({ insights: JSON.parse(rawText) });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate match insights.";
      return res.status(500).json({ error: message });
    }
  });

  // 5. AI Partner Icebreaker / Study Invite Note
  app.post("/api/ai/icebreaker", async (req, res) => {
    try {
      const { user, partner, sharedSubjects, sharedAvailability } = req.body ?? {};
      if (!user || !partner) {
        return res.status(400).json({ error: "User and partner details are required." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured in environment secrets.",
          code: "MISSING_API_KEY",
        });
      }

      const prompt = `Write a friendly, concise 2-sentence study invite message from ${user.name || "a student"} to ${partner.name}.
Context:
- Shared subjects: ${(sharedSubjects || []).join(", ") || "general study accountability"}
- Overlapping free times: ${(sharedAvailability || []).join(", ") || "flexible scheduling"}
- Partner's goal: ${partner.goal}
- Preferred format: ${partner.meetingPreference}

Keep it natural, peer-to-peer, and focused on proposing a concrete first study session.`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "Write brief, authentic student-to-student study invite messages with zero filler or hashtags.",
        },
      });

      const message = (response.text ?? "").trim();
      if (!message) {
        return res.status(502).json({ error: "Empty message received from Gemini." });
      }
      return res.json({ message });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to draft invite message.";
      return res.status(500).json({ error: message });
    }
  });

  // 6. AI Study Goal Suggester for Profile Setup
  app.post("/api/ai/suggest-goal", async (req, res) => {
    try {
      const { subjects, level, meetingPreference } = req.body ?? {};
      if (!Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({ error: "Select at least one subject first." });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is not configured in environment secrets.",
          code: "MISSING_API_KEY",
        });
      }

      const prompt = `Write a single concise, motivating 1-sentence study goal (under 24 words) for a ${level || "Intermediate"}-level student studying ${subjects.join(", ")} who prefers ${meetingPreference || "Online"} sessions.`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "Generate a practical, plain-language student study goal in first-person or concise action phrasing.",
        },
      });

      const goal = (response.text ?? "").trim();
      if (!goal) {
        return res.status(502).json({ error: "Empty goal received from Gemini." });
      }
      return res.json({ goal });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to suggest study goal.";
      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyBuddy server listening on http://localhost:${PORT}`);
  });
}

startServer();
