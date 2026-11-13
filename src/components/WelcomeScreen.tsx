import { ArrowRight, Check, Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onCreateProfile: () => void;
  onStartDemo: () => void;
}

export function WelcomeScreen({
  onCreateProfile,
  onStartDemo,
}: WelcomeScreenProps) {
  return (
    <div className="space-y-14 py-4 lg:py-8">
      {/* 2-Column Split Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center">
          <p className="text-base font-semibold text-orange-400 mb-3">
            Peer Learning & Collaborative Study Planning
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-50 leading-[1.08] max-w-2xl">
            Find a study partner who learns what you learn.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-300 leading-relaxed max-w-xl">
            StudyBuddy pairs students by shared subjects, experience level,
            schedule overlap, and preferred meeting style—then builds a timed
            AI study plan for every session together.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onCreateProfile}
              className="inline-flex items-center gap-2.5 rounded-xl bg-orange-500 px-7 py-4 text-base sm:text-lg font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Create My Profile</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onStartDemo}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-4 text-base font-semibold text-zinc-100 hover:bg-zinc-800 hover:border-orange-500/60 transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-5 w-5 text-orange-400" aria-hidden="true" />
              <span>Try Instant Demo Profile</span>
            </button>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-5 flex">
          <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline justify-between gap-4 border-b border-zinc-800 pb-4">
                <span className="text-sm font-semibold text-zinc-400">
                  Sample Compatibility Preview
                </span>
                <span className="font-mono text-base font-bold tabular-nums text-orange-400">
                  94% Match
                </span>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-orange-500 text-zinc-950 font-display font-extrabold text-lg grid place-items-center shrink-0">
                  MP
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-bold text-zinc-50 truncate">
                    Maya Patel
                  </h2>
                  <p className="text-base text-zinc-400 truncate">
                    Oakridge State University · Intermediate
                  </p>
                </div>
              </div>

              <p className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 py-3.5 text-base text-zinc-200 leading-relaxed">
                You both study Biology, are free Wednesday evenings, and support
                online or in-person sessions.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-base">
                <span className="inline-flex items-center gap-1.5 font-bold text-orange-400">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Biology
                </span>
                <span className="text-zinc-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-zinc-300">Organic Chemistry</span>
                <span className="text-zinc-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-zinc-300">Psychology</span>
              </div>
            </div>

            <div className="mt-7 border-t border-zinc-800 pt-4 text-base text-zinc-300">
              <span className="font-bold text-zinc-50">Next session:</span>{" "}
              <span className="font-mono text-sm font-semibold tabular-nums text-orange-400">
                45 min
              </span>{" "}
              AI Study Plan on Cellular Respiration & ATP with 3 practice
              questions.
            </div>
          </div>
        </div>
      </section>

      {/* 3 Value Pillars */}
      <section
        aria-label="Core capabilities"
        className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-800 pt-10"
      >
        <div>
          <h3 className="font-display text-xl font-bold text-zinc-50">
            01. Transparent Match Explanations
          </h3>
          <p className="mt-2 text-base text-zinc-400 leading-relaxed">
            Compatibility is calculated solely from shared subjects, study
            level, overlapping availability, and meeting format.
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl font-bold text-zinc-50">
            02. Focused Discovery Filters
          </h3>
          <p className="mt-2 text-base text-zinc-400 leading-relaxed">
            Filter potential study peers by subject, proficiency level, free
            time slots, and online or in-person preference.
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl font-bold text-zinc-50">
            03. AI Study Session Copilot
          </h3>
          <p className="mt-2 text-base text-zinc-400 leading-relaxed">
            Generate timed collaborative agendas, hints-first practice
            questions, concise recaps, and live follow-up answers.
          </p>
        </div>
      </section>
    </div>
  );
}
