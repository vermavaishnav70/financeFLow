const Joi = require('joi');

const listAuditLogsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  entity: Joi.string().valid('user', 'record'),
  action: Joi.string().valid('CREATE', 'UPDATE', 'DELETE'),
  entityId: Joi.string().trim(),
});

module.exports = { listAuditLogsSchema };
