import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, Send, Sparkles } from "lucide-react";
import {
  SAMPLE_PARTNERS,
  STUDY_SUBJECTS,
  TOPIC_SUGGESTIONS,
} from "../data/studyData";
import { CopilotApiError, CopilotService } from "../services/copilotService";
import type { AnswerEvaluation, CopilotState, StudyLevel } from "../types";

interface CopilotScreenProps {
  copilot: CopilotState;
  acceptedPartnerIds: string[];
  userSubjects: string[];
  userLevel: StudyLevel;
  onUpdateCopilot: (next: CopilotState) => void;
  onNotify: (message: string) => void;
}

const QUICK_PROMPTS = [
  "Explain this more simply",
  "Give me a real-world example",
  "Quiz me with another question",
  "How should my partner and I divide this?",
];

export function CopilotScreen({
  copilot,
  acceptedPartnerIds,
  userSubjects,
  userLevel,
  onUpdateCopilot,
  onNotify,
}: CopilotScreenProps) {
  const [subject, setSubject] = useState(copilot.subject);
  const [topic, setTopic] = useState(copilot.topic);
  const [duration, setDuration] = useState(copilot.duration || 45);
  const [partnerId, setPartnerId] = useState(copilot.partnerId || "");

  const [isGenerating, setIsGenerating] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [attempts, setAttempts] = useState<Record<number, string>>({});
  const [evaluatingIdx, setEvaluatingIdx] = useState<number | null>(null);
  const [evaluations, setEvaluations] = useState<Record<number, AnswerEvaluation>>({});

  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [streamingReply, setStreamingReply] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSubject(copilot.subject);
    setTopic(copilot.topic);
    setDuration(copilot.duration || 45);
    setPartnerId(copilot.partnerId || "");
  }, [copilot.subject, copilot.topic, copilot.duration, copilot.partnerId]);

  const acceptedPartners = SAMPLE_PARTNERS.filter((p) =>
    acceptedPartnerIds.includes(p.id)
  );
  const allSubjectOptions = Array.from(
    new Set([...(userSubjects || []), ...STUDY_SUBJECTS])
  );
  const topicChips = TOPIC_SUGGESTIONS[subject] || [
    `${subject} Core Foundations`,
    `${subject} Practice Problems`,
    `${subject} Exam Review`,
  ];

  const handleSubjectChange = (nextSubject: string) => {
    setSubject(nextSubject);
    const suggested =
      TOPIC_SUGGESTIONS[nextSubject]?.[0] || `${nextSubject} Key Concepts`;
    setTopic(suggested);
  };

  const handleGeneratePlan = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      onNotify("Please enter a study topic.");
      return;
    }

    const partner = SAMPLE_PARTNERS.find((p) => p.id === partnerId);
    setPlanError(null);
    setIsGenerating(true);
    setAttempts({});
    setEvaluations({});

    try {
      const plan = await CopilotService.generatePlan({
        subject,
        topic: trimmedTopic,
        duration,
        partnerName: partner?.name,
        userLevel,
      });
      onUpdateCopilot({
        subject,
        topic: trimmedTopic,
        duration,
        partnerId,
        plan,
        completedSteps: [],
        revealedHints: [],
        revealedAnswers: [],
        chatHistory: [],
      });
    } catch (err: unknown) {
      const message =
        err instanceof CopilotApiError || err instanceof Error
          ? err.message
          : "Unable to connect to AI Study Copilot.";
      setPlanError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseSamplePlan = () => {
    const trimmedTopic = topic.trim() || `${subject} Core Concepts`;
    const partner = SAMPLE_PARTNERS.find((p) => p.id === partnerId);
    const plan = CopilotService.generateSamplePlan({
      subject,
      topic: trimmedTopic,
      duration,
      partnerName: partner?.name,
      userLevel,
    });
    setPlanError(null);
    setAttempts({});
    setEvaluations({});
    onUpdateCopilot({
      subject,
      topic: trimmedTopic,
      duration,
      partnerId,
      plan,
      completedSteps: [],
      revealedHints: [],
      revealedAnswers: [],
      chatHistory: [],
    });
    onNotify("Loaded sample collaborative study plan.");
  };

  const toggleAgendaStep = (idx: number) => {
    const list = copilot.completedSteps || [];
    const next = list.includes(idx)
      ? list.filter((i) => i !== idx)
      : [...list, idx];
    onUpdateCopilot({ ...copilot, completedSteps: next });
  };

  const toggleHint = (idx: number) => {
    const list = copilot.revealedHints || [];
    const next = list.includes(idx)
      ? list.filter((i) => i !== idx)
      : [...list, idx];
    onUpdateCopilot({ ...copilot, revealedHints: next });
  };

  const toggleAnswer = (idx: number) => {
    const list = copilot.revealedAnswers || [];
    const next = list.includes(idx)
      ? list.filter((i) => i !== idx)
      : [...list, idx];
    onUpdateCopilot({ ...copilot, revealedAnswers: next });
  };

  const handleEvaluateAttempt = async (idx: number) => {
    if (!copilot.plan) return;
    const studentAttempt = (attempts[idx] || "").trim();
    if (!studentAttempt) {
      onNotify("Type your answer attempt before checking with AI.");
      return;
    }

    const item = copilot.plan.questions[idx];
    setEvaluatingIdx(idx);
    try {
      const evaluation = await CopilotService.evaluateAnswer({
        subject: copilot.plan.subject,
        topic: copilot.plan.topic,
        question: item.q,
        expectedAnswer: item.a,
        studentAttempt,
      });
      setEvaluations((prev) => ({ ...prev, [idx]: evaluation }));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unable to evaluate answer.";
      onNotify(msg);
    } finally {
      setEvaluatingIdx(null);
    }
  };

  const sendFollowUp = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || !copilot.plan || isChatLoading) return;

    const currentPlan = copilot.plan;
    const updatedHistory = [
      ...(copilot.chatHistory || []),
      { role: "user" as const, text: trimmed },
    ];
    onUpdateCopilot({ ...copilot, chatHistory: updatedHistory });
    setChatInput("");
    setChatError(null);
    setIsChatLoading(true);
    setStreamingReply("");

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      let finalAnswer = "";
      if (currentPlan.source === "sample") {
        finalAnswer = CopilotService.answerSampleFollowUp({
          subject: currentPlan.subject,
          topic: currentPlan.topic,
          question: trimmed,
          partnerName: currentPlan.partnerName,
          history: updatedHistory,
        });
      } else {
        finalAnswer = await CopilotService.streamFollowUp(
          {
            subject: currentPlan.subject,
            topic: currentPlan.topic,
            question: trimmed,
            partnerName: currentPlan.partnerName,
            history: updatedHistory,
          },
          (partial) => {
            setStreamingReply(partial);
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        );
      }

      setStreamingReply("");
      onUpdateCopilot({
        ...copilot,
        plan: currentPlan,
        chatHistory: [...updatedHistory, { role: "ai", text: finalAnswer }],
      });
    } catch (err: unknown) {
      setStreamingReply("");
      const message =
        err instanceof Error ? err.message : "Failed to get AI response.";
      setChatError(message);
    } finally {
      setIsChatLoading(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendFollowUp(chatInput);
  };

  const activePlan = copilot.plan;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-50">
            AI Study Session Copilot
          </h1>
          <p className="mt-2 text-base sm:text-lg text-zinc-400">
            Generate a timed collaborative plan, practice questions with AI
            feedback, a recap, and live follow-up Q&A.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Session Setup Form */}
        <form
          onSubmit={handleGeneratePlan}
          className="lg:col-span-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-5"
        >
          <h2 className="font-display text-xl font-bold text-zinc-50">
            Session Setup
          </h2>

          <div>
            <label
              htmlFor="cp-subject"
              className="block text-base font-semibold text-zinc-100 mb-2"
            >
              Subject
            </label>
            <select
              id="cp-subject"
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-base text-zinc-100 focus:border-orange-500 focus:outline-none"
            >
              {allSubjectOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cp-topic"
              className="block text-base font-semibold text-zinc-100 mb-2"
            >
              Topic
            </label>
            <input
              id="cp-topic"
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Cellular Respiration & ATP"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
            />
            <div className="mt-2.5 flex flex-wrap gap-2">
              {topicChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setTopic(chip)}
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:border-orange-500 hover:text-orange-400 transition-colors text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="cp-duration"
              className="block text-base font-semibold text-zinc-100 mb-2"
            >
              Session Length
            </label>
            <select
              id="cp-duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-base text-zinc-100 focus:border-orange-500 focus:outline-none"
            >
              {[30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cp-partner"
              className="block text-base font-semibold text-zinc-100 mb-2"
            >
              Study Partner{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <select
              id="cp-partner"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-base text-zinc-100 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Any / Solo Prep</option>
              {acceptedPartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-base font-extrabold text-zinc-950 hover:bg-orange-400 disabled:opacity-60 transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span>Generating Study Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                <span>Generate Study Plan</span>
              </>
            )}
          </button>
        </form>

        {/* Output Workspace */}
        <div className="lg:col-span-8 space-y-5">
          {planError && (
            <div
              role="alert"
              className="rounded-xl border border-orange-500/50 bg-zinc-900 p-5 space-y-3"
            >
              <div className="flex items-start gap-3 text-base text-zinc-100">
                <AlertCircle
                  className="h-5 w-5 text-orange-400 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-bold">Unable to reach Gemini AI</p>
                  <p className="text-zinc-300 mt-0.5 text-sm sm:text-base">
                    {planError}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleUseSamplePlan}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors"
                >
                  Load Offline Sample Plan Instead
                </button>
              </div>
            </div>
          )}

          {isGenerating ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-base font-semibold text-zinc-100">
                <Loader2
                  className="h-5 w-5 animate-spin text-orange-400"
                  aria-hidden="true"
                />
                <span>
                  Building your {duration}-minute {subject} session plan...
                </span>
              </div>
              <div className="h-16 rounded-lg bg-zinc-800 animate-pulse" />
              <div className="h-16 rounded-lg bg-zinc-800 animate-pulse" />
              <div className="h-24 rounded-lg bg-zinc-800 animate-pulse" />
            </div>
          ) : !activePlan ? (
            <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900 px-6 py-16 text-center">
              <h2 className="font-display text-2xl font-bold text-zinc-50">
                Ready to co-pilot your study session
              </h2>
              <p className="mt-2 text-base text-zinc-400 max-w-md mx-auto">
                Pick a subject, topic, and duration on the left to generate a
                timed collaborative agenda, practice questions, a recap, and
                streaming follow-up Q&A.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Timed Agenda */}
              <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-zinc-50">
                      {activePlan.duration}-Min Plan: {activePlan.topic}
                    </h2>
                    <p className="text-sm sm:text-base text-zinc-400 mt-1">
                      {activePlan.subject}
                      {activePlan.partnerName
                        ? ` · Joint session with ${activePlan.partnerName}`
                        : ""}
                      {" · "}
                      {activePlan.source === "sample"
                        ? "Sample offline plan"
                        : "Generated with Gemini"}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums text-orange-400">
                    {copilot.completedSteps.length}/{activePlan.agenda.length}{" "}
                    Completed
                  </span>
                </div>

                <div className="divide-y divide-zinc-800 border-t border-zinc-800">
                  {activePlan.agenda.map((step, idx) => {
                    const done = copilot.completedSteps.includes(idx);
                    return (
                      <label
                        key={`${step.title}-${idx}`}
                        className={`flex items-start gap-3.5 py-4 cursor-pointer transition-opacity ${
                          done ? "opacity-55" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleAgendaStep(idx)}
                          className="mt-1.5 h-4 w-4 rounded border-zinc-600 bg-zinc-950 accent-orange-500"
                        />
                        <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums text-orange-400 whitespace-nowrap pt-0.5 min-w-[72px]">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {step.time}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-base font-bold text-zinc-100 ${
                              done ? "line-through" : ""
                            }`}
                          >
                            {step.title}
                          </div>
                          <p className="mt-1 text-sm sm:text-base text-zinc-300 leading-relaxed">
                            {step.detail}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* Practice Questions + AI Answer Evaluator */}
              <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
                <h2 className="font-display text-2xl font-bold text-zinc-50">
                  Practice Questions
                </h2>
                <div className="divide-y divide-zinc-800 border-t border-zinc-800">
                  {activePlan.questions.map((item, idx) => {
                    const showHint = copilot.revealedHints.includes(idx);
                    const showAns = copilot.revealedAnswers.includes(idx);
                    const evalResult = evaluations[idx];
                    const isEvaluating = evaluatingIdx === idx;
                    return (
                      <div key={idx} className="py-5 first:pt-4 last:pb-0 space-y-3.5">
                        <p className="text-base sm:text-lg font-semibold text-zinc-100 leading-relaxed">
                          <span className="font-mono text-orange-400 mr-2">
                            Q{idx + 1}.
                          </span>
                          {item.q}
                        </p>

                        {/* Student Attempt Input for AI Evaluation */}
                        <div className="space-y-2.5">
                          <textarea
                            rows={2}
                            value={attempts[idx] || ""}
                            onChange={(e) =>
                              setAttempts((prev) => ({
                                ...prev,
                                [idx]: e.target.value,
                              }))
                            }
                            placeholder="Try answering in your own words, then check with AI..."
                            aria-label={`Your answer attempt for question ${idx + 1}`}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleEvaluateAttempt(idx)}
                            disabled={isEvaluating}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-extrabold text-zinc-950 hover:bg-orange-400 disabled:opacity-60 transition-colors"
                          >
                            {isEvaluating ? (
                              <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Sparkles className="h-4 w-4" aria-hidden="true" />
                            )}
                            <span>
                              {isEvaluating
                                ? "Checking..."
                                : "Check Answer with AI"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleHint(idx)}
                            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
                          >
                            {showHint ? "Hide Hint" : "Show Hint"}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleAnswer(idx)}
                            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
                          >
                            {showAns ? "Hide Answer" : "Reveal Answer"}
                          </button>
                        </div>

                        {evalResult && (
                          <div className="rounded-lg border border-orange-500/40 bg-zinc-950 p-4 space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-bold text-orange-400">
                              <CheckCircle2
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              <span>AI Feedback · {evalResult.status}</span>
                            </div>
                            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                              {evalResult.feedback}
                            </p>
                            <p className="text-xs sm:text-sm text-zinc-400">
                              <span className="font-semibold text-zinc-200">
                                Key takeaway:
                              </span>{" "}
                              {evalResult.keyTakeaway}
                            </p>
                          </div>
                        )}

                        {showHint && (
                          <p className="rounded-lg bg-zinc-950 border border-zinc-700 px-4 py-3 text-sm sm:text-base text-amber-300">
                            <span className="font-bold">Hint:</span>{" "}
                            {item.hint}
                          </p>
                        )}
                        {showAns && (
                          <p className="rounded-lg bg-zinc-950 border border-orange-500/40 px-4 py-3 text-sm sm:text-base text-zinc-100">
                            <span className="font-bold text-orange-400">
                              Answer:
                            </span>{" "}
                            {item.a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Session Recap */}
              <section className="rounded-xl border border-orange-500/30 bg-zinc-900 p-6">
                <h2 className="font-display text-xl font-bold text-zinc-50">
                  Session Recap & Takeaway
                </h2>
                <p className="mt-2 text-base text-zinc-300 leading-relaxed">
                  {activePlan.recap}
                </p>
              </section>

              {/* Streaming Follow-up Q&A */}
              <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-zinc-50">
                    Ask Follow-Up Questions
                  </h2>
                  <span className="text-sm text-zinc-400">
                    {activePlan.source === "sample"
                      ? "Sample Q&A mode"
                      : "Live Streaming with Gemini"}
                  </span>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 max-h-80 overflow-y-auto space-y-3">
                  {copilot.chatHistory.length === 0 && !streamingReply ? (
                    <p className="text-base text-zinc-400 text-center py-5">
                      Ask anything about{" "}
                      <span className="font-semibold text-zinc-200">
                        {activePlan.topic}
                      </span>{" "}
                      or choose a quick prompt below.
                    </p>
                  ) : (
                    copilot.chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-4 py-3 text-base leading-relaxed ${
                            msg.role === "user"
                              ? "bg-orange-500 text-zinc-950 font-medium"
                              : "bg-zinc-900 border border-zinc-800 text-zinc-100"
                          }`}
                        >
                          {msg.role === "ai" && (
                            <div className="text-xs font-bold text-orange-400 mb-1">
                              StudyBuddy Copilot
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-zinc-100">
                        <div className="text-xs font-bold text-orange-400 mb-1">
                          StudyBuddy Copilot
                        </div>
                        {streamingReply ? (
                          <p className="whitespace-pre-wrap">{streamingReply}</p>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-zinc-300">
                            <Loader2
                              className="h-4 w-4 animate-spin text-orange-400"
                              aria-hidden="true"
                            />
                            <span>Thinking...</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {chatError && (
                  <p className="text-sm font-medium text-red-400" role="alert">
                    {chatError}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendFollowUp(q)}
                      disabled={isChatLoading}
                      className="rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm font-medium text-zinc-300 hover:border-orange-500 hover:text-orange-400 disabled:opacity-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleChatSubmit} className="flex gap-2.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Ask a follow-up question about ${activePlan.topic}...`}
                    required
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-base font-extrabold text-zinc-950 hover:bg-orange-400 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Ask</span>
                  </button>
                </form>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
