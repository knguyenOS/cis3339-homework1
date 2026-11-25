const express = require('express');
const { Course, Enrollment } = require('../models');
const ApiError = require('../utils/ApiError');
const { normalizeCourseId } = require('../utils/normalize');

const router = express.Router();

async function findCourseOr404(courseId) {
  const course = await Course.findOne({ courseId: normalizeCourseId(courseId) });
  if (!course) throw ApiError.notFound(`Course ${courseId} was not found.`);
  return course;
}

/** GET /api/courses → all courses with the number of enrolled students. */
router.get('/', async (_req, res) => {
  const [courses, counts] = await Promise.all([
    Course.find().sort({ courseId: 1 }),
    Enrollment.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }]),
  ]);
  const countByCourse = new Map(counts.map((row) => [String(row._id), row.count]));
  res.json(
    courses.map((course) => ({
      ...course.toJSON(),
      enrollmentCount: countByCourse.get(course.id) || 0,
    }))
  );
});

/** GET /api/courses/:courseId */
router.get('/:courseId', async (req, res) => {
  res.json(await findCourseOr404(req.params.courseId));
});

/** GET /api/courses/:courseId/students → the course roster. */
router.get('/:courseId/students', async (req, res) => {
  const course = await findCourseOr404(req.params.courseId);
  const enrollments = await Enrollment.find({ course: course._id }).populate('student');
  const students = enrollments
    .filter((enrollment) => enrollment.student)
    .map((enrollment) => ({
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.createdAt,
      ...enrollment.student.toJSON(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.studentId.localeCompare(b.studentId));
  res.json({ course, students });
});

/** POST /api/courses  { courseId, name } */
router.post('/', async (req, res) => {
  const { courseId, name } = req.body ?? {};
  const course = new Course({ courseId, name });
  await course.validate();

  if (await Course.exists({ courseId: course.courseId })) {
    throw ApiError.conflict(`Course ${course.courseId} already exists.`);
  }

  await course.save();
  res.status(201).json({ message: `Course ${course.courseId} was added.`, course });
});

/** DELETE /api/courses/:courseId → deletes the course and all of its enrollments. */
router.delete('/:courseId', async (req, res) => {
  const course = await Course.findOneAndDelete({ courseId: normalizeCourseId(req.params.courseId) });
  if (!course) throw ApiError.notFound(`Course ${req.params.courseId} was not found.`);

  const { deletedCount } = await Enrollment.deleteMany({ course: course._id });
  res.json({
    message: `Course ${course.courseId} was deleted along with ${deletedCount} enrollment(s).`,
    course,
    removedEnrollments: deletedCount,
  });
});

module.exports = router;
