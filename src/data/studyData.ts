import type { MeetingPreference, Partner, StudyLevel } from "../types";

export const STUDY_SUBJECTS: string[] = [
  "Biology",
  "Calculus",
  "Computer Science",
  "Organic Chemistry",
  "Psychology",
  "Economics",
  "Physics",
  "World History",
  "Linear Algebra",
  "Spanish",
];

export const STUDY_LEVELS: StudyLevel[] = ["Beginner", "Intermediate", "Advanced"];

export const AVAILABILITY_SLOTS: string[] = [
  "Weekday Mornings",
  "Weekday Afternoons",
  "Monday Evenings",
  "Wednesday Evenings",
  "Friday Evenings",
  "Weekend Mornings",
  "Weekend Afternoons",
];

export const MEETING_STYLES: MeetingPreference[] = ["Online", "In-person", "Both"];

export const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  Biology: [
    "Cellular Respiration & ATP",
    "DNA Replication & Transcription",
    "Mendelian Genetics",
  ],
  Calculus: [
    "Chain Rule & Implicit Differentiation",
    "Integration by Parts",
    "Limits & Continuity",
  ],
  "Computer Science": [
    "Recursion & Trees",
    "Dynamic Programming Basics",
    "Big-O Time Complexity",
  ],
  "Organic Chemistry": [
    "SN1 vs SN2 Reactions",
    "Stereochemistry & Chirality",
    "Aromaticity",
  ],
  Psychology: [
    "Memory Encoding & Retrieval",
    "Classical vs Operant Conditioning",
    "Neurotransmitters",
  ],
  Economics: [
    "Supply, Demand & Elasticity",
    "Fiscal vs Monetary Policy",
    "Market Structures",
  ],
  Physics: [
    "Newtonian Mechanics & Free-Body Diagrams",
    "Thermodynamics Laws",
    "Electric Fields",
  ],
  "World History": [
    "Industrial Revolution Causes",
    "Silk Road Trade Networks",
    "Post-WWII Geopolitics",
  ],
  "Linear Algebra": [
    "Eigenvalues & Eigenvectors",
    "Matrix Transformations",
    "Vector Spaces",
  ],
  Spanish: [
    "Preterite vs Imperfect Tense",
    "Subjunctive Mood Practice",
    "Conversational Travel Phrases",
  ],
};

export const AVATAR_STYLES: string[] = [
  "bg-orange-500 text-zinc-950",
  "bg-zinc-800 text-orange-400 border border-zinc-700",
  "bg-amber-500 text-zinc-950",
  "bg-orange-600 text-zinc-950",
  "bg-zinc-700 text-zinc-100 border border-zinc-600",
  "bg-orange-400 text-zinc-950",
];

export const SAMPLE_PARTNERS: Partner[] = [
  {
    id: "p1",
    name: "Maya Patel",
    school: "Oakridge State University",
    subjects: ["Biology", "Organic Chemistry", "Psychology"],
    level: "Intermediate",
    availability: ["Wednesday Evenings", "Weekend Mornings"],
    meetingPreference: "Both",
    goal: "Preparing for midterms with active recall flashcards and diagram walkthroughs.",
    colorIndex: 0,
  },
  {
    id: "p2",
    name: "Liam Carter",
    school: "Northside Community College",
    subjects: ["Computer Science", "Calculus", "Linear Algebra"],
    level: "Intermediate",
    availability: ["Monday Evenings", "Wednesday Evenings", "Weekend Afternoons"],
    meetingPreference: "Online",
    goal: "Practicing data structures problems together and reviewing calculus derivations.",
    colorIndex: 1,
  },
  {
    id: "p3",
    name: "Sofia Morales",
    school: "Metro Tech Institute",
    subjects: ["Biology", "Calculus", "Physics"],
    level: "Beginner",
    availability: ["Weekday Afternoons", "Wednesday Evenings"],
    meetingPreference: "In-person",
    goal: "Looking for a calm library partner to break down tough textbook chapters step by step.",
    colorIndex: 2,
  },
  {
    id: "p4",
    name: "Noah Kim",
    school: "Westfield University",
    subjects: ["Economics", "Calculus", "World History"],
    level: "Advanced",
    availability: ["Weekday Mornings", "Friday Evenings", "Weekend Mornings"],
    meetingPreference: "Online",
    goal: "Working through past exam papers and quizzing each other under timed conditions.",
    colorIndex: 3,
  },
  {
    id: "p5",
    name: "Hannah Brooks",
    school: "Cedar Valley High",
    subjects: ["Psychology", "Biology", "Spanish"],
    level: "Intermediate",
    availability: ["Monday Evenings", "Weekend Mornings", "Weekend Afternoons"],
    meetingPreference: "Both",
    goal: "Building consistent weekly study habits with short 45-minute focused sessions.",
    colorIndex: 4,
  },
  {
    id: "p6",
    name: "Ethan Nguyen",
    school: "Lakeside Engineering College",
    subjects: ["Computer Science", "Physics", "Linear Algebra"],
    level: "Advanced",
    availability: ["Wednesday Evenings", "Friday Evenings"],
    meetingPreference: "Online",
    goal: "Solving algorithm challenges and explaining concepts aloud to check understanding.",
    colorIndex: 5,
  },
  {
    id: "p7",
    name: "Chloe Bennett",
    school: "",
    subjects: ["Organic Chemistry", "Biology", "Calculus"],
    level: "Beginner",
    availability: ["Weekday Afternoons", "Weekend Afternoons"],
    meetingPreference: "In-person",
    goal: "Staying accountable with problem sets and turning notes into quick summary sheets.",
    colorIndex: 1,
  },
  {
    id: "p8",
    name: "Daniel Okafor",
    school: "Greenwood University",
    subjects: ["Economics", "World History", "Spanish"],
    level: "Intermediate",
    availability: ["Monday Evenings", "Wednesday Evenings", "Weekend Mornings"],
    meetingPreference: "Both",
    goal: "Reviewing lecture key points, practicing essays, and conversational Spanish.",
    colorIndex: 0,
  },
];
