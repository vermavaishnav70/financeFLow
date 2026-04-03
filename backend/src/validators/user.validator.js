const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('VIEWER', 'ANALYST', 'ADMIN').default('VIEWER'),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().trim().email(),
  role: Joi.string().valid('VIEWER', 'ANALYST', 'ADMIN'),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').required()
    .messages({ 'any.only': 'Status must be either ACTIVE or INACTIVE' }),
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({ 'any.required': 'Current password is required' }),
  newPassword: Joi.string().min(8).max(128).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

const listUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  role: Joi.string().valid('VIEWER', 'ANALYST', 'ADMIN'),
});

module.exports = { createUserSchema, updateUserSchema, updateStatusSchema, updatePasswordSchema, listUsersSchema };
