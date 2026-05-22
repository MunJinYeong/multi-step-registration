import { useFormContext } from "react-hook-form";
import Field from "../../../components/Field";
import type { EnrollmentFormDraft, EnrollmentType } from "../types";

interface ApplicantStepProps {
  enrollmentType: EnrollmentType | "";
  onBack: () => void;
  onNext: () => void;
}

function ApplicantStep({ enrollmentType, onBack, onNext }: ApplicantStepProps) {
  const {
    formState: { errors },
    register,
    watch
  } = useFormContext<EnrollmentFormDraft>();
  const motivation = watch("applicant.motivation") ?? "";

  return (
    <section className="applicant-step" aria-labelledby="applicant-step-title">
      <div className="section-heading">
        <p className="eyebrow">Step 2</p>
        <h1 id="applicant-step-title">수강생 정보를 입력해 주세요.</h1>
        <p>
          신청자 연락처는 강의 안내와 신청 결과 전달에 사용됩니다. 단체 신청
          정보는 다음 단계에서 이어서 입력합니다.
        </p>
      </div>

      <div className="form-panel">
        <div className="field-grid">
          <Field
            label="이름"
            required
            error={errors.applicant?.name}
            controlProps={{
              id: "applicant-name",
              autoComplete: "name",
              placeholder: "홍길동",
              ...register("applicant.name")
            }}
          />
          <Field
            label="이메일"
            required
            error={errors.applicant?.email}
            controlProps={{
              id: "applicant-email",
              autoComplete: "email",
              inputMode: "email",
              placeholder: "name@example.com",
              type: "email",
              ...register("applicant.email")
            }}
          />
          <Field
            label="전화번호"
            required
            hint="010-1234-5678 형식으로 입력할 수 있습니다."
            error={errors.applicant?.phone}
            controlProps={{
              id: "applicant-phone",
              autoComplete: "tel",
              inputMode: "tel",
              placeholder: "010-1234-5678",
              type: "tel",
              ...register("applicant.phone")
            }}
          />
          <Field
            label="수강 동기"
            hint={`${motivation.length}/300자`}
            error={errors.applicant?.motivation}
            controlProps={{
              id: "applicant-motivation",
              as: "textarea",
              maxLength: 300,
              placeholder: "강의를 신청하는 이유를 간단히 적어 주세요.",
              rows: 5,
              ...register("applicant.motivation")
            }}
          />
        </div>

        {enrollmentType === "group" ? (
          <div className="step-note" role="note">
            단체 신청 세부 정보는 다음 구현 단계에서 입력 화면으로
            연결됩니다.
          </div>
        ) : null}

        <div className="step-actions">
          <button className="secondary-action" onClick={onBack} type="button">
            이전
          </button>
          <button className="primary-action" onClick={onNext} type="button">
            다음 단계
          </button>
        </div>
      </div>
    </section>
  );
}

export default ApplicantStep;
