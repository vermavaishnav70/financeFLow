const Joi = require('joi');

const createRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required()
    .messages({ 'number.positive': 'Amount must be a positive number' }),
  type: Joi.string().valid('INCOME', 'EXPENSE').required()
    .messages({ 'any.only': 'Type must be either INCOME or EXPENSE' }),
  category: Joi.string().trim().min(1).max(100).required()
    .messages({ 'any.required': 'Category is required' }),
  date: Joi.date().iso().required()
    .messages({ 'date.format': 'Date must be in ISO 8601 format (YYYY-MM-DD)' }),
  description: Joi.string().trim().max(500).allow('', null),
});

const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid('INCOME', 'EXPENSE'),
  category: Joi.string().trim().min(1).max(100),
  date: Joi.date().iso(),
  description: Joi.string().trim().max(500).allow('', null),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const listRecordsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  state: Joi.string().valid('active', 'deleted', 'all').default('active'),
  type: Joi.string().valid('INCOME', 'EXPENSE'),
  category: Joi.string().trim(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate'))
    .messages({ 'date.min': 'End date must be after start date' }),
  minAmount: Joi.number().positive().precision(2),
  maxAmount: Joi.number().positive().precision(2).min(Joi.ref('minAmount'))
    .messages({ 'number.min': 'Maximum amount must be greater than or equal to minimum amount' }),
  search: Joi.string().trim().max(200),
  sortBy: Joi.string().valid('date', 'amount', 'createdAt').default('date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

module.exports = { createRecordSchema, updateRecordSchema, listRecordsSchema };
