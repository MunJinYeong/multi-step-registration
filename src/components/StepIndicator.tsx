import type { EnrollmentStep } from "../features/enrollment/types";

interface StepIndicatorProps {
  currentStep: EnrollmentStep;
}

const steps: Array<{ id: EnrollmentStep; label: string }> = [
  { id: "course", label: "강의 선택" },
  { id: "applicant", label: "정보 입력" },
  { id: "review", label: "확인 및 제출" }
];

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex(({ id }) => id === currentStep);

  return (
    <ol className="step-indicator" aria-label="신청 진행 단계">
      {steps.map((step, index) => {
        const isCurrent = step.id === currentStep;
        const isComplete = index < currentStepIndex;

        return (
          <li
            className="step-indicator__item"
            data-state={
              isCurrent ? "current" : isComplete ? "complete" : "upcoming"
            }
            key={step.id}
            aria-current={isCurrent ? "step" : undefined}
          >
            <span className="step-indicator__number">{index + 1}</span>
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default StepIndicator;
