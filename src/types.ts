export type StudyLevel = "Beginner" | "Intermediate" | "Advanced";
export type MeetingPreference = "Online" | "In-person" | "Both";
export type ScreenId =
  | "welcome"
  | "profile"
  | "discover"
  | "partner-details"
  | "connections"
  | "copilot";

export type ConnectionsTab = "incoming" | "accepted" | "sent";
export type ConnectionStatus = "none" | "incoming" | "sent" | "accepted";

export interface UserProfile {
  name: string;
  school: string;
  subjects: string[];
  level: StudyLevel;
  availability: string[];
  meetingPreference: MeetingPreference;
  goal: string;
}

export interface Partner {
  id: string;
  name: string;
  school: string;
  subjects: string[];
  level: StudyLevel;
  availability: string[];
  meetingPreference: MeetingPreference;
  goal: string;
  colorIndex: number;
}

export interface MatchEvaluation {
  partner: Partner;
  score: number;
  sharedSubjects: string[];
  sharedAvailability: string[];
  sameLevel: boolean;
  meetingCompatible: boolean;
  explanation: string;
}

export interface AiMatchInsight {
  partnerId: string;
  insight: string;
  sessionIdea: string;
}

export interface AnswerEvaluation {
  status: string;
  feedback: string;
  keyTakeaway: string;
}

export interface ConnectionState {
  incoming: string[];
  sent: string[];
  accepted: string[];
}

export interface FilterState {
  query: string;
  subject: string;
  level: string;
  availability: string;
  meetingPreference: string;
}

export interface AgendaStep {
  time: string;
  title: string;
  detail: string;
}

export interface PracticeQuestion {
  q: string;
  hint: string;
  a: string;
}

export interface CopilotPlan {
  id: number;
  subject: string;
  topic: string;
  duration: number;
  partnerName: string;
  agenda: AgendaStep[];
  questions: PracticeQuestion[];
  recap: string;
  source?: "gemini" | "sample";
}

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export interface CopilotState {
  subject: string;
  topic: string;
  duration: number;
  partnerId: string;
  plan: CopilotPlan | null;
  completedSteps: number[];
  revealedHints: number[];
  revealedAnswers: number[];
  chatHistory: ChatMessage[];
}

export interface AppState {
  hasOnboarded: boolean;
  currentScreen: ScreenId;
  selectedPartnerId: string | null;
  connectionsTab: ConnectionsTab;
  user: UserProfile;
  connections: ConnectionState;
  filters: FilterState;
  copilot: CopilotState;
}
