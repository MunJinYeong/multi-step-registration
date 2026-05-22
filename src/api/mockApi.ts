import type {
  Course,
  CourseCategory,
  CourseListResponse,
  EnrollmentRequest,
  EnrollmentResponse,
  ErrorResponse
} from "../features/enrollment/types";
import { getRemainingCapacity } from "../features/enrollment/utils";

const categories: CourseCategory[] = [
  "development",
  "design",
  "marketing",
  "business"
];

const courses: Course[] = [
  {
    id: "dev-react-foundation",
    title: "React 실전 기초",
    description: "컴포넌트 설계와 상태 관리를 중심으로 React의 핵심을 학습합니다.",
    category: "development",
    price: 240000,
    maxCapacity: 30,
    currentEnrollment: 18,
    startDate: "2026-06-08T10:00:00.000Z",
    endDate: "2026-07-03T12:00:00.000Z",
    instructor: "김도현"
  },
  {
    id: "dev-typescript-master",
    title: "TypeScript 마스터 클래스",
    description: "실무 코드베이스에서 타입 안정성을 높이는 패턴을 학습합니다.",
    category: "development",
    price: 320000,
    maxCapacity: 24,
    currentEnrollment: 22,
    startDate: "2026-06-15T10:00:00.000Z",
    endDate: "2026-07-10T12:00:00.000Z",
    instructor: "박서연"
  },
  {
    id: "design-product-ux",
    title: "프로덕트 UX 리서치",
    description: "사용자 문제 정의부터 검증 가능한 UX 가설 수립까지 다룹니다.",
    category: "design",
    price: 280000,
    maxCapacity: 20,
    currentEnrollment: 20,
    startDate: "2026-06-10T05:00:00.000Z",
    endDate: "2026-07-01T07:00:00.000Z",
    instructor: "이하린"
  },
  {
    id: "design-interface-system",
    title: "인터페이스 디자인 시스템",
    description: "일관된 제품 경험을 위한 컴포넌트와 토큰 설계를 학습합니다.",
    category: "design",
    price: 300000,
    maxCapacity: 18,
    currentEnrollment: 9,
    startDate: "2026-06-22T05:00:00.000Z",
    endDate: "2026-07-17T07:00:00.000Z",
    instructor: "정유진"
  },
  {
    id: "marketing-growth-loop",
    title: "그로스 마케팅 루프 설계",
    description: "획득, 활성화, 유지 지표를 연결하는 성장 실험을 설계합니다.",
    category: "marketing",
    price: 260000,
    maxCapacity: 25,
    currentEnrollment: 12,
    startDate: "2026-06-12T04:00:00.000Z",
    endDate: "2026-07-03T06:00:00.000Z",
    instructor: "최민재"
  },
  {
    id: "marketing-content-strategy",
    title: "콘텐츠 마케팅 전략",
    description: "브랜드 메시지를 성과로 연결하는 콘텐츠 기획 방법을 다룹니다.",
    category: "marketing",
    price: 210000,
    maxCapacity: 16,
    currentEnrollment: 14,
    startDate: "2026-06-18T04:00:00.000Z",
    endDate: "2026-07-09T06:00:00.000Z",
    instructor: "문지호"
  },
  {
    id: "business-startup-finance",
    title: "스타트업 재무 모델링",
    description: "초기 스타트업을 위한 매출, 비용, 투자 시나리오 모델링을 학습합니다.",
    category: "business",
    price: 350000,
    maxCapacity: 15,
    currentEnrollment: 8,
    startDate: "2026-06-09T09:00:00.000Z",
    endDate: "2026-07-07T11:00:00.000Z",
    instructor: "한지훈"
  },
  {
    id: "business-leadership",
    title: "팀 리더십 워크숍",
    description: "실무 리더를 위한 피드백, 위임, 의사결정 훈련을 진행합니다.",
    category: "business",
    price: 290000,
    maxCapacity: 12,
    currentEnrollment: 12,
    startDate: "2026-06-25T09:00:00.000Z",
    endDate: "2026-07-16T11:00:00.000Z",
    instructor: "서민영"
  }
];

const duplicateEnrollmentKeys = new Set([
  "duplicate@example.com:dev-react-foundation",
  "already@course.com:marketing-growth-loop"
]);

function delay<T>(value: T, duration = 350) {
  return new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(value), duration);
  });
}

function rejectWithError(error: ErrorResponse, duration = 350) {
  return new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(error), duration);
  });
}

function createEnrollmentId() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `ENR-${randomPart}`;
}

export function getCourses(
  category?: CourseCategory
): Promise<CourseListResponse> {
  const filteredCourses = category
    ? courses.filter((course) => course.category === category)
    : courses;

  return delay({
    courses: filteredCourses,
    categories
  });
}

export function submitEnrollment(
  payload: EnrollmentRequest
): Promise<EnrollmentResponse> {
  const course = courses.find(({ id }) => id === payload.courseId);

  if (!course) {
    return rejectWithError({
      code: "INVALID_INPUT",
      message: "선택한 강의를 찾을 수 없습니다.",
      details: {
        courseId: "존재하지 않는 강의입니다."
      }
    });
  }

  const requestedSeats = payload.type === "group" ? payload.group.headCount : 1;

  if (getRemainingCapacity(course) < requestedSeats) {
    return rejectWithError({
      code: "COURSE_FULL",
      message: "선택한 강의의 잔여 정원이 부족합니다."
    });
  }

  const duplicateKey = `${payload.applicant.email}:${payload.courseId}`;

  if (duplicateEnrollmentKeys.has(duplicateKey)) {
    return rejectWithError({
      code: "DUPLICATE_ENROLLMENT",
      message: "이미 신청된 강의입니다."
    });
  }

  if (payload.applicant.email.endsWith("@invalid.test")) {
    return rejectWithError({
      code: "INVALID_INPUT",
      message: "입력값을 다시 확인해 주세요.",
      details: {
        "applicant.email": "사용할 수 없는 이메일 도메인입니다."
      }
    });
  }

  return delay({
    enrollmentId: createEnrollmentId(),
    status: requestedSeats > 5 ? "pending" : "confirmed",
    enrolledAt: new Date().toISOString()
  });
}
