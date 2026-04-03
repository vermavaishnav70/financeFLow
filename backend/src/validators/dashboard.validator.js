const Joi = require('joi');

const trendsQuerySchema = Joi.object({
  months: Joi.number().integer().min(1).max(120).default(12)
    .messages({
      'number.min': 'Months must be at least 1',
      'number.max': 'Months cannot exceed 120 (10 years)',
    }),
});

const recentQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
});

const categoriesQuerySchema = Joi.object({
  type: Joi.string().valid('INCOME', 'EXPENSE')
    .messages({
      'any.only': 'Type must be either INCOME or EXPENSE',
    }),
});

module.exports = { trendsQuerySchema, recentQuerySchema, categoriesQuerySchema };
