const { Schema, model } = require('mongoose');
const { cleanString } = require('../utils/normalize');
const toJSON = require('./toJSON');

const studentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      set: cleanString,
      minlength: [1, 'Name is required.'],
      maxlength: [100, 'Name must be 100 characters or fewer.'],
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required.'],
      set: cleanString,
      match: [/^\d{1,10}$/, 'Student ID must be 1–10 digits (for example 1001).'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required.'],
      set: cleanString,
      validate: {
        validator: (value) => /^[0-9()+\-.\s]+$/.test(value) && /^\d{7,15}$/.test(value.replace(/\D/g, '')),
        message: 'Phone must contain 7–15 digits (for example 555-1234 or 713-555-1234).',
      },
    },
    zip: {
      type: String,
      required: [true, 'ZIP code is required.'],
      set: cleanString,
      match: [/^\d{5}(-\d{4})?$/, 'ZIP code must be 5 digits or ZIP+4 (for example 77001).'],
    },
  },
  {
    timestamps: true,
    collection: 'students',
    toJSON,
    toObject: toJSON,
  }
);

// Unique index: MongoDB itself rejects duplicate student IDs.
studentSchema.index({ studentId: 1 }, { unique: true });
// Supports sorting/searching by name.
studentSchema.index({ name: 1 });

module.exports = model('Student', studentSchema);
