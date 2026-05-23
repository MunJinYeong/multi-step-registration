import { z } from "zod";
import type { EnrollmentFormDraft, EnrollmentStep } from "./types";

const STORAGE_KEY = "multi-step-registration:draft";
const STORAGE_VERSION = 1;

const savedStepSchema = z.enum(["course", "applicant", "review"]);

const savedDraftSchema = z.object({
  courseId: z.string().catch(""),
  type: z.union([z.literal(""), z.literal("personal"), z.literal("group")]),
  applicant: z.object({
    name: z.string().catch(""),
    email: z.string().catch(""),
    phone: z.string().catch(""),
    motivation: z.string().optional().catch("")
  }),
  group: z
    .object({
      organizationName: z.string().catch(""),
      headCount: z.number().int().min(2).max(10).catch(2),
      participants: z
        .array(
          z.object({
            name: z.string().catch(""),
            email: z.string().catch("")
          })
        )
        .catch([]),
      contactPerson: z.string().catch("")
    })
    .optional(),
  agreedToTerms: z.boolean().catch(false)
});

const savedEnrollmentSchema = z.object({
  version: z.literal(STORAGE_VERSION),
  currentStep: savedStepSchema,
  draft: savedDraftSchema
});

export interface SavedEnrollmentDraft {
  currentStep: Extract<EnrollmentStep, "course" | "applicant" | "review">;
  draft: EnrollmentFormDraft;
}

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function removeSavedDraft() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

export function loadEnrollmentDraft(): SavedEnrollmentDraft | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawSavedDraft = window.localStorage.getItem(STORAGE_KEY);

    if (!rawSavedDraft) {
      return null;
    }

    const result = savedEnrollmentSchema.safeParse(JSON.parse(rawSavedDraft));

    if (!result.success) {
      removeSavedDraft();
      return null;
    }

    return result.data;
  } catch {
    removeSavedDraft();
    return null;
  }
}

export function saveEnrollmentDraft({
  currentStep,
  draft
}: SavedEnrollmentDraft) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        currentStep,
        draft
      })
    );
  } catch {
    return;
  }
}

export function clearEnrollmentDraft() {
  if (!canUseLocalStorage()) {
    return;
  }

  removeSavedDraft();
}

export function hasEnrollmentDraftInput(
  draft: EnrollmentFormDraft,
  currentStep: EnrollmentStep
) {
  if (currentStep !== "course") {
    return true;
  }

  const group = draft.group;

  return (
    draft.courseId.trim().length > 0 ||
    draft.type !== "" ||
    draft.applicant.name.trim().length > 0 ||
    draft.applicant.email.trim().length > 0 ||
    draft.applicant.phone.trim().length > 0 ||
    (draft.applicant.motivation?.trim().length ?? 0) > 0 ||
    draft.agreedToTerms ||
    Boolean(
      group &&
        (group.organizationName.trim().length > 0 ||
          group.contactPerson.trim().length > 0 ||
          group.participants.some(
            (participant) =>
              participant.name.trim().length > 0 ||
              participant.email.trim().length > 0
          ))
    )
  );
}
