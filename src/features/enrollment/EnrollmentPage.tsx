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
          setCurrentStep("course");
        }
      })
      .catch(() => {
        if (isActive) {
          setCurrentStep("course");
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

      return;
    }

    clearErrors(["courseId", "type"]);
    setCurrentStep("applicant");
    setSubmitError("");
  };

  const handleApplicantStepBack = () => {
    setCurrentStep("course");
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
      return;
    }

    clearErrors("group.headCount");
    setSubmitError("");
    setCurrentStep("review");
  };

  const applyServerDetails = (details?: Record<string, string>) => {
    if (!details) {
      return;
    }

    Object.entries(details).forEach(([fieldName, message]) => {
      setError(fieldName as FieldPath<EnrollmentFormDraft>, {
        type: "server",
        message
      });
    });
  };

  const handleReviewBack = () => {
    setCurrentStep("applicant");
    setSubmitError("");
  };

  const handleEditStep = (step: "course" | "applicant") => {
    setCurrentStep(step);
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
      submissionResult.error.issues.forEach((issue) => {
        setError(issue.path.join(".") as FieldPath<EnrollmentFormDraft>, {
          type: "manual",
          message: issue.message
        });
      });
      setSubmitError("입력값을 다시 확인해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await submitEnrollment(submissionResult.data);

      setEnrollmentResult(response);
      setCurrentStep("complete");
    } catch (error) {
      if (isServerError(error)) {
        applyServerDetails(error.details);
        setSubmitError(submitErrorMessage[error.code] ?? error.message);
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
