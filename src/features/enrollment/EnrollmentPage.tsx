import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import StepIndicator from "../../components/StepIndicator";
import { courseStepSchema, enrollmentFormDraftSchema } from "./schemas";
import ApplicantStep from "./steps/ApplicantStep";
import CourseStep from "./steps/CourseStep";
import type {
  Course,
  EnrollmentFormDraft,
  EnrollmentStep,
  EnrollmentType
} from "./types";
import {
  createDefaultGroupDraft,
  getRemainingCapacity,
  hasGroupDraftInput
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

function EnrollmentPage() {
  const [currentStep, setCurrentStep] = useState<EnrollmentStep>("course");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isApplicantStepReady, setIsApplicantStepReady] = useState(false);
  const methods = useForm<EnrollmentFormDraft>({
    defaultValues: initialDraft,
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

  const handleCourseChange = (course: Course) => {
    setSelectedCourse(course);
    setValue("courseId", course.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setIsApplicantStepReady(false);
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
    setIsApplicantStepReady(false);
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
    setIsApplicantStepReady(false);
  };

  const handleApplicantStepBack = () => {
    setCurrentStep("course");
    setIsApplicantStepReady(false);
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
      setIsApplicantStepReady(false);
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
      setIsApplicantStepReady(false);
      return;
    }

    clearErrors("group.headCount");
    setIsApplicantStepReady(true);
  };

  return (
    <main className="app-shell">
      <FormProvider {...methods}>
        <div className="app-container">
          <StepIndicator currentStep={currentStep} />
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
          {isApplicantStepReady ? (
            <div className="next-step-notice" role="status">
              수강생 정보 입력이 완료되었습니다. 다음 구현 단계에서 단체 신청
              세부 정보와 확인 화면으로 연결됩니다.
            </div>
          ) : null}
        </div>
      </FormProvider>
    </main>
  );
}

export default EnrollmentPage;
