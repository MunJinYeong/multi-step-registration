import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, type FieldPath } from "react-hook-form";
import StepIndicator from "../../components/StepIndicator";
import { getCourses, submitEnrollment } from "../../api/mockApi";
import {
  courseStepSchema,
  enrollmentFormDraftSchema,
  enrollmentSubmissionSchema,
  reviewStepSchema
} from "./schemas";
import {
  clearEnrollmentDraft,
  hasEnrollmentDraftInput,
  loadEnrollmentDraft,
  saveEnrollmentDraft
} from "./storage";
import ApplicantStep from "./steps/ApplicantStep";
import CompleteStep from "./steps/CompleteStep";
import CourseStep from "./steps/CourseStep";
import ReviewStep from "./steps/ReviewStep";
import type {
  Course,
  EnrollmentErrorCode,
  EnrollmentFormDraft,
  EnrollmentResponse,
  EnrollmentStep,
  EnrollmentType
} from "./types";
import {
  createDefaultGroupDraft,
  getRemainingCapacity,
  hasGroupDraftInput,
  normalizeEnrollmentPayload
} from "./utils";

const initialDraft: EnrollmentFormDraft = {
  courseId: "",
  type: "",
  applicant: {
    name: "",
    email: "",
    phone: "",
    motivation: ""
  },
  agreedToTerms: false
};

const submitErrorMessage: Record<EnrollmentErrorCode, string> = {
  COURSE_FULL:
    "선택한 강의의 잔여 정원이 부족합니다. 강의 또는 인원수를 확인해 주세요.",
  DUPLICATE_ENROLLMENT: "이미 신청된 강의입니다. 신청 내역을 확인해 주세요.",
  INVALID_INPUT: "입력값을 다시 확인해 주세요."
};

const fieldFocusTargets: Partial<Record<FieldPath<EnrollmentFormDraft>, string>> =
  {
    courseId: ".course-card:not(:disabled)",
    type: 'input[name="enrollment-type"]',
    "applicant.name": "#applicant-name",
    "applicant.email": "#applicant-email",
    "applicant.phone": "#applicant-phone",
    "applicant.motivation": "#applicant-motivation",
    "group.organizationName": "#group-organization-name",
    "group.headCount": "#group-head-count",
    "group.contactPerson": "#group-contact-person",
    agreedToTerms: "#agreed-to-terms"
  };

type HistoryEnrollmentStep = Extract<
  EnrollmentStep,
  "course" | "applicant" | "review"
>;

function isHistoryEnrollmentStep(step: unknown): step is HistoryEnrollmentStep {
  return step === "course" || step === "applicant" || step === "review";
}

function getPreviousStep(step: EnrollmentStep): EnrollmentStep | null {
  if (step === "review") {
    return "applicant";
  }

  if (step === "applicant") {
    return "course";
  }

  return null;
}

function getFieldStep(fieldName: string): EnrollmentStep {
  if (fieldName === "courseId" || fieldName === "type") {
    return "course";
  }

  if (fieldName === "agreedToTerms") {
    return "review";
  }

  return "applicant";
}

function getFieldFocusTarget(fieldName: string) {
  if (fieldName.startsWith("group.participants.")) {
    const [, , participantIndex, fieldKey] = fieldName.split(".");

    return `#participant-${participantIndex}-${fieldKey}`;
  }

  return fieldFocusTargets[fieldName as FieldPath<EnrollmentFormDraft>];
}

function isServerError(error: unknown): error is {
  code: EnrollmentErrorCode;
  message: string;
  details?: Record<string, string>;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

function EnrollmentPage() {
  const savedEnrollmentDraft = useMemo(() => loadEnrollmentDraft(), []);
  const [currentStep, setCurrentStep] = useState<EnrollmentStep>(
    savedEnrollmentDraft?.currentStep ?? "course"
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrollmentResult, setEnrollmentResult] =
    useState<EnrollmentResponse | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFocusField, setPendingFocusField] = useState<string | null>(
    null
  );
  const methods = useForm<EnrollmentFormDraft>({
    defaultValues: savedEnrollmentDraft?.draft ?? initialDraft,
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(enrollmentFormDraftSchema)
  });
  const {
    formState: { errors },
    clearErrors,
    getValues,
    setError,
    setValue,
    trigger,
    watch
  } = methods;
  const selectedCourseId = watch("courseId");
  const selectedType = watch("type");
  const draftValues = watch();
  const shouldWarnBeforeUnload =
    currentStep !== "complete" &&
    hasEnrollmentDraftInput(draftValues, currentStep);

  const goToStep = (
    step: EnrollmentStep,
    options: { replace?: boolean } = {}
  ) => {
    setCurrentStep(step);

    if (step === "complete") {
      return;
    }

    const historyMethod = options.replace ? "replaceState" : "pushState";

    window.history[historyMethod](
      { enrollmentStep: step },
      "",
      window.location.href
    );
  };

  useEffect(() => {
    if (!selectedCourseId) {
      setSelectedCourse(null);
      return;
    }

    let isActive = true;

    getCourses()
      .then(({ courses }) => {
        if (!isActive) {
          return;
        }

        const restoredCourse =
          courses.find((course) => course.id === selectedCourseId) ?? null;

        setSelectedCourse(restoredCourse);

        if (!restoredCourse) {
          setValue("courseId", "", {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: false
          });
          goToStep("course", { replace: true });
        }
      })
      .catch(() => {
        if (isActive) {
          goToStep("course", { replace: true });
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedCourseId, setValue]);

  useEffect(() => {
    if (currentStep === "complete") {
      clearEnrollmentDraft();
      return;
    }

    if (!hasEnrollmentDraftInput(draftValues, currentStep)) {
      clearEnrollmentDraft();
      return;
    }

    saveEnrollmentDraft({
      currentStep,
      draft: draftValues
    });
  }, [currentStep, draftValues]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldWarnBeforeUnload) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldWarnBeforeUnload]);

  useEffect(() => {
    window.history.replaceState(
      { enrollmentStep: currentStep === "complete" ? "review" : currentStep },
      "",
      window.location.href
    );

    const handlePopState = (event: PopStateEvent) => {
      const step = event.state?.enrollmentStep;

      if (isHistoryEnrollmentStep(step)) {
        setCurrentStep(step);
        setSubmitError("");
        return;
      }

      const previousStep = getPreviousStep(currentStep);

      if (!previousStep) {
        return;
      }

      setCurrentStep(previousStep);
      setSubmitError("");
      window.history.replaceState(
        { enrollmentStep: previousStep },
        "",
        window.location.href
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentStep]);

  useEffect(() => {
    if (!pendingFocusField) {
      return;
    }

    const targetSelector = getFieldFocusTarget(pendingFocusField);

    if (!targetSelector) {
      setPendingFocusField(null);
      return;
    }

    window.setTimeout(() => {
      const targetElement = document.querySelector<HTMLElement>(targetSelector);

      if (!targetElement) {
        setPendingFocusField(null);
        return;
      }

      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      targetElement.focus({ preventScroll: true });
      setPendingFocusField(null);
    }, 0);
  }, [currentStep, pendingFocusField]);

  const moveToField = (fieldName: string) => {
    const targetStep = getFieldStep(fieldName);

    if (targetStep !== currentStep) {
      goToStep(targetStep);
    }

    setPendingFocusField(fieldName);
  };

  const handleCourseChange = (course: Course) => {
    setSelectedCourse(course);
    setValue("courseId", course.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setSubmitError("");
  };

  const handleTypeChange = (type: EnrollmentType) => {
    const currentType = getValues("type");

    if (currentType === type) {
      return;
    }

    if (type === "personal") {
      const groupDraft = getValues("group");

      if (
        hasGroupDraftInput(groupDraft) &&
        !window.confirm("개인 신청으로 변경하면 입력한 단체 정보가 삭제됩니다.")
      ) {
        return;
      }

      setValue("group", undefined, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false
      });
      clearErrors("group");
    }

    if (type === "group" && !getValues("group")) {
      setValue("group", createDefaultGroupDraft(), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false
      });
    }

    setValue("type", type, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setSubmitError("");
  };

  const handleCourseStepNext = () => {
    const result = courseStepSchema.safeParse({
      courseId: getValues("courseId"),
      type: getValues("type")
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      if (fieldErrors.courseId?.[0]) {
        setError("courseId", {
          type: "manual",
          message: fieldErrors.courseId[0]
        });
      }

      if (fieldErrors.type?.[0]) {
        setError("type", {
          type: "manual",
          message: fieldErrors.type[0]
        });
      }

      moveToField(fieldErrors.courseId?.[0] ? "courseId" : "type");
      return;
    }

    clearErrors(["courseId", "type"]);
    goToStep("applicant");
    setSubmitError("");
  };

  const handleApplicantStepBack = () => {
    goToStep("course");
    setSubmitError("");
  };

  const handleApplicantStepNext = async () => {
    const fieldsToValidate =
      getValues("type") === "group"
        ? ([
            "applicant.name",
            "applicant.email",
            "applicant.phone",
            "applicant.motivation",
            "group"
          ] as const)
        : ([
            "applicant.name",
            "applicant.email",
            "applicant.phone",
            "applicant.motivation"
          ] as const);
    const isValid = await trigger(fieldsToValidate, { shouldFocus: true });

    if (!isValid) {
      return;
    }

    const group = getValues("group");

    if (
      selectedCourse &&
      getValues("type") === "group" &&
      group &&
      group.headCount > getRemainingCapacity(selectedCourse)
    ) {
      setError("group.headCount", {
        type: "manual",
        message: "신청 인원수가 선택한 강의의 잔여 정원을 초과합니다."
      });
      moveToField("group.headCount");
      return;
    }

    clearErrors("group.headCount");
    setSubmitError("");
    goToStep("review");
  };

  const applyServerDetails = (details?: Record<string, string>) => {
    if (!details) {
      return null;
    }

    const detailEntries = Object.entries(details);

    detailEntries.forEach(([fieldName, message]) => {
      setError(fieldName as FieldPath<EnrollmentFormDraft>, {
        type: "server",
        message
      });
    });

    return detailEntries[0]?.[0] ?? null;
  };

  const handleReviewBack = () => {
    goToStep("applicant");
    setSubmitError("");
  };

  const handleEditStep = (step: "course" | "applicant") => {
    goToStep(step);
    setSubmitError("");
  };

  const handleSubmitEnrollment = async () => {
    const termsResult = reviewStepSchema.safeParse({
      agreedToTerms: getValues("agreedToTerms")
    });

    if (!termsResult.success) {
      setError("agreedToTerms", {
        type: "manual",
        message:
          termsResult.error.flatten().fieldErrors.agreedToTerms?.[0] ??
          "이용약관에 동의해 주세요."
      });
      moveToField("agreedToTerms");
      return;
    }

    let payload;

    try {
      payload = normalizeEnrollmentPayload(getValues());
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "제출 정보를 확인해 주세요."
      );
      return;
    }

    const submissionResult = enrollmentSubmissionSchema.safeParse(payload);

    if (!submissionResult.success) {
      const firstIssuePath = submissionResult.error.issues[0]?.path.join(".");

      submissionResult.error.issues.forEach((issue) => {
        const fieldName = issue.path.join(".");

        setError(fieldName as FieldPath<EnrollmentFormDraft>, {
          type: "manual",
          message: issue.message
        });
      });
      setSubmitError("입력값을 다시 확인해 주세요.");

      if (firstIssuePath) {
        moveToField(firstIssuePath);
      }

      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await submitEnrollment(submissionResult.data);

      setEnrollmentResult(response);
      goToStep("complete");
    } catch (error) {
      if (isServerError(error)) {
        const firstServerErrorField = applyServerDetails(error.details);

        setSubmitError(submitErrorMessage[error.code] ?? error.message);

        if (firstServerErrorField) {
          moveToField(firstServerErrorField);
        }

        return;
      }

      setSubmitError("신청 제출 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <FormProvider {...methods}>
        <div className="app-container">
          {currentStep !== "complete" ? (
            <StepIndicator currentStep={currentStep} />
          ) : null}
          {currentStep === "course" ? (
            <CourseStep
              selectedCourse={selectedCourse}
              selectedCourseId={selectedCourseId}
              selectedType={selectedType}
              errors={{
                courseId: errors.courseId?.message,
                type: errors.type?.message
              }}
              onCourseChange={handleCourseChange}
              onTypeChange={handleTypeChange}
              onNext={handleCourseStepNext}
            />
          ) : null}
          {currentStep === "applicant" ? (
            <ApplicantStep
              enrollmentType={getValues("type")}
              onBack={handleApplicantStepBack}
              onNext={handleApplicantStepNext}
            />
          ) : null}
          {currentStep === "review" && selectedCourse ? (
            <ReviewStep
              course={selectedCourse}
              errorMessage={submitError}
              isSubmitting={isSubmitting}
              onBack={handleReviewBack}
              onEditStep={handleEditStep}
              onSubmit={handleSubmitEnrollment}
            />
          ) : null}
          {currentStep === "complete" && selectedCourse && enrollmentResult ? (
            <CompleteStep course={selectedCourse} result={enrollmentResult} />
          ) : null}
        </div>
      </FormProvider>
    </main>
  );
}

export default EnrollmentPage;
