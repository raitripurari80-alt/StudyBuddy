import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Loader2, Plus, Sparkles } from "lucide-react";
import {
  AVAILABILITY_SLOTS,
  MEETING_STYLES,
  STUDY_LEVELS,
  STUDY_SUBJECTS,
} from "../data/studyData";
import { CopilotService } from "../services/copilotService";
import type { MeetingPreference, StudyLevel, UserProfile } from "../types";

interface ProfileScreenProps {
  user: UserProfile;
  hasOnboarded: boolean;
  onSave: (profile: UserProfile) => void;
  onBackToDiscover: () => void;
  onNotify: (message: string) => void;
}

export function ProfileScreen({
  user,
  hasOnboarded,
  onSave,
  onBackToDiscover,
  onNotify,
}: ProfileScreenProps) {
  const [name, setName] = useState(user.name);
  const [school, setSchool] = useState(user.school);
  const [subjects, setSubjects] = useState<string[]>(user.subjects || []);
  const [customSubject, setCustomSubject] = useState("");
  const [level, setLevel] = useState<StudyLevel>(user.level || "Intermediate");
  const [availability, setAvailability] = useState<string[]>(
    user.availability || []
  );
  const [meetingPreference, setMeetingPreference] = useState<MeetingPreference>(
    user.meetingPreference || "Online"
  );
  const [goal, setGoal] = useState(user.goal || "");
  const [isSuggestingGoal, setIsSuggestingGoal] = useState(false);

  const allSubjects = Array.from(new Set([...STUDY_SUBJECTS, ...subjects]));

  const toggleSubject = (subj: string) => {
    setSubjects((prev) =>
      prev.includes(subj) ? prev.filter((s) => s !== subj) : [...prev, subj]
    );
  };

  const handleAddCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (!trimmed) return;
    if (!subjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSubjects((prev) => [...prev, trimmed]);
    }
    setCustomSubject("");
  };

  const toggleSlot = (slot: string) => {
    setAvailability((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSuggestGoal = async () => {
    if (subjects.length === 0) {
      onNotify("Select at least one subject before asking AI for a study goal.");
      return;
    }
    setIsSuggestingGoal(true);
    try {
      const suggested = await CopilotService.suggestStudyGoal({
        subjects,
        level,
        meetingPreference,
      });
      setGoal(suggested);
      onNotify("AI suggested a study goal.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unable to suggest study goal.";
      onNotify(msg);
    } finally {
      setIsSuggestingGoal(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      onNotify("Please enter your name.");
      return;
    }
    if (subjects.length === 0) {
      onNotify("Please select at least one subject.");
      return;
    }
    if (availability.length === 0) {
      onNotify("Please select at least one preferred study time.");
      return;
    }

    onSave({
      name: trimmedName,
      school: school.trim(),
      subjects,
      level,
      availability,
      meetingPreference,
      goal: goal.trim(),
    });
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-50">
            {hasOnboarded ? "Edit Your Study Profile" : "Set Up Your Study Profile"}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-zinc-400">
            Share what you are studying and when you are available to find compatible partners.
          </p>
        </div>
        {hasOnboarded && (
          <button
            type="button"
            onClick={onBackToDiscover}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-orange-500/60 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Find Partners</span>
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 space-y-7"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="prof-name"
              className="block text-base font-semibold text-zinc-100 mb-2"
            >
              Your Name *
            </label>
            <input
              id="prof-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Jordan Taylor"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="prof-school"
              className="block text-base font-semibold text-zinc-100 mb-2"
            >
              School or College{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="prof-school"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g., Oakridge State University"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Subject Multi-select */}
        <div>
          <span className="block text-base font-semibold text-zinc-100 mb-1">
            Subjects You Are Studying *{" "}
            <span className="font-normal text-zinc-400">
              (select one or more)
            </span>
          </span>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {allSubjects.map((subj) => {
              const selected = subjects.includes(subj);
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => toggleSubject(subj)}
                  aria-pressed={selected}
                  className={`rounded-lg border px-4 py-2.5 text-sm sm:text-base font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    selected
                      ? "border-orange-500 bg-orange-500 text-zinc-950"
                      : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-orange-400 hover:text-orange-300"
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2.5 max-w-lg">
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomSubject();
                }
              }}
              placeholder="Add another subject (e.g., Statistics)"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCustomSubject}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm sm:text-base font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-orange-500/60 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4 text-orange-400" aria-hidden="true" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="prof-level"
              className="block text-base font-semibold text-zinc-100 mb-2"
            >
              Experience Level *
            </label>
            <select
              id="prof-level"
              value={level}
              onChange={(e) => setLevel(e.target.value as StudyLevel)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-base text-zinc-100 focus:border-orange-500 focus:outline-none"
            >
              {STUDY_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="prof-meeting"
              className="block text-base font-semibold text-zinc-100 mb-2"
            >
              Preferred Meeting Style *
            </label>
            <select
              id="prof-meeting"
              value={meetingPreference}
              onChange={(e) =>
                setMeetingPreference(e.target.value as MeetingPreference)
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-base text-zinc-100 focus:border-orange-500 focus:outline-none"
            >
              {MEETING_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style === "Both" ? "Either Online or In-person" : style}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Availability Multi-select */}
        <div>
          <span className="block text-base font-semibold text-zinc-100 mb-1">
            Preferred Study Times *{" "}
            <span className="font-normal text-zinc-400">
              (select when you are usually free)
            </span>
          </span>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {AVAILABILITY_SLOTS.map((slot) => {
              const selected = availability.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => toggleSlot(slot)}
                  aria-pressed={selected}
                  className={`rounded-lg border px-4 py-2.5 text-sm sm:text-base font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    selected
                      ? "border-orange-500 bg-orange-500 text-zinc-950"
                      : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-orange-400 hover:text-orange-300"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label
              htmlFor="prof-goal"
              className="block text-base font-semibold text-zinc-100"
            >
              Study Goal{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <button
              type="button"
              onClick={handleSuggestGoal}
              disabled={isSuggestingGoal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 bg-zinc-950 px-3.5 py-1.5 text-sm font-semibold text-orange-400 hover:bg-zinc-800 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {isSuggestingGoal ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {isSuggestingGoal ? "Drafting..." : "Suggest Goal with AI"}
              </span>
            </button>
          </div>
          <textarea
            id="prof-goal"
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Preparing for finals, practicing weekly problem sets, or staying accountable."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end border-t border-zinc-800 pt-6">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 text-base font-extrabold text-zinc-950 hover:bg-orange-400 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Save Profile & Find Partners</span>
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
