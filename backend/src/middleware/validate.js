const ApiError = require('../utils/ApiError');

/**
 * Request validation middleware factory.
 * Validates request data against a Joi schema.
 *
 * @param {import('joi').Schema} schema - Joi validation schema
 * @param {'body'|'query'|'params'} source - Request property to validate
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/records', validate(createRecordSchema, 'body'), controller);
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return next(ApiError.badRequest('Validation failed', errors));
    }

    // Replace with validated (and stripped) value
    req[source] = value;
    next();
  };
};

module.exports = { validate };
