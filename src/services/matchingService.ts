import { STUDY_LEVELS } from "../data/studyData";
import type { MatchEvaluation, Partner, UserProfile } from "../types";

export const MatchingService = {
  levelIndex(level: Partner["level"]): number {
    return STUDY_LEVELS.indexOf(level);
  },

  evaluateMatch(user: UserProfile, partner: Partner): MatchEvaluation {
    const userSubjects = user.subjects || [];
    const partnerSubjects = partner.subjects || [];
    const sharedSubjects = partnerSubjects.filter((s) =>
      userSubjects.some((us) => us.toLowerCase() === s.toLowerCase())
    );

    const userAvail = user.availability || [];
    const partnerAvail = partner.availability || [];
    const sharedAvailability = partnerAvail.filter((a) => userAvail.includes(a));

    let subjectScore = 0;
    if (sharedSubjects.length === 1) subjectScore = 38;
    else if (sharedSubjects.length === 2) subjectScore = 45;
    else if (sharedSubjects.length >= 3) subjectScore = 50;

    const diff = Math.abs(this.levelIndex(user.level) - this.levelIndex(partner.level));
    const levelScore = diff === 0 ? 20 : diff === 1 ? 11 : 3;

    let availScore = 0;
    if (sharedAvailability.length === 1) availScore = 15;
    else if (sharedAvailability.length >= 2) availScore = 20;

    let meetingScore = 0;
    if (user.meetingPreference === partner.meetingPreference) {
      meetingScore = 10;
    } else if (user.meetingPreference === "Both" || partner.meetingPreference === "Both") {
      meetingScore = 8;
    }

    const totalScore = Math.min(99, subjectScore + levelScore + availScore + meetingScore);

    const reasonParts: string[] = [];
    if (sharedSubjects.length > 0) {
      const subjText =
        sharedSubjects.length === 1
          ? sharedSubjects[0]
          : `${sharedSubjects.slice(0, -1).join(", ")} and ${sharedSubjects[sharedSubjects.length - 1]}`;
      reasonParts.push(`You both study ${subjText}`);
    } else {
      reasonParts.push(`You both focus on ${partner.level.toLowerCase()}-level study habits`);
    }

    if (sharedAvailability.length > 0) {
      reasonParts.push(`are free ${sharedAvailability[0].toLowerCase()}`);
    } else if (diff === 0) {
      reasonParts.push(`study at the same ${partner.level.toLowerCase()} level`);
    }

    if (meetingScore >= 8 && reasonParts.length < 3) {
      const prefLabel =
        partner.meetingPreference === "Both"
          ? user.meetingPreference === "Both"
            ? "flexible online or in-person"
            : user.meetingPreference.toLowerCase()
          : partner.meetingPreference.toLowerCase();
      reasonParts.push(`prefer ${prefLabel} sessions`);
    }

    let explanation = "";
    if (reasonParts.length === 1) {
      explanation = `${reasonParts[0]}.`;
    } else if (reasonParts.length === 2) {
      explanation = `${reasonParts[0]} and ${reasonParts[1]}.`;
    } else {
      explanation = `${reasonParts[0]}, ${reasonParts[1]}, and ${reasonParts[2]}.`;
    }

    return {
      partner,
      score: totalScore,
      sharedSubjects,
      sharedAvailability,
      sameLevel: diff === 0,
      meetingCompatible: meetingScore > 0,
      explanation,
    };
  },

  getTopRecommendations(user: UserProfile, partners: Partner[], limit = 3): MatchEvaluation[] {
    return partners
      .map((p) => this.evaluateMatch(user, p))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
};
