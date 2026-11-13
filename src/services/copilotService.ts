import type {
  AiMatchInsight,
  AnswerEvaluation,
  ChatMessage,
  CopilotPlan,
  MatchEvaluation,
  MeetingPreference,
  Partner,
  PracticeQuestion,
  StudyLevel,
  UserProfile,
} from "../types";

const TOPIC_BANK: Record<string, { questions: PracticeQuestion[]; recap: string }> = {
  Biology: {
    questions: [
      {
        q: "What is the primary role of ATP in cellular processes, and where is most of it generated during aerobic respiration?",
        hint: "Think about the final stage inside the inner mitochondrial membrane.",
        a: "ATP acts as the cell's usable energy currency. Most ATP (~30-34 molecules per glucose) is generated in the mitochondria during oxidative phosphorylation (electron transport chain and chemiosmosis).",
      },
      {
        q: "Compare transcription and translation in one sentence each.",
        hint: "Focus on the starting molecule, ending molecule, and cellular location.",
        a: "Transcription copies a DNA gene into mRNA inside the nucleus, while translation decodes that mRNA at a ribosome to assemble a polypeptide chain.",
      },
      {
        q: "How can two heterozygous parents (Aa x Aa) produce a recessive phenotype?",
        hint: "Picture a standard 2x2 Punnett square.",
        a: "Each parent has a 50% chance of passing the recessive allele (a), creating a 25% (1 in 4) probability of an offspring with genotype aa.",
      },
    ],
    recap:
      "Anchor biological terms in processes rather than isolated definitions: trace inputs, locations, and outputs.",
  },
  Calculus: {
    questions: [
      {
        q: "When differentiating f(g(x)), what does the Chain Rule tell you to do?",
        hint: "Think outer derivative first, then multiply.",
        a: "Differentiate the outer function evaluated at g(x), then multiply by the derivative of the inner function: f'(g(x)) * g'(x).",
      },
      {
        q: "How do you recognize when Integration by Parts is a good strategy?",
        hint: "Look for a product of two distinct function types (like x * e^x).",
        a: "It works best on products of functions from different families where differentiating one part simplifies the integral.",
      },
      {
        q: "What is the geometric meaning of a derivative at x = a?",
        hint: "Imagine zooming in closely on the curve at one point.",
        a: "It represents the instantaneous rate of change—equivalently, the slope of the tangent line to the curve at x = a.",
      },
    ],
    recap:
      "Always state what each step changes (rate, area, or tangent slope) before jumping into algebra.",
  },
  "Computer Science": {
    questions: [
      {
        q: "Why does a recursive function always need a base case?",
        hint: "Consider what happens on the call stack without a stopping condition.",
        a: "The base case stops further recursive calls; without it, the function recurses indefinitely until it causes a stack overflow.",
      },
      {
        q: "What is the difference between O(n) and O(log n) search performance as input size grows to 1,000,000 items?",
        hint: "Compare checking every element vs. halving the search space each step.",
        a: "O(n) may inspect up to 1,000,000 elements, while O(log n) (such as binary search on sorted data) takes roughly 20 comparisons.",
      },
      {
        q: "When is a hash map preferred over an array for lookups?",
        hint: "Think about searching by key vs. searching by numeric index.",
        a: "A hash map gives average O(1) key-based lookup without needing sequential indices or scanning all items.",
      },
    ],
    recap:
      "Trace small inputs by hand first, verify edge cases, and state time and space complexity aloud.",
  },
  Psychology: {
    questions: [
      {
        q: "What is the difference between positive reinforcement and negative reinforcement?",
        hint: "Both increase a behavior—one adds something, one removes something.",
        a: "Positive reinforcement strengthens a behavior by adding a desirable stimulus; negative reinforcement strengthens a behavior by removing an unpleasant stimulus.",
      },
      {
        q: "Why is spaced repetition more effective for long-term memory than cramming?",
        hint: "Think about retrieval effort and memory consolidation.",
        a: "Spacing forces active retrieval after slight forgetting, strengthening neural pathways and improving long-term retention.",
      },
      {
        q: "Give one real-world example of confirmation bias.",
        hint: "Consider how people evaluate evidence for an existing belief.",
        a: "Only noticing evidence that supports an existing belief about a study method while ignoring data showing another method works better.",
      },
    ],
    recap:
      "Connect every psychological concept to one concrete everyday example so it sticks during exams.",
  },
};

export interface CopilotPlanParams {
  subject: string;
  topic: string;
  duration: number;
  partnerName?: string;
  userLevel: StudyLevel;
}

export interface CopilotChatParams {
  subject: string;
  topic: string;
  question: string;
  partnerName?: string;
  history: ChatMessage[];
}

export class CopilotApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

export const CopilotService = {
  async generatePlan(params: CopilotPlanParams): Promise<CopilotPlan> {
    const res = await fetch("/api/copilot/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new CopilotApiError(
        data.error || "Unable to generate study plan right now.",
        data.code
      );
    }
    return data as CopilotPlan;
  },

  async evaluateAnswer(params: {
    subject: string;
    topic: string;
    question: string;
    expectedAnswer: string;
    studentAttempt: string;
  }): Promise<AnswerEvaluation> {
    const res = await fetch("/api/copilot/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new CopilotApiError(
        data.error || "Unable to evaluate answer right now.",
        data.code
      );
    }
    return data as AnswerEvaluation;
  },

  async streamFollowUp(
    params: CopilotChatParams,
    onChunk: (partialText: string) => void
  ): Promise<string> {
    const res = await fetch("/api/copilot/chat-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new CopilotApiError(
        data.error || "Unable to answer follow-up question right now.",
        data.code
      );
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new CopilotApiError("Streaming response unavailable.");
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;
        const payload = JSON.parse(jsonStr) as {
          chunk?: string;
          done?: boolean;
          error?: string;
        };
        if (payload.error) {
          throw new CopilotApiError(payload.error);
        }
        if (payload.chunk) {
          fullText += payload.chunk;
          onChunk(fullText);
        }
      }
    }

    return fullText;
  },

  async generateMatchInsights(
    user: UserProfile,
    matches: MatchEvaluation[]
  ): Promise<Record<string, AiMatchInsight>> {
    const candidates = matches.map((m) => ({
      id: m.partner.id,
      name: m.partner.name,
      subjects: m.partner.subjects,
      level: m.partner.level,
      availability: m.partner.availability,
      meetingPreference: m.partner.meetingPreference,
      goal: m.partner.goal,
      score: m.score,
    }));

    const res = await fetch("/api/ai/match-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, candidates }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new CopilotApiError(
        data.error || "Unable to generate AI match insights right now.",
        data.code
      );
    }

    const map: Record<string, AiMatchInsight> = {};
    for (const item of (data.insights || []) as AiMatchInsight[]) {
      if (item.partnerId) {
        map[item.partnerId] = item;
      }
    }
    return map;
  },

  async draftIcebreaker(params: {
    user: UserProfile;
    partner: Partner;
    sharedSubjects: string[];
    sharedAvailability: string[];
  }): Promise<string> {
    const res = await fetch("/api/ai/icebreaker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new CopilotApiError(
        data.error || "Unable to draft study invite right now.",
        data.code
      );
    }
    return data.message as string;
  },

  async suggestStudyGoal(params: {
    subjects: string[];
    level: StudyLevel;
    meetingPreference: MeetingPreference;
  }): Promise<string> {
    const res = await fetch("/api/ai/suggest-goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new CopilotApiError(
        data.error || "Unable to suggest a study goal right now.",
        data.code
      );
    }
    return data.goal as string;
  },

  generateSamplePlan(params: CopilotPlanParams): CopilotPlan {
    const mins = Number(params.duration) || 45;
    const collabLabel = params.partnerName
      ? `with ${params.partnerName}`
      : "with your study partner";

    const allocations =
      {
        30: [4, 9, 10, 4, 3],
        45: [5, 13, 15, 7, 5],
        60: [6, 16, 22, 10, 6],
        90: [8, 22, 35, 17, 8],
      }[mins] || [5, 13, 15, 7, 5];

    const agenda = [
      {
        time: `${allocations[0]} min`,
        title: "Check-In & Target Goal",
        detail: `Agree ${collabLabel} on one core outcome for "${params.topic}" (${params.userLevel} pace) and list 2 confusing sub-questions.`,
      },
      {
        time: `${allocations[1]} min`,
        title: "Concept Breakdown & Teach-Back",
        detail: `Split "${params.topic}" into two halves. Each person summarizes their half in plain English without looking at notes.`,
      },
      {
        time: `${allocations[2]} min`,
        title: "Collaborative Problem Solving",
        detail:
          "Work through the practice prompts below together. Talk through your reasoning step by step before checking answers.",
      },
      {
        time: `${allocations[3]} min`,
        title: "Rapid Recall Quiz",
        detail: `Close textbooks and quiz each other on key terms, formulas, or cause-and-effect links in ${params.subject}.`,
      },
      {
        time: `${allocations[4]} min`,
        title: "Wrap-Up & Next Step",
        detail: `Write down the 1 trickiest part of "${params.topic}" to revisit next session and confirm your next meeting time.`,
      },
    ];

    const bank = TOPIC_BANK[params.subject];
    const questions: PracticeQuestion[] = bank
      ? bank.questions.map((item, idx) =>
          idx === 0 ? { ...item, q: `${params.topic}: ${item.q}` } : item
        )
      : [
          {
            q: `Explain the core idea of "${params.topic}" in ${params.subject} as if teaching a friend who missed class.`,
            hint: "Start with what problem it solves or why it matters, then give one clear example.",
            a: `A strong summary defines "${params.topic}" in 2-3 plain sentences, identifies its key components, and walks through one concrete ${params.subject} example.`,
          },
          {
            q: `What is one common mistake students make when applying "${params.topic}"?`,
            hint: "Think about assumptions, units, edge cases, or mixing up two similar terms.",
            a: `Most mistakes happen when skipping setup steps or confusing "${params.topic}" with a related concept—writing down given conditions first prevents this.`,
          },
          {
            q: `Create one quick practice scenario using "${params.topic}" and trade solutions with your partner.`,
            hint: "Keep numbers or conditions simple so you can check each other's logic in 2 minutes.",
            a: "Trading custom mini-problems checks true understanding and reveals hidden gaps faster than re-reading notes.",
          },
        ];

    const recap = bank
      ? `${bank.recap} Today's focus ("${params.topic}") works best when both partners explain why an answer works, not just what it is.`
      : `Combine a plain-language teach-back of "${params.topic}" in ${params.subject} with active testing rather than passive re-reading.`;

    return {
      id: Date.now(),
      subject: params.subject,
      topic: params.topic,
      duration: mins,
      partnerName: params.partnerName || "",
      agenda,
      questions,
      recap,
      source: "sample",
    };
  },

  answerSampleFollowUp(params: CopilotChatParams): string {
    const qLower = params.question.toLowerCase();
    const partnerRef = params.partnerName
      ? `you and ${params.partnerName}`
      : "you and your partner";

    if (qLower.includes("simpl") || qLower.includes("easy")) {
      return `Simple breakdown for "${params.topic}" (${params.subject}): Think of it in three steps—what goes in, what mechanism transforms it, and what comes out. Have ${partnerRef} sketch those three steps on paper in 60 seconds and compare.`;
    }
    if (qLower.includes("example") || qLower.includes("real")) {
      return `Real-world angle for "${params.topic}": Connect it to an observable everyday system and challenge your partner to spot one concrete example before your next check-in.`;
    }
    if (qLower.includes("quiz") || qLower.includes("question") || qLower.includes("test")) {
      return `Bonus ${params.subject} mini-quiz on "${params.topic}": Without checking notes, ask your partner what would happen to the final outcome if one key variable or condition doubled or failed completely.`;
    }
    if (qLower.includes("divide") || qLower.includes("split") || qLower.includes("partner")) {
      return `To divide "${params.topic}" effectively, ${partnerRef} can split into definitions and intuition for 5 minutes, a worked example for 5 minutes, then solve a fresh problem independently before comparing steps.`;
    }

    return `To unpack "${params.question.trim()}" in ${params.topic}, isolate the core principle behind it, test it on a tiny concrete case, and ask your partner to verify each step aloud.`;
  },
};
