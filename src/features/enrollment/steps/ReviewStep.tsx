import { useFormContext, useWatch } from "react-hook-form";
import type { Course, EnrollmentFormDraft } from "../types";
import EnrollmentSummary from "./EnrollmentSummary";

interface ReviewStepProps {
  course: Course;
  errorMessage: string;
  isSubmitting: boolean;
  onBack: () => void;
  onEditStep: (step: "course" | "applicant") => void;
  onSubmit: () => void;
}

function ReviewStep({
  course,
  errorMessage,
  isSubmitting,
  onBack,
  onEditStep,
  onSubmit
}: ReviewStepProps) {
  const {
    control,
    formState: { errors },
    register
  } = useFormContext<EnrollmentFormDraft>();
  const draft = useWatch({ control }) as EnrollmentFormDraft;

  return (
    <section className="review-step" aria-labelledby="review-step-title">
      <div className="section-heading">
        <p className="eyebrow">Step 3</p>
        <h1 id="review-step-title">신청 내용을 확인해 주세요.</h1>
        <p>
          제출 전 강의와 신청자 정보를 확인해 주세요. 수정이 필요한 항목은
          각 섹션의 수정 버튼으로 돌아갈 수 있습니다.
        </p>
      </div>

      <EnrollmentSummary course={course} draft={draft} onEditStep={onEditStep} />

      <div className="submit-panel">
        <label className="terms-check" htmlFor="agreed-to-terms">
          <input
            id="agreed-to-terms"
            type="checkbox"
            aria-invalid={Boolean(errors.agreedToTerms)}
            {...register("agreedToTerms")}
          />
          <span>이용약관과 개인정보 수집 및 이용에 동의합니다.</span>
        </label>
        {errors.agreedToTerms ? (
          <p className="field-error" role="alert">
            {errors.agreedToTerms.message}
          </p>
        ) : null}
        {errorMessage ? (
          <div className="submit-error" role="alert">
            {errorMessage}
          </div>
        ) : null}
        <div className="step-actions">
          <button
            className="secondary-action"
            disabled={isSubmitting}
            onClick={onBack}
            type="button"
          >
            이전
          </button>
          <button
            className="primary-action"
            disabled={isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? "제출 중" : "신청 제출"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default ReviewStep;
