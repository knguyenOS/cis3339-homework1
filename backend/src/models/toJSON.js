/**
 * Shared JSON options for all models: expose `id` instead of `_id`
 * and hide the internal `__v` version key.
 */
module.exports = {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
};
