const { Schema, model } = require('mongoose');
const toJSON = require('./toJSON');

/**
 * An enrollment links one student to one course. References use ObjectIds so
 * that renaming a student or course never breaks the relationship.
 */
const enrollmentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required.'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required.'],
    },
  },
  {
    timestamps: true,
    collection: 'enrollments',
    toJSON,
    toObject: toJSON,
  }
);

// A student can be enrolled in a given course only once.
// This compound index also serves "all enrollments for a student" lookups.
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
// Serves course roster lookups and cascading deletes by course.
enrollmentSchema.index({ course: 1 });

module.exports = model('Enrollment', enrollmentSchema);
