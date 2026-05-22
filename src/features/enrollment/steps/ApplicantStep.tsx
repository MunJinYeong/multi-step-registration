import { useFormContext } from "react-hook-form";
import Field from "../../../components/Field";
import type { EnrollmentFormDraft, EnrollmentType } from "../types";
import { hasParticipantInput, resizeParticipants } from "../utils";

interface ApplicantStepProps {
  enrollmentType: EnrollmentType | "";
  onBack: () => void;
  onNext: () => void;
}

function ApplicantStep({ enrollmentType, onBack, onNext }: ApplicantStepProps) {
  const {
    clearErrors,
    formState: { errors },
    register,
    setValue,
    watch
  } = useFormContext<EnrollmentFormDraft>();
  const motivation = watch("applicant.motivation") ?? "";
  const group = watch("group");
  const headCount = group?.headCount ?? 2;
  const participants = group?.participants ?? [];

  const handleHeadCountChange = (value: number) => {
    const nextHeadCount = Math.min(Math.max(value, 2), 10);
    const removedParticipants = participants.slice(nextHeadCount);

    if (
      nextHeadCount < participants.length &&
      hasParticipantInput(removedParticipants) &&
      !window.confirm(
        "신청 인원수를 줄이면 초과 참가자 정보가 삭제됩니다. 계속하시겠습니까?"
      )
    ) {
      return;
    }

    setValue("group.headCount", nextHeadCount, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setValue(
      "group.participants",
      resizeParticipants(participants, nextHeadCount),
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      }
    );
    clearErrors("group.participants");
  };

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

        {enrollmentType === "group" && group ? (
          <div className="group-section">
            <div className="section-subheading">
              <h2>단체 신청 정보</h2>
              <p>신청 인원수에 맞춰 참가자 이름과 이메일을 입력해 주세요.</p>
            </div>

            <div className="field-grid">
              <Field
                label="단체명"
                required
                error={errors.group?.organizationName}
                controlProps={{
                  id: "group-organization-name",
                  placeholder: "예: 프론트엔드 스터디 팀",
                  ...register("group.organizationName")
                }}
              />
              <div className="field">
                <label htmlFor="group-head-count">신청 인원수 *</label>
                <div className="count-stepper">
                  <button
                    aria-label="신청 인원수 감소"
                    disabled={headCount <= 2}
                    onClick={() => handleHeadCountChange(headCount - 1)}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    aria-describedby="group-head-count-hint"
                    aria-invalid={Boolean(errors.group?.headCount)}
                    id="group-head-count"
                    readOnly
                    type="number"
                    value={headCount}
                  />
                  <button
                    aria-label="신청 인원수 증가"
                    disabled={headCount >= 10}
                    onClick={() => handleHeadCountChange(headCount + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <p className="field-hint" id="group-head-count-hint">
                  단체 신청은 2명 이상 10명 이하로 가능합니다.
                </p>
                {errors.group?.headCount ? (
                  <p className="field-error" role="alert">
                    {errors.group.headCount.message}
                  </p>
                ) : null}
              </div>
              <Field
                label="담당자 연락처"
                required
                hint="010-1234-5678 형식으로 입력할 수 있습니다."
                error={errors.group?.contactPerson}
                controlProps={{
                  id: "group-contact-person",
                  inputMode: "tel",
                  placeholder: "010-1234-5678",
                  type: "tel",
                  ...register("group.contactPerson")
                }}
              />
            </div>

            <div className="participants-section">
              <h3>참가자 명단</h3>
              <div className="participants-list">
                {participants.map((_, index) => (
                  <div className="participant-card" key={index}>
                    <span className="participant-card__title">
                      참가자 {index + 1}
                    </span>
                    <Field
                      label="이름"
                      required
                      error={errors.group?.participants?.[index]?.name}
                      controlProps={{
                        id: `participant-${index}-name`,
                        placeholder: "참가자 이름",
                        ...register(`group.participants.${index}.name`)
                      }}
                    />
                    <Field
                      label="이메일"
                      required
                      error={errors.group?.participants?.[index]?.email}
                      controlProps={{
                        id: `participant-${index}-email`,
                        inputMode: "email",
                        placeholder: "participant@example.com",
                        type: "email",
                        ...register(`group.participants.${index}.email`)
                      }}
                    />
                  </div>
                ))}
              </div>
              {errors.group?.participants?.root?.message ? (
                <p className="field-error" role="alert">
                  {errors.group.participants.root.message}
                </p>
              ) : null}
            </div>
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
