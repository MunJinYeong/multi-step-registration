import { useEffect, useState } from "react";
import { getCourses } from "../../../api/mockApi";
import EmptyState from "../../../components/EmptyState";
import LoadingState from "../../../components/LoadingState";
import type {
  Course,
  CourseCategory,
  EnrollmentType
} from "../types";
import {
  formatCurrency,
  formatDateRange,
  getRemainingCapacity,
  isCourseAlmostFull,
  isCourseFull
} from "../utils";

interface CourseStepProps {
  selectedCourse: Course | null;
  selectedCourseId: string;
  selectedType: EnrollmentType | "";
  errors: {
    courseId?: string;
    type?: string;
  };
  onCourseChange: (course: Course) => void;
  onTypeChange: (type: EnrollmentType) => void;
  onNext: () => void;
}

const categoryLabels: Record<CourseCategory, string> = {
  development: "개발",
  design: "디자인",
  marketing: "마케팅",
  business: "비즈니스"
};

function CourseStep({
  selectedCourse,
  selectedCourseId,
  selectedType,
  errors,
  onCourseChange,
  onTypeChange,
  onNext
}: CourseStepProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CourseCategory>("development");
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setLoadError("");

    getCourses(selectedCategory)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setCourses(response.courses);
        setCategories(response.categories);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setLoadError("강의 목록을 불러오지 못했습니다. 다시 시도해 주세요.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedCategory]);

  return (
    <section className="course-step" aria-labelledby="course-step-title">
      <div className="section-heading">
        <p className="eyebrow">Step 1</p>
        <h1 id="course-step-title">수강할 강의를 선택해 주세요.</h1>
        <p>
          카테고리별 강의를 확인하고 신청 유형을 선택하면 다음 단계로
          이동할 수 있습니다.
        </p>
      </div>

      <div className="category-tabs" aria-label="강의 카테고리">
        {categories.length === 0
          ? Object.entries(categoryLabels).map(([category, label]) => (
              <button
                className="category-tab"
                data-active={category === selectedCategory}
                key={category}
                onClick={() => setSelectedCategory(category as CourseCategory)}
                type="button"
              >
                {label}
              </button>
            ))
          : categories.map((category) => (
              <button
                className="category-tab"
                data-active={category === selectedCategory}
                key={category}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {categoryLabels[category]}
              </button>
            ))}
      </div>

      <div className="course-layout">
        <div className="course-list" aria-label="강의 목록">
          {isLoading ? (
            <LoadingState message="강의 목록을 불러오는 중입니다." />
          ) : loadError ? (
            <EmptyState title="조회 실패" description={loadError} />
          ) : courses.length === 0 ? (
            <EmptyState
              title="강의가 없습니다"
              description="선택한 카테고리에 등록된 강의가 없습니다."
            />
          ) : (
            courses.map((course) => {
              const remainingCapacity = getRemainingCapacity(course);
              const isSelected = selectedCourseId === course.id;
              const full = isCourseFull(course);

              return (
                <button
                  className="course-card"
                  data-selected={isSelected}
                  disabled={full}
                  key={course.id}
                  onClick={() => onCourseChange(course)}
                  type="button"
                >
                  <span className="course-card__topline">
                    <span>{course.instructor}</span>
                    <span
                      className="capacity-badge"
                      data-state={
                        full
                          ? "full"
                          : isCourseAlmostFull(course)
                            ? "almost-full"
                            : "available"
                      }
                    >
                      {full
                        ? "마감"
                        : isCourseAlmostFull(course)
                          ? `마감 임박 ${remainingCapacity}석`
                          : `${remainingCapacity}석 남음`}
                    </span>
                  </span>
                  <strong>{course.title}</strong>
                  <span>{course.description}</span>
                  <span className="course-card__meta">
                    <span>{formatCurrency(course.price)}</span>
                    <span>{formatDateRange(course.startDate, course.endDate)}</span>
                  </span>
                </button>
              );
            })
          )}
          {errors.courseId ? (
            <p className="field-error" role="alert">
              {errors.courseId}
            </p>
          ) : null}
        </div>

        <aside className="selected-panel" aria-label="선택한 강의 정보">
          {selectedCourse ? (
            <>
              <p className="eyebrow">Selected course</p>
              <h2>{selectedCourse.title}</h2>
              <dl className="summary-list">
                <div>
                  <dt>가격</dt>
                  <dd>{formatCurrency(selectedCourse.price)}</dd>
                </div>
                <div>
                  <dt>일정</dt>
                  <dd>
                    {formatDateRange(
                      selectedCourse.startDate,
                      selectedCourse.endDate
                    )}
                  </dd>
                </div>
                <div>
                  <dt>강사</dt>
                  <dd>{selectedCourse.instructor}</dd>
                </div>
                <div>
                  <dt>잔여 정원</dt>
                  <dd>{getRemainingCapacity(selectedCourse)}명</dd>
                </div>
              </dl>
            </>
          ) : (
            <EmptyState
              title="선택된 강의가 없습니다"
              description="수강하려는 강의를 선택하면 상세 정보가 표시됩니다."
            />
          )}

          <fieldset className="enrollment-type">
            <legend>신청 유형</legend>
            <label data-selected={selectedType === "personal"}>
              <input
                checked={selectedType === "personal"}
                name="enrollment-type"
                onChange={() => onTypeChange("personal")}
                type="radio"
              />
              <span>
                <strong>개인 신청</strong>
                <small>1명이 강의를 신청합니다.</small>
              </span>
            </label>
            <label data-selected={selectedType === "group"}>
              <input
                checked={selectedType === "group"}
                name="enrollment-type"
                onChange={() => onTypeChange("group")}
                type="radio"
              />
              <span>
                <strong>단체 신청</strong>
                <small>2명 이상 함께 신청합니다.</small>
              </span>
            </label>
            {errors.type ? (
              <p className="field-error" role="alert">
                {errors.type}
              </p>
            ) : null}
          </fieldset>

          <button className="primary-action" onClick={onNext} type="button">
            다음 단계
          </button>
        </aside>
      </div>
    </section>
  );
}

export default CourseStep;
