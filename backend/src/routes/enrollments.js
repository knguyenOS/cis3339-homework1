const express = require('express');
const mongoose = require('mongoose');
const { Student, Course, Enrollment } = require('../models');
const ApiError = require('../utils/ApiError');
const { cleanString, normalizeCourseId } = require('../utils/normalize');

const router = express.Router();

function toEnrollmentJSON(enrollment) {
  return {
    id: enrollment.id,
    enrolledAt: enrollment.createdAt,
    student: enrollment.student,
    course: enrollment.course,
  };
}

/**
 * GET /api/enrollments                       → all enrollments (newest first)
 * GET /api/enrollments?courseId=CIS%203339   → enrollments for one course
 * GET /api/enrollments?studentId=1001        → enrollments for one student
 */
router.get('/', async (req, res) => {
  const filter = {};
  if (typeof req.query.courseId === 'string' && req.query.courseId.trim()) {
    const course = await Course.findOne({ courseId: normalizeCourseId(req.query.courseId) });
    if (!course) throw ApiError.notFound(`Course ${req.query.courseId} was not found.`);
    filter.course = course._id;
  }
  if (typeof req.query.studentId === 'string' && req.query.studentId.trim()) {
    const student = await Student.findOne({ studentId: cleanString(req.query.studentId) });
    if (!student) throw ApiError.notFound(`Student with ID ${req.query.studentId} was not found.`);
    filter.student = student._id;
  }

  const enrollments = await Enrollment.find(filter).sort({ createdAt: -1 }).populate('student').populate('course');
  res.json(enrollments.filter((e) => e.student && e.course).map(toEnrollmentJSON));
});

/** POST /api/enrollments  { studentId, courseId } */
router.post('/', async (req, res) => {
  const body = req.body ?? {};
  const studentId = typeof body.studentId === 'number' ? String(body.studentId) : cleanString(body.studentId);
  const courseId = normalizeCourseId(body.courseId);

  const details = {};
  if (typeof studentId !== 'string' || !studentId) details.studentId = 'Please select a student.';
  if (typeof courseId !== 'string' || !courseId) details.courseId = 'Please select a course.';
  if (Object.keys(details).length) throw ApiError.badRequest(Object.values(details)[0], details);

  // Referential integrity: both sides must exist.
  const [student, course] = await Promise.all([Student.findOne({ studentId }), Course.findOne({ courseId })]);
  if (!student) throw ApiError.notFound(`Student with ID ${studentId} was not found.`);
  if (!course) throw ApiError.notFound(`Course ${courseId} was not found.`);

  if (await Enrollment.exists({ student: student._id, course: course._id })) {
    throw ApiError.conflict(`${student.name} (${student.studentId}) is already enrolled in ${course.courseId}.`);
  }

  // The unique compound index still rejects duplicates created by concurrent requests (→ 409).
  const enrollment = await Enrollment.create({ student: student._id, course: course._id });

  // If the student or course was deleted while this request was running, undo the
  // enrollment so no orphaned record is left behind.
  const [stillStudent, stillCourse] = await Promise.all([
    Student.exists({ _id: student._id }),
    Course.exists({ _id: course._id }),
  ]);
  if (!stillStudent || !stillCourse) {
    await Enrollment.deleteOne({ _id: enrollment._id });
    throw ApiError.notFound('The selected student or course no longer exists.');
  }

  enrollment.student = student;
  enrollment.course = course;
  res.status(201).json({
    message: `${student.name} was enrolled in ${course.courseId}.`,
    enrollment: toEnrollmentJSON(enrollment),
  });
});

/** DELETE /api/enrollments/:id → removes a single enrollment (drop a student from a course). */
router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest('Invalid enrollment ID.');
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id).populate('student').populate('course');
  if (!enrollment) throw ApiError.notFound('Enrollment was not found.');

  const who = enrollment.student ? enrollment.student.name : 'Student';
  const where = enrollment.course ? enrollment.course.courseId : 'the course';
  res.json({ message: `${who} was removed from ${where}.`, enrollment: toEnrollmentJSON(enrollment) });
});

module.exports = router;
