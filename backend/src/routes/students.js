const express = require('express');
const { Student, Enrollment } = require('../models');
const ApiError = require('../utils/ApiError');
const { cleanString, escapeRegex } = require('../utils/normalize');

const router = express.Router();

async function findStudentOr404(studentId) {
  const student = await Student.findOne({ studentId: cleanString(studentId) });
  if (!student) throw ApiError.notFound(`Student with ID ${studentId} was not found.`);
  return student;
}

/**
 * GET /api/students            → all students, sorted by name
 * GET /api/students?q=John     → students whose name contains "John" (case-insensitive)
 *                                 or whose student ID is exactly the query
 */
router.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? cleanString(req.query.q) : '';
  const filter = q
    ? { $or: [{ name: { $regex: escapeRegex(q), $options: 'i' } }, { studentId: q }] }
    : {};
  const students = await Student.find(filter).sort({ name: 1, studentId: 1 });
  res.json(students);
});

/** GET /api/students/:studentId → one student plus the courses they are enrolled in. */
router.get('/:studentId', async (req, res) => {
  const student = await findStudentOr404(req.params.studentId);
  const enrollments = await Enrollment.find({ student: student._id }).populate('course');
  const courses = enrollments
    .filter((enrollment) => enrollment.course)
    .map((enrollment) => ({
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.createdAt,
      ...enrollment.course.toJSON(),
    }))
    .sort((a, b) => a.courseId.localeCompare(b.courseId));
  res.json({ ...student.toJSON(), courses });
});

/** POST /api/students  { name, studentId, phone, zip } */
router.post('/', async (req, res) => {
  const { name, studentId, phone, zip } = req.body ?? {};
  const student = new Student({ name, studentId, phone, zip });
  await student.validate(); // 400 with field details if anything is missing/invalid

  if (await Student.exists({ studentId: student.studentId })) {
    throw ApiError.conflict(`A student with ID ${student.studentId} already exists.`);
  }

  await student.save(); // the unique index still guards against races (→ 409)
  res.status(201).json({ message: `Student ${student.name} was added.`, student });
});

/** DELETE /api/students/:studentId → deletes the student and all of their enrollments. */
router.delete('/:studentId', async (req, res) => {
  const student = await Student.findOneAndDelete({ studentId: cleanString(req.params.studentId) });
  if (!student) throw ApiError.notFound(`Student with ID ${req.params.studentId} was not found.`);

  const { deletedCount } = await Enrollment.deleteMany({ student: student._id });
  res.json({
    message: `Student ${student.name} was deleted along with ${deletedCount} enrollment(s).`,
    student,
    removedEnrollments: deletedCount,
  });
});

module.exports = router;
