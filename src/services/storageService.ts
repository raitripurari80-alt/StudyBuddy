import type { AppState } from "../types";

const STORAGE_KEY = "studybuddy_state_v2";

export const StorageService = {
  getDefaultState(): AppState {
    return {
      hasOnboarded: false,
      currentScreen: "welcome",
      selectedPartnerId: null,
      connectionsTab: "incoming",
      user: {
        name: "",
        school: "",
        subjects: [],
        level: "Intermediate",
        availability: [],
        meetingPreference: "Online",
        goal: "",
      },
      connections: {
        incoming: ["p1", "p5"],
        sent: [],
        accepted: ["p2"],
      },
      filters: {
        query: "",
        subject: "All",
        level: "All",
        availability: "All",
        meetingPreference: "All",
      },
      copilot: {
        subject: "Biology",
        topic: "Cellular Respiration & ATP",
        duration: 45,
        partnerId: "",
        plan: null,
        completedSteps: [],
        revealedHints: [],
        revealedAnswers: [],
        chatHistory: [],
      },
    };
  },

  load(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const def = this.getDefaultState();
      if (!raw) return def;
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        ...def,
        ...parsed,
        user: { ...def.user, ...(parsed.user || {}) },
        connections: { ...def.connections, ...(parsed.connections || {}) },
        filters: { ...def.filters, ...(parsed.filters || {}) },
        copilot: { ...def.copilot, ...(parsed.copilot || {}) },
      };
    } catch {
      return this.getDefaultState();
    }
  },

  save(state: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore private browsing quota errors
    }
  },

  reset(): AppState {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    return this.getDefaultState();
  },
};
