import { useState } from "react";
import StepIndicator from "../../components/StepIndicator";
import { courseStepSchema } from "./schemas";
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
  const [currentStep] = useState<EnrollmentStep>("course");
  const [draft, setDraft] = useState<EnrollmentFormDraft>(initialDraft);
  const [courseStepErrors, setCourseStepErrors] = useState<{
    courseId?: string;
    type?: string;
  }>({});
  const [isCourseStepReady, setIsCourseStepReady] = useState(false);

  const handleCourseChange = (course: Course) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      courseId: course.id
    }));
    setCourseStepErrors((currentErrors) => ({
      ...currentErrors,
      courseId: undefined
    }));
    setIsCourseStepReady(false);
  };

  const handleTypeChange = (type: EnrollmentType) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      type
    }));
    setCourseStepErrors((currentErrors) => ({
      ...currentErrors,
      type: undefined
    }));
    setIsCourseStepReady(false);
  };

  const handleCourseStepNext = () => {
    const result = courseStepSchema.safeParse({
      courseId: draft.courseId,
      type: draft.type
    });

    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors;

      setCourseStepErrors({
        courseId: formattedErrors.courseId?.[0],
        type: formattedErrors.type?.[0]
      });
      setIsCourseStepReady(false);
      return;
    }

    setCourseStepErrors({});
    setIsCourseStepReady(true);
  };

  return (
    <main className="app-shell">
      <div className="app-container">
        <StepIndicator currentStep={currentStep} />
        <CourseStep
          selectedCourseId={draft.courseId}
          selectedType={draft.type}
          errors={courseStepErrors}
          onCourseChange={handleCourseChange}
          onTypeChange={handleTypeChange}
          onNext={handleCourseStepNext}
        />
        {isCourseStepReady ? (
          <div className="next-step-notice" role="status">
            강의 선택이 완료되었습니다. 다음 구현 단계에서 수강생 정보 입력
            화면으로 연결됩니다.
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default EnrollmentPage;
