import type { Course } from "./types";

export function getRemainingCapacity(course: Course) {
  return Math.max(course.maxCapacity - course.currentEnrollment, 0);
}

export function isCourseFull(course: Course) {
  return getRemainingCapacity(course) === 0;
}

export function isCourseAlmostFull(course: Course) {
  const remainingCapacity = getRemainingCapacity(course);

  return remainingCapacity > 0 && remainingCapacity <= 3;
}
