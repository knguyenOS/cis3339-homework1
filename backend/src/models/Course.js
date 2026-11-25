const { Schema, model } = require('mongoose');
const { cleanString, normalizeCourseId } = require('../utils/normalize');
const toJSON = require('./toJSON');

const courseSchema = new Schema(
  {
    courseId: {
      type: String,
      required: [true, 'Course ID is required.'],
      set: normalizeCourseId,
      match: [
        /^[A-Z]{2,6} \d{3,5}[A-Z]?$/,
        'Course ID must be a subject code followed by a number (for example CIS 3339).',
      ],
    },
    name: {
      type: String,
      required: [true, 'Course name is required.'],
      set: cleanString,
      minlength: [1, 'Course name is required.'],
      maxlength: [120, 'Course name must be 120 characters or fewer.'],
    },
  },
  {
    timestamps: true,
    collection: 'courses',
    toJSON,
    toObject: toJSON,
  }
);

// Unique index: MongoDB itself rejects duplicate course IDs.
courseSchema.index({ courseId: 1 }, { unique: true });

module.exports = model('Course', courseSchema);
