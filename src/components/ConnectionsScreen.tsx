import { Check, Sparkles } from "lucide-react";
import { AVATAR_STYLES, SAMPLE_PARTNERS } from "../data/studyData";
import { MatchingService } from "../services/matchingService";
import type { ConnectionState, ConnectionsTab, UserProfile } from "../types";

interface ConnectionsScreenProps {
  user: UserProfile;
  connections: ConnectionState;
  activeTab: ConnectionsTab;
  onChangeTab: (tab: ConnectionsTab) => void;
  onBrowsePartners: () => void;
  onViewPartner: (partnerId: string) => void;
  onAccept: (partnerId: string) => void;
  onDecline: (partnerId: string) => void;
  onCancelSent: (partnerId: string) => void;
  onSimulateAccept: (partnerId: string) => void;
  onLaunchCopilot: (partnerId: string) => void;
}

function getInitials(name: string): string {
  const parts = (name || "SB").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "SB";
}

export function ConnectionsScreen({
  user,
  connections,
  activeTab,
  onChangeTab,
  onBrowsePartners,
  onViewPartner,
  onAccept,
  onDecline,
  onCancelSent,
  onSimulateAccept,
  onLaunchCopilot,
}: ConnectionsScreenProps) {
  const incomingPartners = SAMPLE_PARTNERS.filter((p) =>
    connections.incoming.includes(p.id)
  );
  const acceptedPartners = SAMPLE_PARTNERS.filter((p) =>
    connections.accepted.includes(p.id)
  );
  const sentPartners = SAMPLE_PARTNERS.filter((p) =>
    connections.sent.includes(p.id)
  );

  const tabs: Array<{ id: ConnectionsTab; label: string; count: number }> = [
    {
      id: "incoming",
      label: "Incoming Requests",
      count: incomingPartners.length,
    },
    {
      id: "accepted",
      label: "Accepted Partners",
      count: acceptedPartners.length,
    },
    { id: "sent", label: "Sent Requests", count: sentPartners.length },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-50">
            Your Connections
          </h1>
          <p className="mt-2 text-base sm:text-lg text-zinc-400">
            Manage incoming invites, pending requests, and accepted study
            partners.
          </p>
        </div>
        <button
          type="button"
          onClick={onBrowsePartners}
          className="rounded-xl bg-orange-500 px-5 py-3 text-base font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors whitespace-nowrap shrink-0"
        >
          Find More Partners
        </button>
      </div>

      {/* Segmented Tabs */}
      <div
        role="tablist"
        aria-label="Connection categories"
        className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChangeTab(tab.id)}
              className={`rounded-lg px-4 py-2.5 text-sm sm:text-base font-semibold whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? "bg-orange-500 text-zinc-950 font-bold"
                  : "text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`ml-1.5 font-mono text-sm tabular-nums ${
                  active ? "text-zinc-900" : "text-zinc-400"
                }`}
              >
                ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "incoming" &&
        (incomingPartners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900 px-6 py-14 text-center">
            <h2 className="font-display text-2xl font-bold text-zinc-50">
              No pending incoming requests
            </h2>
            <p className="mt-2 text-base text-zinc-400 max-w-md mx-auto">
              When another student invites you to study together, their request
              will appear here.
            </p>
            <button
              type="button"
              onClick={onBrowsePartners}
              className="mt-6 rounded-xl bg-orange-500 px-6 py-3 text-base font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors"
            >
              Browse Study Partners
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {incomingPartners.map((p) => {
              const match = MatchingService.evaluateMatch(user, p);
              return (
                <article
                  key={p.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-12 w-12 rounded-xl font-display font-extrabold text-base grid place-items-center shrink-0 ${
                            AVATAR_STYLES[p.colorIndex]
                          }`}
                        >
                          {getInitials(p.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-xl font-bold text-zinc-50 truncate">
                            {p.name}
                          </h3>
                          <p className="text-sm text-zinc-400 truncate">
                            {p.level} ·{" "}
                            {p.meetingPreference === "Both"
                              ? "Online or In-person"
                              : p.meetingPreference}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-orange-400 shrink-0">
                        Pending Invite
                      </span>
                    </div>

                    <p className="rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-3 text-sm sm:text-base text-zinc-300">
                      {match.explanation}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-300">
                      {p.subjects.map((subj, idx) => (
                        <span key={subj}>
                          {idx > 0 && (
                            <span className="text-zinc-600 mr-2" aria-hidden="true">
                              ·
                            </span>
                          )}
                          <span
                            className={
                              match.sharedSubjects.includes(subj)
                                ? "font-bold text-orange-400"
                                : ""
                            }
                          >
                            {subj}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 border-t border-zinc-800 pt-4">
                    <button
                      type="button"
                      onClick={() => onAccept(p.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3.5 py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecline(p.id)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ))}

      {activeTab === "accepted" &&
        (acceptedPartners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900 px-6 py-14 text-center">
            <h2 className="font-display text-2xl font-bold text-zinc-50">
              No accepted study partners yet
            </h2>
            <p className="mt-2 text-base text-zinc-400 max-w-md mx-auto">
              Accept an incoming invite or send a connection request from Find
              Partners.
            </p>
            <button
              type="button"
              onClick={onBrowsePartners}
              className="mt-6 rounded-xl bg-orange-500 px-6 py-3 text-base font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors"
            >
              Find Study Partners
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {acceptedPartners.map((p) => {
              const match = MatchingService.evaluateMatch(user, p);
              return (
                <article
                  key={p.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-12 w-12 rounded-xl font-display font-extrabold text-base grid place-items-center shrink-0 ${
                            AVATAR_STYLES[p.colorIndex]
                          }`}
                        >
                          {getInitials(p.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-xl font-bold text-zinc-50 truncate">
                            {p.name}
                          </h3>
                          <p className="text-sm text-zinc-400 truncate">
                            {p.school || "Independent Learner"}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-orange-400 shrink-0">
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Partner
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-300">
                      {p.subjects.map((subj, idx) => (
                        <span key={subj}>
                          {idx > 0 && (
                            <span className="text-zinc-600 mr-2" aria-hidden="true">
                              ·
                            </span>
                          )}
                          <span
                            className={
                              match.sharedSubjects.includes(subj)
                                ? "font-bold text-orange-400"
                                : ""
                            }
                          >
                            {subj}
                          </span>
                        </span>
                      ))}
                    </div>

                    <dl className="space-y-1.5 text-sm sm:text-base text-zinc-300 border-t border-zinc-800 pt-3">
                      <div>
                        <dt className="inline font-semibold text-zinc-100">
                          Available:{" "}
                        </dt>
                        <dd className="inline">{p.availability.join(", ")}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-zinc-100">
                          Goal:{" "}
                        </dt>
                        <dd className="inline">{p.goal}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex items-center gap-2.5 border-t border-zinc-800 pt-4">
                    <button
                      type="button"
                      onClick={() => onViewPartner(p.id)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => onLaunchCopilot(p.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3.5 py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors whitespace-nowrap"
                    >
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      <span>AI Study Plan</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ))}

      {activeTab === "sent" &&
        (sentPartners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900 px-6 py-14 text-center">
            <h2 className="font-display text-2xl font-bold text-zinc-50">
              No sent requests right now
            </h2>
            <p className="mt-2 text-base text-zinc-400 max-w-md mx-auto">
              Select Connect Now on any student card to send a study invite.
            </p>
            <button
              type="button"
              onClick={onBrowsePartners}
              className="mt-6 rounded-xl bg-orange-500 px-6 py-3 text-base font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors"
            >
              Find Study Partners
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sentPartners.map((p) => (
              <article
                key={p.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-12 w-12 rounded-xl font-display font-extrabold text-base grid place-items-center shrink-0 ${
                          AVATAR_STYLES[p.colorIndex]
                        }`}
                      >
                        {getInitials(p.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-bold text-zinc-50 truncate">
                          {p.name}
                        </h3>
                        <p className="text-sm text-zinc-400 truncate">
                          {p.level} ·{" "}
                          {p.meetingPreference === "Both"
                            ? "Online or In-person"
                            : p.meetingPreference}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-zinc-400 shrink-0">
                      Pending
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-zinc-300">
                    {p.subjects.join(" · ")}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 border-t border-zinc-800 pt-4">
                  <button
                    type="button"
                    onClick={() => onCancelSent(p.id)}
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onSimulateAccept(p.id)}
                    className="flex-1 rounded-lg bg-orange-500 px-3.5 py-2.5 text-sm font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors whitespace-nowrap"
                  >
                    Demo Accept
                  </button>
                </div>
              </article>
            ))}
          </div>
        ))}
    </div>
  );
}
