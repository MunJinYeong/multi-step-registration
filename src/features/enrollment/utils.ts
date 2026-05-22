import type {
  Course,
  EnrollmentFormDraft,
  EnrollmentRequest,
  GroupEnrollmentDraft,
  Participant
} from "./types";

export function getRemainingCapacity(course: Course) {
  return Math.max(course.maxCapacity - course.currentEnrollment, 0);
}

export function isCourseFull(course: Course) {
  return getRemainingCapacity(course) === 0;
}

export function isCourseAlmostFull(course: Course) {
  const remainingCapacity = getRemainingCapacity(course);

  return remainingCapacity > 0 && remainingCapacity <= 3;
}

export function createEmptyParticipant(): Participant {
  return {
    name: "",
    email: ""
  };
}

export function createDefaultGroupDraft(): GroupEnrollmentDraft {
  return {
    organizationName: "",
    headCount: 2,
    participants: [createEmptyParticipant(), createEmptyParticipant()],
    contactPerson: ""
  };
}

export function resizeParticipants(
  participants: Participant[],
  headCount: number
) {
  if (participants.length === headCount) {
    return participants;
  }

  if (participants.length > headCount) {
    return participants.slice(0, headCount);
  }

  return [
    ...participants,
    ...Array.from({ length: headCount - participants.length }, () =>
      createEmptyParticipant()
    )
  ];
}

export function hasGroupDraftInput(group?: GroupEnrollmentDraft) {
  if (!group) {
    return false;
  }

  return (
    group.organizationName.trim().length > 0 ||
    group.contactPerson.trim().length > 0 ||
    group.participants.some(
      (participant) =>
        participant.name.trim().length > 0 ||
        participant.email.trim().length > 0
    )
  );
}

export function hasParticipantInput(participants: Participant[]) {
  return participants.some(
    (participant) =>
      participant.name.trim().length > 0 ||
      participant.email.trim().length > 0
  );
}

export function normalizeEnrollmentPayload(
  draft: EnrollmentFormDraft
): EnrollmentRequest {
  const applicant = {
    ...draft.applicant,
    name: draft.applicant.name.trim(),
    email: draft.applicant.email.trim(),
    phone: draft.applicant.phone.trim(),
    motivation: draft.applicant.motivation?.trim() || undefined
  };

  if (draft.type === "personal") {
    return {
      courseId: draft.courseId,
      type: "personal",
      applicant,
      agreedToTerms: draft.agreedToTerms
    };
  }

  if (draft.type !== "group") {
    throw new Error("신청 유형을 선택해야 합니다.");
  }

  const group = draft.group ?? createDefaultGroupDraft();

  return {
    courseId: draft.courseId,
    type: "group",
    applicant,
    group: {
      organizationName: group.organizationName.trim(),
      headCount: group.headCount,
      participants: resizeParticipants(group.participants, group.headCount).map(
        (participant) => ({
          name: participant.name.trim(),
          email: participant.email.trim()
        })
      ),
      contactPerson: group.contactPerson.trim()
    },
    agreedToTerms: draft.agreedToTerms
  };
}
