/** Trim a value and collapse inner whitespace. Non-strings are returned unchanged. */
function cleanString(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
}

/**
 * Normalize a course ID so that "cis3339", "CIS-3339" and " cis  3339 " are all
 * stored (and compared) as "CIS 3339". This makes duplicate detection reliable.
 */
function normalizeCourseId(value) {
  if (typeof value !== 'string') return value;
  return value
    .trim()
    .toUpperCase()
    .replace(/[-_]+/g, ' ')
    .replace(/([A-Z])(\d)/g, '$1 $2')
    .replace(/\s+/g, ' ');
}

/** Escape user input so it can be used safely inside a RegExp. */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { cleanString, normalizeCourseId, escapeRegex };
