import type { ReactNode } from "react";
import type { Course, EnrollmentFormDraft, EnrollmentStep } from "../types";
import {
  formatCurrency,
  formatDateRange,
  getRemainingCapacity,
  resizeParticipants
} from "../utils";

interface EnrollmentSummaryProps {
  course: Course;
  draft: EnrollmentFormDraft;
  onEditStep?: (step: Extract<EnrollmentStep, "course" | "applicant">) => void;
}

interface SummarySectionProps {
  title: string;
  editLabel?: string;
  onEdit?: () => void;
  children: ReactNode;
}

function SummarySection({
  title,
  editLabel,
  onEdit,
  children
}: SummarySectionProps) {
  return (
    <section className="review-card" aria-labelledby={`${title}-summary-title`}>
      <div className="review-card__header">
        <h2 id={`${title}-summary-title`}>{title}</h2>
        {onEdit ? (
          <button className="text-action" onClick={onEdit} type="button">
            {editLabel ?? "수정"}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EnrollmentSummary({
  course,
  draft,
  onEditStep
}: EnrollmentSummaryProps) {
  const group = draft.type === "group" ? draft.group : undefined;
  const participants = group
    ? resizeParticipants(group.participants, group.headCount)
    : [];

  return (
    <div className="review-grid">
      <SummarySection
        title="강의 정보"
        onEdit={onEditStep ? () => onEditStep("course") : undefined}
      >
        <dl className="summary-list">
          <div>
            <dt>강의명</dt>
            <dd>{course.title}</dd>
          </div>
          <div>
            <dt>가격</dt>
            <dd>{formatCurrency(course.price)}</dd>
          </div>
          <div>
            <dt>일정</dt>
            <dd>{formatDateRange(course.startDate, course.endDate)}</dd>
          </div>
          <div>
            <dt>강사</dt>
            <dd>{course.instructor}</dd>
          </div>
          <div>
            <dt>잔여 정원</dt>
            <dd>{getRemainingCapacity(course)}명</dd>
          </div>
          <div>
            <dt>신청 유형</dt>
            <dd>{draft.type === "group" ? "단체 신청" : "개인 신청"}</dd>
          </div>
        </dl>
      </SummarySection>

      <SummarySection
        title="신청자 정보"
        onEdit={onEditStep ? () => onEditStep("applicant") : undefined}
      >
        <dl className="summary-list">
          <div>
            <dt>이름</dt>
            <dd>{draft.applicant.name}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{draft.applicant.email}</dd>
          </div>
          <div>
            <dt>전화번호</dt>
            <dd>{draft.applicant.phone}</dd>
          </div>
          <div>
            <dt>수강 동기</dt>
            <dd>{draft.applicant.motivation?.trim() || "입력하지 않음"}</dd>
          </div>
        </dl>
      </SummarySection>

      {group ? (
        <SummarySection
          title="단체 신청 정보"
          onEdit={onEditStep ? () => onEditStep("applicant") : undefined}
        >
          <dl className="summary-list">
            <div>
              <dt>단체명</dt>
              <dd>{group.organizationName}</dd>
            </div>
            <div>
              <dt>신청 인원수</dt>
              <dd>{group.headCount}명</dd>
            </div>
            <div>
              <dt>담당자 연락처</dt>
              <dd>{group.contactPerson}</dd>
            </div>
          </dl>
          <div className="participant-summary">
            <h3>참가자 명단</h3>
            <ol>
              {participants.map((participant, index) => (
                <li key={`${participant.email}-${index}`}>
                  <span>{participant.name}</span>
                  <span>{participant.email}</span>
                </li>
              ))}
            </ol>
          </div>
        </SummarySection>
      ) : null}
    </div>
  );
}

export default EnrollmentSummary;
