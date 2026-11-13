import { useState } from "react";
import { Check, Loader2, Search, Settings, Sparkles } from "lucide-react";
import {
  AVAILABILITY_SLOTS,
  AVATAR_STYLES,
  SAMPLE_PARTNERS,
  STUDY_LEVELS,
  STUDY_SUBJECTS,
} from "../data/studyData";
import { CopilotService } from "../services/copilotService";
import { MatchingService } from "../services/matchingService";
import type {
  AiMatchInsight,
  ConnectionStatus,
  FilterState,
  UserProfile,
} from "../types";

interface DiscoverScreenProps {
  user: UserProfile;
  filters: FilterState;
  getStatus: (partnerId: string) => ConnectionStatus;
  onUpdateFilters: (filters: FilterState) => void;
  onEditProfile: () => void;
  onViewPartner: (partnerId: string) => void;
  onConnect: (partnerId: string) => void;
  onAccept: (partnerId: string) => void;
  onLaunchCopilot: (partnerId: string) => void;
  onNotify: (message: string) => void;
}

function getInitials(name: string): string {
  const parts = (name || "SB").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "SB";
}

export function DiscoverScreen({
  user,
  filters,
  getStatus,
  onUpdateFilters,
  onEditProfile,
  onViewPartner,
  onConnect,
  onAccept,
  onLaunchCopilot,
  onNotify,
}: DiscoverScreenProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<Record<string, AiMatchInsight>>(
    {}
  );

  const allSubjects = Array.from(
    new Set([
      ...STUDY_SUBJECTS,
      ...(user.subjects || []),
      ...SAMPLE_PARTNERS.flatMap((p) => p.subjects),
    ])
  ).sort();

  const topMatches = MatchingService.getTopRecommendations(
    user,
    SAMPLE_PARTNERS,
    3
  );

  const filteredPartners = SAMPLE_PARTNERS.map((p) =>
    MatchingService.evaluateMatch(user, p)
  )
    .filter(({ partner }) => {
      const q = filters.query.trim().toLowerCase();
      if (q) {
        const hay = `${partner.name} ${partner.school} ${partner.subjects.join(" ")} ${partner.goal}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.subject !== "All" && !partner.subjects.includes(filters.subject))
        return false;
      if (filters.level !== "All" && partner.level !== filters.level)
        return false;
      if (
        filters.availability !== "All" &&
        !partner.availability.includes(filters.availability)
      )
        return false;
      if (filters.meetingPreference !== "All") {
        if (
          partner.meetingPreference !== filters.meetingPreference &&
          partner.meetingPreference !== "Both"
        ) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => b.score - a.score);

  const resetFilters = () => {
    onUpdateFilters({
      query: "",
      subject: "All",
      level: "All",
      availability: "All",
      meetingPreference: "All",
    });
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const insightsMap = await CopilotService.generateMatchInsights(
        user,
        topMatches
      );
      setAiInsights(insightsMap);
      onNotify("Generated personalized Gemini AI match insights.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to generate AI match insights.";
      onNotify(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderPrimaryAction = (partnerId: string) => {
    const status = getStatus(partnerId);
    if (status === "accepted") {
      return (
        <button
          type="button"
          onClick={() => onLaunchCopilot(partnerId)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3.5 py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors whitespace-nowrap"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>Study Together</span>
        </button>
      );
    }
    if (status === "incoming") {
      return (
        <button
          type="button"
          onClick={() => onAccept(partnerId)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3.5 py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors whitespace-nowrap"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          <span>Accept Request</span>
        </button>
      );
    }
    if (status === "sent") {
      return (
        <button
          type="button"
          disabled
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm font-semibold text-zinc-500 cursor-not-allowed whitespace-nowrap"
        >
          Request Sent
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onConnect(partnerId)}
        className="flex-1 rounded-lg bg-orange-500 px-3.5 py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors whitespace-nowrap"
      >
        Connect Now
      </button>
    );
  };

  return (
    <div className="space-y-9">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-50">
            Find a Study Partner
          </h1>
          <p className="mt-2 text-base sm:text-lg text-zinc-400">
            Browse students learning the same subjects, or jump into your top
            AI-recommended matches.
          </p>
        </div>
        <button
          type="button"
          onClick={onEditProfile}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-orange-500/60 transition-colors whitespace-nowrap shrink-0"
        >
          <Settings className="h-4 w-4 text-orange-400" aria-hidden="true" />
          <span>Edit Preferences</span>
        </button>
      </div>

      {/* AI Match Suggestions */}
      <section
        aria-label="AI Match Suggestions"
        className="rounded-xl border border-orange-500/30 bg-zinc-900 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-50 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-400" aria-hidden="true" />
              <span>AI Match Suggestions</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-0.5">
              Ranked strictly by shared subjects, study level, schedule overlap,
              and meeting preference.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAnalyzeWithAI}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-orange-400 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {isAnalyzing ? "Analyzing with AI..." : "Generate AI Insights"}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {isAnalyzing
            ? [1, 2, 3].map((k) => (
                <div
                  key={k}
                  className="h-56 rounded-xl border border-zinc-800 bg-zinc-950 animate-pulse"
                />
              ))
            : topMatches.map((m) => {
                const aiInsight = aiInsights[m.partner.id];
                return (
                  <div
                    key={m.partner.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-11 w-11 rounded-xl font-display font-extrabold text-sm grid place-items-center shrink-0 ${
                              AVATAR_STYLES[m.partner.colorIndex]
                            }`}
                          >
                            {getInitials(m.partner.name)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-display text-lg font-bold text-zinc-50 truncate">
                              {m.partner.name}
                            </h3>
                            <p className="text-sm text-zinc-400 truncate">
                              {m.partner.level} ·{" "}
                              {m.partner.meetingPreference === "Both"
                                ? "Online or In-person"
                                : m.partner.meetingPreference}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-sm font-bold tabular-nums text-orange-400 shrink-0">
                          {m.score}%
                        </span>
                      </div>

                      <div className="mt-4 text-sm sm:text-base text-zinc-200 leading-relaxed bg-zinc-900 rounded-lg px-3.5 py-3 border border-zinc-800 space-y-2">
                        <p>{aiInsight ? aiInsight.insight : m.explanation}</p>
                        {aiInsight?.sessionIdea && (
                          <p className="text-xs sm:text-sm text-orange-400 border-t border-zinc-800 pt-2">
                            <span className="font-bold">First session idea:</span>{" "}
                            {aiInsight.sessionIdea}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onViewPartner(m.partner.id)}
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap"
                      >
                        Details
                      </button>
                      {renderPrimaryAction(m.partner.id)}
                    </div>
                  </div>
                );
              })}
        </div>
      </section>

      {/* Filter Bar */}
      <section aria-label="Filter study partners" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative lg:col-span-2">
            <Search
              className="h-4 w-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={filters.query}
              onChange={(e) =>
                onUpdateFilters({ ...filters, query: e.target.value })
              }
              placeholder="Search name, subject, or school..."
              aria-label="Search study partners"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-10 pr-3.5 py-2.5 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by subject"
            value={filters.subject}
            onChange={(e) =>
              onUpdateFilters({ ...filters, subject: e.target.value })
            }
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm sm:text-base text-zinc-100 focus:border-orange-500 focus:outline-none"
          >
            <option value="All">All Subjects</option>
            {allSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by level"
            value={filters.level}
            onChange={(e) =>
              onUpdateFilters({ ...filters, level: e.target.value })
            }
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm sm:text-base text-zinc-100 focus:border-orange-500 focus:outline-none"
          >
            <option value="All">All Levels</option>
            {STUDY_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by availability"
            value={filters.availability}
            onChange={(e) =>
              onUpdateFilters({ ...filters, availability: e.target.value })
            }
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm sm:text-base text-zinc-100 focus:border-orange-500 focus:outline-none"
          >
            <option value="All">Any Study Time</option>
            {AVAILABILITY_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              aria-label="Filter by meeting format"
              value={filters.meetingPreference}
              onChange={(e) =>
                onUpdateFilters({
                  ...filters,
                  meetingPreference: e.target.value,
                })
              }
              className="flex-1 min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm sm:text-base text-zinc-100 focus:border-orange-500 focus:outline-none"
            >
              <option value="All">Any Format</option>
              <option value="Online">Online</option>
              <option value="In-person">In-person</option>
            </select>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
            >
              Clear
            </button>
          </div>
        </div>

        <p className="text-base font-medium text-zinc-400 tabular-nums">
          Showing {filteredPartners.length}{" "}
          {filteredPartners.length === 1 ? "study partner" : "study partners"}
        </p>
      </section>

      {/* Partner Grid */}
      {filteredPartners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900 px-6 py-14 text-center">
          <h3 className="font-display text-2xl font-bold text-zinc-50">
            No study partners match those filters
          </h3>
          <p className="mt-2 text-base text-zinc-400 max-w-md mx-auto">
            Try broadening your availability time or clearing one of your
            filters to see more peers.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 rounded-xl bg-orange-500 px-6 py-3 text-base font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPartners.map(
            ({ partner, score, sharedSubjects, sharedAvailability }) => (
              <article
                key={partner.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between gap-5 hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`h-12 w-12 rounded-xl font-display font-extrabold text-base grid place-items-center shrink-0 ${
                          AVATAR_STYLES[partner.colorIndex]
                        }`}
                      >
                        {getInitials(partner.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-bold text-zinc-50 truncate">
                          {partner.name}
                        </h3>
                        <p className="text-sm text-zinc-400 truncate">
                          {partner.school || "Independent Learner"}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold tabular-nums text-orange-400 shrink-0">
                      {score}% match
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm sm:text-base">
                    {partner.subjects.map((subj, idx) => {
                      const isShared = sharedSubjects.includes(subj);
                      return (
                        <span key={subj} className="inline-flex items-center gap-1">
                          {idx > 0 && (
                            <span className="text-zinc-600 mr-1.5" aria-hidden="true">
                              ·
                            </span>
                          )}
                          {isShared ? (
                            <span className="inline-flex items-center gap-1 font-bold text-orange-400">
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              {subj}
                            </span>
                          ) : (
                            <span className="text-zinc-300">{subj}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>

                  <dl className="space-y-2 text-sm sm:text-base text-zinc-300 border-t border-zinc-800 pt-3.5">
                    <div className="flex gap-2">
                      <dt className="font-semibold text-zinc-100 shrink-0">
                        Level:
                      </dt>
                      <dd>{partner.level}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold text-zinc-100 shrink-0">
                        Format:
                      </dt>
                      <dd>
                        {partner.meetingPreference === "Both"
                          ? "Online or In-person"
                          : partner.meetingPreference}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold text-zinc-100 shrink-0">
                        Available:
                      </dt>
                      <dd>
                        {partner.availability.map((slot, i) => (
                          <span key={slot}>
                            {i > 0 && ", "}
                            {sharedAvailability.includes(slot) ? (
                              <span className="font-bold text-orange-400">
                                {slot}
                              </span>
                            ) : (
                              slot
                            )}
                          </span>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex items-center gap-2.5 border-t border-zinc-800 pt-4">
                  <button
                    type="button"
                    onClick={() => onViewPartner(partner.id)}
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors whitespace-nowrap"
                  >
                    View Details
                  </button>
                  {renderPrimaryAction(partner.id)}
                </div>
              </article>
            )
          )}
        </div>
      )}
    </div>
  );
}
