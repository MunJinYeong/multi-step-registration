import { z } from "zod";

const koreanPhoneRegex =
  /^(01[016789]-?\d{3,4}-?\d{4}|0\d{1,2}-?\d{3,4}-?\d{4})$/;

const requiredText = (message: string) => z.string().trim().min(1, message);

export const enrollmentTypeSchema = z.enum(["personal", "group"], {
  error: "신청 유형을 선택해 주세요."
});

export const courseStepSchema = z.object({
  courseId: requiredText("강의를 선택해 주세요."),
  type: enrollmentTypeSchema
});

export const applicantBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "이름은 2자 이상 입력해 주세요.")
    .max(20, "이름은 20자 이하로 입력해 주세요."),
  email: z
    .string()
    .trim()
    .min(1, "이메일을 입력해 주세요.")
    .email("올바른 이메일 형식으로 입력해 주세요."),
  phone: z
    .string()
    .trim()
    .min(1, "전화번호를 입력해 주세요.")
    .regex(koreanPhoneRegex, "올바른 한국 전화번호 형식으로 입력해 주세요."),
  motivation: z
    .string()
    .trim()
    .max(300, "수강 동기는 300자 이하로 입력해 주세요.")
    .optional()
});

export const participantSchema = z.object({
  name: requiredText("참가자 이름을 입력해 주세요."),
  email: z
    .string()
    .trim()
    .min(1, "참가자 이메일을 입력해 주세요.")
    .email("올바른 이메일 형식으로 입력해 주세요.")
});

export const groupFieldsSchema = z
  .object({
    organizationName: requiredText("단체명을 입력해 주세요."),
    headCount: z
      .number({ error: "신청 인원수를 입력해 주세요." })
      .int("신청 인원수는 정수로 입력해 주세요.")
      .min(2, "단체 신청은 2명 이상이어야 합니다.")
      .max(10, "단체 신청은 최대 10명까지 가능합니다."),
    participants: z.array(participantSchema),
    contactPerson: z
      .string()
      .trim()
      .min(1, "담당자 연락처를 입력해 주세요.")
      .regex(koreanPhoneRegex, "올바른 한국 전화번호 형식으로 입력해 주세요.")
  })
  .superRefine((group, ctx) => {
    if (group.participants.length !== group.headCount) {
      ctx.addIssue({
        code: "custom",
        path: ["participants"],
        message: "참가자 명단은 신청 인원수와 같아야 합니다."
      });
    }

    const emailIndexes = new Map<string, number>();

    group.participants.forEach((participant, index) => {
      const normalizedEmail = participant.email.trim().toLowerCase();

      if (!normalizedEmail) {
        return;
      }

      const duplicatedIndex = emailIndexes.get(normalizedEmail);

      if (duplicatedIndex !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["participants", index, "email"],
          message: "참가자 이메일은 중복될 수 없습니다."
        });
        ctx.addIssue({
          code: "custom",
          path: ["participants", duplicatedIndex, "email"],
          message: "참가자 이메일은 중복될 수 없습니다."
        });
        return;
      }

      emailIndexes.set(normalizedEmail, index);
    });
  });

export const personalApplicantStepSchema = z.object({
  type: z.literal("personal"),
  applicant: applicantBaseSchema
});

export const groupApplicantStepSchema = z.object({
  type: z.literal("group"),
  applicant: applicantBaseSchema,
  group: groupFieldsSchema
});

export const applicantStepSchema = z.discriminatedUnion("type", [
  personalApplicantStepSchema,
  groupApplicantStepSchema
]);

export const enrollmentFormDraftSchema = z.object({
  courseId: z.string(),
  type: z.union([enrollmentTypeSchema, z.literal("")]),
  applicant: applicantBaseSchema,
  group: groupFieldsSchema.optional(),
  agreedToTerms: z.boolean()
});

export const reviewStepSchema = z.object({
  agreedToTerms: z.literal(true, {
    error: "이용약관에 동의해 주세요."
  })
});

export const personalEnrollmentSchema = z.object({
  courseId: requiredText("강의를 선택해 주세요."),
  type: z.literal("personal"),
  applicant: applicantBaseSchema,
  agreedToTerms: z.literal(true, {
    error: "이용약관에 동의해 주세요."
  })
});

export const groupEnrollmentSchema = z.object({
  courseId: requiredText("강의를 선택해 주세요."),
  type: z.literal("group"),
  applicant: applicantBaseSchema,
  group: groupFieldsSchema,
  agreedToTerms: z.literal(true, {
    error: "이용약관에 동의해 주세요."
  })
});

export const enrollmentSubmissionSchema = z.discriminatedUnion("type", [
  personalEnrollmentSchema,
  groupEnrollmentSchema
]);
