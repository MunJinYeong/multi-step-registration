export type CourseCategory =
  | "development"
  | "design"
  | "marketing"
  | "business";

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  price: number;
  maxCapacity: number;
  currentEnrollment: number;
  startDate: string;
  endDate: string;
  instructor: string;
}

export interface CourseListResponse {
  courses: Course[];
  categories: CourseCategory[];
}

export interface Applicant {
  name: string;
  email: string;
  phone: string;
  motivation?: string;
}

export interface Participant {
  name: string;
  email: string;
}

export type EnrollmentType = "personal" | "group";

export type EnrollmentStep = "course" | "applicant" | "review" | "complete";

export interface GroupEnrollmentDraft {
  organizationName: string;
  headCount: number;
  participants: Participant[];
  contactPerson: string;
}

export interface EnrollmentFormDraft {
  courseId: string;
  type: EnrollmentType;
  applicant: Applicant;
  group?: GroupEnrollmentDraft;
  agreedToTerms: boolean;
}

export interface PersonalEnrollmentRequest {
  courseId: string;
  type: "personal";
  applicant: Applicant;
  agreedToTerms: boolean;
}

export interface GroupEnrollmentRequest {
  courseId: string;
  type: "group";
  applicant: Applicant;
  group: {
    organizationName: string;
    headCount: number;
    participants: Participant[];
    contactPerson: string;
  };
  agreedToTerms: boolean;
}

export type EnrollmentRequest =
  | PersonalEnrollmentRequest
  | GroupEnrollmentRequest;

export interface EnrollmentResponse {
  enrollmentId: string;
  status: "confirmed" | "pending";
  enrolledAt: string;
}

export type EnrollmentErrorCode =
  | "COURSE_FULL"
  | "DUPLICATE_ENROLLMENT"
  | "INVALID_INPUT";

export interface ErrorResponse {
  code: EnrollmentErrorCode;
  message: string;
  details?: Record<string, string>;
}
