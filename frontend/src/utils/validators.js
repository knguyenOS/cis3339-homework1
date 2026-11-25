/**
 * Client-side validation rules. They mirror the Mongoose schema rules on the
 * server so users get instant feedback; the server still validates everything.
 * Each rule returns an error message, or an empty string when the value is valid.
 */

const trim = (value) => String(value ?? '').trim();

export const studentRules = {
  name(value) {
    const v = trim(value);
    if (!v) return 'Name is required.';
    if (v.length > 100) return 'Name must be 100 characters or fewer.';
    return '';
  },
  studentId(value) {
    const v = trim(value);
    if (!v) return 'Student ID is required.';
    if (!/^\d{1,10}$/.test(v)) return 'Student ID must be 1–10 digits (for example 1001).';
    return '';
  },
  phone(value) {
    const v = trim(value);
    if (!v) return 'Phone number is required.';
    const digits = v.replace(/\D/g, '');
    if (!/^[0-9()+\-.\s]+$/.test(v) || digits.length < 7 || digits.length > 15) {
      return 'Phone must contain 7–15 digits (for example 555-1234 or 713-555-1234).';
    }
    return '';
  },
  zip(value) {
    const v = trim(value);
    if (!v) return 'ZIP code is required.';
    if (!/^\d{5}(-\d{4})?$/.test(v)) return 'ZIP code must be 5 digits or ZIP+4 (for example 77001).';
    return '';
  },
};

/** Same normalization the server applies: "cis3339" → "CIS 3339". */
export function normalizeCourseId(value) {
  return trim(value)
    .toUpperCase()
    .replace(/[-_]+/g, ' ')
    .replace(/([A-Z])(\d)/g, '$1 $2')
    .replace(/\s+/g, ' ');
}

export const courseRules = {
  courseId(value) {
    const v = normalizeCourseId(value);
    if (!v) return 'Course ID is required.';
    if (!/^[A-Z]{2,6} \d{3,5}[A-Z]?$/.test(v)) {
      return 'Course ID must be a subject code followed by a number (for example CIS 3339).';
    }
    return '';
  },
  name(value) {
    const v = trim(value);
    if (!v) return 'Course name is required.';
    if (v.length > 120) return 'Course name must be 120 characters or fewer.';
    return '';
  },
};

export const enrollmentRules = {
  studentId: (value) => (trim(value) ? '' : 'Please select a student.'),
  courseId: (value) => (trim(value) ? '' : 'Please select a course.'),
};
