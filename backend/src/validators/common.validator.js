const Joi = require('joi');

/**
 * Common validation schemas reused across routes.
 */

const uuidSchema = Joi.string()
  .guid({ version: ['uuidv4'] })
  .required()
  .messages({
    'string.guid': 'Invalid ID format - must be a valid UUID',
    'any.required': 'ID is required',
  });

const idParamSchema = Joi.object({
  id: uuidSchema,
});

module.exports = { uuidSchema, idParamSchema };
