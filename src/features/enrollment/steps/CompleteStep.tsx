import { useFormContext } from "react-hook-form";
import type {
  Course,
  EnrollmentFormDraft,
  EnrollmentResponse
} from "../types";
import { formatDateTime } from "../utils";
import EnrollmentSummary from "./EnrollmentSummary";

interface CompleteStepProps {
  course: Course;
  result: EnrollmentResponse;
}

const statusLabels: Record<EnrollmentResponse["status"], string> = {
  confirmed: "신청 확정",
  pending: "확인 대기"
};

function CompleteStep({ course, result }: CompleteStepProps) {
  const { getValues } = useFormContext<EnrollmentFormDraft>();

  return (
    <section className="complete-step" aria-labelledby="complete-step-title">
      <div className="complete-hero">
        <p className="eyebrow">Enrollment complete</p>
        <h1 id="complete-step-title">수강 신청이 접수되었습니다.</h1>
        <dl className="complete-meta">
          <div>
            <dt>신청 번호</dt>
            <dd>{result.enrollmentId}</dd>
          </div>
          <div>
            <dt>상태</dt>
            <dd>{statusLabels[result.status]}</dd>
          </div>
          <div>
            <dt>신청 일시</dt>
            <dd>{formatDateTime(result.enrolledAt)}</dd>
          </div>
        </dl>
      </div>

      <EnrollmentSummary course={course} draft={getValues()} />
    </section>
  );
}

export default CompleteStep;
