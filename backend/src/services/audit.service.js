const { prisma } = require('../config/prisma');

/**
 * Audit Service
 * Logs all mutating operations on financial records and users.
 * Audit writes should always run inside the same Prisma transaction
 * as the parent operation to ensure atomicity.
 */

/**
 * Log an audit action. Should be called within a Prisma $transaction.
 * @param {import('@prisma/client').Prisma.TransactionClient} tx - Transaction client
 * @param {object} params
 * @param {string} params.action - CREATE | UPDATE | DELETE
 * @param {string} params.entity - "record" | "user"
 * @param {string} params.entityId - UUID of the affected entity
 * @param {string} params.performedBy - UUID of the acting user
 * @param {object} [params.before] - Entity state before the change
 * @param {object} [params.after] - Entity state after the change
 */
async function logAction(tx, { action, entity, entityId, performedBy, before = null, after = null }) {
  await tx.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      performedBy,
      changes: {
        ...(before && { before }),
        ...(after && { after }),
      },
    },
  });
}

async function getAuditLogs({ page = 1, limit = 20, entity, action, entityId }) {
  const where = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (entityId) where.entityId = entityId;

  const skip = (page - 1) * limit;

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        performer: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = { logAction, getAuditLogs };
