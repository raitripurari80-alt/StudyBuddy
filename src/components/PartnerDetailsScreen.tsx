import { useState } from "react";
import { ArrowLeft, Check, Copy, Loader2, Sparkles } from "lucide-react";
import { AVATAR_STYLES, SAMPLE_PARTNERS } from "../data/studyData";
import { CopilotService } from "../services/copilotService";
import { MatchingService } from "../services/matchingService";
import type { ConnectionStatus, UserProfile } from "../types";

interface PartnerDetailsScreenProps {
  partnerId: string | null;
  user: UserProfile;
  getStatus: (partnerId: string) => ConnectionStatus;
  onBack: () => void;
  onConnect: (partnerId: string) => void;
  onCancelSent: (partnerId: string) => void;
  onAccept: (partnerId: string) => void;
  onDecline: (partnerId: string) => void;
  onSimulateAccept: (partnerId: string) => void;
  onLaunchCopilot: (partnerId: string) => void;
  onNotify: (message: string) => void;
}

function getInitials(name: string): string {
  const parts = (name || "SB").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "SB";
}

export function PartnerDetailsScreen({
  partnerId,
  user,
  getStatus,
  onBack,
  onConnect,
  onCancelSent,
  onAccept,
  onDecline,
  onSimulateAccept,
  onLaunchCopilot,
  onNotify,
}: PartnerDetailsScreenProps) {
  const partner =
    SAMPLE_PARTNERS.find((p) => p.id === partnerId) || SAMPLE_PARTNERS[0];
  const match = MatchingService.evaluateMatch(user, partner);
  const status = getStatus(partner.id);

  const [icebreaker, setIcebreaker] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);

  const handleDraftIcebreaker = async () => {
    setIsDrafting(true);
    try {
      const message = await CopilotService.draftIcebreaker({
        user,
        partner,
        sharedSubjects: match.sharedSubjects,
        sharedAvailability: match.sharedAvailability,
      });
      setIcebreaker(message);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unable to draft study invite.";
      onNotify(msg);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopyIcebreaker = async () => {
    if (!icebreaker) return;
    try {
      await navigator.clipboard.writeText(icebreaker);
      onNotify("Copied invite message to clipboard.");
    } catch {
      onNotify("Copy not available in this browser.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Profile Details */}
        <section className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-7 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div
              className={`h-16 w-16 rounded-xl font-display font-extrabold text-2xl grid place-items-center shrink-0 ${
                AVATAR_STYLES[partner.colorIndex]
              }`}
            >
              {getInitials(partner.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-zinc-50">
                  {partner.name}
                </h1>
                {status === "accepted" && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-400">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Connected Partner
                  </span>
                )}
              </div>
              <p className="text-base text-zinc-400 mt-1">
                {partner.school || "Independent Learner"} · {partner.level}{" "}
                Level
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-400 mb-2">
              Study Focus & Goals
            </h2>
            <p className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-base text-zinc-200 leading-relaxed">
              {partner.goal}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-400 mb-2">
              Subjects
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base">
              {partner.subjects.map((subj, idx) => {
                const isShared = match.sharedSubjects.includes(subj);
                return (
                  <span key={subj} className="inline-flex items-center gap-1">
                    {idx > 0 && (
                      <span className="text-zinc-600 mr-2" aria-hidden="true">
                        ·
                      </span>
                    )}
                    {isShared ? (
                      <span className="inline-flex items-center gap-1.5 font-bold text-orange-400">
                        <Check className="h-4 w-4" aria-hidden="true" />
                        {subj} (Shared)
                      </span>
                    ) : (
                      <span className="text-zinc-300">{subj}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-zinc-800 pt-5">
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">
                Preferred Times
              </h3>
              <ul className="space-y-1.5 text-base text-zinc-200">
                {partner.availability.map((slot) => {
                  const overlap = match.sharedAvailability.includes(slot);
                  return (
                    <li
                      key={slot}
                      className={overlap ? "font-bold text-orange-400" : ""}
                    >
                      {overlap ? `${slot} (Overlap)` : slot}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">
                Meeting Style
              </h3>
              <p className="text-base font-bold text-zinc-100">
                {partner.meetingPreference === "Both"
                  ? "Online or In-person"
                  : partner.meetingPreference}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {match.meetingCompatible
                  ? "Matches your preferred session format."
                  : "Differs from your current session format."}
              </p>
            </div>
          </div>

          {/* Strong CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 border-t border-zinc-800 pt-6">
            {status === "accepted" && (
              <button
                type="button"
                onClick={() => onLaunchCopilot(partner.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-base font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors"
              >
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                <span>Plan Session in AI Copilot</span>
              </button>
            )}
            {status === "incoming" && (
              <>
                <button
                  type="button"
                  onClick={() => onAccept(partner.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-base font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors"
                >
                  <Check className="h-5 w-5" aria-hidden="true" />
                  <span>Accept Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDecline(partner.id)}
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3.5 text-base font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Decline
                </button>
              </>
            )}
            {status === "sent" && (
              <>
                <button
                  type="button"
                  onClick={() => onSimulateAccept(partner.id)}
                  className="rounded-xl bg-orange-500 px-6 py-3.5 text-base font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors"
                >
                  Demo: Simulate Accept
                </button>
                <button
                  type="button"
                  onClick={() => onCancelSent(partner.id)}
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3.5 text-base font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Withdraw Request
                </button>
              </>
            )}
            {status === "none" && (
              <button
                type="button"
                onClick={() => onConnect(partner.id)}
                className="rounded-xl bg-orange-500 px-7 py-3.5 text-base font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors"
              >
                Connect with {partner.name.split(" ")[0]}
              </button>
            )}
          </div>
        </section>

        {/* Right Column: AI Compatibility + AI Study Invite */}
        <div className="lg:col-span-5 space-y-6">
          <aside className="rounded-xl border border-orange-500/30 bg-zinc-900 p-6 space-y-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-zinc-50 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-400" aria-hidden="true" />
                <span>AI Compatibility</span>
              </h2>
              <span className="font-mono text-lg font-bold tabular-nums text-orange-400">
                {match.score}% Match
              </span>
            </div>

            <div
              className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden"
              role="progressbar"
              aria-valuenow={match.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Compatibility score"
            >
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${match.score}%` }}
              />
            </div>

            <p className="rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-3.5 text-base text-zinc-200 leading-relaxed">
              {match.explanation}
            </p>

            <dl className="space-y-3 text-base border-t border-zinc-800 pt-4">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Shared subjects</dt>
                <dd className="font-semibold text-zinc-100 tabular-nums text-right">
                  {match.sharedSubjects.length > 0
                    ? match.sharedSubjects.join(", ")
                    : "None yet"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Study level</dt>
                <dd className="font-semibold text-zinc-100 text-right">
                  {match.sameLevel
                    ? "Exact match"
                    : `${partner.level} / ${user.level}`}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Time overlap</dt>
                <dd className="font-semibold text-zinc-100 text-right">
                  {match.sharedAvailability.length > 0
                    ? match.sharedAvailability.join(", ")
                    : "No direct overlap"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">Meeting style</dt>
                <dd className="font-semibold text-zinc-100 text-right">
                  {match.meetingCompatible ? "Compatible" : "Different preference"}
                </dd>
              </div>
            </dl>
          </aside>

          {/* AI Study Invite Drafter */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-zinc-50">
              AI Study Invite Draft
            </h2>
            <p className="text-sm sm:text-base text-zinc-400">
              Generate a tailored intro message based on your shared subjects
              and schedule overlap.
            </p>

            {icebreaker && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                <p className="text-base text-zinc-200 leading-relaxed">
                  {icebreaker}
                </p>
                <button
                  type="button"
                  onClick={handleCopyIcebreaker}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
                  <span>Copy Message</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDraftIcebreaker}
              disabled={isDrafting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/50 bg-zinc-950 px-4 py-3 text-base font-bold text-orange-400 hover:bg-zinc-800 disabled:opacity-60 transition-colors"
            >
              {isDrafting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {isDrafting
                  ? "Drafting Invite..."
                  : icebreaker
                    ? "Regenerate Invite Message"
                    : "Draft Study Invite with AI"}
              </span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
