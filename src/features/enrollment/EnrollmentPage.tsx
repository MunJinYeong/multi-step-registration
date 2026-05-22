import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import StepIndicator from "../../components/StepIndicator";
import { enrollmentFormDraftSchema } from "./schemas";
import ApplicantStep from "./steps/ApplicantStep";
import CourseStep from "./steps/CourseStep";
import type {
  Course,
  EnrollmentFormDraft,
  EnrollmentStep,
  EnrollmentType
} from "./types";

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
    getValues,
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
    setValue("type", type, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setIsApplicantStepReady(false);
  };

  const handleCourseStepNext = async () => {
    const isValid = await trigger(["courseId", "type"], {
      shouldFocus: true
    });

    if (!isValid) {
      return;
    }

    setCurrentStep("applicant");
    setIsApplicantStepReady(false);
  };

  const handleApplicantStepBack = () => {
    setCurrentStep("course");
    setIsApplicantStepReady(false);
  };

  const handleApplicantStepNext = async () => {
    const isValid = await trigger(
      [
        "applicant.name",
        "applicant.email",
        "applicant.phone",
        "applicant.motivation"
      ],
      { shouldFocus: true }
    );

    if (!isValid) {
      setIsApplicantStepReady(false);
      return;
    }

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
